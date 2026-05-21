import { Router, type IRouter } from "express";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// LLM proxy guard — small, fast calls but still chargeable.
const identifyRateLimit = rateLimit({ perMinute: 12 });

const SYSTEM_PROMPT = `You are an entity-resolution specialist. The user types a company name AND a homepage URL (both are mandatory). Your job is to identify the REAL company that lives at that URL and either return a single high-confidence match or surface the ambiguity by returning multiple candidates.

Rules:
1. The URL is the AUTHORITATIVE identifier. The name is a HINT. The candidate(s) you return MUST be the company whose homepage lives at the supplied URL — not a more famous same-named company. Set "canonicalUrl" on every candidate to the supplied URL (normalised, no protocol).
2. CORRELATION CHECK: confirm the supplied name plausibly matches the supplied URL. If they correlate (e.g. "HumanCo" + humanco.com, "Guitar Center" + guitarcenter.com), return ONE candidate with confidence ≥ 0.92 — the URL anchors it, no disambiguation needed. If the name and URL appear to refer to DIFFERENT entities (e.g. "Apple" + microsoft.com, or "Delta Airlines" + deltafaucet.com), return TWO candidates — first the company at the URL (higher confidence), second the company the name suggests (lower confidence) — so the user can see the mismatch and pick.
3. If you do not recognise the URL as a real public company at all, return ONE candidate with the user's literal name, canonicalUrl = the supplied URL, sector "Unknown", confidence 0.4, distinguisher "URL not in public-company knowledge — will seed from supplied details only". Do NOT invent a different company.
4. NEVER substitute a more famous company that shares a partial name. If the user types "Mercer Industries" + mercerindustries.com, do NOT return Mercer (the consulting firm at mercer.com).
5. Sort candidates by confidence descending. Cap at 3. Single high-confidence match is the expected outcome — only return multiple when there is genuine name/URL mismatch.

Return STRICT JSON only — no prose, no code fences. Shape:

{
  "candidates": Array<{
    "name": string,             // canonical brand name
    "canonicalUrl": string,     // their real homepage, without protocol (e.g. "guitarcenter.com")
    "sector": string,           // e.g. "Specialty music retail"
    "hqCity": string,           // best-known HQ city
    "hqState": string,          // 2-letter US state OR country
    "oneLiner": string,         // 1 sentence: what this company actually is, distinguishing it from same-named entities
    "confidence": number,       // 0.0-1.0 — be honest
    "distinguisher": string     // 1 short phrase: what makes this candidate different from the others (or "Sole match" if unambiguous)
  }>,
  "verdict": "unambiguous" | "ambiguous" | "unknown"
}

Sort candidates by confidence descending. Cap at 3. Output JSON ONLY.`;

router.post("/companies/identify", identifyRateLimit, async (req, res) => {
  const raw = (req.body ?? {}) as Record<string, unknown>;
  const name   = typeof raw.name   === "string" ? raw.name.trim().slice(0, 120)   : "";
  const url    = typeof raw.url    === "string" ? raw.url.trim().slice(0, 200)    : "";
  const sector = typeof raw.sector === "string" ? raw.sector.trim().slice(0, 160) : "";
  if (!name) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }
  if (!url) {
    res.status(400).json({ error: "Homepage URL is required — it's the authoritative identifier for this company." });
    return;
  }
  // Server-side domain shape guard. The client also validates, but never trust the client.
  const urlBare = url
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(urlBare)) {
    res.status(400).json({ error: "Homepage URL must look like a real domain (e.g. humanco.com)." });
    return;
  }

  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) {
    req.log.error("Anthropic AI integration env vars missing");
    res.status(503).json({ error: "AI integration is not configured on this server." });
    return;
  }

  const userPrompt =
    `User-typed name: ${name}\n` +
    `User-typed homepage URL: ${url}  (AUTHORITATIVE — anchor on this domain)\n` +
    (sector ? `User-supplied sector hint: ${sector}\n` : "") +
    `\nIdentify the company at ${urlBare}, confirm it correlates with the typed name "${name}", and return the JSON now.`;

  const tStart = Date.now();
  try {
    const apiRes = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      req.log.error({ status: apiRes.status, body: errBody.slice(0, 500) }, "Anthropic identify error");
      res.status(502).json({ error: `Upstream AI error (HTTP ${apiRes.status}).` });
      return;
    }

    const payload = (await apiRes.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const text = payload.content?.find(b => b.type === "text")?.text ?? "";
    if (!text) {
      res.status(502).json({ error: "AI returned no content." });
      return;
    }
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: unknown;
    try { parsed = JSON.parse(cleaned); } catch {
      req.log.error({ snippet: cleaned.slice(0, 300) }, "identify: bad JSON");
      res.status(502).json({ error: "AI returned invalid JSON." });
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      res.status(502).json({ error: "AI returned non-object." });
      return;
    }
    const p = parsed as Record<string, unknown>;
    const rawCandidates = Array.isArray(p.candidates) ? p.candidates : [];
    const candidates = rawCandidates
      .map(c => {
        if (!c || typeof c !== "object") return null;
        const cc = c as Record<string, unknown>;
        const nm = typeof cc.name === "string" ? cc.name.trim().slice(0, 120) : "";
        if (!nm) return null;
        const conf = typeof cc.confidence === "number"
          ? Math.max(0, Math.min(1, cc.confidence)) : 0.5;
        return {
          name:          nm,
          canonicalUrl:  typeof cc.canonicalUrl === "string"  ? cc.canonicalUrl.trim().slice(0, 200) : "",
          sector:        typeof cc.sector === "string"        ? cc.sector.trim().slice(0, 160)       : "",
          hqCity:        typeof cc.hqCity === "string"        ? cc.hqCity.trim().slice(0, 80)        : "",
          hqState:       typeof cc.hqState === "string"       ? cc.hqState.trim().slice(0, 40)       : "",
          oneLiner:      typeof cc.oneLiner === "string"      ? cc.oneLiner.trim().slice(0, 400)     : "",
          distinguisher: typeof cc.distinguisher === "string" ? cc.distinguisher.trim().slice(0, 200): "",
          confidence:    conf,
        };
      })
      .filter((c): c is NonNullable<typeof c> => !!c)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    if (candidates.length === 0) {
      // Always give the UI at least one option to proceed with the literal input.
      candidates.push({
        name, canonicalUrl: url, sector: sector || "Unknown",
        hqCity: "", hqState: "", oneLiner: "Proceed with supplied details only.",
        distinguisher: "No public match found", confidence: 0.3,
      });
    }
    const verdictRaw = typeof p.verdict === "string" ? p.verdict : "";
    const verdict: "unambiguous" | "ambiguous" | "unknown" =
      verdictRaw === "unambiguous" || verdictRaw === "ambiguous" || verdictRaw === "unknown"
        ? verdictRaw
        : (candidates.length === 1 ? (candidates[0].confidence >= 0.85 ? "unambiguous" : "unknown") : "ambiguous");

    // Real provenance — surfaces to the UI so users can verify the LLM call really happened.
    const meta = {
      model:        payload.model ?? "claude-sonnet-4-6",
      durationMs:   Date.now() - tStart,
      inputTokens:  payload.usage?.input_tokens  ?? null,
      outputTokens: payload.usage?.output_tokens ?? null,
      bytesReturned: Buffer.byteLength(text, "utf8"),
    };
    res.json({ candidates, verdict, _meta: meta });
  } catch (e) {
    req.log.error({ err: String(e) }, "Identify route failed");
    res.status(500).json({ error: "Company identification failed unexpectedly." });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// LLM proxy guard — small, fast calls but still chargeable.
const identifyRateLimit = rateLimit({ perMinute: 12 });

const SYSTEM_PROMPT = `You are an entity-resolution specialist. The user types a company name and (usually) a homepage URL. Your job is to identify the REAL company they mean and either return a single high-confidence match or surface the ambiguity by returning multiple candidates.

Rules:
1. The URL is the AUTHORITATIVE identifier. If the user supplied a URL that maps unambiguously to a real company you can recognise, return a single candidate with confidence ≥ 0.95. Do not invent ambiguity that doesn't exist.
2. If the URL is missing OR the name is genuinely ambiguous across multiple real entities (e.g. "Delta" → airline, faucets, dental insurance; "Apollo" → tyres, hospitals, asset manager; "Atlas" → many; "Mars" → candy or aerospace), return 2-3 candidates spanning the most-likely meanings, each with realistic confidence scores. Do NOT pad with implausible options.
3. If the name + URL together point to ONE company you can recognise but with low certainty (e.g. niche brand), return 1 candidate with the confidence you actually have (0.5-0.85). Do not bluff a high score.
4. If the name is plainly unidentifiable (no real company you know matches), return one candidate with the user's literal name + URL, sector "Unknown", confidence 0.3, distinguisher "No public match found — will seed from supplied details only".
5. NEVER substitute a more famous company that shares a partial name. If the user types "Mercer Industries" and the URL is mercerindustries.com, do NOT return Mercer (the consulting firm). Use the URL to anchor.

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

  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) {
    req.log.error("Anthropic AI integration env vars missing");
    res.status(503).json({ error: "AI integration is not configured on this server." });
    return;
  }

  const userPrompt =
    `User-typed name: ${name}\n` +
    (url    ? `User-typed homepage URL: ${url}\n` : "User-typed homepage URL: (none — disambiguation MORE likely)\n") +
    (sector ? `User-supplied sector hint: ${sector}\n` : "") +
    `\nIdentify the company. Return the JSON now.`;

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

    const payload = (await apiRes.json()) as { content?: Array<{ type: string; text?: string }> };
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

    res.json({ candidates, verdict });
  } catch (e) {
    req.log.error({ err: String(e) }, "Identify route failed");
    res.status(500).json({ error: "Company identification failed unexpectedly." });
  }
});

export default router;

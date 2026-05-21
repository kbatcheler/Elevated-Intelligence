import { Router, type IRouter } from "express";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// Guard the LLM proxy: each client IP gets 6 brief requests per minute
// (bursting to 6). Caches per profile in the client mean repeat opens
// are free; this is sized for legitimate switching, not bulk scraping.
const briefRateLimit = rateLimit({ perMinute: 6 });

// Hard clamp on user-supplied prompt-input strings. Generous enough for
// any real company metadata, tight enough that an attacker can't stuff
// the prompt with garbage to inflate cost or steer the model.
function clamp(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, max);
}

// In-memory server-side cache for generated briefs, keyed by a stable
// hash of the normalised inputs. Survives client localStorage clears
// (e.g. Replit preview reloads) so repeat opens of the same profile
// return in <10ms instead of waiting 10-20s for another Claude call.
// Process-lifetime only; that's fine for a demo + costs nothing in
// extra deps. 7-day TTL is plenty for sales-prep sessions.
const briefCache = new Map<string, { brief: unknown; cachedAt: number }>();
const BRIEF_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BRIEF_CACHE_MAX = 200;

function cacheKey(parts: Array<string | number | undefined>): string {
  return parts.map(p => (p ?? "").toString().toLowerCase().trim()).join("\u0001");
}
function cacheGet(key: string): unknown | null {
  const hit = briefCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > BRIEF_CACHE_TTL_MS) {
    briefCache.delete(key);
    return null;
  }
  return hit.brief;
}
function cacheSet(key: string, brief: unknown): void {
  if (briefCache.size >= BRIEF_CACHE_MAX) {
    // Evict oldest entry — Map iteration is insertion-ordered.
    const oldest = briefCache.keys().next().value;
    if (oldest !== undefined) briefCache.delete(oldest);
  }
  briefCache.set(key, { brief, cachedAt: Date.now() });
}

const SYSTEM_PROMPT = `You are a senior strategist at a top-tier management consultancy producing a confidential "company intelligence" briefing for a CEO-level sales meeting. The briefing must be substantive, specific, and editorial — not marketing fluff, not bullet-point soup. Use your training-data knowledge of the real company.

Return STRICT JSON only — no prose, no code fences. Conform exactly to this TypeScript shape:

{
  "company": {
    "snapshot": string,           // 3-5 sentences: what the company actually does, who it serves, scale, distinctive operating model. Editorial voice.
    "history": string,            // 2-3 sentences: founding, key inflection points, current chapter.
    "businessModel": string,      // 2-3 sentences: how it makes money, unit economics in plain terms, channel mix.
    "differentiators": string[]   // 3-5 short phrases — what makes it different from peers
  },
  "leaders": Array<{              // 4-6 named executives — real people if known, plausible roles if not.
    "name": string,
    "role": string,               // e.g. "CEO", "CFO", "President, Music & Arts"
    "background": string          // 1-2 sentences: tenure, prior role, signal about their priorities
  }>,
  "financials": {
    "scale": string,              // e.g. "≈$2.1B revenue, FY24; mid-single-digit EBITDA margins"
    "trajectory": string,         // 2-3 sentences: growth trend, margin trajectory, recent shifts
    "capitalStructure": string,   // 1-2 sentences: ownership, leverage, recent transactions
    "kpis": Array<{ label: string; value: string; note?: string }>  // 4-6 metric tiles. "label" e.g. "Revenue (FY24)", "value" e.g. "$2.1B", "note" e.g. "−4% YoY"
  },
  "aiOpportunities": Array<{      // 4-6 SPECIFIC, named AI use cases for THIS company — not generic.
    "title": string,              // e.g. "Promo-depth elasticity engine for the top-100 SKUs"
    "where": string,              // e.g. "Pricing & merchandising"
    "problem": string,            // 2-3 sentences: the operational problem it would solve, grounded in this company's reality
    "solution": string,           // 2-3 sentences: what the AI would actually do (data inputs → decision/output)
    "impact": string,             // 1 sentence: estimated business impact (margin pts, hours saved, attach rate, etc.)
    "horizon": "Now" | "6 months" | "12+ months"
  }>,
  "narrative": string             // 4-6 sentences: the integrated thesis. What is this company's central business problem right now, and why is AI-enabled decisioning the most under-utilised lever? Tie to the four sections above. Editorial, declarative, specific.
}

Critical rules:
- Be specific. Name real people, real numbers, real competitors, real product lines. If you don't know, invent plausibly but mark uncertainty (e.g. "≈$2.1B").
- AI opportunities must reference THIS company's operational specifics — its supply chain, its category mix, its customer segments. Generic "use AI for personalization" answers are unacceptable.
- Numbers should be plausible for the company's scale.
- Editorial voice: precise, declarative, no hedging clichés.
- Output JSON ONLY. No \`\`\` fences. No commentary outside the JSON.`;

router.post("/intelligence/brief", briefRateLimit, async (req, res) => {
  const raw = (req.body ?? {}) as Record<string, unknown>;
  // Clamp every user-supplied prompt input to a sane length before assembly.
  const name        = clamp(raw.name,        120);
  const url         = clamp(raw.url,         200);
  const sector      = clamp(raw.sector,      160);
  const hqCity      = clamp(raw.hqCity,      120);
  const hqState     = clamp(raw.hqState,     80);
  const revenueBand = clamp(raw.revenueBand, 80);
  const ownership   = clamp(raw.ownership,   200);
  const tagline     = clamp(raw.tagline,     280);
  const founded = typeof raw.founded === "number" && Number.isInteger(raw.founded)
    && raw.founded >= 1700 && raw.founded <= 2100 ? raw.founded : undefined;
  if (!name) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }

  // Cache-first: same inputs → return the previously generated brief
  // instantly. `?refresh=1` skips the cache for forced regeneration.
  const forceRefresh = req.query.refresh === "1" || req.query.refresh === "true";
  const key = cacheKey([name, url, sector, hqCity, hqState, revenueBand, ownership, founded, tagline]);
  if (!forceRefresh) {
    const cached = cacheGet(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached);
      return;
    }
  }

  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) {
    req.log.error("Anthropic AI integration env vars missing");
    res.status(503).json({ error: "AI integration is not configured on this server." });
    return;
  }

  const lines: string[] = [`Company: ${name}`];
  if (url)         lines.push(`Homepage: ${url}`);
  if (sector)      lines.push(`Sector: ${sector}`);
  if (hqCity)      lines.push(`Headquarters: ${hqState ? `${hqCity}, ${hqState}` : hqCity}`);
  if (revenueBand) lines.push(`Revenue band (rough): ${revenueBand}`);
  if (ownership)   lines.push(`Ownership: ${ownership}`);
  if (founded)     lines.push(`Founded: ${founded}`);
  if (tagline)     lines.push(`One-liner: ${tagline}`);
  lines.push("", "Produce the briefing JSON now.");
  const userPrompt = lines.join("\n");

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
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      req.log.error({ status: apiRes.status, body: errBody.slice(0, 500) }, "Anthropic API error");
      res.status(502).json({ error: `Upstream AI error (HTTP ${apiRes.status}).` });
      return;
    }

    const payload = (await apiRes.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.find(b => b.type === "text")?.text ?? "";
    if (!text) {
      res.status(502).json({ error: "AI returned no text content." });
      return;
    }

    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    let brief: unknown;
    try {
      brief = JSON.parse(cleaned);
    } catch {
      req.log.error({ snippet: cleaned.slice(0, 300) }, "Failed to parse AI JSON");
      res.status(502).json({ error: "AI returned invalid JSON. Try again." });
      return;
    }

    const normalised = normaliseBrief(brief);
    if (!normalised.ok) {
      req.log.error({ reason: normalised.reason }, "AI brief failed validation");
      res.status(502).json({ error: `AI brief invalid: ${normalised.reason}` });
      return;
    }

    const payloadOut = { ...normalised.value, generatedAt: new Date().toISOString() };
    cacheSet(key, payloadOut);
    res.setHeader("X-Cache", "MISS");
    res.json(payloadOut);
  } catch (e) {
    req.log.error({ err: String(e) }, "Intelligence brief route failed");
    res.status(500).json({ error: "Briefing generation failed unexpectedly." });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Validator/normaliser — coerces an untrusted AI JSON blob into a strict
// shape the client can render. Truncates strings, drops malformed entries.
// ───────────────────────────────────────────────────────────────────────────
type NormResult<T> = { ok: true; value: T } | { ok: false; reason: string };

function asStr(v: unknown, max: number, fallback = ""): string {
  if (typeof v === "string") return v.slice(0, max);
  return fallback;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

interface NormalisedBrief {
  company: { snapshot: string; history: string; businessModel: string; differentiators: string[] };
  leaders: Array<{ name: string; role: string; background: string }>;
  financials: {
    scale: string;
    trajectory: string;
    capitalStructure: string;
    kpis: Array<{ label: string; value: string; note?: string }>;
  };
  aiOpportunities: Array<{
    title: string; where: string; problem: string; solution: string; impact: string;
    horizon: "Now" | "6 months" | "12+ months";
  }>;
  narrative: string;
}

function normaliseBrief(raw: unknown): NormResult<NormalisedBrief> {
  if (!isRecord(raw)) return { ok: false, reason: "root is not an object" };

  const c = raw.company;
  if (!isRecord(c)) return { ok: false, reason: "company section missing" };
  const company = {
    snapshot:        asStr(c.snapshot, 1200),
    history:         asStr(c.history, 800),
    businessModel:   asStr(c.businessModel, 800),
    differentiators: Array.isArray(c.differentiators)
      ? c.differentiators.map(v => asStr(v, 120)).filter(s => s.length > 0).slice(0, 8)
      : [],
  };
  if (!company.snapshot) return { ok: false, reason: "company.snapshot missing" };

  if (!Array.isArray(raw.leaders)) return { ok: false, reason: "leaders missing" };
  const leaders = raw.leaders
    .map(l => isRecord(l) ? {
      name:       asStr(l.name, 80),
      role:       asStr(l.role, 120),
      background: asStr(l.background, 600),
    } : null)
    .filter((l): l is NonNullable<typeof l> => !!l && l.name.length > 0 && l.role.length > 0)
    .slice(0, 10);
  if (leaders.length === 0) return { ok: false, reason: "no valid leaders" };

  const f = raw.financials;
  if (!isRecord(f)) return { ok: false, reason: "financials missing" };
  const kpis = Array.isArray(f.kpis)
    ? f.kpis.map(k => isRecord(k) ? {
        label: asStr(k.label, 60),
        value: asStr(k.value, 40),
        note:  asStr(k.note, 60) || undefined,
      } : null)
      .filter((k): k is NonNullable<typeof k> => !!k && k.label.length > 0 && k.value.length > 0)
      .slice(0, 8)
    : [];
  const financials = {
    scale:            asStr(f.scale, 400),
    trajectory:       asStr(f.trajectory, 800),
    capitalStructure: asStr(f.capitalStructure, 600),
    kpis,
  };

  if (!Array.isArray(raw.aiOpportunities)) return { ok: false, reason: "aiOpportunities missing" };
  const aiOpportunities = raw.aiOpportunities
    .map(o => {
      if (!isRecord(o)) return null;
      const horizonRaw = asStr(o.horizon, 16);
      const horizon: NormalisedBrief["aiOpportunities"][number]["horizon"] =
        horizonRaw === "Now" || horizonRaw === "6 months" || horizonRaw === "12+ months"
          ? horizonRaw : "6 months";
      return {
        title:    asStr(o.title, 180),
        where:    asStr(o.where, 120),
        problem:  asStr(o.problem, 800),
        solution: asStr(o.solution, 800),
        impact:   asStr(o.impact, 240),
        horizon,
      };
    })
    .filter((o): o is NonNullable<typeof o> => !!o && o.title.length > 0 && o.problem.length > 0)
    .slice(0, 10);
  if (aiOpportunities.length === 0) return { ok: false, reason: "no valid AI opportunities" };

  const narrative = asStr(raw.narrative, 2000);
  if (!narrative) return { ok: false, reason: "narrative missing" };

  return { ok: true, value: { company, leaders, financials, aiOpportunities, narrative } };
}

export default router;

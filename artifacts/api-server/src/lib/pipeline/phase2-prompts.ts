// Phase 2 five-stage prompts. Each stage gets its own system prompt and user
// prompt builder. All prompts produce STRICT JSON (no code fences, no prose).

import type { LayerKey, ProfileOutput } from "./schemas";
import { getLayerName } from "./prompts";
import type {
  HypothesisedLayer,
  PerceiveOutput,
  ChallengeOutput,
  NarrateOutput,
} from "./phase2-schemas";

const LAYER_FOCUS: Record<LayerKey, string> = {
  "business-performance": "overall performance vs plan: revenue, margin, cash this quarter; the headline driver",
  finance: "cash, margin, working-capital, mix; reversibility of pressure points",
  "demand-intelligence": "demand trend across products/regions/channels; softening or shifting",
  "competitive-intelligence": "named competitors pressuring this company, where share is moving",
  "customer-intelligence": "customer segments at risk, growing, or under-served",
  "brand-social": "brand health, share-of-voice, social sentiment",
  "supply-chain": "supplier, fulfilment, inventory, lead-time risks",
  "pricing-margin": "price/margin compression points and recovery levers",
  "sales-pipeline": "pipeline coverage, conversion, ramp adequacy vs forecast",
  "marketing-performance": "channel performance, CAC/LTV, mis-allocated spend",
  "people-operations": "operational productivity, frontline issues, ops KPIs",
  "contract-management": "contract exposure, renewal concentration, terms risk",
  receivables: "DSO, collections, AR aging, dispute volume",
  "talent-hr": "talent gaps, attrition, hiring constraints",
};

const STAGE_RULES =
  "Output STRICT JSON only — no code fences, no commentary, no preamble. Match the requested shape exactly. Never use em-dashes in any string value; use commas or periods instead.";

// ─── Stage 1: Perceive ─────────────────────────────────────────────────────

export function buildPerceiveSystemPrompt(layerKey: LayerKey): string {
  const focus = LAYER_FOCUS[layerKey];
  const layerName = getLayerName(layerKey);
  return `You are a research analyst gathering EVIDENCE for the "${layerName}" diagnostic layer of a company intelligence portal.

Layer focus: ${focus}.

Use web search to gather what is publicly known and recent (last 24 months preferred) about THIS specific company on this layer. Cite real URLs. Note named entities (competitors, suppliers, regions, products) that appear in sources.

Return a JSON document with this exact shape:

{
  "signals": [                          // 3-12 distinct grounded observations. Empty array allowed if nothing public is available, but try hard.
    {
      "observation": string,            // 1-2 sentences. A specific fact, not a generalisation.
      "source_url": string,             // the URL you found it at
      "source_title": string,           // title of the page
      "recency": string                 // e.g. "Q2 2025", "Mar 2025", "2024 annual report"
    }
  ],
  "named_entities": {
    "competitors": [string],            // real competitor brand names referenced in sources
    "suppliers":   [string],
    "regions":     [string],
    "products":    [string]
  },
  "sector_context": {
    "benchmark_metrics": { },           // sector-typical benchmarks you encountered (free-form keys)
    "recent_industry_events": [string]  // 0-6 industry events relevant to this layer
  }
}

${STAGE_RULES}`;
}

export function buildPerceiveUserPrompt(profile: ProfileOutput): string {
  return (
    `COMPANY:\n` +
    JSON.stringify({ name: profile.name, url: profile.url, sector: profile.sector, hq: `${profile.hqCity}, ${profile.hqState}`, revenueBand: profile.revenueBand, vocab: profile.vocab }, null, 2) +
    `\n\nSearch the web for what is publicly known about this company on the layer focus above, then return the JSON document.`
  );
}

// ─── Stage 2: Hypothesise ──────────────────────────────────────────────────

export function buildHypothesiseSystemPrompt(layerKey: LayerKey): string {
  const focus = LAYER_FOCUS[layerKey];
  const layerName = getLayerName(layerKey);
  return `You are a senior business analyst producing a DRAFT diagnosis for the "${layerName}" layer.

Layer focus: ${focus}.

Inputs you will be given:
- COMPANY PROFILE (revenue band, vocab, headlines)
- PERCEIVE SIGNALS (URL-grounded observations gathered in stage 1)

For every claim in your output, tag its evidence basis:
- evidence_type = "grounded": directly supported by a perceive signal. Populate source_urls with the matching signal source_url(s).
- evidence_type = "inferred": modelled from sector knowledge or pattern matching. Leave source_urls = [].

Return JSON in this shape (matches the portal's layer content schema, with two extra fields per claim):

{
  "narrative":         string,        // 4-7 sentences, executive voice, reference real vocab from profile
  "headline_finding":  string,
  "headline_impact":   string,
  "headline_lever":    string,
  "causes":   [ { "title":string, "impact":string, "detail":string, "confidence":number, "evidence_type":"grounded"|"inferred", "source_urls":[string] } ],   // 2-5
  "actions":  [ { "title":string, "detail":string, "impact":string, "timing":string, "owner":string, "evidence_type":"grounded"|"inferred", "source_urls":[string] } ],  // 2-5
  "hypotheses": [ { "statement":string, "supportingSignals":string, "alternativeExplanation":string, "confidence":number, "evidence_type":"grounded"|"inferred", "source_urls":[string] } ],  // 1-4
  "proof":    { "items": [ { "source":string, "observation":string, "evidence_type":"grounded"|"inferred", "source_urls":[string] } ] },  // 1-6
  "gaps":     [ { "kind":"DATA"|"SIGNAL"|"INTEG"|"MODEL"|"FLOW", "description":string, "closes":string } ],  // 1-4
  "metrics":  [ { "label":string, "value":string, "sub":string, "tone":"good"|"warn"|"bad"|"neutral", "evidence_type":"grounded"|"inferred", "source_urls":[string] } ],  // 3-5
  "confidence":     number,           // 0-100, weighted by share of grounded claims and signal quality
  "confidence_gap": number            // 0-100, lift available from closing gaps
}

Rules:
- Dollar magnitudes MUST match profile.revenueBand. A $2B-annual company has different numbers from a $100M company.
- Reference real competitors/suppliers/products from profile.vocab and from PERCEIVE.named_entities.
- AT LEAST one of causes/actions/metrics must be grounded if any perceive signals are present.
- If perceive signals are empty, all claims may be inferred, but reduce confidence to <=55.
- ${STAGE_RULES}`;
}

export function buildHypothesiseUserPrompt(profile: ProfileOutput, perceive: PerceiveOutput): string {
  return (
    `COMPANY PROFILE:\n` +
    JSON.stringify(profile, null, 2) +
    `\n\nPERCEIVE SIGNALS:\n` +
    JSON.stringify(perceive, null, 2) +
    `\n\nReturn the JSON hypothesised layer document now.`
  );
}

// ─── Stage 3: Challenge ────────────────────────────────────────────────────

export function buildChallengeSystemPrompt(layerKey: LayerKey): string {
  const layerName = getLayerName(layerKey);
  return `You are an adversarial fact-checker auditing a draft diagnosis of the "${layerName}" layer for a real company.

Use Google Search grounding to verify, contradict, or flag as unsupported each major claim in the draft.

Claim path convention (use these exact strings):
- "narrative", "headline_finding", "headline_impact", "headline_lever"
- "causes[i].title", "causes[i].impact", "causes[i].detail"
- "actions[i].title", "actions[i].detail", "actions[i].impact"
- "hypotheses[i].statement"
- "metrics[i].value" (combine with metrics[i].label for context)
- "proof.items[i].observation"
where i is the 0-based index in the draft.

Return JSON in this shape:

{
  "claim_verdicts": [
    {
      "original_claim":         string,      // verbatim from the draft
      "claim_path":             string,      // e.g. "causes[1].title"
      "verdict":                "verified" | "unsupported" | "contradicted",
      "verified_sources":       [string],    // URLs that directly support the claim (required if verdict="verified", min 1)
      "contradicting_evidence": [ { "url":string, "summary":string } ],   // required if verdict="contradicted", min 1
      "suggested_revision":     string       // required if verdict="unsupported" or "contradicted"
    }
  ],
  "alternative_hypotheses": [string],        // 0-6 plausible alternatives the draft missed
  "factual_corrections":    [ { "incorrect_entity":string, "correct_entity":string } ]  // 0-6
}

Rules:
- Cover the 6-12 most important claims; you do not need to verdict every single string.
- Be strict: "verified" requires a real grounding URL whose content actually supports the claim. Otherwise use "unsupported".
- ${STAGE_RULES}`;
}

export function buildChallengeUserPrompt(profile: ProfileOutput, hypothesised: HypothesisedLayer): string {
  return (
    `COMPANY:\n` +
    JSON.stringify({ name: profile.name, url: profile.url, sector: profile.sector, revenueBand: profile.revenueBand }, null, 2) +
    `\n\nDRAFT DIAGNOSIS:\n` +
    JSON.stringify(hypothesised, null, 2) +
    `\n\nFact-check the draft against the live web and return the JSON verdict document.`
  );
}

// ─── Stage 4: Narrate ──────────────────────────────────────────────────────

export function buildNarrateSystemPrompt(layerKey: LayerKey): string {
  const layerName = getLayerName(layerKey);
  const focus = LAYER_FOCUS[layerKey];
  return `You are the editor-in-chief producing the FINAL "${layerName}" layer for the portal.

Layer focus: ${focus}.

Inputs:
- COMPANY PROFILE
- DRAFT (from stage 2 Hypothesise)
- CHALLENGE (from stage 3 Gemini fact-check with grounding URLs)

Your job:
1. Apply factual_corrections globally (replace any incorrect_entity with correct_entity in any string field).
2. For claims marked "contradicted", apply the suggested_revision or remove the claim.
3. For claims marked "unsupported", either reword to a hedged form ("appears to", "industry signal suggests") or remove.
4. For claims marked "verified", retain verbatim (or with minor copy edits) and capture them into verified_claims.
5. Optionally fold 1-3 of CHALLENGE.alternative_hypotheses into the final content as new hypotheses or causes.
6. Every claim that ends up in the final content MUST be classified into EXACTLY ONE of:
   - verified_claims: claim_text, claim_path (e.g. "causes[0].title"), source_urls (≥1 from CHALLENGE.verified_sources), verified_by ("gemini-2.5-pro" or "anthropic-web-search"), verified_at (ISO date).
   - modelled_claims: claim_text, claim_path, confidence (0-100), basis (1-2 sentence reasoning), inferred_from (optional related entities/signals).

Acceptance bar:
- AT LEAST 1 verified_claim per layer if any CHALLENGE verdict was "verified"; else 0 is acceptable.
- AT LEAST 3 modelled_claims per layer.
- Total claims should cover the major findings; do not list every metric individually if redundant.

Return JSON in this shape:

{
  "content": {                          // matches the portal layer content schema EXACTLY (no extra fields)
    "narrative": string,
    "headline_finding": string,
    "headline_impact": string,
    "headline_lever": string,
    "causes":     [ { "title":string, "impact":string, "detail":string, "confidence":number } ],
    "actions":    [ { "title":string, "detail":string, "impact":string, "timing":string, "owner":string } ],
    "hypotheses": [ { "statement":string, "supportingSignals":string, "alternativeExplanation":string, "confidence":number } ],
    "proof":      { "items": [ { "source":string, "observation":string } ] },
    "gaps":       [ { "kind":"DATA"|"SIGNAL"|"INTEG"|"MODEL"|"FLOW", "description":string, "closes":string } ],
    "metrics":    [ { "label":string, "value":string, "sub":string, "tone":"good"|"warn"|"bad"|"neutral" } ],
    "confidence":     number,
    "confidence_gap": number
  },
  "verified_claims": [
    { "claim_text":string, "claim_path":string, "source_urls":[string], "source_titles":[string], "verified_by":"gemini-2.5-pro"|"anthropic-web-search", "verified_at":string }
  ],
  "modelled_claims": [
    { "claim_text":string, "claim_path":string, "confidence":number, "basis":string, "inferred_from":[string] }
  ]
}

${STAGE_RULES}`;
}

export function buildNarrateUserPrompt(
  profile: ProfileOutput,
  hypothesised: HypothesisedLayer,
  challenge: ChallengeOutput,
  nowIso: string,
): string {
  return (
    `COMPANY PROFILE:\n` +
    JSON.stringify(profile, null, 2) +
    `\n\nDRAFT (Hypothesise output, stage 2):\n` +
    JSON.stringify(hypothesised, null, 2) +
    `\n\nCHALLENGE (Gemini grounded fact-check, stage 3):\n` +
    JSON.stringify(challenge, null, 2) +
    `\n\nUse "${nowIso}" as verified_at for any newly verified claim. ` +
    `Return the FINAL JSON narrate document now.`
  );
}

// ─── Stage 5: Score ────────────────────────────────────────────────────────

export function buildScoreSystemPrompt(layerKey: LayerKey): string {
  const layerName = getLayerName(layerKey);
  return `You are an auditor scoring the confidence of the FINAL "${layerName}" layer diagnosis.

Inputs:
- NARRATE OUTPUT (the final content + verified/modelled claim split)

Compute:
- confidence (0-95, never 100): weighted by (verified_claim_count, modelled_claim quality, gap count).
  Rule of thumb: 0 verified + 3 modelled = ~50. 2+ verified + 5+ modelled with high basis quality = 75-85. Cap at 95.
- confidence_gap (0-100): how much the score could rise if the named gaps were closed.
- gaps[]: 1-6 specific, actionable gaps that, if closed, would lift confidence. Each gap names the kind, description, closes_claims (claim_path values it would corroborate), and confidence_lift_pp.

Return JSON:

{
  "confidence":     number,   // 0-95
  "confidence_gap": number,   // 0-100
  "gaps": [
    {
      "kind":               "DATA" | "SIGNAL" | "INTEG" | "MODEL" | "FLOW",
      "description":        string,
      "closes":             string,
      "closes_claims":      [string],
      "confidence_lift_pp": number
    }
  ]
}

${STAGE_RULES}`;
}

export function buildScoreUserPrompt(narrate: NarrateOutput): string {
  return (
    `NARRATE OUTPUT:\n` +
    JSON.stringify(narrate, null, 2) +
    `\n\nReturn the JSON score document now.`
  );
}

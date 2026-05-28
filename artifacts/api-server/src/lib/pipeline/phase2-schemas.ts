// Zod schemas for Phase 2 five-stage pipeline outputs.
//
// Stages 2 (Hypothesise) and 4 (Narrate) both materialise the layer content
// in the same shape that Phase 1 used (layerContentSchema), so the frontend
// stays compatible. Stages 1, 3, 5 produce intermediate JSON consumed only
// by the pipeline itself.

import { z } from "zod/v4";
import { layerContentSchema } from "./schemas";

// ─── Shared atoms ──────────────────────────────────────────────────────────

export const evidenceTypeEnum = z.enum(["grounded", "inferred"]);
export type EvidenceType = z.infer<typeof evidenceTypeEnum>;

const urlString = z.string().min(1).max(800);
const urlArray = z.array(urlString).max(8).optional().default([]);

// ─── Stage 1: Perceive ─────────────────────────────────────────────────────

export const signalSchema = z.object({
  observation: z.string().min(5).max(800),
  source_url: urlString,
  source_title: z.string().max(400).optional().default(""),
  recency: z.string().max(80).optional().default(""),
});
export type Signal = z.infer<typeof signalSchema>;

export const perceiveOutputSchema = z.object({
  signals: z.array(signalSchema).max(20).optional().default([]),
  named_entities: z
    .object({
      competitors: z.array(z.string().max(160)).max(60).optional().default([]),
      suppliers: z.array(z.string().max(160)).max(60).optional().default([]),
      regions: z.array(z.string().max(160)).max(60).optional().default([]),
      products: z.array(z.string().max(160)).max(60).optional().default([]),
    })
    .optional()
    .default({ competitors: [], suppliers: [], regions: [], products: [] }),
  sector_context: z
    .object({
      benchmark_metrics: z.record(z.string(), z.unknown()).optional().default({}),
      recent_industry_events: z.array(z.string().max(600)).max(10).optional().default([]),
    })
    .optional()
    .default({ benchmark_metrics: {}, recent_industry_events: [] }),
});
export type PerceiveOutput = z.infer<typeof perceiveOutputSchema>;

// ─── Stage 2: Hypothesise ──────────────────────────────────────────────────
// Mirrors layerContentSchema but adds evidence_type + source_urls per claim.
// Stage 4 strips these annotation fields before writing content to DB and
// uses them to partition claims into verified/modelled buckets.

const toneSchema = z.enum(["good", "warn", "bad", "neutral"]);
const gapKindSchema = z.enum(["DATA", "SIGNAL", "INTEG", "MODEL", "FLOW"]);

export const hypothesisedLayerSchema = z.object({
  narrative: z.string().min(20).max(6000),
  headline_finding: z.string().min(5).max(600),
  headline_impact: z.string().min(2).max(500),
  headline_lever: z.string().min(5).max(600),
  causes: z
    .array(
      z.object({
        title: z.string().min(2).max(300),
        impact: z.string().max(500),
        detail: z.string().max(1200),
        confidence: z.number().min(0).max(100).optional(),
        evidence_type: evidenceTypeEnum,
        source_urls: urlArray,
      }),
    )
    .min(1)
    .max(8),
  actions: z
    .array(
      z.object({
        title: z.string().min(2).max(300),
        detail: z.string().max(1200),
        impact: z.string().max(500),
        timing: z.string().max(160).optional(),
        owner: z.string().max(160).optional(),
        evidence_type: evidenceTypeEnum,
        source_urls: urlArray,
      }),
    )
    .min(1)
    .max(8),
  hypotheses: z
    .array(
      z.object({
        statement: z.string().min(5).max(600),
        supportingSignals: z.string().max(1200).optional(),
        alternativeExplanation: z.string().max(1200).optional(),
        confidence: z.number().min(0).max(100).optional(),
        evidence_type: evidenceTypeEnum,
        source_urls: urlArray,
      }),
    )
    .max(8)
    .optional()
    .default([]),
  // Accept either { items: [...] } or a bare array; Claude regresses to the
  // bare-array form ~10% of the time. Normalise to { items }.
  proof: z
    .union([
      z.object({
        items: z
          .array(
            z.object({
              source: z.string().max(240),
              observation: z.string().max(1200),
              evidence_type: evidenceTypeEnum,
              source_urls: urlArray,
            }),
          )
          .max(12),
      }),
      z
        .array(
          z.object({
            source: z.string().max(240),
            observation: z.string().max(1200),
            evidence_type: evidenceTypeEnum,
            source_urls: urlArray,
          }),
        )
        .max(12)
        .transform((items) => ({ items })),
    ])
    .optional()
    .default({ items: [] }),
  gaps: z
    .array(
      z.object({
        kind: gapKindSchema,
        description: z.string().max(600),
        closes: z.string().max(400).optional(),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  metrics: z
    .array(
      z.object({
        label: z.string().max(160),
        value: z.string().max(120),
        sub: z.string().max(300).optional(),
        tone: toneSchema,
        evidence_type: evidenceTypeEnum,
        source_urls: urlArray,
      }),
    )
    .min(1)
    .max(8),
  confidence: z.number().min(0).max(100),
  confidence_gap: z.number().min(0).max(100),
});
export type HypothesisedLayer = z.infer<typeof hypothesisedLayerSchema>;

// ─── Stage 3: Challenge ────────────────────────────────────────────────────

export const challengeOutputSchema = z.object({
  claim_verdicts: z
    .array(
      z.object({
        original_claim: z.string().min(1).max(1200),
        claim_path: z.string().min(1).max(160),
        verdict: z.enum(["verified", "unsupported", "contradicted"]),
        verified_sources: z.array(urlString).max(8).optional().default([]),
        contradicting_evidence: z
          .array(
            z.object({
              url: urlString,
              summary: z.string().max(800),
            }),
          )
          .max(8)
          .optional()
          .default([]),
        suggested_revision: z.string().max(1200).nullish(),
      }),
    )
    .max(60)
    .optional()
    .default([]),
  alternative_hypotheses: z.array(z.string().max(800)).max(10).optional().default([]),
  factual_corrections: z
    .array(
      z.object({
        incorrect_entity: z.string().max(200),
        correct_entity: z.string().max(400),
      }),
    )
    .max(10)
    .optional()
    .default([]),
});
export type ChallengeOutput = z.infer<typeof challengeOutputSchema>;

// ─── Stage 4: Narrate ──────────────────────────────────────────────────────
// Re-uses layerContentSchema for the final rendered content so the frontend
// stays unchanged, plus the verified/modelled claim arrays in the exact
// shape the brief specified.

export const verifiedClaimSchema = z.object({
  claim_text: z.string().min(2).max(1200),
  claim_path: z.string().min(1).max(160),
  source_urls: z.array(urlString).min(1).max(8),
  source_titles: z.array(z.string().max(400)).max(8).optional().default([]),
  verified_by: z.enum(["gemini-2.5-pro", "anthropic-web-search"]),
  verified_at: z.string().min(10).max(40),
});
export type VerifiedClaim = z.infer<typeof verifiedClaimSchema>;

export const modelledClaimSchema = z.object({
  claim_text: z.string().min(2).max(1200),
  claim_path: z.string().min(1).max(160),
  confidence: z.number().min(0).max(100),
  basis: z.string().min(2).max(800),
  inferred_from: z.array(z.string().max(600)).max(8).optional().default([]),
});
export type ModelledClaim = z.infer<typeof modelledClaimSchema>;

export const narrateOutputSchema = z.object({
  content: layerContentSchema,
  verified_claims: z.array(verifiedClaimSchema).max(60),
  modelled_claims: z.array(modelledClaimSchema).max(60),
});
export type NarrateOutput = z.infer<typeof narrateOutputSchema>;

// ─── Stage 5: Score ────────────────────────────────────────────────────────

export const scoreOutputSchema = z.object({
  confidence: z.number().min(0).max(95),
  confidence_gap: z.number().min(0).max(100),
  gaps: z
    .array(
      z.object({
        kind: gapKindSchema,
        description: z.string().max(600),
        closes: z.string().max(400).optional(),
        closes_claims: z.array(z.string().max(400)).max(8).optional().default([]),
        confidence_lift_pp: z.number().min(0).max(50).optional().default(0),
      }),
    )
    .max(12)
    .optional()
    .default([]),
});
export type ScoreOutput = z.infer<typeof scoreOutputSchema>;

// ─── Stage 6: Hero ─────────────────────────────────────────────────────────
// Short Haiku call that, given the finalised narrate content + tenant profile,
// produces a tenant-specific hero panel for the layer (eyebrow, headline,
// status pills, named spotlight entities). Stored on tenant_layers.hero_panel.
// Failure of this stage is non-degrading: the frontend falls back to the
// metric-only snapshot when the panel is null.

const heroToneSchema = z.enum(["good", "warn", "bad", "neutral"]);

export const heroPanelSchema = z.object({
  eyebrow: z.string().min(1).max(60),
  headline: z.string().min(2).max(200),
  subhead: z.string().max(400).optional().default(""),
  highlight_pills: z
    .array(z.object({ label: z.string().min(1).max(60), tone: heroToneSchema }))
    .max(3)
    .optional()
    .default([]),
  spotlight_entities: z
    .array(
      z.object({
        kind: z.enum(["competitor", "region", "segment", "supplier", "product", "channel", "metric"]),
        name: z.string().min(1).max(120),
        value: z.string().max(60).optional(),
        note: z.string().max(240).optional(),
        tone: heroToneSchema.optional(),
      }),
    )
    .max(6)
    .optional()
    .default([]),
});
export type HeroPanel = z.infer<typeof heroPanelSchema>;

export const heroOutputSchema = z.object({ hero_panel: heroPanelSchema });
export type HeroOutput = z.infer<typeof heroOutputSchema>;

// ─── Stage 7: Peers ───────────────────────────────────────────────────────
// Short Haiku call that, given the finalised narrate content + tenant
// profile, identifies 3-5 plausible sector peers and emits 2-4 per-metric
// comparison rows for the layer. Stored on tenant_layers.peer_benchmark.
// Non-degrading: failure leaves the panel null and the frontend skips it.

const peerToneSchema = z.enum(["ahead", "median", "behind"]);

export const peerBenchmarkSchema = z.object({
  peer_set: z.string().min(2).max(160),
  as_of: z.string().min(1).max(40),
  metrics: z
    .array(
      z.object({
        metric: z.string().min(1).max(120),
        tenant_value: z.string().min(1).max(40),
        median: z.string().min(1).max(40),
        best: z.string().min(1).max(40),
        best_label: z.string().min(1).max(80),
        unit: z.string().max(20).optional().default(""),
        position: z.number().min(0).max(100),
        tone: peerToneSchema,
        comment: z.string().min(1).max(400),
      }),
    )
    .min(2)
    .max(6),
});
export type PeerBenchmark = z.infer<typeof peerBenchmarkSchema>;

export const peersOutputSchema = z.object({ peer_benchmark: peerBenchmarkSchema });
export type PeersOutput = z.infer<typeof peersOutputSchema>;

// ─── Stage 8: Supplements ──────────────────────────────────────────────────
// Short Haiku call that emits 1-3 supplement blocks of a discriminated union
// shape (leaderboard | matrix | timeline | callout) for the layer. Stored on
// tenant_layers.supplement_blocks. Non-degrading.

const supplementToneSchema = z.enum(["good", "warn", "bad", "neutral"]);

const leaderboardBlockSchema = z.object({
  kind: z.literal("leaderboard"),
  title: z.string().min(2).max(80),
  eyebrow: z.string().max(40).optional().default(""),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.string().min(1).max(40),
        sub: z.string().max(80).optional().default(""),
        tone: supplementToneSchema.optional(),
      }),
    )
    .min(2)
    .max(8),
});

const matrixBlockSchema = z.object({
  kind: z.literal("matrix"),
  title: z.string().min(2).max(80),
  eyebrow: z.string().max(40).optional().default(""),
  columns: z.array(z.string().min(1).max(40)).min(2).max(5),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        cells: z.array(z.string().max(40)).min(2).max(5),
        tone: supplementToneSchema.optional(),
      }),
    )
    .min(2)
    .max(8),
});

const timelineBlockSchema = z.object({
  kind: z.literal("timeline"),
  title: z.string().min(2).max(80),
  eyebrow: z.string().max(40).optional().default(""),
  items: z
    .array(
      z.object({
        when: z.string().min(1).max(40),
        headline: z.string().min(2).max(160),
        detail: z.string().max(280).optional().default(""),
        tone: supplementToneSchema.optional(),
      }),
    )
    .min(2)
    .max(6),
});

const calloutBlockSchema = z.object({
  kind: z.literal("callout"),
  title: z.string().min(2).max(80),
  eyebrow: z.string().max(40).optional().default(""),
  body: z.string().min(4).max(600),
  tone: supplementToneSchema.optional(),
  bullets: z.array(z.string().min(1).max(160)).max(5).optional().default([]),
});

export const supplementBlockSchema = z.discriminatedUnion("kind", [
  leaderboardBlockSchema,
  matrixBlockSchema,
  timelineBlockSchema,
  calloutBlockSchema,
]);
export type SupplementBlock = z.infer<typeof supplementBlockSchema>;

export const supplementBlocksSchema = z.object({
  blocks: z.array(supplementBlockSchema).min(1).max(3),
});
export type SupplementBlocks = z.infer<typeof supplementBlocksSchema>;

// ─── Sub-stage 9: Briefs (tenant-scope) ────────────────────────────────────
// Rich copy that drives MorningBrief.tsx + BoardPack.tsx for any seeded
// tenant. Generated once per tenant after every layer has finalised, taking
// the profile + the bundle of per-layer narrative content as input.

const layerKeyEnum = z.enum([
  "business-performance",
  "finance",
  "demand-intelligence",
  "competitive-intelligence",
  "customer-intelligence",
  "brand-social",
  "supply-chain",
  "pricing-margin",
  "sales-pipeline",
  "marketing-performance",
  "people-operations",
  "contract-management",
  "receivables",
  "talent-hr",
]);

export const briefOverridesSchema = z.object({
  executiveRead: z.string().min(40).max(2000),
  pullQuote: z.string().min(20).max(600),
  combinedRecovery: z.string().min(2).max(80),
  recoveryConfidence: z.string().min(20).max(400),
  topFindings: z
    .array(
      z.object({
        layerKey: layerKeyEnum,
        finding: z.string().min(20).max(800),
        impact: z.string().min(2).max(160),
        lever: z.string().max(400).optional(),
      }),
    )
    .min(6)
    .max(13),
  rootCauses: z
    .array(
      z.object({
        title: z.string().min(2).max(160),
        impact: z.string().min(1).max(40),
        body: z.string().min(40).max(900),
      }),
    )
    .length(3),
  recoveryLevers: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        horizon: z.string().min(2).max(60),
        recovery: z.string().min(1).max(60),
        owner: z.string().min(2).max(80),
        body: z.string().min(40).max(900),
      }),
    )
    .length(3),
});
export type BriefOverrides = z.infer<typeof briefOverridesSchema>;

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

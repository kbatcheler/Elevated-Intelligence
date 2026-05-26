// Zod schemas for Phase 1 Claude pipeline outputs. Kept deliberately
// permissive on lengths and optional fields, strict on shape — Claude can
// be creative inside our bounds but the JSON envelope is non-negotiable.
//
// All `unknown[]` arrays use `z.array(z.unknown())` so the pipeline accepts
// model-authored content without losing shape, and downstream consumers
// cast or validate further as needed.

import { z } from "zod/v4";

// ─── Canonical layer keys (the 14 layers Phase 1 produces) ──────────────────
export const LAYER_KEYS = [
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
] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];

// ─── Canonical artifact kinds (the 5 cross-layer artifacts) ─────────────────
export const ARTIFACT_KINDS = [
  "morning_brief",
  "board_pack",
  "cross_layer_map",
  "narrator",
  "scenarios",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

// ─── Profile schema ─────────────────────────────────────────────────────────
// Strict on the fields the UI shell needs to render any tenant; permissive on
// the rest. `vocab` is preserved for Phase 2 (when we may re-introduce token
// swaps for cross-layer consistency) but the Phase 1 frontend ignores it.
export const profileSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().min(1).max(200),
  sector: z.string().max(160).optional(),
  hqCity: z.string().max(80).optional(),
  hqState: z.string().max(80).optional(),
  revenueBand: z.string().max(80).optional(),
  ownership: z.string().max(160).optional(),
  founded: z.number().int().min(1500).max(2100).optional(),
  tagline: z.string().max(400).optional(),
  logoMonogram: z.string().min(1).max(4),
  // Free-form vocab map of named entities (competitors, suppliers, regions)
  // visible on the homepage or commonly associated with the company.
  vocab: z.record(z.string(), z.string()).optional(),
  // Headline financials sized to the company's actual scale.
  headlines: z
    .object({
      revenueActual: z.string().max(40).optional(),
      revenuePlan: z.string().max(40).optional(),
      revenueVarPct: z.string().max(20).optional(),
      revenueVarDollars: z.string().max(40).optional(),
      marginActual: z.string().max(20).optional(),
      marginTarget: z.string().max(20).optional(),
      marginVarBps: z.string().max(20).optional(),
      cashActual: z.string().max(40).optional(),
      cashVar: z.string().max(60).optional(),
      cashTone: z.enum(["good", "warn", "bad"]).optional(),
      npsActual: z.number().min(-100).max(100).optional(),
      npsDelta: z.string().max(60).optional(),
    })
    .optional(),
  executiveRead: z.string().max(2000).optional(),
  pullQuote: z.string().max(500).optional(),
});
export type ProfileOutput = z.infer<typeof profileSchema>;

// ─── Layer schema ───────────────────────────────────────────────────────────
const toneSchema = z.enum(["good", "warn", "bad", "neutral"]);
const gapKindSchema = z.enum(["DATA", "SIGNAL", "INTEG", "MODEL", "FLOW"]);

// String caps here are safety nets, not strict contracts. The prompts steer
// Claude toward concise prose; we loosen the caps so the occasional richer
// sentence does not flip a whole layer into the fallback stub.
export const layerContentSchema = z.object({
  narrative: z.string().min(20).max(6000),
  headline_finding: z.string().min(5).max(600),
  headline_impact: z.string().min(2).max(300),
  headline_lever: z.string().min(5).max(600),
  causes: z
    .array(
      z.object({
        title: z.string().min(2).max(240),
        impact: z.string().max(240),
        detail: z.string().max(1200),
        confidence: z.number().min(0).max(100).optional(),
      }),
    )
    .min(1)
    .max(8),
  actions: z
    .array(
      z.object({
        title: z.string().min(2).max(240),
        detail: z.string().max(1200),
        impact: z.string().max(240),
        timing: z.string().max(160).optional(),
        owner: z.string().max(160).optional(),
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
      }),
    )
    .max(8)
    .optional()
    .default([]),
  proof: z
    .object({
      items: z
        .array(
          z.object({
            source: z.string().max(240),
            observation: z.string().max(1200),
          }),
        )
        .max(12),
    })
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
      }),
    )
    .min(1)
    .max(8),
  confidence: z.number().min(0).max(100),
  confidence_gap: z.number().min(0).max(100),
});
export type LayerContent = z.infer<typeof layerContentSchema>;

// Fallback stub used when a layer's content fails validation twice. The UI
// surfaces this clearly as "not generated successfully" with a refresh button
// instead of pretending we have content.
export function layerFallbackStub(layerKey: LayerKey): LayerContent {
  return {
    narrative:
      "This layer could not be generated successfully. Refresh the tenant to retry the pipeline for this layer.",
    headline_finding: "Layer generation failed validation.",
    headline_impact: "Unknown",
    headline_lever: "Refresh the tenant to retry this layer.",
    causes: [
      {
        title: "Pipeline validation failure",
        impact: "N/A",
        detail: `The layer "${layerKey}" did not return schema-valid JSON after a retry.`,
      },
    ],
    actions: [
      {
        title: "Refresh tenant",
        detail: "Re-run the Phase 1 pipeline for this tenant.",
        impact: "Repopulates this layer.",
      },
    ],
    hypotheses: [],
    proof: { items: [] },
    gaps: [],
    metrics: [{ label: "Status", value: "Failed", tone: "bad" }],
    confidence: 0,
    confidence_gap: 0,
  };
}

// ─── Artifacts schema ───────────────────────────────────────────────────────
// One object containing all five artifact kinds. The pipeline splits the
// returned object into 5 rows on commit.
export const artifactsOutputSchema = z.object({
  morning_brief: z.object({
    headline: z.string().min(5).max(600),
    pullQuote: z.string().max(800).optional(),
    sections: z
      .array(
        z.object({
          title: z.string().max(240),
          body: z.string().max(3000),
        }),
      )
      .min(2)
      .max(8),
  }),
  board_pack: z.object({
    headline: z.string().min(5).max(600),
    sections: z
      .array(
        z.object({
          title: z.string().max(240),
          body: z.string().max(3000),
          bullets: z.array(z.string().max(600)).max(8).optional().default([]),
        }),
      )
      .min(2)
      .max(8),
  }),
  cross_layer_map: z.object({
    nodes: z
      .array(
        z.object({
          key: z.string().max(120),
          label: z.string().max(200),
          status: toneSchema.optional(),
        }),
      )
      .min(2)
      .max(40),
    edges: z
      .array(
        z.object({
          from: z.string().max(120),
          to: z.string().max(120),
          label: z.string().max(240).optional(),
        }),
      )
      .min(1)
      .max(80),
    insights: z.array(z.string().max(600)).min(1).max(12),
  }),
  narrator: z.object({
    morningSummary: z.string().min(20).max(3000),
    perLayer: z.record(z.string(), z.string().max(1200)).optional().default({}),
  }),
  scenarios: z
    .array(
      z.object({
        key: z.string().max(120),
        label: z.string().max(240),
        description: z.string().max(1200),
        impact: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(8),
});
export type ArtifactsOutput = z.infer<typeof artifactsOutputSchema>;

export function artifactFallbackStubs(): ArtifactsOutput {
  return {
    morning_brief: {
      headline: "Artifacts could not be generated. Refresh the tenant to retry.",
      sections: [
        { title: "Status", body: "Pipeline returned invalid artifact JSON." },
        { title: "Next step", body: "Refresh the tenant from the picker." },
      ],
    },
    board_pack: {
      headline: "Board pack unavailable. Refresh the tenant to retry.",
      sections: [
        { title: "Status", body: "Pipeline returned invalid artifact JSON.", bullets: [] },
      ],
    },
    cross_layer_map: {
      nodes: [{ key: "status", label: "Generation failed" }],
      edges: [{ from: "status", to: "status" }],
      insights: ["Refresh the tenant to retry the pipeline."],
    },
    narrator: {
      morningSummary: "Narrator content could not be generated. Refresh the tenant to retry.",
      perLayer: {},
    },
    scenarios: [
      {
        key: "refresh",
        label: "Refresh the tenant",
        description: "The pipeline returned invalid scenario JSON. Refresh to retry.",
      },
    ],
  };
}

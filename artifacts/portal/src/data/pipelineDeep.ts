// Deep "pipeline detail" tables. Per-tenant pipeline-detail panels require
// upstream data wiring deferred to Phase 2. Phase 1 exports the type
// contracts only; the PipelineDetail component renders an empty placeholder
// when PIPELINE_DEEP[layerKey] is undefined.

export interface DeepRow {
  cols: string[];
  tone?: "good" | "warn" | "bad";
}

export interface DeepTable {
  title: string;
  subtitle: string;
  headers: string[];
  rows: DeepRow[];
  footnote: string;
}

export interface PipelineDeep {
  eyebrow: string;
  intro: string;
  primary: DeepTable;
  secondary: DeepTable;
  modelNote: { title: string; detail: string };
}

export const PIPELINE_DEEP: Record<string, PipelineDeep> = {};

// Per-layer prescriptive next-step playbook. The Phase 1 pipeline emits
// actions per layer (LayerContent.actions); the dedicated three-horizon
// next-steps block is deferred to Phase 2. Type contracts retained.

export interface NextStep {
  title: string;
  detail: string;
  owner: string;
  effort: "1d" | "2d" | "1wk" | "2wk" | "1mo";
  outcome: string;
  depends?: string;
}

export interface NextStepsBlock {
  now: NextStep;
  week: NextStep;
  month: NextStep;
}

export const NEXT_STEPS: Record<string, NextStepsBlock> = {};

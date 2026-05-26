// Scenario war-room levers. Per-tenant lever sets are produced by the
// pipeline `scenarios` artifact in Phase 1; richer modelling is deferred
// to Phase 2. Type + computeImpact helper retained for the WarRoom
// component, which falls back to an empty state when LEVERS is empty.

export interface Lever {
  id: string;
  layer: string;
  layerLabel: string;
  title: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  impactPerUnit: number;
  uncertaintyPerUnit: number;
  direction: "revenue" | "margin" | "cash";
  minLabel: string;
  maxLabel: string;
  cautionAbove?: number;
  cautionNote?: string;
}

export const LEVERS: Lever[] = [];

export interface LeverImpact {
  revenue: number;
  margin: number;
  cash: number;
  ebitda: number;
  uncertainty: number;
  revenueM: number;
  marginM: number;
  cashM: number;
  uncertaintyM: number;
}

// Phase 1: LEVERS is empty so this returns the zero impact baseline. The
// second `values` argument is retained for back-compat with WarRoom.
export function computeImpact(
  values: Record<string, number> = {},
  _levers: Lever[] = LEVERS,
): LeverImpact {
  void values; void _levers;
  return {
    revenue: 0, margin: 0, cash: 0, ebitda: 0, uncertainty: 0,
    revenueM: 0, marginM: 0, cashM: 0, uncertaintyM: 0,
  };
}

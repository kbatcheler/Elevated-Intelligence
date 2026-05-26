// Per-layer historical snapshots for the time-travel slider.
// Phase 1 does not emit history (single seed = single point in time).
// Type contracts retained; TimeTravel component renders nothing when
// TIMELINES[layerKey] is undefined.

export interface Snapshot {
  label: string;
  diagnosedAt: string;
  confidence: number;
  headline: string;
  delta?: string;
}

export type Timeline = [Snapshot, Snapshot, Snapshot];

export const TIMELINES: Record<string, Timeline> = {};

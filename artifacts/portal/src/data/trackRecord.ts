// Outcome track record. Records every committed action's predicted vs
// delivered outcome, scoped to the active tenant. Phase 1 ships an empty
// roster, the TrackRecord page renders its empty state.

export type OutcomeStatus = "beat" | "met" | "partial" | "missed" | "in-flight";

export interface TrackRecordEntry {
  id: string;
  closedAt: string;
  quarter: string;
  layer: string;
  title: string;
  predicted: string;
  delivered: string;
  variance: string;
  status: OutcomeStatus;
  owner: string;
  note: string;
  predictedValue: number;
  deliveredValue: number;
}

export const TRACK_RECORD: TrackRecordEntry[] = [];

export interface TrackRecordSummary {
  entries: number;
  total: number;
  beat: number;
  met: number;
  partial: number;
  missed: number;
  inFlight: number;
  hitRate: number;
  hitRatePct: number;
  totalPredictedM: number;
  totalDeliveredM: number;
  totalPredictedDollar: number;
  totalDeliveredDollar: number;
  varianceM: number;
}

export function summary(entries: TrackRecordEntry[] = TRACK_RECORD): TrackRecordSummary {
  const counts = { beat: 0, met: 0, partial: 0, missed: 0, inFlight: 0 };
  let predicted = 0;
  let delivered = 0;
  for (const e of entries) {
    if (e.status === "beat")      counts.beat++;
    if (e.status === "met")       counts.met++;
    if (e.status === "partial")   counts.partial++;
    if (e.status === "missed")    counts.missed++;
    if (e.status === "in-flight") counts.inFlight++;
    predicted += e.predictedValue || 0;
    delivered += e.deliveredValue || 0;
  }
  const scored = counts.beat + counts.met + counts.partial + counts.missed;
  const hit = scored > 0 ? Math.round(((counts.beat + counts.met) / scored) * 100) : 0;
  return {
    entries: entries.length,
    total: entries.length,
    beat: counts.beat, met: counts.met,
    partial: counts.partial, missed: counts.missed, inFlight: counts.inFlight,
    hitRate: hit,
    hitRatePct: hit,
    totalPredictedM: predicted, totalDeliveredM: delivered,
    totalPredictedDollar: predicted, totalDeliveredDollar: delivered,
    varianceM: delivered - predicted,
  };
}

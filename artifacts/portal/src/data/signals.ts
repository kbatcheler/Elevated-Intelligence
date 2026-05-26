// Live signal stream + anomaly inbox + evidence drill-down catalogue.
//
// The live signal ticker and anomaly inbox require per-tenant streaming
// wiring (Phase 2). Phase 1 ships a small neutral signal pool so the ticker
// has something to scroll while the pipeline is being seeded, plus empty
// defaults for anomalies and evidence. Consumers (AnomalyInbox,
// EvidencePanel) render their empty states gracefully.

export type SignalTone = "info" | "warn" | "alert" | "good";

export interface IncomingSignal {
  ts: string;
  source: string;
  layer: string;
  metric?: string;
  text: string;
  tone: SignalTone;
  delta?: string;
}

export const SIGNAL_POOL: IncomingSignal[] = [
  { ts: "04:18", source: "ERP",                 layer: "business-performance",    text: "General ledger refresh complete, quarter close window updated.",                       tone: "info" },
  { ts: "04:25", source: "POS aggregator",      layer: "demand-intelligence",     text: "Hourly demand signals refreshed against the current weekly plan.",                     tone: "info" },
  { ts: "04:33", source: "CRM",                 layer: "sales-pipeline",          text: "Pipeline coverage ratio refreshed against the current quarter commit.",                tone: "info" },
  { ts: "04:40", source: "WMS",                 layer: "supply-chain",            text: "Inventory snapshot updated across the fulfilment network.",                            tone: "info" },
  { ts: "04:46", source: "Service platform",    layer: "customer-intelligence",   text: "Customer support volume tracked against the rolling weekly baseline.",                 tone: "info" },
  { ts: "04:52", source: "Pricing engine",      layer: "pricing-margin",          text: "Margin position refreshed against the current price index.",                            tone: "info" },
  { ts: "04:58", source: "Marketing analytics", layer: "marketing-performance",   text: "Campaign attribution model refreshed for the trailing 24-hour window.",                tone: "info" },
  { ts: "05:05", source: "Survey platform",     layer: "brand-social",            text: "Brand sentiment pulse updated against the rolling 7-day window.",                      tone: "info" },
];

export type AnomalySeverity = "critical" | "high" | "medium" | "low";

export interface Anomaly {
  id: string;
  ts: string;
  layer: string;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  evidence?: string;
  delta?: string;
}

export const ANOMALIES: Anomaly[] = [];

export interface EvidenceObservation {
  source: string;
  observation: string;
  confidence?: number;
}

export interface EvidenceRow {
  source: string;
  ts: string;
  value: string;
  note?: string;
  confidence: number;
}

export interface EvidenceCalcStep {
  step: string;
  value: string;
  note?: string;
}

// Per-tenant evidence drill-down spec. Phase 1: empty, EvidencePanel renders
// its empty state (no anomaly is ever opened, so the panel stays closed).
export interface EvidenceSpec {
  metric: string;
  layer: string;
  value: string;
  computedAs: string;
  query: string;
  calculation?: EvidenceCalcStep[];
  rows: EvidenceRow[];
  combinedConfidence: number;
  observations?: EvidenceObservation[];
}

export const EVIDENCE: Record<string, EvidenceSpec> = {};

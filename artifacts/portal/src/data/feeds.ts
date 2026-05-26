// Data-feed catalogue. Per-tenant feed inventory now comes from the server
// once that wiring lands (Phase 2). Phase 1 ships empty defaults so
// consuming components render their empty states cleanly.

export type FeedStatus = "live" | "stale" | "partial" | "missing" | "manual";
export type FeedType =
  | "ERP" | "CRM" | "WMS" | "POS" | "DW"
  | "Web" | "Ads" | "CDP" | "Social" | "Search"
  | "Survey" | "Panel" | "Scraper" | "External" | "HRIS"
  | "Sensor" | "EDI" | "Audit" | "Model" | "Manual" | "GEO";

export interface DataFeed {
  source: string;
  type: FeedType;
  cadence: string;
  lastSync: string;
  completeness: number;
  status: FeedStatus;
  pipelineUsd?: string;
  pipelineNote?: string;
}

export interface ActivityEvent {
  ts: string;
  layer: string;
  text: string;
  tone: "info" | "warn" | "alert" | "good";
}

export const FEEDS: Record<string, DataFeed[]> = {};

export const ACTIVITY_STREAM: ActivityEvent[] = [];

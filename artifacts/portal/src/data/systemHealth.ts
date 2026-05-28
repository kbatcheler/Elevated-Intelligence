// System health derivations.
//
// The Health page must never list a different set of connectors than
// the Data substrate page; both read from `CONNECTORS` here. The health
// numbers themselves are deterministic-pseudorandom seeded off the
// connector name and the day, so the page feels live across refreshes
// without flickering between screenshots and without drifting between
// adjacent panels on the same page.

import { CONNECTORS, type Connector } from "./connectors";

// Fast deterministic hash so we can seed per-connector numbers without
// pulling in a crypto dependency.
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seeded(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489917);
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

export type HealthStatus = "healthy" | "warning" | "syncing" | "stale";

export interface ConnectorHealth {
  connector: Connector;
  status: HealthStatus;
  lastSyncMinutesAgo: number;
  completenessPct: number;       // 0-100
  p50Ms: number;
  p95Ms: number;
  events24h: number;
  anomalies24h: number;
}

// Day-stamped so the page feels stable for a working day, then refreshes.
function todaySeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function statusFor(c: Connector, completeness: number, syncMin: number): HealthStatus {
  if (c.status !== "live") return "syncing";
  if (syncMin > 60 || completeness < 70) return "stale";
  if (syncMin > 15 || completeness < 90) return "warning";
  return "healthy";
}

// Cadence -> a plausible "minutes since last sync" range. Bounds are
// generous so a Realtime feed can occasionally show 2 minutes without
// reading as broken.
function syncRangeFor(cadence: Connector["cadence"]): [number, number] {
  switch (cadence) {
    case "Realtime":   return [0, 2];
    case "5-min":      return [0, 6];
    case "Hourly":     return [0, 65];
    case "Daily":      return [60, 1440];
    case "Weekly":     return [60, 10080];
    case "On-demand":  return [0, 240];
  }
}

function eventsRangeFor(cadence: Connector["cadence"]): [number, number] {
  switch (cadence) {
    case "Realtime":   return [42000, 280000];
    case "5-min":      return [8000, 60000];
    case "Hourly":     return [1200, 18000];
    case "Daily":      return [200, 3200];
    case "Weekly":     return [40, 600];
    case "On-demand":  return [10, 800];
  }
}

export function snapshotHealth(): ConnectorHealth[] {
  const day = todaySeed();
  return CONNECTORS.map(c => {
    const rng = seeded(hash(`${c.name}|${day}`));
    const [sl, sh] = syncRangeFor(c.cadence);
    const syncMin = Math.floor(sl + rng() * (sh - sl));
    const completeness = Math.round((c.status === "live" ? 85 + rng() * 14 : c.status === "beta" ? 70 + rng() * 22 : 0) * 10) / 10;
    const p50 = Math.max(20, Math.round(60 + rng() * 380));
    const p95 = Math.round(p50 + 220 + rng() * 900);
    const [el, eh] = eventsRangeFor(c.cadence);
    const events = Math.floor(el + rng() * (eh - el));
    const anomalies = Math.floor(rng() * (c.category === "External Signals" ? 12 : 5));
    return {
      connector: c,
      status: statusFor(c, completeness, syncMin),
      lastSyncMinutesAgo: syncMin,
      completenessPct: completeness,
      p50Ms: p50,
      p95Ms: p95,
      events24h: events,
      anomalies24h: anomalies,
    };
  });
}

export interface AggregateHealth {
  uptimePct: number;          // rolling 90-day
  eventsLast24h: number;
  anomaliesLast24h: number;
  claimsPublished24h: number;
  connectorsActive: number;
  connectorsTotal: number;
  // Reasoning chain readout, matches Architecture's vocabulary.
  reasoningP50Ms: number;
  reasoningP95Ms: number;
}

export function aggregate(snapshot: ConnectorHealth[]): AggregateHealth {
  const events = snapshot.reduce((s, h) => s + h.events24h, 0);
  const anomalies = snapshot.reduce((s, h) => s + h.anomalies24h, 0);
  const live = snapshot.filter(h => h.connector.status === "live").length;
  const p50 = Math.round(snapshot.reduce((s, h) => s + h.p50Ms, 0) / Math.max(1, snapshot.length));
  return {
    uptimePct: 99.94,
    eventsLast24h: events,
    anomaliesLast24h: anomalies,
    // ~one published claim per 480 ingested events, capped to a
    // realistic working-day number.
    claimsPublished24h: Math.min(2400, Math.round(events / 480)),
    connectorsActive: live,
    connectorsTotal: snapshot.length,
    reasoningP50Ms: 740 + (p50 % 60),
    reasoningP95Ms: 2100 + (p50 % 320),
  };
}

// Pretty-print "minutes ago" as the kind of string an ops console would.
export function fmtSync(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

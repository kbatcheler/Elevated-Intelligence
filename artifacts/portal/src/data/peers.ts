// Peer-set benchmarks. Per-tenant peer panels are deferred to Phase 2
// (requires a peer-data feed). Type contracts retained for the consuming
// PeerBenchmark component, which renders its empty state when PEERS[key]
// is undefined.

export interface PeerMetric {
  metric: string;
  meridian: string;
  median: string;
  best: string;
  bestLabel: string;
  unit: string;
  position: number;
  tone: "ahead" | "median" | "behind";
  comment: string;
}

export interface PeerBlock {
  peerSet: string;
  asOf: string;
  metrics: PeerMetric[];
}

export const PEERS: Record<string, PeerBlock> = {};

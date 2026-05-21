import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { SIGNAL_POOL, EVIDENCE, type IncomingSignal, type EvidenceSpec } from "../data/signals";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CommittedAction {
  id: string;
  layer: string;        // layer key
  layerTitle: string;
  title: string;
  detail: string;
  impact: string;
  owner: string;
  due: string;          // ISO-ish display string
  status: "committed" | "in-flight" | "done";
  committedAt: number;  // epoch ms
}

export interface Pulse {
  layer: string;
  metric: string;
  at: number;
}

interface AppContextValue {
  // global tick (1s) — drives ambient motion
  tick: number;
  // signal stream
  signals: IncomingSignal[];
  latest: IncomingSignal | null;
  pulse: Pulse | null;
  // anomaly inbox
  inboxOpen: boolean;
  openInbox: () => void;
  closeInbox: () => void;
  // evidence drill-down
  evidence: EvidenceSpec | null;
  openEvidence: (layer: string, metric: string) => void;
  closeEvidence: () => void;
  // committed actions
  committed: CommittedAction[];
  commitAction: (a: Omit<CommittedAction, "id" | "status" | "committedAt">) => void;
  advanceAction: (id: string) => void;
  removeCommitted: (id: string) => void;
  // time-travel offset for active layer: 0 = now, 1 = -3d, 2 = -7d
  timeOffsetByLayer: Record<string, number>;
  setTimeOffset: (layer: string, offset: number) => void;
  // morning brief overlay
  briefOpen: boolean;
  openBrief: () => void;
  closeBrief: () => void;
  // active layer (mirrors App state, exposed so non-App components can pulse correctly)
  activeLayer: string;
  setActiveLayer: (k: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp must be inside <AppProvider>");
  return v;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [signals, setSignals] = useState<IncomingSignal[]>([SIGNAL_POOL[0]]);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceSpec | null>(null);
  const [committed, setCommitted] = useState<CommittedAction[]>([]);
  const [timeOffsetByLayer, setTimeOffsetByLayer] = useState<Record<string, number>>({});
  const [activeLayer, setActiveLayer] = useState("business-performance");

  const activeLayerRef = useRef(activeLayer);
  activeLayerRef.current = activeLayer;
  const signalIdxRef = useRef(0);

  // 1s heartbeat
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Signal stream — every ~5s push a new signal; ~30% of the time pulse a
  // metric on the currently-viewed layer.
  useEffect(() => {
    const id = setInterval(() => {
      signalIdxRef.current = (signalIdxRef.current + 1) % SIGNAL_POOL.length;
      const next = SIGNAL_POOL[signalIdxRef.current];
      setSignals(s => [next, ...s].slice(0, 20));

      // 35% chance to pulse a metric IF it belongs to the currently active layer
      if (next.layer === activeLayerRef.current && next.metric && Math.random() < 0.55) {
        setPulse({ layer: next.layer, metric: next.metric, at: Date.now() });
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Pulse auto-clears after 1.6s
  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 1600);
    return () => clearTimeout(t);
  }, [pulse]);

  const openInbox  = useCallback(() => setInboxOpen(true), []);
  const closeInbox = useCallback(() => setInboxOpen(false), []);
  const openBrief  = useCallback(() => setBriefOpen(true), []);
  const closeBrief = useCallback(() => setBriefOpen(false), []);

  const openEvidence = useCallback((layer: string, metric: string) => {
    const spec = EVIDENCE[`${layer}/${metric}`];
    if (spec) setEvidence(spec);
  }, []);
  const closeEvidence = useCallback(() => setEvidence(null), []);

  const commitAction = useCallback((a: Omit<CommittedAction, "id" | "status" | "committedAt">) => {
    setCommitted(prev => {
      // de-dupe by layer+title
      if (prev.some(p => p.layer === a.layer && p.title === a.title)) return prev;
      return [
        { ...a, id: `C-${Date.now().toString(36)}`, status: "committed", committedAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const advanceAction = useCallback((id: string) => {
    setCommitted(prev => prev.map(c =>
      c.id !== id ? c : { ...c, status: c.status === "committed" ? "in-flight" : c.status === "in-flight" ? "done" : "done" }
    ));
  }, []);

  const removeCommitted = useCallback((id: string) => {
    setCommitted(prev => prev.filter(c => c.id !== id));
  }, []);

  const setTimeOffset = useCallback((layer: string, offset: number) => {
    setTimeOffsetByLayer(prev => ({ ...prev, [layer]: offset }));
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    tick, signals, latest: signals[0] ?? null, pulse,
    inboxOpen, openInbox, closeInbox,
    evidence, openEvidence, closeEvidence,
    committed, commitAction, advanceAction, removeCommitted,
    timeOffsetByLayer, setTimeOffset,
    briefOpen, openBrief, closeBrief,
    activeLayer, setActiveLayer,
  }), [
    tick, signals, pulse,
    inboxOpen, openInbox, closeInbox,
    evidence, openEvidence, closeEvidence,
    committed, commitAction, advanceAction, removeCommitted,
    timeOffsetByLayer, setTimeOffset,
    briefOpen, openBrief, closeBrief,
    activeLayer,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

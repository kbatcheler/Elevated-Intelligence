import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import {
  makeResolver, deepResolveWith,
  type CompanyProfile,
} from "../data/companies";
import {
  LAYER_KEYS, LAYER_SCHEMA,
  type LayerData, type ChartSpec, type Metric, type Cause, type Action, type Gap, type GapCategory,
} from "../data/layers";
import type { NarratorContent } from "../data/narrator";
import type { PeerBlock } from "../data/peers";
import type { DataFeed, ActivityEvent } from "../data/feeds";
import type { NextStepsBlock } from "../data/nextSteps";
import type { PipelineDeep } from "../data/pipelineDeep";
import type { IncomingSignal, Anomaly, EvidenceSpec } from "../data/signals";
import type { TrackRecordEntry } from "../data/trackRecord";
import type { Lever } from "../data/warroom";
import type { ChatPattern } from "../data/chatBrain";
import {
  ARCH_COMPONENTS as RAW_ARCH_COMPONENTS, SAMPLE_QUESTION as RAW_SAMPLE_QUESTION,
} from "../data/architecture";
import { SIGNAL_POOL as RAW_SIGNAL_POOL } from "../data/signals";
import { SUGGESTED as RAW_SUGGESTED } from "../data/chatBrain";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1.4: CompanyContext is now backed by the /api/tenants REST surface.
// All per-tenant content (profile + 14 layers + 5 artifacts) is fetched fresh
// per active tenant and projected into the legacy CompanyProfile +
// NarrativeBundle shapes for backward compatibility with the existing views.
//
// Hardcoded MERIDIAN / GUITAR_CENTER / SWEETGREEN profiles and the LIBRARY /
// DEFAULT_PROFILE_ID constants have been deleted; the localStorage library
// has been replaced with the server tenants table. The active tenant id
// persists in localStorage under `ei.activeTenantId`.
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_TENANT_KEY = "ei.activeTenantId";

// ─── Server-shape types (mirrors api-server zod schemas, kept local so the
//     portal compiles without an extra cross-package import) ────────────────
export interface TenantSummary {
  id: string;
  name: string;
  url: string;
  status: "seeding" | "ready" | "failed";
  lastSeededAt: string | null;
  staleAfter: string | null;
}

export interface ServerLayerContent {
  narrative: string;
  headline_finding: string;
  headline_impact: string;
  headline_lever?: string;
  causes: Array<{ title: string; impact: string; detail: string; confidence?: number }>;
  actions: Array<{ title: string; detail: string; impact: string; timing?: string; owner?: string }>;
  hypotheses?: Array<{ title?: string; detail?: string; confidence?: number }>;
  proof?: { items?: Array<{ title?: string; source?: string; detail?: string }> };
  gaps?: Array<{ kind?: string; description?: string; closes?: string; confidence_gap?: number }>;
  metrics?: Array<{ label: string; value: string; sub?: string; tone: "good" | "warn" | "bad" | "neutral" }>;
  confidence?: number;
  confidence_gap?: number;
}

export interface ServerProfile {
  name: string;
  url: string;
  sector?: string;
  hqCity?: string;
  hqState?: string;
  revenueBand?: string;
  ownership?: string;
  founded?: number;
  tagline?: string;
  logoMonogram: string;
  headlines?: {
    revenueActual?: string; revenuePlan?: string;
    revenueVarPct?: string; revenueVarDollars?: string;
    marginActual?: string; marginTarget?: string; marginVarBps?: string;
    cashActual?: string; cashVar?: string; cashTone?: "good" | "warn" | "bad";
    npsActual?: number; npsDelta?: string;
  };
  executiveRead?: string;
  pullQuote?: string;
  vocab?: Record<string, string>;
}

export interface TenantDetail {
  tenant: TenantSummary;
  profile: ServerProfile;
  layers: Array<{ layerKey: string; content: ServerLayerContent }>;
  artifacts: Array<{ kind: string; content: unknown }>;
}

export interface PipelineStage {
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  progress: { current: number; total: number } | null;
}

export interface PipelineStatus {
  tenant: { id: string; name: string; status: "seeding" | "ready" | "failed" };
  run: {
    status: "pending" | "running" | "complete" | "partial" | "failed";
    stages: PipelineStage[];
    error: string | null;
  } | null;
}

// ─── Back-compat narrative bundle shape ─────────────────────────────────────
export interface NarrativeBundle {
  LAYERS: LayerData[];
  NARRATOR: Record<string, NarratorContent>;
  PEERS: Record<string, PeerBlock>;
  FEEDS: Record<string, DataFeed[]>;
  ACTIVITY_STREAM: ActivityEvent[];
  NEXT_STEPS: Record<string, NextStepsBlock>;
  PIPELINE_DEEP: Record<string, PipelineDeep>;
  SIGNAL_POOL: IncomingSignal[];
  ANOMALIES: Anomaly[];
  EVIDENCE: Record<string, EvidenceSpec>;
  TRACK_RECORD: TrackRecordEntry[];
  ARCH_COMPONENTS: typeof RAW_ARCH_COMPONENTS;
  SAMPLE_QUESTION: string;
  LEVERS: Lever[];
  SUGGESTED: string[];
  PATTERNS: ChatPattern[];
}

// ─── Boot splash state ─────────────────────────────────────────────────────
export type SeedStepKind = "ground" | "identify" | "disambiguate" | "seed" | "narrate" | "prefetch" | "indexing";
export type SeedStepStatus = "pending" | "running" | "done" | "skipped" | "failed";
export interface SeedStep {
  kind: SeedStepKind;
  status: SeedStepStatus;
  label: string;
  detail?: string;
  stats?: Array<{ label: string; value: string }>;
  errorReason?: string;
}

// Pipeline-progress overlay state (the new mode added in 1.4). When present,
// the boot splash renders the server-side pipeline stage list (Ground →
// Profile → Layers N/14 → Artifacts → Commit) and polls /status every 2s.
export interface PipelineProgress {
  tenantId: string;
  startedAt: number;
  status: PipelineStatus | null;
  error: string | null;
}

export interface BootSplashState {
  open: boolean;
  profileName: string;
  meta?: CompanyProfile["_meta"];
  seedFlow: SeedStep[] | null;
  autoDismiss: boolean;
  pipeline: PipelineProgress | null;
}

interface CompanyContextValue {
  profile: CompanyProfile;
  library: CompanyProfile[];
  customProfiles: CompanyProfile[];
  tenants: TenantSummary[];
  tenantsLoading: boolean;
  tenantsError: string | null;
  activeTenant: TenantSummary | null;
  activeDetail: TenantDetail | null;
  detailLoading: boolean;
  // Library / tenant operations (new 1.4 API)
  refreshLibrary: () => Promise<void>;
  addTenant: (input: { name: string; url: string }) => Promise<{ id: string; runId: string } | null>;
  removeTenant: (id: string) => Promise<void>;
  refreshTenant: (id: string) => Promise<void>;
  // Back-compat aliases for the rest of the app
  setProfileId: (id: string) => void;
  addCustomProfile: (p: CompanyProfile) => void;
  removeCustomProfile: (id: string) => void;
  resetToDefault: () => void;
  resolve: (text: string) => string;
  narrative: NarrativeBundle;
  bootSplash: BootSplashState | null;
  triggerBootSplash: (profileName: string) => void;
  beginSeedFlow: (profileName: string, initialSteps: SeedStep[]) => void;
  updateSeedStep: (kind: SeedStepKind, patch: Partial<Omit<SeedStep, "kind">>) => void;
  endSeedFlow: (meta?: CompanyProfile["_meta"]) => void;
  failSeedFlow: (kind: SeedStepKind, reason: string) => void;
  dismissBootSplash: () => void;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
}

const Ctx = createContext<CompanyContextValue | null>(null);

// ─── Empty fallbacks for when no tenant is active ───────────────────────────
const EMPTY_PROFILE: CompanyProfile = {
  id: "",
  name: "No tenant",
  url: "",
  logoMonogram: "··",
  sector: "·",
  hqCity: "·",
  revenueBand: "·",
  ownership: "·",
  period: "Live",
  channelLabel: "·",
  tagline: "",
  vocab: {},
  headlines: {},
  sourceSystems: "·",
  analyst: "·",
};

function emptyNarrative(): NarrativeBundle {
  return {
    LAYERS: [],
    NARRATOR: {},
    PEERS: {},
    FEEDS: {},
    ACTIVITY_STREAM: [],
    NEXT_STEPS: {},
    PIPELINE_DEEP: {},
    SIGNAL_POOL: RAW_SIGNAL_POOL,
    ANOMALIES: [],
    EVIDENCE: {},
    TRACK_RECORD: [],
    ARCH_COMPONENTS: RAW_ARCH_COMPONENTS,
    SAMPLE_QUESTION: RAW_SAMPLE_QUESTION,
    LEVERS: [],
    SUGGESTED: RAW_SUGGESTED,
    PATTERNS: [],
  };
}

// ─── Server → client projections ────────────────────────────────────────────
function projectProfile(t: TenantSummary, p: ServerProfile): CompanyProfile {
  return {
    id: t.id,
    name: p.name ?? t.name,
    url: p.url ?? t.url,
    logoMonogram: p.logoMonogram || (p.name ?? t.name).slice(0, 2).toUpperCase(),
    sector: p.sector ?? "",
    hqCity: p.hqCity ?? "",
    hqState: p.hqState,
    revenueBand: p.revenueBand ?? "",
    ownership: p.ownership ?? "",
    founded: p.founded,
    period: "Live",
    channelLabel: p.sector ?? "Live",
    tagline: p.tagline ?? "",
    vocab: p.vocab ?? {},
    headlines: p.headlines ?? {},
    executiveRead: p.executiveRead,
    pullQuote: p.pullQuote,
    sourceSystems: "Live (server-seeded)",
    analyst: "Different Day",
    isGenerated: true,
    generatedAt: t.lastSeededAt ?? undefined,
  };
}

function normaliseGapCategory(kind: string | undefined): GapCategory {
  const k = (kind ?? "").toUpperCase();
  if (k === "FLOW" || k === "WORKFLOW") return "WORKFLOW";
  if (k === "DATA" || k === "INTEG" || k === "MODEL" || k === "SIGNAL") return k;
  return "DATA";
}

function placeholderChart(): ChartSpec {
  return { kind: "bar", data: [], series: [], xKey: "x", yLabel: "" };
}

function projectLayer(
  layerKey: string,
  content: ServerLayerContent,
  diagnosedAt: string,
): LayerData {
  const schema = LAYER_SCHEMA[layerKey];
  const metrics: Metric[] = (content.metrics ?? []).map(m => ({
    label: m.label,
    value: m.value,
    sub: m.sub ?? "",
    tone: m.tone,
  }));
  const causes: Cause[] = (content.causes ?? []).map(c => ({
    title: c.title, impact: c.impact, detail: c.detail,
  }));
  const actions: Action[] = (content.actions ?? []).map(a => ({
    title: a.title, detail: a.detail, impact: a.impact,
  }));
  const gaps: Gap[] = (content.gaps ?? []).map(g => ({
    category: normaliseGapCategory(g.kind),
    title: g.closes || g.description || "Gap",
    detail: g.description ?? "",
    confidenceLiftPp: typeof g.confidence_gap === "number" ? Math.round(g.confidence_gap) : 0,
    solution: g.closes ?? "",
  }));
  const counterArgs = (content.hypotheses ?? []).map(h => ({
    title: h.title ?? "Hypothesis",
    ci: typeof h.confidence === "number" ? `${Math.round(h.confidence)}% CI` : "",
    detail: h.detail ?? "",
  }));
  return {
    key: layerKey,
    group: schema?.group ?? "Operational",
    title: schema?.name ?? layerKey,
    question: schema?.question ?? "",
    confidence: typeof content.confidence === "number" ? Math.round(content.confidence) : 0,
    sources: content.proof?.items?.length ?? 0,
    diagnosedAt,
    analystTake: content.headline_finding ?? "",
    metrics,
    narrative: content.narrative ?? "",
    causes,
    chartTitle: "",
    chart: placeholderChart(),
    actions,
    actionsRecoveryUsd: content.headline_impact ?? "",
    gaps,
    gapsPipelineUsd: "",
    counterArgs,
  };
}

function projectNarrative(detail: TenantDetail | null): NarrativeBundle {
  if (!detail) return emptyNarrative();
  const diagnosedAt = detail.tenant.lastSeededAt
    ? new Date(detail.tenant.lastSeededAt).toLocaleString()
    : "Just now";
  const layers = detail.layers
    .map(l => projectLayer(l.layerKey, l.content, diagnosedAt))
    .filter(l => LAYER_KEYS.includes(l.key));
  // Order layers by canonical LAYER_KEYS so the sidebar order matches.
  layers.sort((a, b) => LAYER_KEYS.indexOf(a.key) - LAYER_KEYS.indexOf(b.key));
  return {
    LAYERS: layers,
    NARRATOR: {},
    PEERS: {},
    FEEDS: {},
    ACTIVITY_STREAM: [],
    NEXT_STEPS: {},
    PIPELINE_DEEP: {},
    SIGNAL_POOL: RAW_SIGNAL_POOL,
    ANOMALIES: [],
    EVIDENCE: {},
    TRACK_RECORD: [],
    ARCH_COMPONENTS: RAW_ARCH_COMPONENTS,
    SAMPLE_QUESTION: RAW_SAMPLE_QUESTION,
    LEVERS: [],
    SUGGESTED: RAW_SUGGESTED,
    PATTERNS: [],
  };
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { credentials: "include" });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return (await r.json()) as T;
}
async function apiSend<T>(method: "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${method} ${path} → ${r.status} ${text}`);
  }
  return (await r.json()) as T;
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function CompanyProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(ACTIVE_TENANT_KEY); } catch { return null; }
  });
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bootSplash, setBootSplash] = useState<BootSplashState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Persist active id whenever it changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activeId) window.localStorage.setItem(ACTIVE_TENANT_KEY, activeId);
      else window.localStorage.removeItem(ACTIVE_TENANT_KEY);
    } catch { /* ignore */ }
  }, [activeId]);

  // ─── Library fetch ─────────────────────────────────────────────────────
  const refreshLibrary = useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError(null);
    try {
      const r = await apiGet<{ tenants: TenantSummary[] }>("/api/tenants");
      setTenants(r.tenants);
      // Self-heal: if the persisted active id no longer exists in the
      // library, snap to the first ready tenant or clear.
      setActiveId(curr => {
        if (curr && r.tenants.some(t => t.id === curr)) return curr;
        const first = r.tenants[0];
        return first ? first.id : null;
      });
    } catch (e) {
      setTenantsError(e instanceof Error ? e.message : String(e));
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  useEffect(() => { void refreshLibrary(); }, [refreshLibrary]);

  // ─── Active tenant detail fetch ────────────────────────────────────────
  const activeTenant = useMemo(
    () => tenants.find(t => t.id === activeId) ?? null,
    [tenants, activeId],
  );

  useEffect(() => {
    if (!activeId) { setDetail(null); return; }
    const tenant = tenants.find(t => t.id === activeId);
    if (!tenant || tenant.status !== "ready") {
      // Tenant is still seeding or failed, no detail to fetch yet.
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    apiGet<TenantDetail>(`/api/tenants/${activeId}`)
      .then(d => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [activeId, tenants]);

  // ─── Pipeline status polling for splash ────────────────────────────────
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    const pipeline = bootSplash?.pipeline;
    if (!pipeline) {
      if (pollRef.current !== null) { window.clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await apiGet<PipelineStatus>(`/api/tenants/${pipeline.tenantId}/status`);
        if (cancelled) return;
        setBootSplash(prev => prev?.pipeline && prev.pipeline.tenantId === pipeline.tenantId
          ? { ...prev, pipeline: { ...prev.pipeline, status: s, error: null } }
          : prev);
        // Refresh library so the tenant's status flips ready → renders detail.
        if (s.tenant.status === "ready" || s.tenant.status === "failed") {
          void refreshLibrary();
        }
        if (s.tenant.status === "ready") {
          // Auto-dismiss 1.5s after ready so the user can see the final tick.
          window.setTimeout(() => {
            setBootSplash(prev => prev?.pipeline && prev.pipeline.tenantId === pipeline.tenantId
              ? null : prev);
          }, 1500);
        }
      } catch (e) {
        if (cancelled) return;
        setBootSplash(prev => prev?.pipeline && prev.pipeline.tenantId === pipeline.tenantId
          ? { ...prev, pipeline: { ...prev.pipeline, error: e instanceof Error ? e.message : String(e) } }
          : prev);
      }
    };
    void poll();
    pollRef.current = window.setInterval(() => { void poll(); }, 2000);
    return () => {
      cancelled = true;
      if (pollRef.current !== null) { window.clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [bootSplash?.pipeline?.tenantId, refreshLibrary]);

  // ─── Profile / narrative projection ────────────────────────────────────
  const profile = useMemo<CompanyProfile>(() => {
    if (!detail || !activeTenant) return EMPTY_PROFILE;
    return projectProfile(activeTenant, detail.profile);
  }, [detail, activeTenant]);

  const resolve = useMemo(() => makeResolver(profile), [profile]);
  const narrative = useMemo<NarrativeBundle>(() => projectNarrative(detail), [detail]);

  // ─── Tenant lifecycle ops ──────────────────────────────────────────────
  const openPipelineSplash = useCallback((tenantId: string, profileName: string) => {
    setBootSplash({
      open: true,
      profileName,
      seedFlow: null,
      autoDismiss: false,
      pipeline: { tenantId, startedAt: Date.now(), status: null, error: null },
    });
    setActiveId(tenantId);
    setPickerOpen(false);
  }, []);

  const addTenant = useCallback(async (input: { name: string; url: string }) => {
    try {
      const r = await apiSend<{ id: string; runId: string }>("POST", "/api/tenants", input);
      await refreshLibrary();
      openPipelineSplash(r.id, input.name);
      return r;
    } catch {
      return null;
    }
  }, [refreshLibrary, openPipelineSplash]);

  const removeTenant = useCallback(async (id: string) => {
    try { await apiSend<{ ok: true }>("DELETE", `/api/tenants/${id}`); } catch { /* ignore */ }
    await refreshLibrary();
    setActiveId(curr => {
      if (curr !== id) return curr;
      return null;
    });
  }, [refreshLibrary]);

  const refreshTenant = useCallback(async (id: string) => {
    try {
      await apiSend<{ runId: string }>("POST", `/api/tenants/${id}/refresh`);
      await refreshLibrary();
      const t = tenants.find(x => x.id === id);
      openPipelineSplash(id, t?.name ?? "Refresh");
    } catch { /* ignore */ }
  }, [refreshLibrary, openPipelineSplash, tenants]);

  // ─── Back-compat surface ───────────────────────────────────────────────
  const setProfileId = useCallback((id: string) => {
    if (!tenants.some(t => t.id === id)) return;
    setActiveId(id);
    setPickerOpen(false);
  }, [tenants]);

  // Legacy "add a hand-rolled profile" hook: in Phase 1 the only way to add
  // a profile is to seed a new tenant on the server, so this is a no-op
  // kept for type-compat with any remaining call-sites.
  const addCustomProfile = useCallback((_p: CompanyProfile) => { /* no-op */ }, []);
  const removeCustomProfile = useCallback((id: string) => { void removeTenant(id); }, [removeTenant]);
  const resetToDefault = useCallback(() => {
    const first = tenants[0];
    if (first) setActiveId(first.id);
    else setActiveId(null);
    setPickerOpen(false);
  }, [tenants]);

  const triggerBootSplash = useCallback((profileName: string) => {
    setBootSplash({ open: true, profileName, seedFlow: null, autoDismiss: true, pipeline: null });
  }, []);

  const beginSeedFlow = useCallback((profileName: string, initialSteps: SeedStep[]) => {
    setBootSplash({ open: true, profileName, seedFlow: initialSteps, autoDismiss: false, pipeline: null });
    setPickerOpen(false);
  }, []);
  const updateSeedStep = useCallback((kind: SeedStepKind, patch: Partial<Omit<SeedStep, "kind">>) => {
    setBootSplash(prev => {
      if (!prev?.seedFlow) return prev;
      return { ...prev, seedFlow: prev.seedFlow.map(s => s.kind === kind ? { ...s, ...patch } : s) };
    });
  }, []);
  const endSeedFlow = useCallback((meta?: CompanyProfile["_meta"]) => {
    setBootSplash(prev => prev ? { ...prev, meta: meta ?? prev.meta, autoDismiss: true } : prev);
  }, []);
  const failSeedFlow = useCallback((kind: SeedStepKind, reason: string) => {
    setBootSplash(prev => {
      if (!prev?.seedFlow) return prev;
      const next = prev.seedFlow.map(s => {
        if (s.kind === kind) return { ...s, status: "failed" as const, errorReason: reason };
        if (s.status === "running") return { ...s, status: "skipped" as const };
        return s;
      });
      return { ...prev, seedFlow: next, autoDismiss: false };
    });
  }, []);
  const dismissBootSplash = useCallback(() => setBootSplash(null), []);

  useEffect(() => {
    if (!bootSplash?.open || !bootSplash.autoDismiss) return undefined;
    const t = window.setTimeout(() => setBootSplash(null), 2800);
    return () => window.clearTimeout(t);
  }, [bootSplash]);

  // Library projected as CompanyProfile[] for the legacy library surface.
  // For tenants that aren't ready yet (no detail available), build a sparse
  // CompanyProfile from the summary alone so picker chips still render.
  const library = useMemo<CompanyProfile[]>(() => {
    return tenants.map(t => ({
      ...EMPTY_PROFILE,
      id: t.id,
      name: t.name,
      url: t.url,
      logoMonogram: t.name.slice(0, 2).toUpperCase(),
      sector: "",
      tagline: "",
      isGenerated: true,
      generatedAt: t.lastSeededAt ?? undefined,
    }));
  }, [tenants]);

  const value: CompanyContextValue = {
    profile,
    library,
    customProfiles: library,
    tenants,
    tenantsLoading,
    tenantsError,
    activeTenant,
    activeDetail: detail,
    detailLoading,
    refreshLibrary,
    addTenant,
    removeTenant,
    refreshTenant,
    setProfileId,
    addCustomProfile,
    removeCustomProfile,
    resetToDefault,
    resolve,
    narrative,
    bootSplash,
    triggerBootSplash,
    beginSeedFlow,
    updateSeedStep,
    endSeedFlow,
    failSeedFlow,
    dismissBootSplash,
    pickerOpen,
    setPickerOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompany(): CompanyContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompany must be used inside <CompanyProvider>");
  return v;
}

export function useNarrative(): NarrativeBundle {
  return useCompany().narrative;
}

/** Sugar hook: server-backed library state. */
export function useLibrary() {
  const c = useCompany();
  return {
    tenants: c.tenants,
    loading: c.tenantsLoading,
    error: c.tenantsError,
    refresh: c.refreshLibrary,
  };
}

/** Sugar hook: server-backed tenant detail for the active tenant. */
export function useTenantDetail(id: string | null) {
  const c = useCompany();
  if (id && c.activeTenant?.id === id) {
    return { detail: c.activeDetail, loading: c.detailLoading };
  }
  return { detail: null, loading: false };
}

/**
 * Always returns false in Phase 1, no built-in default tenant exists any
 * more. Retained so the many legacy gating call-sites compile; their
 * Meridian-shaped fallback fixtures are themselves empty so the gate is
 * effectively inert.
 */
export function useIsDefaultProfile(): boolean {
  return false;
}

/**
 * @deprecated for Phase 1. Vocab swap is a no-op because tenant content is
 * LLM-authored end-to-end. Retained for type-compat with legacy components.
 */
export function useSwap<T>(value: T): T {
  const { resolve } = useCompany();
  return useMemo(() => deepResolveWith(value, resolve), [value, resolve]);
}

/**
 * @deprecated for Phase 1. Per-component dataset overrides are not used.
 */
export function useDataset<T>(_key: string, raw: T): T {
  const { resolve } = useCompany();
  return useMemo(() => deepResolveWith(raw, resolve), [raw, resolve]);
}

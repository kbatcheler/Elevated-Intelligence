import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LIBRARY, MERIDIAN, DEFAULT_PROFILE_ID, makeResolver, deepResolveWith,
  type CompanyProfile,
} from "../data/companies";

// Source data modules, imported once, deep-swapped per active profile.
import { LAYERS as RAW_LAYERS } from "../data/layers";
import { NARRATOR as RAW_NARRATOR } from "../data/narrator";
import { PEERS as RAW_PEERS } from "../data/peers";
import { FEEDS as RAW_FEEDS, ACTIVITY_STREAM as RAW_ACTIVITY_STREAM } from "../data/feeds";
import { NEXT_STEPS as RAW_NEXT_STEPS } from "../data/nextSteps";
import { PIPELINE_DEEP as RAW_PIPELINE_DEEP } from "../data/pipelineDeep";
import {
  SIGNAL_POOL as RAW_SIGNAL_POOL, ANOMALIES as RAW_ANOMALIES, EVIDENCE as RAW_EVIDENCE,
} from "../data/signals";
import { TRACK_RECORD as RAW_TRACK_RECORD } from "../data/trackRecord";
import {
  ARCH_COMPONENTS as RAW_ARCH_COMPONENTS, SAMPLE_QUESTION as RAW_SAMPLE_QUESTION,
} from "../data/architecture";
import { LEVERS as RAW_LEVERS } from "../data/warroom";
import { SUGGESTED as RAW_SUGGESTED, PATTERNS as RAW_PATTERNS } from "../data/chatBrain";

const STORAGE_KEY_ACTIVE = "differentday.activeProfileId.v1";
const STORAGE_KEY_CUSTOM = "differentday.customProfiles.v1";

// ─────────────────────────────────────────────────────────────────────────────
// Neutral fallbacks for non-default profiles
// ─────────────────────────────────────────────────────────────────────────────
// The raw bulk collections (SIGNAL_POOL, ACTIVITY_STREAM, FEEDS, NARRATOR,
// PEERS, EVIDENCE, ANOMALIES, LEVERS, PATTERNS, ...) are written entirely in
// Meridian Industrial-shaped language with brand-specific tokens (Home Depot, Phoenix DC,
// Greater Plains Co., Kelly Services, cordless drill, ...). The vocab swap
// layer cannot translate those, it can only substring-replace mapped vocab.
//
// For any non-default profile we substitute these collections with neutral
// generic equivalents below. SIGNAL_POOL and ACTIVITY_STREAM MUST stay
// non-empty (their consumers index into [0] / use idx % length and would
// crash on an empty array). Everything else is safe to leave empty, the
// consuming renderers all handle empty record/array gracefully.
const NEUTRAL_SIGNAL_POOL: typeof RAW_SIGNAL_POOL = [
  { ts: "04:18", source: "ERP",                 layer: "business-performance",    text: "General ledger refresh complete, quarter close window updated.",                       tone: "info" },
  { ts: "04:25", source: "POS aggregator",      layer: "demand-intelligence",     text: "Hourly demand signals refreshed against the current weekly plan.",                     tone: "info" },
  { ts: "04:33", source: "CRM",                 layer: "sales-pipeline",          text: "Pipeline coverage ratio refreshed against the current quarter commit.",                tone: "info" },
  { ts: "04:40", source: "WMS",                 layer: "supply-chain",            text: "Inventory snapshot updated across the fulfilment network.",                            tone: "info" },
  { ts: "04:46", source: "Service platform",    layer: "customer-intelligence",   text: "Customer support volume tracked against the rolling weekly baseline.",                 tone: "info" },
  { ts: "04:52", source: "Pricing engine",      layer: "pricing-margin",          text: "Margin position refreshed against the current price index.",                            tone: "info" },
  { ts: "04:58", source: "Marketing analytics", layer: "marketing-performance",   text: "Campaign attribution model refreshed for the trailing 24-hour window.",                tone: "info" },
  { ts: "05:05", source: "Survey platform",     layer: "brand-social",            text: "Brand sentiment pulse updated against the rolling 7-day window.",                      tone: "info" },
  { ts: "05:11", source: "Receivables ledger",  layer: "receivables",             text: "AR ageing buckets refreshed against the current close cycle.",                          tone: "info" },
  { ts: "05:18", source: "HRIS",                layer: "people-operations",       text: "Workforce headcount and attrition snapshot updated.",                                   tone: "info" },
  { ts: "05:24", source: "FP&A",                layer: "finance",                 text: "Plan-to-actual variance computation refreshed for the trailing period.",                tone: "info" },
  { ts: "05:31", source: "Competitive scraper", layer: "competitive-intelligence",text: "Competitive intelligence feed refreshed against the named peer set.",                   tone: "info" },
];

const NEUTRAL_ACTIVITY_STREAM: typeof RAW_ACTIVITY_STREAM = [
  { ts: "06:42", layer: "business-performance",     text: "Financial close window refreshed for the current period.",                tone: "info" },
  { ts: "06:38", layer: "demand-intelligence",      text: "Demand signals refreshed against the active plan.",                       tone: "info" },
  { ts: "06:33", layer: "sales-pipeline",           text: "Pipeline movements logged for the trading day.",                          tone: "info" },
  { ts: "06:27", layer: "supply-chain",             text: "Inventory positions refreshed across the network.",                       tone: "info" },
  { ts: "06:21", layer: "customer-intelligence",    text: "Customer health scores recalculated against the latest activity.",       tone: "info" },
  { ts: "06:14", layer: "pricing-margin",           text: "Pricing index refreshed across the active SKU range.",                    tone: "info" },
  { ts: "06:08", layer: "marketing-performance",    text: "Marketing attribution refreshed for the trailing 24 hours.",              tone: "info" },
  { ts: "06:02", layer: "brand-social",             text: "Brand sentiment refreshed against the rolling baseline.",                  tone: "info" },
];

// For layers that have no per-profile narrative override, replace the Meridian Industrial-
// shaped baseline narrative + causes + actions with a neutral placeholder so
// the wrong-brand story can't leak through. Charts and metric values are kept
// because they're either LLM-overridden or numerically rescaled.
const NEUTRAL_LAYER_NARRATIVE =
  "The system has not yet generated a per-layer narrative for this company. The headline metrics, chart, and any LLM-generated executive summary above remain valid; the deeper story below populates once enough company-specific context has been ingested.";

// Meridian Industrial's quarterly revenue (from MERIDIAN.headlines.revenueActual = "$127M").
// Charts in data/layers.ts are drawn at this scale; the rescale factor below
// normalises to the seeded company's actual operating magnitude.
const MERIDIAN_QUARTERLY_REVENUE_M = 127;

// Parse a headline-style string like "$95B", "$2.4B", "$340M", "$23M",
// "$1,200M" into a number of millions. Returns null on failure.
function parseHeadlineToMillions(s: string | undefined | null): number | null {
  if (!s || typeof s !== "string") return null;
  const cleaned = s.replace(/[\$\s,]/g, "");
  const m = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)([KMB])?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (m[2] ?? "M").toUpperCase();
  if (unit === "K") return value * 0.001;
  if (unit === "M") return value;
  if (unit === "B") return value * 1000;
  return null;
}

// Derive a single multiplicative factor that scales Meridian Industrial-shaped chart
// values into the seeded company's magnitude. Defaults to 1 (no-op) for the
// Meridian Industrial profile or when revenueActual is missing/unparseable.
function computeRevenueScaleFactor(profile: CompanyProfile): number {
  const revM = parseHeadlineToMillions(profile.headlines?.revenueActual);
  if (revM == null || revM <= 0) return 1;
  const factor = revM / MERIDIAN_QUARTERLY_REVENUE_M;
  if (!Number.isFinite(factor) || factor <= 0) return 1;
  return factor;
}

// Only rescale charts that are denominated in dollars. Charts measured in
// percentages, basis points, counts, or scores stay numerically untouched
// regardless of company size.
function isDollarChart(yLabel: string | undefined): boolean {
  if (!yLabel) return false;
  const l = yLabel.toLowerCase();
  return l.includes("usd") || l.includes("$") || l.includes("dollar") || l.includes("revenue");
}

// Round to N significant figures so scaled chart values render cleanly
// (e.g. 44.1 * 750 = 33075 → 33100, not 33074.99999).
function roundToSig(n: number, sig: number): number {
  if (n === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(n)));
  const power = sig - d;
  const mag = Math.pow(10, power);
  return Math.round(n * mag) / mag;
}

export interface NarrativeBundle {
  LAYERS: typeof RAW_LAYERS;
  NARRATOR: typeof RAW_NARRATOR;
  PEERS: typeof RAW_PEERS;
  FEEDS: typeof RAW_FEEDS;
  ACTIVITY_STREAM: typeof RAW_ACTIVITY_STREAM;
  NEXT_STEPS: typeof RAW_NEXT_STEPS;
  PIPELINE_DEEP: typeof RAW_PIPELINE_DEEP;
  SIGNAL_POOL: typeof RAW_SIGNAL_POOL;
  ANOMALIES: typeof RAW_ANOMALIES;
  EVIDENCE: typeof RAW_EVIDENCE;
  TRACK_RECORD: typeof RAW_TRACK_RECORD;
  ARCH_COMPONENTS: typeof RAW_ARCH_COMPONENTS;
  SAMPLE_QUESTION: string;
  LEVERS: typeof RAW_LEVERS;
  SUGGESTED: typeof RAW_SUGGESTED;
  PATTERNS: typeof RAW_PATTERNS;
}

// Per-step state of the live seed flow. Each entry corresponds to a real
// unit of work, homepage fetch, identify call, seed call, brief prefetch,
// vocabulary indexing, and is updated by the orchestrator as that work
// actually completes. NO fake setTimeout ticks: every status change here is
// tied to a network round-trip resolving or a sync computation finishing.
export type SeedStepKind = "ground" | "identify" | "disambiguate" | "seed" | "narrate" | "prefetch" | "indexing";
export type SeedStepStatus = "pending" | "running" | "done" | "skipped" | "failed";
export interface SeedStep {
  kind: SeedStepKind;
  status: SeedStepStatus;
  label: string;
  detail?: string;
  // Tiny inline receipts shown below the step, e.g. "Source · humanco.com",
  // "Round-trip · 4.2s", "Tokens in/out · 1,694 → 191". These are the proof
  // that real work happened.
  stats?: Array<{ label: string; value: string }>;
  errorReason?: string;
}

export interface BootSplashState {
  open: boolean;
  profileName: string;
  meta?: CompanyProfile["_meta"];
  // When present, splash renders the real seed flow with per-step receipts.
  // When null, splash renders the simple library-switch view (no work in flight).
  seedFlow: SeedStep[] | null;
  // While the flow is in-flight we MUST NOT auto-dismiss, the work isn't done.
  // Flipped to true by endSeedFlow / failSeedFlow once everything resolves.
  autoDismiss: boolean;
}

interface CompanyContextValue {
  profile: CompanyProfile;
  library: CompanyProfile[];
  customProfiles: CompanyProfile[];
  setProfileId: (id: string) => void;
  addCustomProfile: (p: CompanyProfile) => void;
  removeCustomProfile: (id: string) => void;
  resetToDefault: () => void;
  resolve: (text: string) => string;
  narrative: NarrativeBundle;
  bootSplash: BootSplashState | null;
  triggerBootSplash: (profileName: string) => void;
  // Seed-flow orchestration, called by CompanyPicker as real work progresses.
  beginSeedFlow: (profileName: string, initialSteps: SeedStep[]) => void;
  updateSeedStep: (kind: SeedStepKind, patch: Partial<Omit<SeedStep, "kind">>) => void;
  endSeedFlow: (meta?: CompanyProfile["_meta"]) => void;
  failSeedFlow: (kind: SeedStepKind, reason: string) => void;
  dismissBootSplash: () => void;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
}

const Ctx = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [customProfiles, setCustomProfiles] = useState<CompanyProfile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_CUSTOM);
      return raw ? (JSON.parse(raw) as CompanyProfile[]) : [];
    } catch { return []; }
  });

  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE_ID;
    try {
      return window.localStorage.getItem(STORAGE_KEY_ACTIVE) ?? DEFAULT_PROFILE_ID;
    } catch { return DEFAULT_PROFILE_ID; }
  });

  const [bootSplash, setBootSplash] = useState<BootSplashState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const allProfiles = useMemo(() => [...LIBRARY, ...customProfiles], [customProfiles]);
  const profile = useMemo(
    () => allProfiles.find(p => p.id === activeId) ?? MERIDIAN,
    [allProfiles, activeId],
  );

  // Self-heal stale activeId in localStorage. A previous build of the app
  // used "mercer-group" as the default profile id; users with that value
  // cached will fall back to MERIDIAN above, but the stale id stays in
  // storage. Rewrite it to DEFAULT_PROFILE_ID so the picker UI and any
  // future bootstrap stay consistent.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (profile.id !== activeId) {
      setActiveId(profile.id);
      try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, profile.id); } catch { /* ignore */ }
    }
  }, [profile.id, activeId]);
  const resolve = useMemo(() => makeResolver(profile), [profile]);

  // Deep-swapped narrative bundle. For the Meridian Industrial (default) profile the vocab
  // map is empty so deepResolveWith is effectively a structural-clone no-op,
  // and Meridian Industrial copy stays bit-perfect. Memoised per profile.id.
  const narrative = useMemo<NarrativeBundle>(() => {
    const isDefault = profile.id === DEFAULT_PROFILE_ID;
    const swap = <T,>(v: T): T => deepResolveWith(v, resolve);
    // 1. Vocab-swap every dataset (no-op for the default Meridian Industrial profile).
    let layersOut = swap(RAW_LAYERS);
    // 2. For seeded profiles, overlay per-layer LLM-rewritten narrative /
    //    metrics / causes / actions on top of the vocab swap. Missing layers
    //    fall through, for the default profile that's vocab-swapped Meridian Industrial
    //    copy (logical filler); for non-default profiles we replace the
    //    narrative + causes + actions with neutral placeholders so the
    //    wrong-brand Meridian Industrial story can't leak through.
    const overrides = profile.layerOverrides;
    layersOut = layersOut.map(layer => {
      const ov = overrides?.[layer.key];
      const next = { ...layer };
      if (ov?.narrative)                                                   next.narrative = ov.narrative;
      else if (!isDefault)                                                  next.narrative = NEUTRAL_LAYER_NARRATIVE;
      if (ov?.metrics && ov.metrics.length === layer.metrics.length)       next.metrics   = ov.metrics;
      if (ov?.causes  && ov.causes.length  === layer.causes.length)        next.causes    = ov.causes;
      else if (!isDefault)                                                  next.causes    = [];
      if (ov?.actions && ov.actions.length === layer.actions.length)       next.actions   = ov.actions;
      else if (!isDefault)                                                  next.actions   = [];
      if (!isDefault) {
        next.counterArgs = [];
        next.gaps        = [];
      }
      return next;
    });
    // 3. Chart-data rescale. Charts are hardcoded at Meridian Industrial's ~$127M-quarter
    //    scale; for a seeded company we scale every numeric value in dollar-
    //    denominated charts proportionally so the bars/lines/areas match the
    //    rebased headlines. Percentage / count charts are left untouched
    //    (detected via yLabel, only "USD"/"$" charts get rescaled).
    const scaleFactor = computeRevenueScaleFactor(profile);
    if (scaleFactor !== 1) {
      layersOut = layersOut.map(layer => {
        if (!isDollarChart(layer.chart.yLabel)) return layer;
        return {
          ...layer,
          chart: {
            ...layer.chart,
            data: layer.chart.data.map((row: Record<string, unknown>) => {
              const next: Record<string, unknown> = { ...row };
              for (const [k, v] of Object.entries(row)) {
                if (typeof v === "number" && Number.isFinite(v)) {
                  next[k] = roundToSig(v * scaleFactor, 3);
                }
              }
              return next;
            }),
          },
        };
      });
    }
    // For non-default profiles, substitute neutral fallbacks for every
    // Meridian Industrial-shaped bulk collection. SIGNAL_POOL and ACTIVITY_STREAM use
    // explicit neutral arrays (their consumers can't tolerate empty);
    // everything else is safe to leave empty, the consuming renderers all
    // handle empty record/array gracefully (see explorer notes).
    if (!isDefault) {
      // Preview-mode bundle for non-default tenants. The portal is operating
      // on a vocabulary swap of the canonical Meridian Industrial corpus,
      // feeds, peers and architecture all rewrite their named entities
      // through the resolver so the page stops referencing the wrong brand.
      // The fully-authored, per-tenant outputs (narrator commentary, pipeline
      // deep-dives, anomalies, track record, etc.) require real data wiring
      // and are intentionally withheld until the seed completes; their pages
      // already render clean empty/preview states. Track record is the one
      // exception, the canonical Meridian Industrial outcomes stay visible
      // as the system's portfolio receipts, surfaced by the track-record page
      // itself with the appropriate empty-state for the active tenant.
      return {
        LAYERS:          layersOut,
        NARRATOR:        {},
        PEERS:           swap(RAW_PEERS),
        FEEDS:           swap(RAW_FEEDS),
        ACTIVITY_STREAM: NEUTRAL_ACTIVITY_STREAM,
        NEXT_STEPS:      {},
        PIPELINE_DEEP:   {},
        SIGNAL_POOL:     NEUTRAL_SIGNAL_POOL,
        ANOMALIES:       [],
        EVIDENCE:        {},
        TRACK_RECORD:    swap(RAW_TRACK_RECORD),
        ARCH_COMPONENTS: swap(RAW_ARCH_COMPONENTS),
        SAMPLE_QUESTION: "What is the biggest driver of this quarter's plan variance?",
        LEVERS:          [],
        SUGGESTED:       swap(RAW_SUGGESTED),
        PATTERNS:        [],
      };
    }
    return {
      LAYERS:          layersOut,
      NARRATOR:        swap(RAW_NARRATOR),
      PEERS:           swap(RAW_PEERS),
      FEEDS:           swap(RAW_FEEDS),
      ACTIVITY_STREAM: swap(RAW_ACTIVITY_STREAM),
      NEXT_STEPS:      swap(RAW_NEXT_STEPS),
      PIPELINE_DEEP:   swap(RAW_PIPELINE_DEEP),
      SIGNAL_POOL:     swap(RAW_SIGNAL_POOL),
      ANOMALIES:       swap(RAW_ANOMALIES),
      EVIDENCE:        swap(RAW_EVIDENCE),
      TRACK_RECORD:    swap(RAW_TRACK_RECORD),
      ARCH_COMPONENTS: swap(RAW_ARCH_COMPONENTS),
      SAMPLE_QUESTION: swap(RAW_SAMPLE_QUESTION),
      LEVERS:          swap(RAW_LEVERS),
      SUGGESTED:       swap(RAW_SUGGESTED),
      PATTERNS:        swap(RAW_PATTERNS),
    };
  }, [resolve, profile.id, profile.layerOverrides, profile.headlines]);

  const setProfileId = useCallback((id: string) => {
    const next = [...LIBRARY, ...customProfiles].find(p => p.id === id);
    if (!next) return;
    setActiveId(id);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, id); } catch { /* ignore */ }
    if (id !== DEFAULT_PROFILE_ID) {
      // Library switch, no live work in flight, so seedFlow is null and the
      // splash renders the simplified "loaded saved profile" view.
      setBootSplash({ open: true, profileName: next.name, meta: next._meta, seedFlow: null, autoDismiss: true });
    }
    setPickerOpen(false);
  }, [customProfiles]);

  // Save the newly seeded profile and make it active. The boot splash is
  // NOT opened here, for the seed-from-name+URL path the splash is already
  // open (driven by the orchestrator in CompanyPicker). For the library
  // path setProfileId opens the splash itself.
  const addCustomProfile = useCallback((p: CompanyProfile) => {
    setCustomProfiles(prev => {
      const next = [...prev.filter(x => x.id !== p.id), p];
      try { window.localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setActiveId(p.id);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, p.id); } catch { /* ignore */ }
    setPickerOpen(false);
  }, []);

  // Purge a saved custom profile AND every trace of its cached intelligence
  // (client localStorage brief + server in-memory cache). Without this the
  // next re-seed of the same company would silently serve a stale brief
  // from before the delete, which defeats the point of deleting.
  // Order matters: capture the profile object before we mutate state so we
  // can read the identity fields needed for the server invalidate call.
  const removeCustomProfile = useCallback((id: string) => {
    const victim = customProfiles.find(p => p.id === id);

    // 1. Client-side brief cache (keyed by profile id).
    try { window.localStorage.removeItem("differentday.intelligenceBrief.v1." + id); } catch { /* ignore */ }

    // 2. Server-side brief cache (keyed by company-identity tuple). Fire-and-
    //    forget, invalidation failure shouldn't block the delete from the UI.
    if (victim) {
      const base = import.meta.env.BASE_URL;
      void fetch(`${base}api/intelligence/brief/invalidate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name:        victim.name,
          url:         victim.url,
          sector:      victim.sector,
          hqCity:      victim.hqCity,
          hqState:     victim.hqState,
          revenueBand: victim.revenueBand,
          ownership:   victim.ownership,
          founded:     victim.founded,
          tagline:     victim.tagline,
        }),
      }).catch(() => { /* ignore, best-effort */ });
    }

    // 3. Remove the profile itself from saved list and storage.
    setCustomProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      try { window.localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

    // 4. If the deleted profile was active, snap back to the default so the
    //    report doesn't render against a missing profile.
    setActiveId(curr => {
      if (curr !== id) return curr;
      try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, DEFAULT_PROFILE_ID); } catch { /* ignore */ }
      return DEFAULT_PROFILE_ID;
    });
  }, [customProfiles]);

  const resetToDefault = useCallback(() => {
    setActiveId(DEFAULT_PROFILE_ID);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, DEFAULT_PROFILE_ID); } catch { /* ignore */ }
    setPickerOpen(false);
  }, []);

  const triggerBootSplash = useCallback((profileName: string) => {
    setBootSplash({ open: true, profileName, seedFlow: null, autoDismiss: true });
  }, []);

  // ─── Seed-flow orchestration ─────────────────────────────────────────────
  // CompanyPicker calls these as the real identify → seed → prefetch pipeline
  // progresses. The splash subscribes and renders each step's live status.
  const beginSeedFlow = useCallback((profileName: string, initialSteps: SeedStep[]) => {
    setBootSplash({ open: true, profileName, seedFlow: initialSteps, autoDismiss: false });
    setPickerOpen(false);
  }, []);

  const updateSeedStep = useCallback((kind: SeedStepKind, patch: Partial<Omit<SeedStep, "kind">>) => {
    setBootSplash(prev => {
      if (!prev?.seedFlow) return prev;
      const next = prev.seedFlow.map(s => s.kind === kind ? { ...s, ...patch } : s);
      return { ...prev, seedFlow: next };
    });
  }, []);

  const endSeedFlow = useCallback((meta?: CompanyProfile["_meta"]) => {
    // Flow finished cleanly. Flip autoDismiss so the splash lingers ~3s
    // (long enough to read the final receipts) then disappears on its own.
    setBootSplash(prev => prev ? { ...prev, meta: meta ?? prev.meta, autoDismiss: true } : prev);
  }, []);

  const failSeedFlow = useCallback((kind: SeedStepKind, reason: string) => {
    setBootSplash(prev => {
      if (!prev?.seedFlow) return prev;
      // Mark the named step failed, AND terminalize any OTHER step still
      // marked "running", otherwise an early identify failure can leave
      // the "ground" step spinning forever, which keeps `anyRunning` true
      // and prevents the splash from being dismissed.
      const next = prev.seedFlow.map(s => {
        if (s.kind === kind) return { ...s, status: "failed" as const, errorReason: reason };
        if (s.status === "running") return { ...s, status: "skipped" as const, detail: s.detail ?? "Not reached, earlier step failed" };
        return s;
      });
      return { ...prev, seedFlow: next, autoDismiss: false };
    });
  }, []);

  const dismissBootSplash = useCallback(() => setBootSplash(null), []);

  // Auto-dismiss only when autoDismiss is true. For library switches that's
  // immediate (no work to wait on); for seed flows it flips to true once the
  // orchestrator calls endSeedFlow or the user explicitly dismisses. In-flight
  // flows can't be ripped away by a timer.
  useEffect(() => {
    if (!bootSplash?.open || !bootSplash.autoDismiss) return undefined;
    const lingerMs = bootSplash.seedFlow ? 3000 : (bootSplash.meta ? 4600 : 2800);
    const t = setTimeout(() => setBootSplash(null), lingerMs);
    return () => clearTimeout(t);
  }, [bootSplash]);

  const value: CompanyContextValue = {
    profile,
    library: LIBRARY,
    customProfiles,
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

/** Sugar for components that only need the swapped narrative bundle. */
export function useNarrative(): NarrativeBundle {
  return useCompany().narrative;
}

/**
 * True when the active profile is the built-in Meridian Industrial baseline.
 *
 * Many deep-dive panels (PipelineDetail, the Hero blocks for non-business-
 * performance layers, every Extras block) are populated from hardcoded
 * Meridian Industrial-shaped fixtures: SKU rows like "Cordless drill 18V", supplier names,
 * DC city names, competitor brands like "Home Depot" / "Lowe's", etc. The
 * vocab-swap layer can only do substring substitution; it cannot translate
 * "Cordless drill" into an iPhone SKU. When a seeded profile lands without a
 * matching dataset/layer override, the raw Meridian Industrial copy leaks through and the
 * dashboard claims (e.g.) that Apple sells power tools.
 *
 * Components that render Meridian Industrial-shaped fixtures gate themselves on this flag
 * so that for any non-default profile the leaking block is hidden rather than
 * rendered with wrong-brand content. The rest of the layer (header, narrative,
 * metric tiles, chart, causes, actions, counter-args, gaps) is driven by the
 * LLM-overridden `layerOverrides` and remains correct for the seeded company.
 */
export function useIsDefaultProfile(): boolean {
  return useCompany().profile.id === DEFAULT_PROFILE_ID;
}

/**
 * Deep-swap an arbitrary value through the active profile's vocab. Intended
 * for module-level "_RAW" constants embedded inside view components (chart
 * labels, hero data, tour copy) so they re-skin with the rest of the report.
 * Memoised per (value, profile) pair.
 */
export function useSwap<T>(value: T): T {
  const { resolve } = useCompany();
  return useMemo(() => deepResolveWith(value, resolve), [value, resolve]);
}

/**
 * Per-component dataset lookup. If the active profile defines an override at
 * `profile.datasets[key]`, that override is returned (deep-swapped through
 * the active vocab, usually a no-op since overrides are already in-profile).
 * Otherwise the supplied RAW fallback is deep-swapped and returned.
 *
 * Use this for hero/extras datasets where token-level vocab can't translate
 * the domain (e.g. hardware SKUs → music SKUs for Guitar Center).
 */
export function useDataset<T>(key: string, raw: T): T {
  const { profile, resolve } = useCompany();
  return useMemo(() => {
    const override = profile.datasets?.[key];
    const source = override !== undefined ? (override as T) : raw;
    return deepResolveWith(source, resolve);
  }, [profile, resolve, key, raw]);
}

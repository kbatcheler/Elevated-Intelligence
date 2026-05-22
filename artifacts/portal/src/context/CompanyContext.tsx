import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LIBRARY, MERCER, DEFAULT_PROFILE_ID, makeResolver, deepResolveWith,
  type CompanyProfile,
} from "../data/companies";

// Source data modules — imported once, deep-swapped per active profile.
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
  SAMPLE_QUESTION: typeof RAW_SAMPLE_QUESTION;
  LEVERS: typeof RAW_LEVERS;
  SUGGESTED: typeof RAW_SUGGESTED;
  PATTERNS: typeof RAW_PATTERNS;
}

// Per-step state of the live seed flow. Each entry corresponds to a real
// unit of work — homepage fetch, identify call, seed call, brief prefetch,
// vocabulary indexing — and is updated by the orchestrator as that work
// actually completes. NO fake setTimeout ticks: every status change here is
// tied to a network round-trip resolving or a sync computation finishing.
export type SeedStepKind = "ground" | "identify" | "disambiguate" | "seed" | "prefetch" | "indexing";
export type SeedStepStatus = "pending" | "running" | "done" | "skipped" | "failed";
export interface SeedStep {
  kind: SeedStepKind;
  status: SeedStepStatus;
  label: string;
  detail?: string;
  // Tiny inline receipts shown below the step — e.g. "Source · humanco.com",
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
  // While the flow is in-flight we MUST NOT auto-dismiss — the work isn't done.
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
  // Seed-flow orchestration — called by CompanyPicker as real work progresses.
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
    () => allProfiles.find(p => p.id === activeId) ?? MERCER,
    [allProfiles, activeId],
  );
  const resolve = useMemo(() => makeResolver(profile), [profile]);

  // Deep-swapped narrative bundle. For the Mercer (default) profile the vocab
  // map is empty so deepResolveWith is effectively a structural-clone no-op,
  // and Mercer copy stays bit-perfect. Memoised per profile.id.
  const narrative = useMemo<NarrativeBundle>(() => {
    const swap = <T,>(v: T): T => deepResolveWith(v, resolve);
    return {
      LAYERS:          swap(RAW_LAYERS),
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
  }, [resolve]);

  const setProfileId = useCallback((id: string) => {
    const next = [...LIBRARY, ...customProfiles].find(p => p.id === id);
    if (!next) return;
    setActiveId(id);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, id); } catch { /* ignore */ }
    if (id !== DEFAULT_PROFILE_ID) {
      // Library switch — no live work in flight, so seedFlow is null and the
      // splash renders the simplified "loaded saved profile" view.
      setBootSplash({ open: true, profileName: next.name, meta: next._meta, seedFlow: null, autoDismiss: true });
    }
    setPickerOpen(false);
  }, [customProfiles]);

  // Save the newly seeded profile and make it active. The boot splash is
  // NOT opened here — for the seed-from-name+URL path the splash is already
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
    //    forget — invalidation failure shouldn't block the delete from the UI.
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
      }).catch(() => { /* ignore — best-effort */ });
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
      // marked "running" — otherwise an early identify failure can leave
      // the "ground" step spinning forever, which keeps `anyRunning` true
      // and prevents the splash from being dismissed.
      const next = prev.seedFlow.map(s => {
        if (s.kind === kind) return { ...s, status: "failed" as const, errorReason: reason };
        if (s.status === "running") return { ...s, status: "skipped" as const, detail: s.detail ?? "Not reached — earlier step failed" };
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
 * the active vocab — usually a no-op since overrides are already in-profile).
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

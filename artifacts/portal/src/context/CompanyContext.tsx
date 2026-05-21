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

interface CompanyContextValue {
  profile: CompanyProfile;
  library: CompanyProfile[];
  customProfiles: CompanyProfile[];
  setProfileId: (id: string) => void;
  addCustomProfile: (p: CompanyProfile) => void;
  resetToDefault: () => void;
  resolve: (text: string) => string;
  narrative: NarrativeBundle;
  bootSplash: { open: boolean; profileName: string } | null;
  triggerBootSplash: (profileName: string) => void;
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

  const [bootSplash, setBootSplash] = useState<{ open: boolean; profileName: string } | null>(null);
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
      setBootSplash({ open: true, profileName: next.name });
    }
    setPickerOpen(false);
  }, [customProfiles]);

  const addCustomProfile = useCallback((p: CompanyProfile) => {
    setCustomProfiles(prev => {
      const next = [...prev.filter(x => x.id !== p.id), p];
      try { window.localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setActiveId(p.id);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, p.id); } catch { /* ignore */ }
    setBootSplash({ open: true, profileName: p.name });
    setPickerOpen(false);
  }, []);

  const resetToDefault = useCallback(() => {
    setActiveId(DEFAULT_PROFILE_ID);
    try { window.localStorage.setItem(STORAGE_KEY_ACTIVE, DEFAULT_PROFILE_ID); } catch { /* ignore */ }
    setPickerOpen(false);
  }, []);

  const triggerBootSplash = useCallback((profileName: string) => {
    setBootSplash({ open: true, profileName });
  }, []);

  // Auto-dismiss the boot splash
  useEffect(() => {
    if (!bootSplash?.open) return undefined;
    const t = setTimeout(() => setBootSplash(null), 2800);
    return () => clearTimeout(t);
  }, [bootSplash]);

  const value: CompanyContextValue = {
    profile,
    library: LIBRARY,
    customProfiles,
    setProfileId,
    addCustomProfile,
    resetToDefault,
    resolve,
    narrative,
    bootSplash,
    triggerBootSplash,
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

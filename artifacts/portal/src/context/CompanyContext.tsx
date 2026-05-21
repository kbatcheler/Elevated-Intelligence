import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LIBRARY, MERCER, DEFAULT_PROFILE_ID, makeResolver,
  type CompanyProfile,
} from "../data/companies";

const STORAGE_KEY_ACTIVE = "differentday.activeProfileId.v1";
const STORAGE_KEY_CUSTOM = "differentday.customProfiles.v1";

interface CompanyContextValue {
  profile: CompanyProfile;
  library: CompanyProfile[];
  customProfiles: CompanyProfile[];
  setProfileId: (id: string) => void;
  addCustomProfile: (p: CompanyProfile) => void;
  resetToDefault: () => void;
  resolve: (text: string) => string;
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

import { useState } from "react";
import { X, Globe, Sparkles, RotateCcw, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { DEFAULT_PROFILE_ID, type CompanyProfile } from "../data/companies";

export default function CompanyPicker() {
  const { pickerOpen, setPickerOpen, library, customProfiles, profile, setProfileId, resetToDefault, addCustomProfile } = useCompany();
  const [tab, setTab] = useState<"library" | "generate">("library");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sector, setSector] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pickerOpen) return null;

  const generate = async () => {
    if (!name.trim()) { setError("Company name is required."); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/companies/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), sector: sector.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Seeding failed (HTTP ${res.status})`);
      }
      const profile = (await res.json()) as CompanyProfile;
      addCustomProfile(profile);
      setName(""); setUrl(""); setSector("");
    } catch (e: any) {
      setError(e?.message ?? "Could not seed the profile.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Company picker"
         className="fixed inset-0 z-[55] flex items-center justify-center px-6"
         style={{ background: "rgba(15,26,51,0.65)" }}
         onClick={() => setPickerOpen(false)}>
      <div className="w-[860px] max-w-full max-h-[88vh] flex flex-col rounded-sm overflow-hidden"
           style={{ background: "var(--paper)", border: "1px solid var(--gold)", boxShadow: "0 24px 80px rgba(15,26,51,0.45)" }}
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0"
             style={{ background: "var(--navy)", color: "var(--cream)" }}>
          <div className="flex items-center gap-2.5">
            <Sparkles size={15} strokeWidth={1.8} className="text-[var(--gold-light)]" />
            <span className="font-serif font-semibold text-[14px]">Switch company · seed a new framework</span>
          </div>
          <button onClick={() => setPickerOpen(false)} aria-label="Close picker"
                  className="text-[var(--gold-light)] hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--cream-dark)] shrink-0" style={{ background: "var(--cream-light)" }}>
          <TabBtn label="From the library" active={tab === "library"} onClick={() => setTab("library")} />
          <TabBtn label="Seed from name + URL" active={tab === "generate"} onClick={() => setTab("generate")} />
          <div className="flex-1" />
          {profile.id !== DEFAULT_PROFILE_ID && (
            <button onClick={resetToDefault}
                    className="px-4 flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider text-[var(--slate)] hover:text-[var(--navy)]">
              <RotateCcw size={11} strokeWidth={1.8} /> Reset to Mercer
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-area px-6 py-6">
          {tab === "library" ? (
            <div className="space-y-6">
              <Section title="Pre-built profiles · ready to demo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {library.map(p => (
                    <ProfileCard key={p.id} profile={p} active={p.id === profile.id} onSelect={() => setProfileId(p.id)} />
                  ))}
                </div>
              </Section>
              {customProfiles.length > 0 && (
                <Section title="Saved by you · seeded from the web">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customProfiles.map(p => (
                      <ProfileCard key={p.id} profile={p} active={p.id === profile.id} onSelect={() => setProfileId(p.id)} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="max-w-[560px] mx-auto pt-4">
              <div className="text-center mb-7">
                <div className="eyebrow text-[var(--coral)] mb-2">Sales tool · seed a prospect</div>
                <h2 className="font-serif font-semibold text-[28px] leading-tight text-[var(--navy)] mb-3">
                  Walk in with a finished implementation.
                </h2>
                <p className="font-serif italic text-[14px] text-[var(--slate)] leading-relaxed">
                  Type a prospect's name and homepage. We'll seed all thirteen layers with public intelligence — competitor set, named geographies, named suppliers, recent narrative. Sales rep can edit any cell before the meeting.
                </p>
              </div>

              <div className="space-y-4">
                <Field label="Company name" hint="As the prospect would say it">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Guitar Center"
                         className="w-full px-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)]"
                         style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
                </Field>
                <Field label="Homepage URL" hint="Used as the canonical identifier">
                  <div className="relative">
                    <Globe size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slate-light)]" />
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="guitarcenter.com"
                           className="w-full pl-10 pr-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)]"
                           style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
                  </div>
                </Field>
                <Field label="Sector hint" hint="Optional — improves the seed if specified">
                  <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. specialty music retail"
                         className="w-full px-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)]"
                         style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
                </Field>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-sm font-sans text-[12px] text-[var(--coral)]"
                       style={{ background: "var(--coral-faint)", border: "1px solid var(--coral)" }}>
                    <AlertCircle size={14} strokeWidth={1.8} className="mt-[1px] shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button onClick={generate} disabled={generating || !name.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-sans font-semibold text-[12px] uppercase tracking-wider disabled:opacity-50"
                        style={{ background: "var(--navy)", color: "var(--cream)", border: "1px solid var(--gold)" }}>
                  {generating ? (
                    <><Loader2 size={14} strokeWidth={1.8} className="animate-spin" /> Seeding from public intelligence…</>
                  ) : (
                    <><Sparkles size={14} strokeWidth={1.8} /> Seed the framework</>
                  )}
                </button>

                <p className="font-serif italic text-[11px] text-[var(--slate-light)] text-center leading-snug pt-2">
                  We use public sources only — homepage, recent news, sector benchmarks. Numbers are scaled to the company's revenue band, not extracted from private filings. The sales rep should review before the meeting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
            className={"px-5 py-3 font-sans text-[12px] uppercase tracking-wider transition-colors " +
              (active ? "text-[var(--navy)] font-semibold" : "text-[var(--slate)] hover:text-[var(--navy)]")}
            style={active ? { borderBottom: "2px solid var(--gold)", marginBottom: -1 } : { borderBottom: "2px solid transparent", marginBottom: -1 }}>
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)] mb-3">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="eyebrow text-[var(--navy)]">{label}</label>
        <span className="font-serif italic text-[11px] text-[var(--slate-light)]">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function ProfileCard({ profile, active, onSelect }: { profile: CompanyProfile; active: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
            className={"text-left p-4 rounded-sm transition-all group " +
              (active ? "ring-2 ring-[var(--gold)]" : "hover:border-[var(--navy)]")}
            style={{ background: active ? "var(--gold-faint)" : "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-sm flex items-center justify-center font-serif font-bold text-[20px] shrink-0"
             style={{ background: "var(--navy)", color: "var(--gold-light)" }}>
          {profile.logoEmoji ?? profile.logoMonogram}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-serif font-semibold text-[17px] text-[var(--navy)] leading-tight truncate">{profile.name}</div>
            {active && <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--gold)] shrink-0">Active</span>}
          </div>
          <div className="font-sans text-[11px] text-[var(--slate)] mt-0.5">{profile.url}</div>
          <div className="font-serif italic text-[12px] text-[var(--slate)] mt-1.5 leading-snug">{profile.tagline}</div>
          <div className="flex items-center gap-2 mt-2.5 font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)]">
            <span>{profile.sector}</span>
            <span className="opacity-30">·</span>
            <span>{profile.revenueBand}</span>
            {!active && (
              <span className="ml-auto flex items-center gap-0.5 text-[var(--coral)] group-hover:text-[var(--navy)]">
                Switch <ChevronRight size={10} strokeWidth={2} />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

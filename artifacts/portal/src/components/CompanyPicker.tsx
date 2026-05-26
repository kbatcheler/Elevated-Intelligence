import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, RotateCcw, Trash2, Check, Loader2, AlertCircle, Globe } from "lucide-react";
import { useCompany } from "../context/CompanyContext";

// Phase 1.4 CompanyPicker: list comes from useLibrary() (server-backed via
// CompanyContext), seed-new form POSTs to /api/tenants, every row has a
// refresh button + a delete button with confirmation. No localStorage, no
// in-portal LLM identify/disambiguate flow, the server pipeline owns all
// of that now and the boot splash renders its progress.

// Curated showcase chips for quick demos.
interface ShowcaseChip { name: string; url: string; hint: string }
const SHOWCASE: ShowcaseChip[] = [
  { name: "Stripe",      url: "stripe.com",     hint: "Payments infra" },
  { name: "Shopify",     url: "shopify.com",    hint: "Commerce SaaS" },
  { name: "Patagonia",   url: "patagonia.com",  hint: "Outdoor apparel" },
  { name: "Sweetgreen",  url: "sweetgreen.com", hint: "Fast-casual" },
  { name: "Notion",      url: "notion.so",      hint: "Productivity SaaS" },
];

type Mode = "list" | "seed";

export default function CompanyPicker() {
  const {
    pickerOpen, setPickerOpen,
    tenants, tenantsLoading, tenantsError,
    activeTenant, setProfileId,
    addTenant, removeTenant, refreshTenant, refreshLibrary,
  } = useCompany();

  const [mode, setMode] = useState<Mode>("list");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    setMode(tenants.length === 0 ? "seed" : "list");
    setSubmitError(null);
    void refreshLibrary();
  }, [pickerOpen, tenants.length, refreshLibrary]);

  const confirmDeleteTenant = useMemo(
    () => tenants.find(t => t.id === confirmDeleteId) ?? null,
    [confirmDeleteId, tenants],
  );

  if (!pickerOpen) return null;

  const close = () => {
    setPickerOpen(false);
    setName(""); setUrl(""); setSubmitError(null);
    setConfirmDeleteId(null);
  };

  const onSubmitSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setSubmitError("Both name and homepage URL are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const r = await addTenant({ name: name.trim(), url: url.trim() });
    setSubmitting(false);
    if (!r) {
      setSubmitError("Could not start the seed run, the API rejected the request.");
      return;
    }
    setName(""); setUrl("");
  };

  const onShowcase = async (s: ShowcaseChip) => {
    setSubmitting(true);
    setSubmitError(null);
    const r = await addTenant({ name: s.name, url: s.url });
    setSubmitting(false);
    if (!r) setSubmitError(`Could not start the seed run for ${s.name}.`);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Company picker"
         className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-10 overflow-y-auto"
         style={{ background: "rgba(15,26,51,0.78)" }}>
      <div className="w-[720px] max-w-full rounded-sm"
           style={{ background: "var(--paper)", border: "1px solid var(--navy)", boxShadow: "0 32px 80px rgba(15,26,51,0.45)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
             style={{ background: "var(--navy)", color: "var(--cream)" }}>
          <div>
            <div className="eyebrow text-[var(--gold-light)]">Different Day · Elevated Intelligence</div>
            <div className="font-serif font-semibold text-[20px] leading-tight">Company library</div>
          </div>
          <button onClick={close} aria-label="Close picker"
                  className="text-[var(--gold-light)] hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tab strip */}
        <div className="flex items-center border-b border-[var(--cream-dark)]">
          <button onClick={() => setMode("list")}
                  className={"px-5 py-3 font-sans text-[12px] uppercase tracking-wider " +
                    (mode === "list" ? "text-[var(--navy)] border-b-2" : "text-[var(--slate-light)] hover:text-[var(--navy)]")}
                  style={mode === "list" ? { borderColor: "var(--gold)" } : undefined}>
            Saved tenants ({tenants.length})
          </button>
          <button onClick={() => setMode("seed")}
                  className={"px-5 py-3 font-sans text-[12px] uppercase tracking-wider " +
                    (mode === "seed" ? "text-[var(--navy)] border-b-2" : "text-[var(--slate-light)] hover:text-[var(--navy)]")}
                  style={mode === "seed" ? { borderColor: "var(--gold)" } : undefined}>
            Seed a new company
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {mode === "list" ? (
            <>
              {tenantsLoading && tenants.length === 0 && (
                <div className="font-sans italic text-[12px] text-[var(--slate-light)] py-6 text-center">
                  Loading tenant library...
                </div>
              )}
              {tenantsError && (
                <div className="mb-3 px-3 py-2 rounded-sm font-sans text-[11px] flex items-center gap-2"
                     style={{ background: "rgba(245,166,123,0.10)", color: "var(--coral)", border: "1px solid rgba(245,166,123,0.40)" }}>
                  <AlertCircle size={12} strokeWidth={1.8} />
                  {tenantsError}
                </div>
              )}
              {tenants.length === 0 && !tenantsLoading && (
                <div className="text-center py-8">
                  <div className="font-serif italic text-[13px] text-[var(--slate)] mb-3">
                    No tenants yet. Seed one to begin.
                  </div>
                  <button onClick={() => setMode("seed")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm font-sans text-[12px] uppercase tracking-wider"
                          style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>
                    <Sparkles size={12} strokeWidth={1.8} />
                    Seed a company
                  </button>
                </div>
              )}
              <ul className="space-y-2">
                {tenants.map(t => {
                  const isActive = activeTenant?.id === t.id;
                  return (
                    <li key={t.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-sm"
                        style={{
                          background: isActive ? "var(--gold-faint)" : "var(--cream-light)",
                          border: `1px solid ${isActive ? "var(--gold)" : "var(--cream-dark)"}`,
                        }}>
                      <button onClick={() => { setProfileId(t.id); close(); }}
                              className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-semibold text-[13px] text-[var(--navy)] truncate">{t.name}</span>
                          <StatusPill status={t.status} />
                          {isActive && <Check size={12} strokeWidth={2} className="text-[var(--gold)] shrink-0" />}
                        </div>
                        <div className="font-sans italic text-[11px] text-[var(--slate-light)] truncate">{t.url}</div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); void refreshTenant(t.id); }}
                                title="Re-seed this tenant"
                                aria-label={`Refresh ${t.name}`}
                                className="p-2 rounded-sm hover:bg-[var(--cream-dark)] text-[var(--slate)] hover:text-[var(--navy)]">
                          <RotateCcw size={13} strokeWidth={1.8} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(t.id); }}
                                title="Delete this tenant"
                                aria-label={`Delete ${t.name}`}
                                className="p-2 rounded-sm hover:bg-[var(--coral-faint)] text-[var(--slate)] hover:text-[var(--coral)]">
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <form onSubmit={onSubmitSeed} className="space-y-3">
                <div>
                  <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)] mb-1">Company name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                         placeholder="Stripe, Patagonia, your prospect..."
                         className="w-full px-3 py-2 rounded-sm font-serif text-[13px]"
                         style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)", color: "var(--ink)" }} />
                </div>
                <div>
                  <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)] mb-1">Homepage URL</label>
                  <div className="relative">
                    <Globe size={13} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--slate-light)]" />
                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                           placeholder="stripe.com"
                           className="w-full pl-8 pr-3 py-2 rounded-sm font-mono text-[12px]"
                           style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)", color: "var(--ink)" }} />
                  </div>
                </div>
                {submitError && (
                  <div className="px-3 py-2 rounded-sm font-sans text-[11px] flex items-center gap-2"
                       style={{ background: "rgba(245,166,123,0.10)", color: "var(--coral)", border: "1px solid rgba(245,166,123,0.40)" }}>
                    <AlertCircle size={12} strokeWidth={1.8} />
                    {submitError}
                  </div>
                )}
                <button type="submit" disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-sans text-[12px] uppercase tracking-wider font-semibold disabled:opacity-50"
                        style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>
                  {submitting ? <Loader2 size={13} strokeWidth={1.8} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.8} />}
                  {submitting ? "Starting seed..." : "Seed this company"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[var(--cream-dark)]">
                <div className="font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)] mb-2">
                  Or pick a showcase
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SHOWCASE.map(s => (
                    <button key={s.name} disabled={submitting} onClick={() => onShowcase(s)}
                            className="px-3 py-1.5 rounded-sm font-sans text-[11px] text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--gold-faint)] border border-[var(--cream-dark)] hover:border-[var(--gold)] disabled:opacity-50">
                      <span className="font-semibold">{s.name}</span>
                      <span className="mx-1.5 opacity-40">·</span>
                      <span className="italic">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteTenant && (
        <div role="dialog" aria-modal="true" aria-label="Confirm delete tenant"
             className="fixed inset-0 z-[65] flex items-center justify-center px-6"
             style={{ background: "rgba(15,26,51,0.85)" }}>
          <div className="w-[420px] max-w-full rounded-sm p-5"
               style={{ background: "var(--paper)", border: "1px solid var(--coral)", boxShadow: "0 24px 60px rgba(15,26,51,0.5)" }}>
            <div className="font-serif font-semibold text-[18px] text-[var(--navy)] mb-2">
              Delete {confirmDeleteTenant.name}?
            </div>
            <div className="font-sans text-[12px] text-[var(--slate)] mb-4 leading-relaxed">
              The tenant, its profile, all 14 layers, and all artifacts will be removed from the database. This cannot be undone.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-wider text-[var(--slate)] hover:bg-[var(--cream-light)]">
                Cancel
              </button>
              <button onClick={async () => {
                          const id = confirmDeleteTenant.id;
                          setConfirmDeleteId(null);
                          await removeTenant(id);
                        }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-wider font-semibold"
                      style={{ background: "var(--coral)", color: "white" }}>
                <Trash2 size={11} strokeWidth={1.8} />
                Delete tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "seeding" | "ready" | "failed" }) {
  const cfg = status === "ready"
    ? { label: "Ready", bg: "rgba(106,156,137,0.18)", color: "var(--teal)" }
    : status === "seeding"
    ? { label: "Seeding", bg: "rgba(212,175,55,0.18)", color: "var(--gold)" }
    : { label: "Failed", bg: "rgba(245,166,123,0.18)", color: "var(--coral)" };
  return (
    <span className="px-1.5 py-0.5 rounded-sm font-sans text-[9px] uppercase tracking-wider shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

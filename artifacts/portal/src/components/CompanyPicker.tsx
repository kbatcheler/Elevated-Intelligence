import { useEffect, useRef, useState } from "react";
import { X, Globe, Sparkles, RotateCcw, ChevronRight, Loader2, AlertCircle, ArrowLeft, Check, Trash2 } from "lucide-react";
import { useCompany, type SeedStep } from "../context/CompanyContext";
import { DEFAULT_PROFILE_ID, type CompanyProfile } from "../data/companies";

// Initial step plan for the live seed splash. Steps progress through
// pending → running → done|skipped|failed as the orchestrator (below)
// drives real API calls. NO setTimeout sequencing anywhere.
function initialSeedSteps(): SeedStep[] {
  return [
    { kind: "ground",        status: "running", label: "Fetching homepage + extracting ground truth" },
    { kind: "identify",      status: "pending", label: "Cross-checking identity with DifferentDay AI" },
    { kind: "disambiguate",  status: "pending", label: "Confirming there's only one match" },
    { kind: "seed",          status: "pending", label: "Generating company profile + 13 intelligence layers" },
    { kind: "indexing",      status: "pending", label: "Indexing vocabulary into the narrative bundle" },
    { kind: "prefetch",      status: "pending", label: "Pre-warming the Executive intelligence brief" },
  ];
}

function fmtMs(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)}s`;
}
function fmtBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}
function fmtInt(n: number): string {
  return n.toLocaleString();
}

interface Candidate {
  name: string;
  canonicalUrl: string;
  sector: string;
  hqCity: string;
  hqState: string;
  oneLiner: string;
  distinguisher: string;
  confidence: number;
}
type Stage = "input" | "identifying" | "disambiguate" | "seeding";

// Confidence at which we skip the disambiguation step entirely.
const AUTO_PROCEED_CONFIDENCE = 0.92;

export default function CompanyPicker() {
  const {
    pickerOpen, setPickerOpen, library, customProfiles, profile,
    setProfileId, resetToDefault, addCustomProfile, removeCustomProfile,
    bootSplash, beginSeedFlow, updateSeedStep, endSeedFlow, failSeedFlow,
  } = useCompany();

  // Close the picker AND cancel any parked seed flow waiting on a
  // disambiguation pick. Without this, the user can close the picker mid-
  // disambiguation and strand the splash with `disambiguate=running` forever
  // (nothing in flight to wait on, but `anyRunning=true` blocks dismiss).
  const closePicker = () => {
    const disambigStep = bootSplash?.seedFlow?.find(s => s.kind === "disambiguate");
    if (disambigStep?.status === "running") {
      failSeedFlow("disambiguate", "Cancelled — picker closed before a candidate was confirmed.");
    }
    setPickerOpen(false);
  };
  const [tab, setTab] = useState<"library" | "generate">("library");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live elapsed-seconds counter for the in-flight LLM call. Real (not fake)
  // — it ticks every 100ms against the wall clock so the user can see the
  // round-trip is actually taking N seconds of network + model time.
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    const busy = stage === "identifying" || stage === "seeding";
    if (!busy) { startRef.current = null; setElapsedMs(0); return undefined; }
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      if (startRef.current !== null) setElapsedMs(Date.now() - startRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [stage]);

  if (!pickerOpen) return null;

  const reset = () => {
    setStage("input"); setCandidates([]); setError(null);
  };

  // Step 1: ask the server to identify the company. The "ground" + "identify"
  // splash steps both resolve from this single round-trip — the server fetches
  // the homepage and runs the LLM identify in one shot. If verdict is
  // unambiguous + high confidence, we proceed straight to seed; otherwise we
  // close the splash and route to disambiguation in the picker.
  const identify = async () => {
    const trimmedName = name.trim();
    const trimmedUrl  = url.trim();
    if (!trimmedName) { setError("Company name is required."); return; }
    if (!trimmedUrl)  { setError("Homepage URL is required — it's the only way to disambiguate from same-named companies."); return; }
    // Light client-side domain shape check. The server enforces this strictly;
    // catching it here gives a faster, kinder error than a 400 round-trip.
    const cleaned = trimmedUrl.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(cleaned)) {
      setError("Homepage URL must look like a real domain (e.g. humanco.com or www.humanco.com).");
      return;
    }
    setError(null);
    setStage("identifying");
    // Open the splash with the real work plan. Ground+identify start
    // running together because they're served by the same endpoint.
    beginSeedFlow(trimmedName, initialSeedSteps());
    updateSeedStep("identify", { status: "running" });
    try {
      const res = await fetch("/api/companies/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, url: trimmedUrl, sector: sector.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Identification failed (HTTP ${res.status})`);
      }
      const data = await res.json() as {
        candidates: Candidate[];
        verdict: string;
        _meta?: {
          durationMs: number;
          inputTokens: number | null;
          outputTokens: number | null;
          grounding?: { ok: boolean; domain: string; bytesFetched: number; bytesExtracted: number; fetchMs: number; status: number };
        };
      };
      const cands = data.candidates ?? [];
      if (cands.length === 0) {
        failSeedFlow("identify", "AI returned no candidates.");
        throw new Error("AI returned no candidates.");
      }
      // Stamp the real grounding receipt onto the "ground" step.
      const g = data._meta?.grounding;
      if (g?.ok) {
        updateSeedStep("ground", {
          status: "done",
          stats: [
            { label: "Source",         value: g.domain },
            { label: "HTML fetched",   value: fmtBytes(g.bytesFetched) },
            { label: "Text extracted", value: fmtBytes(g.bytesExtracted) },
            { label: "Fetch time",     value: fmtMs(g.fetchMs) },
          ],
        });
      } else {
        updateSeedStep("ground", {
          status: "failed",
          errorReason: g ? `homepage returned HTTP ${g.status}` : "no grounding receipt returned",
          detail: "Proceeding from training-data memory only — review the brief before sending.",
        });
      }
      // Stamp the identify receipt with REAL timing + token counts.
      const topName = cands[0].name;
      const topConf = cands[0].confidence;
      updateSeedStep("identify", {
        status: "done",
        stats: [
          { label: "Round-trip",   value: data._meta ? fmtMs(data._meta.durationMs) : "—" },
          { label: "Tokens in/out", value: data._meta && data._meta.inputTokens != null && data._meta.outputTokens != null
                                          ? `${fmtInt(data._meta.inputTokens)} → ${fmtInt(data._meta.outputTokens)}` : "—" },
          { label: "Candidates",   value: cands.length === 1 ? "1 (unambiguous)" : `${cands.length} (verdict: ${data.verdict})` },
          { label: "Top match",    value: `${topName} · ${Math.round(topConf * 100)}%` },
        ],
      });

      setCandidates(cands);
      const top = cands[0];
      if (
        data.verdict === "unambiguous" &&
        cands.length === 1 &&
        top.confidence >= AUTO_PROCEED_CONFIDENCE
      ) {
        // Auto-confirmed — disambiguate step is skipped honestly.
        updateSeedStep("disambiguate", {
          status: "skipped",
          detail: `Auto-confirmed at ${Math.round(top.confidence * 100)}% confidence (threshold ${Math.round(AUTO_PROCEED_CONFIDENCE * 100)}%)`,
        });
        await seedConfirmed(top, { fromAutoProceed: true });
        return;
      }
      // Ambiguous — pause the splash and route the user back to the picker
      // disambiguation list. The splash stays open in a paused state until
      // the user picks (or dismisses).
      updateSeedStep("disambiguate", {
        status: "running",
        detail: `${cands.length} possible matches — pick one in the picker`,
      });
      setPickerOpen(true);
      setStage("disambiguate");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Identification failed.";
      setError(msg);
      failSeedFlow("identify", msg);
      setStage("input");
      setPickerOpen(true);
    }
  };

  // Step 2: seed with a confirmed identity. Drives the "seed" → "indexing"
  // → "prefetch" splash steps with real receipts as each call resolves.
  const seedConfirmed = async (c: Candidate, opts?: { fromAutoProceed?: boolean }) => {
    setError(null);
    setStage("seeding");
    if (!opts?.fromAutoProceed) {
      // User-picked disambiguation — close the picker, mark disambiguate done.
      updateSeedStep("disambiguate", {
        status: "done",
        detail: `Picked ${c.name} (${Math.round(c.confidence * 100)}% confidence)`,
        stats: [
          { label: "Picked",  value: c.name },
          { label: "Source",  value: c.canonicalUrl || url.trim() },
        ],
      });
      setPickerOpen(false);
    }
    updateSeedStep("seed", { status: "running" });
    let seeded: CompanyProfile;
    try {
      const res = await fetch("/api/companies/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:   c.name,
          url:    c.canonicalUrl || url.trim(),
          sector: c.sector || sector.trim(),
          confirmed: {
            name:         c.name,
            canonicalUrl: c.canonicalUrl || url.trim(),
            sector:       c.sector,
            hqCity:       c.hqCity,
            hqState:      c.hqState,
            oneLiner:     c.oneLiner,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Seeding failed (HTTP ${res.status})`);
      }
      seeded = await res.json() as CompanyProfile;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not seed the profile.";
      setError(msg);
      failSeedFlow("seed", msg);
      setStage("disambiguate");
      setPickerOpen(true);
      return;
    }
    const meta = seeded._meta;
    updateSeedStep("seed", {
      status: "done",
      stats: meta ? [
        { label: "Round-trip",     value: fmtMs(meta.durationMs) },
        { label: "Tokens in/out",  value: meta.inputTokens != null && meta.outputTokens != null
                                          ? `${fmtInt(meta.inputTokens)} → ${fmtInt(meta.outputTokens)}` : "—" },
        { label: "Payload",        value: fmtBytes(meta.bytesReturned) },
        { label: "Layers seeded",  value: `${fmtInt(meta.headlinesCount)} headline metrics across 13 layers` },
      ] : [],
    });

    // Indexing step — real but instant. We measure the wall-clock cost of the
    // narrative deep-swap that happens as a side-effect of activating the
    // profile (the useMemo in CompanyContext re-runs on the next render).
    updateSeedStep("indexing", { status: "running" });
    const idxStart = performance.now();
    addCustomProfile(seeded);
    // Allow React to flush the re-render so the swap actually happens before
    // we stop the timer. requestAnimationFrame is the cheapest way to defer.
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    const idxMs = Math.max(1, Math.round(performance.now() - idxStart));
    updateSeedStep("indexing", {
      status: "done",
      stats: [
        { label: "Vocab tokens",      value: meta ? fmtInt(meta.vocabCount) : "—" },
        { label: "Indexed in",        value: fmtMs(idxMs) },
        { label: "Narrative modules", value: "16" },
      ],
    });

    // Prefetch step — the real Executive intelligence brief. This is a
    // genuine LLM round-trip that returns the same payload the report page
    // will display. It also primes the server-side brief cache so the first
    // layer view comes back from cache instead of waiting another 10-15s.
    updateSeedStep("prefetch", { status: "running" });
    const pfStart = performance.now();
    try {
      const briefRes = await fetch("/api/intelligence/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        seeded.name,
          url:         seeded.url,
          sector:      seeded.sector,
          hqCity:      seeded.hqCity,
          hqState:     seeded.hqState,
          revenueBand: seeded.revenueBand,
          ownership:   seeded.ownership,
          founded:     seeded.founded,
          tagline:     seeded.tagline,
        }),
      });
      const pfMs = Math.round(performance.now() - pfStart);
      if (!briefRes.ok) {
        const body = await briefRes.json().catch(() => ({}));
        updateSeedStep("prefetch", {
          status: "failed",
          errorReason: body?.error ?? `HTTP ${briefRes.status}`,
          detail: "The Executive brief will generate on first open instead of being pre-warmed.",
        });
      } else {
        const text = await briefRes.text();
        const cacheHdr = briefRes.headers.get("X-Cache") ?? "MISS";
        updateSeedStep("prefetch", {
          status: "done",
          stats: [
            { label: "Round-trip", value: fmtMs(pfMs) },
            { label: "Payload",    value: fmtBytes(text.length) },
            { label: "Layer",      value: "Executive · Business performance" },
            { label: "Cache",      value: cacheHdr === "HIT" ? "warm (cached)" : "primed (fresh)" },
          ],
        });
      }
    } catch (e) {
      const pfMs = Math.round(performance.now() - pfStart);
      updateSeedStep("prefetch", {
        status: "failed",
        errorReason: `${e instanceof Error ? e.message : String(e)} after ${fmtMs(pfMs)}`,
        detail: "The Executive brief will generate on first open instead of being pre-warmed.",
      });
    }

    endSeedFlow(meta);
    setName(""); setUrl(""); setSector("");
    setCandidates([]);
    setStage("input");
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Company picker"
         className="fixed inset-0 z-[80] flex items-center justify-center px-6"
         style={{ background: "rgba(15,26,51,0.65)" }}
         onClick={closePicker}>
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
          <button onClick={closePicker} aria-label="Close picker"
                  className="text-[var(--gold-light)] hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--cream-dark)] shrink-0" style={{ background: "var(--cream-light)" }}>
          <TabBtn label="From the library" active={tab === "library"} onClick={() => { setTab("library"); reset(); }} />
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
                <Section
                  title="Saved by you · seeded from the web"
                  action={
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ALL ${customProfiles.length} saved profile${customProfiles.length === 1 ? "" : "s"}? You can re-seed any of them later.`)) {
                          customProfiles.forEach(p => removeCustomProfile(p.id));
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-sm font-sans text-[10px] uppercase tracking-wider text-[var(--slate)] hover:text-[var(--coral)] hover:bg-[var(--coral-faint)] transition-colors"
                      title="Delete every saved profile">
                      <Trash2 size={11} strokeWidth={1.8} /> Clear all
                    </button>
                  }>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customProfiles.map(p => (
                      <ProfileCard key={p.id} profile={p} active={p.id === profile.id}
                                   onSelect={() => setProfileId(p.id)}
                                   onDelete={() => removeCustomProfile(p.id)} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : stage === "disambiguate" ? (
            <DisambiguateView
              typedName={name.trim()}
              typedUrl={url.trim()}
              candidates={candidates}
              error={error}
              onPick={seedConfirmed}
              onBack={reset}
            />
          ) : (
            <SeedInputView
              name={name} setName={setName}
              url={url} setUrl={setUrl}
              sector={sector} setSector={setSector}
              error={error}
              stage={stage}
              onSubmit={identify}
              elapsedMs={elapsedMs}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SeedInputView({
  name, setName, url, setUrl, sector, setSector, error, stage, onSubmit, elapsedMs,
}: {
  name: string; setName: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  sector: string; setSector: (v: string) => void;
  error: string | null;
  stage: Stage;
  onSubmit: () => void;
  elapsedMs: number;
}) {
  const busy = stage === "identifying" || stage === "seeding";
  const elapsedLabel = `${(elapsedMs / 1000).toFixed(1)}s`;
  return (
    <div className="max-w-[560px] mx-auto pt-4">
      <div className="text-center mb-7">
        <div className="eyebrow text-[var(--coral)] mb-2">Sales tool · seed a prospect</div>
        <h2 className="font-serif font-semibold text-[28px] leading-tight text-[var(--navy)] mb-3">
          Walk in with a finished implementation.
        </h2>
        <p className="font-serif italic text-[14px] text-[var(--slate)] leading-relaxed">
          Type the prospect's name <strong>and</strong> their homepage URL. The URL is the authoritative identifier — both are required and the framework is seeded directly from that domain.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Company name *" hint="As the prospect would say it">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Guitar Center"
                 disabled={busy} required
                 className="w-full px-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)] disabled:opacity-60"
                 style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
        </Field>
        <Field label="Homepage URL *" hint="Required · the authoritative identifier · must match the company name (e.g. humanco.com for HumanCo)">
          <div className="relative">
            <Globe size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slate-light)]" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="guitarcenter.com" type="url"
                   disabled={busy} required
                   className="w-full pl-10 pr-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)] disabled:opacity-60"
                   style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
          </div>
        </Field>
        <Field label="Sector hint" hint="Optional — helps disambiguate if the name is common">
          <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. specialty music retail"
                 disabled={busy}
                 className="w-full px-3 py-2.5 rounded-sm font-sans text-[14px] text-[var(--navy)] disabled:opacity-60"
                 style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }} />
        </Field>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-sm font-sans text-[12px] text-[var(--coral)]"
               style={{ background: "var(--coral-faint)", border: "1px solid var(--coral)" }}>
            <AlertCircle size={14} strokeWidth={1.8} className="mt-[1px] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button onClick={onSubmit} disabled={busy || !name.trim() || !url.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-sans font-semibold text-[12px] uppercase tracking-wider disabled:opacity-50"
                style={{ background: "var(--navy)", color: "var(--cream)", border: "1px solid var(--gold)" }}>
          {stage === "identifying" ? (
            <>
              <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
              <span>Identifying via DifferentDay AI…</span>
              <span className="font-mono text-[11px] opacity-80 ml-1">{elapsedLabel}</span>
            </>
          ) : stage === "seeding" ? (
            <>
              <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
              <span>Seeding 13 intelligence layers via DifferentDay AI…</span>
              <span className="font-mono text-[11px] opacity-80 ml-1">{elapsedLabel}</span>
            </>
          ) : (
            <><Sparkles size={14} strokeWidth={1.8} /> Identify &amp; seed</>
          )}
        </button>

        <p className="font-serif italic text-[11px] text-[var(--slate-light)] text-center leading-snug pt-2">
          Step 1: confirm the right company. Step 2: seed the framework. Public sources only — the rep should review before the meeting.
        </p>
      </div>
    </div>
  );
}

function DisambiguateView({
  typedName, typedUrl, candidates, error, onPick, onBack,
}: {
  typedName: string;
  typedUrl: string;
  candidates: Candidate[];
  error: string | null;
  onPick: (c: Candidate) => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[640px] mx-auto pt-2">
      <button onClick={onBack}
              className="flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider text-[var(--slate)] hover:text-[var(--navy)] mb-5">
        <ArrowLeft size={11} strokeWidth={1.8} /> Back to input
      </button>

      <div className="mb-6">
        <div className="eyebrow text-[var(--coral)] mb-2">Confirm the company</div>
        <h2 className="font-serif font-semibold text-[24px] leading-tight text-[var(--navy)] mb-2">
          Which {`"${typedName}"`} did you mean?
        </h2>
        <p className="font-serif italic text-[13px] text-[var(--slate)] leading-relaxed">
          {candidates.length > 1
            ? `We found ${candidates.length} possible matches${typedUrl ? "" : " — supplying a homepage URL avoids this step next time"}. Pick the right one to seed.`
            : "We're not fully confident on this one — confirm or go back and add the homepage URL."}
        </p>
      </div>

      <div className="space-y-3">
        {candidates.map((c, i) => (
          <button key={i} onClick={() => onPick(c)}
                  className="w-full text-left p-4 rounded-sm transition-all hover:border-[var(--navy)] group"
                  style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="font-serif font-semibold text-[18px] text-[var(--navy)] leading-tight">{c.name}</div>
                  <ConfidencePill v={c.confidence} />
                </div>
                {c.canonicalUrl && (
                  <div className="font-sans text-[11px] text-[var(--slate)] mb-1.5">{c.canonicalUrl}</div>
                )}
                <div className="font-serif italic text-[13px] text-[var(--ink)] leading-snug mb-2">{c.oneLiner}</div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 font-sans text-[11px] text-[var(--slate-light)]">
                  {c.sector && <span className="uppercase tracking-wider">{c.sector}</span>}
                  {c.hqCity && <><span className="opacity-40">·</span><span>{c.hqCity}{c.hqState ? `, ${c.hqState}` : ""}</span></>}
                  {c.distinguisher && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="italic text-[var(--coral)]">{c.distinguisher}</span>
                    </>
                  )}
                </div>
              </div>
              <Check size={16} strokeWidth={1.8} className="text-[var(--cream-dark)] group-hover:text-[var(--coral)] shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-sm font-sans text-[12px] text-[var(--coral)]"
             style={{ background: "var(--coral-faint)", border: "1px solid var(--coral)" }}>
          <AlertCircle size={14} strokeWidth={1.8} className="mt-[1px] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="font-serif italic text-[11px] text-[var(--slate-light)] text-center leading-snug pt-5">
        Picking a candidate seeds the framework against that exact entity — no silent substitution.
      </p>
    </div>
  );
}

function ConfidencePill({ v }: { v: number }) {
  const pct = Math.round(v * 100);
  const tone =
    v >= 0.85 ? { bg: "var(--teal-faint)", fg: "var(--teal)", label: "High confidence" } :
    v >= 0.6  ? { bg: "var(--gold-faint)", fg: "var(--gold)", label: "Medium" } :
                 { bg: "var(--coral-faint)", fg: "var(--coral)", label: "Low" };
  return (
    <span className="shrink-0 font-sans text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm tabular-nums"
          style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.fg}` }}
          title={`${tone.label} · ${pct}% confidence`}>
      {pct}%
    </span>
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

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow text-[var(--slate-light)]">{title}</div>
        {action}
      </div>
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

function ProfileCard({ profile, active, onSelect, onDelete }: { profile: CompanyProfile; active: boolean; onSelect: () => void; onDelete?: () => void }) {
  // Two-step inline delete: first click arms (turns coral with "Confirm"),
  // second click commits. Auto-disarms after 4s so a stray click can't nuke
  // a saved profile. Replaces the previous native window.confirm() popup.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(t);
  }, [armed]);

  return (
    <div className={"relative text-left p-4 rounded-sm transition-all group " +
            (active ? "ring-2 ring-[var(--gold)]" : "hover:border-[var(--navy)]")}
         style={{ background: active ? "var(--gold-faint)" : "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
      <button onClick={onSelect} className="w-full text-left cursor-pointer bg-transparent border-0 p-0">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-sm flex items-center justify-center font-serif font-bold text-[20px] shrink-0"
               style={{ background: "var(--navy)", color: "var(--gold-light)" }}>
            {profile.logoEmoji ?? profile.logoMonogram}
          </div>
          <div className="flex-1 min-w-0 pr-7">
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
      {onDelete && (
        armed ? (
          <div onClick={(e) => e.stopPropagation()}
               className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-sm"
               style={{ background: "var(--coral-faint)", border: "1px solid var(--coral)" }}>
            <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--coral)]">Delete?</span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    aria-label={`Confirm delete ${profile.name}`}
                    title="Yes, delete"
                    className="p-1 rounded-sm text-[var(--coral)] hover:bg-white/40">
              <Check size={12} strokeWidth={2.2} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setArmed(false); }}
                    aria-label="Cancel delete"
                    title="Cancel"
                    className="p-1 rounded-sm text-[var(--slate)] hover:bg-white/40">
              <X size={12} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setArmed(true); }}
                  aria-label={`Delete saved profile for ${profile.name}`}
                  title="Delete this saved profile"
                  className="absolute top-2 right-2 p-1.5 rounded-sm text-[var(--slate-light)] hover:text-[var(--coral)] hover:bg-[var(--coral-faint)] transition-colors">
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        )
      )}
    </div>
  );
}

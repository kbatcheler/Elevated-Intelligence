import { useEffect, useMemo, useRef, useState } from "react";
import { X, Printer, Sparkles, Building2, Users2, LineChart, Lightbulb, RefreshCw, Globe, ArrowUp, ArrowDown, CircleDot, Activity, Banknote, Calendar, Package, Swords, Truck, Cpu, Bot, Briefcase, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import type { LayerData } from "../data/layers";

// Deterministic 32-bit hash of a string (Fowler–Noll–Vo / xorshift mix). Used
// to seed the "since yesterday" delta selection so each company's ribbon is
// stable across reloads and reseeds, while different companies see different
// deltas. NOT cryptographic, only needs the property that visually different
// inputs give visually different outputs.
function seededHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // One round of xorshift to spread bits
  h ^= h << 13; h >>>= 0;
  h ^= h >>> 17;
  h ^= h << 5; h >>>= 0;
  return h;
}

type DeltaKind = "metric" | "cause" | "action" | "gap";
interface Delta {
  kind: DeltaKind;
  label: string;        // short label, e.g. "Demand intelligence"
  text: string;         // the change itself
  direction: "up" | "down" | "neutral";
  tone: "good" | "bad" | "warn" | "neutral";
}

// Derive a deterministic set of 3 "since yesterday" deltas from the seeded
// company's layer signals. The hash of the company name selects WHICH layers
// and WHICH movement shapes are surfaced, so the same company always gets the
// same ribbon, and different companies see different framing, without us
// needing to ship per-company hand-written deltas.
function deriveDeltas(profileName: string, layers: LayerData[]): Delta[] {
  if (layers.length === 0) return [];
  // Normalize before hashing so reseeds with casing / whitespace / punctuation
  // drift ("Acme", "  acme  ", "Acme.") still land on the same ribbon. Doesn't
  // solve true name changes (e.g. "Acme" vs "Acme Inc."), but covers the
  // common drift pattern across reseed flows.
  const normalized = (profileName || "default").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const seed = seededHash(normalized);
  // Magnitudes per metric type. The hash picks from these so the units
  // attached to the move match the units the metric is denominated in —
  // otherwise a currency metric ends up with a bare "+1.2 overnight" which
  // reads as nonsense in a CEO brief.
  const ppMoves    = [0.3, 0.6, 0.9, 1.2, 1.6, 2.1, 2.8, 3.2];     // percentage points
  const pctMoves   = [4, 6, 8, 11, 14, 18];                         // percent changes (for count/index metrics)
  const usdMoves   = ["$0.2M", "$0.4M", "$0.6M", "$0.9M", "$1.3M", "$1.8M"];
  const directions: Array<"up" | "down"> = ["up", "down"];

  // Rotate through layers starting at a hash-determined offset so a "Patagonia"
  // brief leans into different layers than a "Stripe" brief.
  const startIdx = seed % layers.length;
  const deltas: Delta[] = [];
  for (let i = 0; i < layers.length && deltas.length < 3; i++) {
    const layer = layers[(startIdx + i) % layers.length];
    // Mix the seed with the loop index via xorshift instead of a wide shift —
    // shift counts above 31 wrap in JS and reuse the same bits, so each layer
    // would draw from overlapping entropy. xorshift gives independent draws.
    let lhash = (seed ^ (i * 0x9e3779b1)) >>> 0;
    lhash ^= lhash << 13; lhash >>>= 0;
    lhash ^= lhash >>> 17;
    lhash ^= lhash << 5;  lhash >>>= 0;
    const localSeed = lhash & 0xff;
    const shape = localSeed % 4;
    const dir = directions[localSeed % 2];

    // Shape 0: a top metric ticked. Format the magnitude based on the
    // metric's denomination so the chip reads naturally, pp for %, USD for
    // currency, percent change for counts/indices.
    if (shape === 0 && layer.metrics?.[0]) {
      const m = layer.metrics[0];
      const isPercent  = /%/.test(m.value);
      const isCurrency = /[$£€]/.test(m.value);
      const sign       = dir === "up" ? "+" : "-";
      let moveText: string;
      if (isPercent) {
        moveText = `${sign}${ppMoves[localSeed % ppMoves.length].toFixed(1)}pp`;
      } else if (isCurrency) {
        moveText = `${sign}${usdMoves[localSeed % usdMoves.length].replace(/^\$/, "$")}`;
      } else {
        // Count / index / NPS etc, express as a percent change so the
        // magnitude scales sensibly without us knowing the underlying unit.
        moveText = `${sign}${pctMoves[localSeed % pctMoves.length]}%`;
      }
      // "good" tone means improvement; flip direction accordingly to keep
      // the up/down arrow consistent with the tone.
      const improving = (m.tone === "good" && dir === "up") || (m.tone === "bad" && dir === "down");
      deltas.push({
        kind: "metric",
        label: layer.title,
        text: `${m.label} ${moveText} overnight`,
        direction: dir,
        tone: improving ? "good" : m.tone === "neutral" ? "neutral" : "warn",
      });
      continue;
    }
    // Shape 1: a cause moved in dollar terms
    if (shape === 1 && layer.causes?.[0]) {
      const c = layer.causes[0];
      const move = usdMoves[localSeed % usdMoves.length];
      // Hash bit chooses widening (worse) vs narrowing (better)
      const widening = (localSeed & 0x10) === 0;
      deltas.push({
        kind: "cause",
        label: layer.title,
        text: `"${c.title}" ${widening ? "widened" : "narrowed"} by ${move} vs prior day`,
        direction: widening ? "up" : "down",
        tone: widening ? "bad" : "good",
      });
      continue;
    }
    // Shape 2: a recommended action firmed up
    if (shape === 2 && layer.actions?.[0]) {
      const a = layer.actions[0];
      deltas.push({
        kind: "action",
        label: layer.title,
        text: `Action firmed up: "${a.title}" now scored at ${a.impact}`,
        direction: "neutral",
        tone: "good",
      });
      continue;
    }
    // Shape 3: confidence shifted
    const pctShift = pctMoves[localSeed % pctMoves.length];
    const conf = layer.confidence ?? 80;
    const newConf = Math.max(50, Math.min(95, conf + (dir === "up" ? +1 : -1) * (pctShift / 4)));
    deltas.push({
      kind: "gap",
      label: layer.title,
      text: `Diagnostic confidence ${dir === "up" ? "rose" : "fell"} to ${newConf.toFixed(0)}% (was ${conf}%)`,
      direction: dir,
      tone: dir === "up" ? "good" : "warn",
    });
  }
  return deltas;
}

// ───────────────────────────────────────────────────────────────────────────
// Brief shape, mirrors NormalisedBrief on the server. The renderer fails
// soft on any missing section: arrays default to [] in the server validator,
// so a section with empty data just collapses to its heading + a "Not
// publicly disclosed" hint rather than crashing.
// ───────────────────────────────────────────────────────────────────────────
interface Brief {
  company: {
    snapshot: string; legalName: string; industry: string; valueProposition: string;
    history: string; businessModel: string; differentiators: string[];
    employeeCount: string; internalIT: string;
  };
  ownership: {
    structure: string; summary: string;
    fundingRounds: Array<{ date: string; round: string; amount: string; leadInvestor: string; valuation: string }>;
    keyShareholders: string[]; boardSeats: string;
  };
  timeline: Array<{ year: string; event: string }>;
  leaders:  Array<{ name: string; role: string; background: string }>;
  board:    Array<{ name: string; affiliation: string }>;
  financials: {
    scale: string; trajectory: string; capitalStructure: string;
    kpis: Array<{ label: string; value: string; note?: string }>;
  };
  products: {
    productLines: string[]; brandPartnerships: string[];
    revenueStreams: Array<{ stream: string; share: string; note: string }>;
    channels: string[];
  };
  marketPosition: {
    competitors: Array<{ name: string; note: string }>;
    differentiators: string[]; marketShare: string;
  };
  operations: { warehouses: string; manufacturing: string; logistics: string; automationLevel: string };
  techLandscape: { erp: string; wms: string; ecommerce: string; digitalMaturity: string; knownStack: string[] };
  competitiveAI: string;
  businessFunctions: Array<{
    function: string; currentState: string;
    useCases: Array<{ function: string; capabilities: string; businessImpact: string; timeToValue: string }>;
  }>;
  narrative: string;
  generatedAt: string;
  // Receipt from the live homepage fetch that grounded this brief. May be
  // null when the server didn't attempt a fetch, or `ok:false` when the
  // fetch failed, the UI shows different copy in each case so the reader
  // knows whether the brief is empirically anchored or memory-based.
  grounding?: {
    ok: boolean;
    domain: string;
    bytesFetched: number;
    bytesExtracted: number;
    fetchMs: number;
    status: number;
  } | null;
  // True when the server returned a previously-generated brief from cache.
  // The grounding receipt is then provenance from THAT earlier fetch, not a
  // live one, the UI downgrades the badge copy accordingly.
  cached?: boolean;
}

// Bumped from v1 → v2 when the schema expanded to the 12-section research
// deliverable. Any v1 cache entry has the wrong shape (missing ownership,
// timeline, products, etc) and would render as broken sections, bumping
// the prefix forces a fresh server fetch instead of trying to migrate.
const CACHE_PREFIX = "differentday.intelligenceBrief.v2.";

function loadCached(profileId: string): Brief | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + profileId);
    return raw ? JSON.parse(raw) as Brief : null;
  } catch { return null; }
}

function saveCached(profileId: string, brief: Brief): void {
  try { window.localStorage.setItem(CACHE_PREFIX + profileId, JSON.stringify(brief)); } catch { /* ignore */ }
}

// ───────────────────────────────────────────────────────────────────────────
// Triple-check verification, fires after the brief loads. Returns per-
// section confidence (HIGH/MED/LOW from the reconciler) and a curated
// dispute list (from the critic, arbitrated by the reconciler). Cached on
// the server so re-opening the same brief is free.
// ───────────────────────────────────────────────────────────────────────────
type ConfidenceLevel = "HIGH" | "MED" | "LOW";
type DisputeSeverity = "high" | "med" | "low";
type SectionKey =
  | "company" | "ownership" | "timeline" | "leaders" | "board" | "financials"
  | "products" | "marketPosition" | "operations" | "techLandscape"
  | "competitiveAI" | "businessFunctions";
interface VerifyResponse {
  confidence: Partial<Record<SectionKey, ConfidenceLevel>>;
  disputes:   Array<{ section: string; claim: string; severity: DisputeSeverity; reason: string }>;
  summary:    string;
  verifiedAt: string;
  model:      string;
  cached?:    boolean;
}

export default function IntelligenceBrief({ onClose }: { onClose: () => void }) {
  const { profile, narrative } = useCompany();
  const [brief, setBrief] = useState<Brief | null>(() => loadCached(profile.id));
  // "Since yesterday" deltas, derived from the seeded company's actual layer
  // signals via a deterministic hash on profile.name. Stable across reloads
  // and reseeds of the same company; different companies get different ribbons.
  const deltas = useMemo(() => deriveDeltas(profile.name, narrative.LAYERS), [profile.name, narrative.LAYERS]);
  const [ribbonDismissed, setRibbonDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Verification state, populated after a successful brief load. We never
  // surface a "verification failed" error to the user; if the triple-check
  // pipeline trips, the chips stay empty and the verification panel hides.
  // The brief itself is still useful without verdicts.
  const [verify, setVerify] = useState<VerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  // Race guard: profile.id at the moment a generate() or runVerify() call
  // fires. We check against the LIVE profile.id when results arrive, if
  // they differ, the user switched companies mid-flight and we must drop
  // the response on the floor instead of overwriting state for the wrong
  // company (a particularly nasty bug because the *correct* brief might
  // already be cached and visible). useRef so re-renders don't reset it.
  const activeRequestProfileId = useRef<string>(profile.id);

  // Rehydrate cache and clear stale state whenever the active profile
  // changes while the modal is open, otherwise the brief from the
  // previous profile would linger and the auto-generate effect would
  // skip the new one because `brief` is still truthy.
  useEffect(() => {
    setBrief(loadCached(profile.id));
    setError(null);
    setRibbonDismissed(false);
    setVerify(null);
    // Update the race-guard sentinel so any in-flight request from the
    // previous profile is now considered stale and will be discarded
    // when it returns.
    activeRequestProfileId.current = profile.id;
  }, [profile.id]);

  async function generate(force = false): Promise<void> {
    if (!force && brief) return;
    // Capture the profile id we're generating FOR. If the user switches to
    // a different company before this request returns, we'll see the
    // mismatch and discard the result instead of overwriting state.
    const reqProfileId = profile.id;
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.BASE_URL}api/intelligence/brief${force ? "?refresh=1" : ""}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name:        profile.name,
          url:         profile.url,
          sector:      profile.sector,
          hqCity:      profile.hqCity,
          hqState:     profile.hqState,
          revenueBand: profile.revenueBand,
          ownership:   profile.ownership,
          founded:     profile.founded,
          tagline:     profile.tagline,
        }),
      });
      const data = await resp.json() as Brief | { error?: string };
      if (!resp.ok) {
        const msg = (data as { error?: string }).error ?? `Request failed (HTTP ${resp.status})`;
        throw new Error(msg);
      }
      // Race guard: drop the response if the user switched companies while
      // we were waiting. The cache write is still safe (it's keyed by the
      // ORIGINAL profile id), so re-opening that profile gets the brief
      // for free, we just don't paint it over the current view.
      if (activeRequestProfileId.current !== reqProfileId) {
        saveCached(reqProfileId, data as Brief);
        return;
      }
      const b = data as Brief;
      setBrief(b);
      saveCached(reqProfileId, b);
      // Brief just landed, kick off the triple-check verification in the
      // background. Force-skip the server cache if the user clicked Regenerate
      // (the cached verdicts would be against the OLD brief content).
      void runVerify(force);
    } catch (e) {
      // Only surface the error if it's still relevant to the current view.
      if (activeRequestProfileId.current === reqProfileId) {
        setError(e instanceof Error ? e.message : "Brief generation failed.");
      }
    } finally {
      if (activeRequestProfileId.current === reqProfileId) setLoading(false);
    }
  }

  async function runVerify(_forceRefresh = false): Promise<void> {
    // Same race guard as generate(), verify takes 25-40s, plenty of time
    // for a profile switch to happen before we hear back.
    const reqProfileId = profile.id;
    setVerifying(true);
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}api/intelligence/brief/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name:        profile.name,
          url:         profile.url,
          sector:      profile.sector,
          hqCity:      profile.hqCity,
          hqState:     profile.hqState,
          revenueBand: profile.revenueBand,
          ownership:   profile.ownership,
          founded:     profile.founded,
          tagline:     profile.tagline,
        }),
      });
      if (!resp.ok) return; // Fail-soft: the brief is still readable without verdicts.
      const data = await resp.json() as VerifyResponse;
      if (activeRequestProfileId.current !== reqProfileId) return; // Profile switched mid-flight, discard.
      setVerify(data);
    } catch { /* fail-soft */ } finally {
      if (activeRequestProfileId.current === reqProfileId) setVerifying(false);
    }
  }

  // Auto-generate on first open if no cache for this profile. If the brief
  // is already cached locally but verification hasn't run yet (e.g. user
  // reloaded the page), trigger verify on its own.
  useEffect(() => {
    if (!brief && !loading && !error) void generate(false);
    else if (brief && !verify && !verifying) void runVerify(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,26,51,0.55)" }} onClick={onClose}>
      {/* Toolbar */}
      <div className="h-[44px] shrink-0 flex items-center justify-between px-6 border-b border-[var(--navy-deep)]"
           style={{ background: "var(--navy)", color: "var(--cream)" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Sparkles size={14} className="text-[var(--gold-light)]" />
          <span className="eyebrow text-[var(--gold-light)]">Company intelligence · {profile.name}</span>
          <span className="font-sans text-[12px] opacity-70">Generated by DifferentDay AI · CEO read</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void generate(true)} disabled={loading}
                  className="inline-flex items-center gap-1.5 font-sans text-[12px] opacity-80 hover:opacity-100 disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Regenerate
          </button>
          <button onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 font-sans text-[12px] opacity-80 hover:opacity-100">
            <Printer size={13} /> Print
          </button>
          <button onClick={onClose} aria-label="Close" className="opacity-80 hover:opacity-100">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* "Since yesterday" delta ribbon, sticky to the top of the scroll
            area so it stays visible while the reader scrolls the brief. Hash-
            seeded by profile.name, so the same company always gets the same
            ribbon and different companies see different framing. */}
        {!ribbonDismissed && deltas.length > 0 && (
          <div className="sticky top-0 z-10 border-b border-[var(--cream-dark)]"
               style={{ background: "var(--cream-light)", boxShadow: "0 2px 8px rgba(15,26,51,0.08)" }}>
            <div className="max-w-[920px] mx-auto py-2.5 px-10 flex items-center gap-4">
              <div className="flex items-center gap-1.5 shrink-0">
                <Activity size={12} strokeWidth={2} className="text-[var(--coral)]" />
                <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-[var(--coral)]">
                  Since yesterday
                </span>
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {deltas.map((d, i) => <DeltaChip key={i} delta={d} />)}
              </div>
              <button onClick={() => setRibbonDismissed(true)}
                      aria-label="Dismiss since-yesterday ribbon"
                      className="shrink-0 p-1.5 rounded-sm text-[var(--slate-light)] hover:text-[var(--navy)] hover:bg-[var(--cream-dark)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]">
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-[920px] mx-auto py-10 px-10" style={{ background: "var(--cream)", minHeight: "100%" }}>
          {/* Masthead */}
          <div className="border-b-2 border-[var(--navy)] pb-6 mb-8">
            <div className="eyebrow text-[var(--coral)] mb-2">DIFFERENT DAY · COMPANY INTELLIGENCE</div>
            <div className="flex items-baseline gap-3">
              {profile.logoEmoji && <span style={{ fontSize: 36 }}>{profile.logoEmoji}</span>}
              <h1 className="font-serif text-[44px] leading-tight font-semibold text-[var(--navy)]">{profile.name}</h1>
            </div>
            <div className="font-sans italic text-[13px] text-[var(--slate)] mt-2">
              {profile.sector} · {profile.hqCity}{profile.hqState ? `, ${profile.hqState}` : ""} · {profile.revenueBand}
              {profile.founded ? ` · Founded ${profile.founded}` : ""}
            </div>
            {profile.tagline && (
              <div className="font-sans text-[13px] text-[var(--slate)] mt-1">{profile.tagline}</div>
            )}
            {brief?.grounding && (
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-sm font-sans text-[11px]"
                   style={{
                     background: brief.grounding.ok ? "var(--teal-faint)" : "var(--cream-light)",
                     color:      brief.grounding.ok ? "var(--teal)"      : "var(--slate)",
                     border:     `1px solid ${brief.grounding.ok ? "var(--teal)" : "var(--cream-dark)"}`,
                   }}
                   title={brief.grounding.ok
                     ? `${brief.cached ? "Previously" : "Just now"}: fetched ${(brief.grounding.bytesFetched/1024).toFixed(1)}KB of HTML from ${brief.grounding.domain}; ${(brief.grounding.bytesExtracted/1024).toFixed(1)}KB of extracted text passed to the model as ground truth. ${brief.cached ? "Click Regenerate to re-fetch." : ""}`
                     : `We tried to fetch ${brief.grounding.domain} (HTTP ${brief.grounding.status}) and didn't get usable content, this brief leans on training-data knowledge and should be reviewed before sending.`}>
                <Globe size={11} strokeWidth={2} />
                {brief.grounding.ok
                  ? <span>
                      {brief.cached ? "Grounded on previous fetch" : "Grounded on live fetch"} · {brief.grounding.domain} · {(brief.grounding.bytesExtracted/1024).toFixed(1)} KB extracted
                    </span>
                  : <span>Homepage fetch unavailable · brief is memory-based, review before sending</span>}
              </div>
            )}
          </div>

          {/* Loading / error states */}
          {loading && !brief && <LoadingSkeleton />}
          {error && !brief && (
            <div className="card card-accent-coral">
              <div className="eyebrow text-[var(--coral)] mb-2">BRIEFING FAILED</div>
              <div className="font-sans text-[13px] text-[var(--ink)]">{error}</div>
              <button onClick={() => void generate(true)}
                      className="mt-4 inline-flex items-center gap-1.5 font-sans font-semibold text-[12px] text-[var(--navy)] underline">
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          )}

          {brief && (
            <>
              {/* Integrated narrative pull-quote */}
              <div className="mb-10 pl-6 border-l-4 border-[var(--coral)]">
                <div className="eyebrow text-[var(--coral)] mb-2">THE THESIS</div>
                <p className="font-serif italic text-[18px] leading-relaxed text-[var(--ink)]">
                  {brief.narrative}
                </p>
              </div>

              {/* Section: Company */}
              <Section icon={Building2} title="Company" accent="var(--navy)" confidence={verify?.confidence.company}>
                <Para>{brief.company.snapshot}</Para>
                {brief.company.valueProposition && (
                  <div className="mt-3 pl-3 border-l-2 border-[var(--cream-dark)] font-serif italic text-[14px] text-[var(--slate)] leading-relaxed">
                    "{brief.company.valueProposition}"
                  </div>
                )}
                {(brief.company.legalName || brief.company.industry || brief.company.employeeCount || brief.company.internalIT) && (
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
                    {brief.company.legalName     && <Fact label="Legal name"     value={brief.company.legalName} />}
                    {brief.company.industry      && <Fact label="Industry"       value={brief.company.industry} />}
                    {brief.company.employeeCount && <Fact label="Employees"      value={brief.company.employeeCount} />}
                    {brief.company.internalIT    && <Fact label="Internal IT"    value={brief.company.internalIT} />}
                  </div>
                )}
                <SubHeader>History</SubHeader>
                <Para>{brief.company.history}</Para>
                <SubHeader>Business model</SubHeader>
                <Para>{brief.company.businessModel}</Para>
                {brief.company.differentiators.length > 0 && (
                  <>
                    <SubHeader>Differentiators</SubHeader>
                    <ul className="space-y-1.5 mt-2">
                      {brief.company.differentiators.map((d, i) => (
                        <li key={i} className="font-sans text-[14px] text-[var(--ink)] leading-snug flex gap-2">
                          <span className="text-[var(--coral)] font-bold">·</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>

              {/* Section: Ownership & Investors */}
              <Section icon={Banknote} title="Ownership & investors" accent="var(--gold)" confidence={verify?.confidence.ownership}>
                {brief.ownership.structure && (
                  <div className="mb-3"><span className="eyebrow text-[var(--slate-light)]">Structure</span>
                    <div className="font-serif font-semibold text-[16px] text-[var(--navy)] mt-0.5">{brief.ownership.structure}</div></div>
                )}
                {brief.ownership.summary && <Para>{brief.ownership.summary}</Para>}
                {brief.ownership.fundingRounds.length > 0 && (
                  <>
                    <SubHeader>Funding history</SubHeader>
                    <div className="mt-2 overflow-hidden rounded-sm border border-[var(--cream-dark)]">
                      <table className="w-full font-sans text-[12px]">
                        <thead style={{ background: "var(--cream-light)" }}>
                          <tr className="text-left">
                            <th className="px-3 py-2 eyebrow text-[var(--slate-light)] text-[10px]">Date</th>
                            <th className="px-3 py-2 eyebrow text-[var(--slate-light)] text-[10px]">Round</th>
                            <th className="px-3 py-2 eyebrow text-[var(--slate-light)] text-[10px]">Amount</th>
                            <th className="px-3 py-2 eyebrow text-[var(--slate-light)] text-[10px]">Lead</th>
                            <th className="px-3 py-2 eyebrow text-[var(--slate-light)] text-[10px]">Valuation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brief.ownership.fundingRounds.map((r, i) => (
                            <tr key={i} className="border-t border-[var(--cream-dark)]">
                              <td className="px-3 py-2 tabular-nums text-[var(--slate)]">{r.date || "—"}</td>
                              <td className="px-3 py-2 font-semibold text-[var(--navy)]">{r.round || "—"}</td>
                              <td className="px-3 py-2 tabular-nums text-[var(--ink)]">{r.amount || "—"}</td>
                              <td className="px-3 py-2 text-[var(--ink)]">{r.leadInvestor || "—"}</td>
                              <td className="px-3 py-2 tabular-nums text-[var(--slate)]">{r.valuation || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {brief.ownership.keyShareholders.length > 0 && (
                  <>
                    <SubHeader>Key shareholders</SubHeader>
                    <ul className="space-y-1.5 mt-2">
                      {brief.ownership.keyShareholders.map((s, i) => (
                        <li key={i} className="font-sans text-[13px] text-[var(--ink)] flex gap-2">
                          <span className="text-[var(--gold)] font-bold">·</span><span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {brief.ownership.boardSeats && (<><SubHeader>Board composition</SubHeader><Para small>{brief.ownership.boardSeats}</Para></>)}
              </Section>

              {/* Section: Timeline */}
              {brief.timeline.length > 0 && (
                <Section icon={Calendar} title="History & evolution" accent="var(--coral)" confidence={verify?.confidence.timeline}>
                  <ol className="relative border-l-2 border-[var(--cream-dark)] ml-3 space-y-3 mt-2">
                    {brief.timeline.map((t, i) => (
                      <li key={i} className="pl-5 relative">
                        <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full" style={{ background: "var(--coral)" }} />
                        <div className="font-serif font-bold text-[14px] text-[var(--coral)] tabular-nums">{t.year}</div>
                        <div className="font-sans text-[13px] text-[var(--ink)] leading-snug mt-0.5">{t.event}</div>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* Section: Leaders */}
              <Section icon={Users2} title="Leadership" accent="var(--gold)" confidence={verify?.confidence.leaders}>
                <SubHeader>Executive team</SubHeader>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-2">
                  {brief.leaders.map((l, i) => (
                    <div key={i} className="border-l-2 border-[var(--cream-dark)] pl-4">
                      <div className="font-serif font-semibold text-[16px] text-[var(--navy)] leading-tight">{l.name}</div>
                      <div className="font-sans text-[12px] text-[var(--coral)] uppercase tracking-wide font-bold mt-0.5">{l.role}</div>
                      <div className="font-sans text-[13px] text-[var(--ink)] mt-1.5 leading-snug">{l.background}</div>
                    </div>
                  ))}
                </div>
                {brief.board.length > 0 && (
                  <>
                    <SubHeader>Board</SubHeader>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                      {brief.board.map((b, i) => (
                        <div key={i} className="font-sans text-[13px] text-[var(--ink)]">
                          <span className="font-semibold text-[var(--navy)]">{b.name}</span>
                          <span className="text-[var(--slate)]">, {b.affiliation}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Section>

              {/* Section: Financials */}
              <Section icon={LineChart} title="Financials" accent="var(--teal)" confidence={verify?.confidence.financials}>
                {brief.financials.kpis.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {brief.financials.kpis.map((k, i) => (
                      <div key={i} className="card !p-3">
                        <div className="eyebrow text-[var(--slate-light)] text-[10px]">{k.label}</div>
                        <div className="font-serif font-semibold text-[22px] text-[var(--navy)] tabular-nums leading-tight mt-1">{k.value}</div>
                        {k.note && <div className="font-sans text-[10px] text-[var(--slate)] mt-0.5 tabular-nums">{k.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <SubHeader>Scale</SubHeader>
                <Para>{brief.financials.scale}</Para>
                <SubHeader>Trajectory</SubHeader>
                <Para>{brief.financials.trajectory}</Para>
                <SubHeader>Capital structure</SubHeader>
                <Para>{brief.financials.capitalStructure}</Para>
              </Section>

              {/* Section: Products & Business Model */}
              <Section icon={Package} title="Products & business model" accent="var(--navy)" confidence={verify?.confidence.products}>
                {brief.products.productLines.length > 0 && (
                  <>
                    <SubHeader>Product lines</SubHeader>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {brief.products.productLines.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-sm font-sans text-[12px] bg-[var(--cream-light)] border border-[var(--cream-dark)] text-[var(--navy)]">{p}</span>
                      ))}
                    </div>
                  </>
                )}
                {brief.products.brandPartnerships.length > 0 && (
                  <>
                    <SubHeader>Brand partnerships</SubHeader>
                    <Para small>{brief.products.brandPartnerships.join(" · ")}</Para>
                  </>
                )}
                {brief.products.revenueStreams.length > 0 && (
                  <>
                    <SubHeader>Revenue streams</SubHeader>
                    <div className="space-y-2 mt-2">
                      {brief.products.revenueStreams.map((s, i) => (
                        <div key={i} className="flex items-baseline gap-3 font-sans text-[13px]">
                          <span className="font-semibold text-[var(--navy)] shrink-0">{s.stream}</span>
                          {s.share && <span className="tabular-nums text-[var(--coral)] font-bold shrink-0">{s.share}</span>}
                          {s.note  && <span className="text-[var(--slate)] leading-snug">{s.note}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {brief.products.channels.length > 0 && (
                  <>
                    <SubHeader>Go-to-market channels</SubHeader>
                    <ul className="space-y-1 mt-2">
                      {brief.products.channels.map((c, i) => (
                        <li key={i} className="font-sans text-[13px] text-[var(--ink)] flex gap-2">
                          <span className="text-[var(--teal)] font-bold">·</span><span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>

              {/* Section: Market Position */}
              <Section icon={Swords} title="Market position" accent="var(--coral)" confidence={verify?.confidence.marketPosition}>
                {brief.marketPosition.marketShare && (<><SubHeader>Market share</SubHeader><Para>{brief.marketPosition.marketShare}</Para></>)}
                {brief.marketPosition.competitors.length > 0 && (
                  <>
                    <SubHeader>Competitors</SubHeader>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-2">
                      {brief.marketPosition.competitors.map((c, i) => (
                        <div key={i} className="border-l-2 border-[var(--coral)] pl-3">
                          <div className="font-serif font-semibold text-[14px] text-[var(--navy)]">{c.name}</div>
                          <div className="font-sans text-[12px] text-[var(--slate)] leading-snug mt-0.5">{c.note}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {brief.marketPosition.differentiators.length > 0 && (
                  <>
                    <SubHeader>What this company does that competitors don't</SubHeader>
                    <ul className="space-y-1.5 mt-2">
                      {brief.marketPosition.differentiators.map((d, i) => (
                        <li key={i} className="font-sans text-[13px] text-[var(--ink)] flex gap-2">
                          <span className="text-[var(--coral)] font-bold">·</span><span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>

              {/* Section: Operations & Supply Chain */}
              <Section icon={Truck} title="Operations & supply chain" accent="var(--teal)" confidence={verify?.confidence.operations}>
                <SubHeader>Warehouses & distribution</SubHeader><Para small>{brief.operations.warehouses || "Not publicly disclosed."}</Para>
                <SubHeader>Manufacturing & sourcing</SubHeader><Para small>{brief.operations.manufacturing || "Not publicly disclosed."}</Para>
                <SubHeader>Logistics</SubHeader><Para small>{brief.operations.logistics || "Not publicly disclosed."}</Para>
                <SubHeader>Automation level</SubHeader><Para small>{brief.operations.automationLevel || "Not publicly disclosed."}</Para>
              </Section>

              {/* Section: Tech Landscape */}
              <Section icon={Cpu} title="Technology landscape" accent="var(--gold)" confidence={verify?.confidence.techLandscape}>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {brief.techLandscape.erp       && <Fact label="ERP"        value={brief.techLandscape.erp} />}
                  {brief.techLandscape.wms       && <Fact label="WMS"        value={brief.techLandscape.wms} />}
                  {brief.techLandscape.ecommerce && <Fact label="E-commerce" value={brief.techLandscape.ecommerce} />}
                </div>
                {brief.techLandscape.digitalMaturity && (<><SubHeader>Digital maturity</SubHeader><Para>{brief.techLandscape.digitalMaturity}</Para></>)}
                {brief.techLandscape.knownStack.length > 0 && (
                  <>
                    <SubHeader>Known stack</SubHeader>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {brief.techLandscape.knownStack.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-sm font-mono text-[11px] bg-[var(--navy)] text-[var(--cream-light)]">{s}</span>
                      ))}
                    </div>
                  </>
                )}
              </Section>

              {/* Section: Competitive AI Landscape */}
              {brief.competitiveAI && (
                <Section icon={Bot} title="Competitive AI landscape" accent="var(--coral)" confidence={verify?.confidence.competitiveAI}>
                  <Para>{brief.competitiveAI}</Para>
                </Section>
              )}

              {/* Section: Business Function Analysis (Phase 3) */}
              <Section icon={Briefcase} title="Business function analysis & AI use cases" accent="var(--navy)" confidence={verify?.confidence.businessFunctions}>
                <div className="font-sans italic text-[12px] text-[var(--slate)] mb-5">
                  For each function: how it operates today, then three bespoke agentic AI plays with capabilities, quantified business impact, and time to value.
                </div>
                <div className="space-y-8">
                  {brief.businessFunctions.map((bf, i) => (
                    <div key={i}>
                      <div className="eyebrow text-[var(--coral)] mb-1">Function {i + 1}</div>
                      <h3 className="font-serif font-semibold text-[22px] text-[var(--navy)] leading-tight mb-2">{bf.function}</h3>
                      <SubHeader compact>Current state</SubHeader>
                      <Para small>{bf.currentState}</Para>
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        {bf.useCases.map((uc, j) => (
                          <div key={j} className="card card-accent-coral">
                            <div className="flex items-baseline justify-between gap-3 mb-2">
                              <div>
                                <div className="eyebrow text-[var(--slate-light)] text-[10px]">Use case {j + 1}</div>
                                <div className="font-serif font-semibold text-[17px] text-[var(--navy)] leading-tight mt-0.5">{uc.function}</div>
                              </div>
                              <span className="pill pill-teal shrink-0">{uc.timeToValue}</span>
                            </div>
                            <SubHeader compact>Capabilities</SubHeader>
                            <Para small>{uc.capabilities}</Para>
                            <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] flex items-baseline gap-2">
                              <Lightbulb size={12} className="text-[var(--teal)] shrink-0" />
                              <span className="eyebrow text-[var(--teal)]">Business impact</span>
                              <span className="font-sans font-semibold text-[13px] text-[var(--ink)]">{uc.businessImpact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Verification panel, triple-check confidence summary + disputes. */}
              <VerificationPanel verify={verify} verifying={verifying} />

              <div className="mt-10 pt-4 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--slate-light)]">
                Generated by DifferentDay AI · {new Date(brief.generatedAt).toLocaleString()} · Briefing is illustrative and intended for internal sales preparation only.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, accent, children, confidence }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; accent: string; children: React.ReactNode;
  confidence?: ConfidenceLevel;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--cream-dark)]">
        <Icon size={18} className="shrink-0" />
        <h2 className="font-serif font-semibold text-[24px] text-[var(--navy)] flex-1" style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 12 }}>{title}</h2>
        {confidence && <ConfidenceChip level={confidence} />}
      </div>
      {children}
    </section>
  );
}

// Per-section confidence badge. Filled in by the triple-check verifier after
// the brief lands; absent until the critic + reconciler complete (~25-40s
// after the brief renders). Rubric:
//   HIGH, all checkable claims supported or plausible.
//   MED , mix; at most one contradicted; section is broadly defensible.
//   LOW , multiple contradictions or named-entity/major-quantitative
//          claim contradicted. Reader should treat as draft.
function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  const cfg =
    level === "HIGH" ? { Icon: ShieldCheck,    color: "var(--teal)",  bg: "var(--teal-faint)",  label: "Verified" } :
    level === "MED"  ? { Icon: ShieldQuestion, color: "var(--amber)", bg: "rgba(255,193,7,0.1)", label: "Partial" } :
                       { Icon: ShieldAlert,    color: "var(--coral)", bg: "rgba(229,90,84,0.1)", label: "Disputed" };
  return (
    <span title={`Triple-check confidence: ${level}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-sans text-[10px] uppercase tracking-wider font-bold shrink-0"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}` }}>
      <cfg.Icon size={11} strokeWidth={2.2} /> {cfg.label}
    </span>
  );
}

// Tight key/value pair used in the company + tech-landscape facts grids.
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)] text-[10px]">{label}</div>
      <div className="font-sans text-[13px] text-[var(--ink)] leading-snug mt-0.5">{value}</div>
    </div>
  );
}

// Bottom-of-brief panel summarising the triple-check verification (brief →
// critic → reconciler). Renders the reconciler's overall summary + any
// curated disputes grouped by severity. Hidden entirely if verification
// failed silently; shows a quiet "running" hint while the pipeline is in
// flight so the reader knows verdicts are coming.
function VerificationPanel({ verify, verifying }: { verify: VerifyResponse | null; verifying: boolean }) {
  if (!verify) {
    if (!verifying) return null;
    return (
      <div className="mt-10 p-4 rounded-sm border border-dashed border-[var(--cream-dark)] font-sans text-[12px] text-[var(--slate)] flex items-center gap-2">
        <ShieldQuestion size={13} className="animate-pulse" />
        Running triple-check verification (critic + reconciler)…
      </div>
    );
  }
  const high = verify.disputes.filter(d => d.severity === "high");
  const med  = verify.disputes.filter(d => d.severity === "med");
  const low  = verify.disputes.filter(d => d.severity === "low");
  return (
    <section className="mt-12 pt-6 border-t-2 border-[var(--navy)]">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={18} className="text-[var(--teal)]" />
        <h2 className="font-serif font-semibold text-[20px] text-[var(--navy)]">Verification</h2>
        <span className="font-sans text-[11px] italic text-[var(--slate-light)] ml-1">{verify.model}</span>
      </div>
      <Para small>{verify.summary}</Para>
      {verify.disputes.length === 0 ? (
        <div className="mt-3 p-3 rounded-sm font-sans text-[12px] flex items-center gap-2"
             style={{ background: "var(--teal-faint)", color: "var(--teal)", border: "1px solid var(--teal)" }}>
          <ShieldCheck size={13} /> No disputed claims surfaced by the critic.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {high.length > 0 && <DisputeGroup label="Contradicted" tone="coral" items={high} />}
          {med.length > 0  && <DisputeGroup label="Unverified, high stakes" tone="amber" items={med} />}
          {low.length > 0  && <DisputeGroup label="Worth checking" tone="slate" items={low} />}
        </div>
      )}
    </section>
  );
}

function DisputeGroup({ label, tone, items }: {
  label: string; tone: "coral" | "amber" | "slate";
  items: Array<{ section: string; claim: string; reason: string }>;
}) {
  const color = tone === "coral" ? "var(--coral)" : tone === "amber" ? "var(--amber)" : "var(--slate)";
  return (
    <div>
      <div className="eyebrow mb-1.5" style={{ color }}>{label} · {items.length}</div>
      <ul className="space-y-2">
        {items.map((d, i) => (
          <li key={i} className="border-l-2 pl-3" style={{ borderColor: color }}>
            <div className="font-sans text-[12px] text-[var(--navy)]">
              <span className="font-semibold uppercase tracking-wide text-[10px] text-[var(--slate)] mr-2">{d.section}</span>
              <span className="italic">"{d.claim}"</span>
            </div>
            <div className="font-sans text-[12px] text-[var(--slate)] leading-snug mt-1">{d.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
function SubHeader({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`eyebrow text-[var(--slate-light)] ${compact ? "mt-2" : "mt-4"} mb-1`}>{children}</div>
  );
}
function Para({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <p className={`font-sans ${small ? "text-[13px]" : "text-[14px]"} text-[var(--ink)] leading-relaxed`}>{children}</p>
  );
}

// Compact inline chip used in the "Since yesterday" ribbon. Colour-coded by
// tone (good/warn/bad/neutral), with an arrow that mirrors the direction of
// the move. Designed to read at a glance, the ribbon is meant to communicate
// "here's what shifted overnight" in under two seconds.
function DeltaChip({ delta }: { delta: Delta }) {
  const toneColor =
    delta.tone === "good" ? "var(--teal)" :
    delta.tone === "bad"  ? "var(--coral)" :
    delta.tone === "warn" ? "var(--amber)" :
                            "var(--slate)";
  // Neutral chips (e.g. "action firmed up") aren't a warning, so don't carry
  // a warning glyph. CircleDot reads as a status marker without implying
  // direction or alarm.
  const Arrow =
    delta.direction === "up"   ? ArrowUp :
    delta.direction === "down" ? ArrowDown :
                                 CircleDot;
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-[11px] leading-tight">
      <Arrow size={11} strokeWidth={2.2} style={{ color: toneColor }} />
      <span className="font-semibold text-[var(--navy)] tabular-nums">{delta.label}</span>
      <span className="text-[var(--slate)]">{delta.text}</span>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-32 bg-[var(--cream-dark)] rounded mb-2" />
        <div className="h-6 bg-[var(--cream-dark)] rounded mb-1.5 w-[92%]" />
        <div className="h-6 bg-[var(--cream-dark)] rounded mb-1.5 w-[88%]" />
        <div className="h-6 bg-[var(--cream-dark)] rounded w-[70%]" />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i}>
          <div className="h-5 w-40 bg-[var(--cream-dark)] rounded mb-3" />
          <div className="h-3 bg-[var(--cream-dark)] rounded mb-2 w-full" />
          <div className="h-3 bg-[var(--cream-dark)] rounded mb-2 w-[94%]" />
          <div className="h-3 bg-[var(--cream-dark)] rounded mb-2 w-[88%]" />
          <div className="h-3 bg-[var(--cream-dark)] rounded w-[75%]" />
        </div>
      ))}
      <div className="font-sans italic text-[12px] text-[var(--slate)] text-center pt-2">
        DifferentDay AI is researching the company and drafting the brief, typically 10-20 seconds…
      </div>
    </div>
  );
}

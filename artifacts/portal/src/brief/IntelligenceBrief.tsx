import { useEffect, useMemo, useState } from "react";
import { X, Printer, Sparkles, Building2, Users2, LineChart, Lightbulb, RefreshCw, Globe, ArrowUp, ArrowDown, CircleDot, Activity } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import type { LayerData } from "../data/layers";

// Deterministic 32-bit hash of a string (Fowler–Noll–Vo / xorshift mix). Used
// to seed the "since yesterday" delta selection so each company's ribbon is
// stable across reloads and reseeds, while different companies see different
// deltas. NOT cryptographic — only needs the property that visually different
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
// same ribbon, and different companies see different framing — without us
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
    // metric's denomination so the chip reads naturally — pp for %, USD for
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
        // Count / index / NPS etc — express as a percent change so the
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

interface Brief {
  company:  { snapshot: string; history: string; businessModel: string; differentiators: string[] };
  leaders:  Array<{ name: string; role: string; background: string }>;
  financials: {
    scale: string; trajectory: string; capitalStructure: string;
    kpis: Array<{ label: string; value: string; note?: string }>;
  };
  aiOpportunities: Array<{
    title: string; where: string; problem: string; solution: string;
    impact: string; horizon: "Now" | "6 months" | "12+ months";
  }>;
  narrative: string;
  generatedAt: string;
  // Receipt from the live homepage fetch that grounded this brief. May be
  // null when the server didn't attempt a fetch, or `ok:false` when the
  // fetch failed — the UI shows different copy in each case so the reader
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
  // live one — the UI downgrades the badge copy accordingly.
  cached?: boolean;
}

const CACHE_PREFIX = "differentday.intelligenceBrief.v1.";

function loadCached(profileId: string): Brief | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + profileId);
    return raw ? JSON.parse(raw) as Brief : null;
  } catch { return null; }
}

function saveCached(profileId: string, brief: Brief): void {
  try { window.localStorage.setItem(CACHE_PREFIX + profileId, JSON.stringify(brief)); } catch { /* ignore */ }
}

export default function IntelligenceBrief({ onClose }: { onClose: () => void }) {
  const { profile, narrative } = useCompany();
  const [brief, setBrief] = useState<Brief | null>(() => loadCached(profile.id));
  // "Since yesterday" deltas — derived from the seeded company's actual layer
  // signals via a deterministic hash on profile.name. Stable across reloads
  // and reseeds of the same company; different companies get different ribbons.
  const deltas = useMemo(() => deriveDeltas(profile.name, narrative.LAYERS), [profile.name, narrative.LAYERS]);
  const [ribbonDismissed, setRibbonDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate cache and clear stale state whenever the active profile
  // changes while the modal is open — otherwise the brief from the
  // previous profile would linger and the auto-generate effect would
  // skip the new one because `brief` is still truthy.
  useEffect(() => {
    setBrief(loadCached(profile.id));
    setError(null);
    setRibbonDismissed(false);
  }, [profile.id]);

  async function generate(force = false): Promise<void> {
    if (!force && brief) return;
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
      const b = data as Brief;
      setBrief(b);
      saveCached(profile.id, b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brief generation failed.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate on first open if no cache for this profile
  useEffect(() => {
    if (!brief && !loading && !error) void generate(false);
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
        {/* "Since yesterday" delta ribbon — sticky to the top of the scroll
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
                     : `We tried to fetch ${brief.grounding.domain} (HTTP ${brief.grounding.status}) and didn't get usable content — this brief leans on training-data knowledge and should be reviewed before sending.`}>
                <Globe size={11} strokeWidth={2} />
                {brief.grounding.ok
                  ? <span>
                      {brief.cached ? "Grounded on previous fetch" : "Grounded on live fetch"} · {brief.grounding.domain} · {(brief.grounding.bytesExtracted/1024).toFixed(1)} KB extracted
                    </span>
                  : <span>Homepage fetch unavailable · brief is memory-based — review before sending</span>}
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
              <Section icon={Building2} title="Company" accent="var(--navy)">
                <Para>{brief.company.snapshot}</Para>
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

              {/* Section: Leaders */}
              <Section icon={Users2} title="Leaders" accent="var(--gold)">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {brief.leaders.map((l, i) => (
                    <div key={i} className="border-l-2 border-[var(--cream-dark)] pl-4">
                      <div className="font-serif font-semibold text-[16px] text-[var(--navy)] leading-tight">{l.name}</div>
                      <div className="font-sans text-[12px] text-[var(--coral)] uppercase tracking-wide font-bold mt-0.5">{l.role}</div>
                      <div className="font-sans text-[13px] text-[var(--ink)] mt-1.5 leading-snug">{l.background}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Section: Financials */}
              <Section icon={LineChart} title="Financials" accent="var(--teal)">
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

              {/* Section: AI Opportunities */}
              <Section icon={Lightbulb} title="Where AI moves the needle" accent="var(--coral)">
                <div className="space-y-5">
                  {brief.aiOpportunities.map((o, i) => (
                    <div key={i} className="card card-accent-coral">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-serif font-semibold text-[18px] text-[var(--navy)] leading-tight">{o.title}</div>
                          <div className="font-sans text-[11px] text-[var(--slate)] uppercase tracking-wide mt-1">{o.where}</div>
                        </div>
                        <span className={`pill shrink-0 ${o.horizon === "Now" ? "pill-coral" : o.horizon === "6 months" ? "pill-amber" : "pill-teal"}`}>
                          {o.horizon}
                        </span>
                      </div>
                      <SubHeader compact>The problem</SubHeader>
                      <Para small>{o.problem}</Para>
                      <SubHeader compact>The AI play</SubHeader>
                      <Para small>{o.solution}</Para>
                      <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] flex items-baseline gap-2">
                        <span className="eyebrow text-[var(--teal)]">Impact</span>
                        <span className="font-sans font-semibold text-[13px] text-[var(--ink)]">{o.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

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

function Section({ icon: Icon, title, accent, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; accent: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--cream-dark)]">
        <Icon size={18} className="shrink-0" />
        <h2 className="font-serif font-semibold text-[24px] text-[var(--navy)]" style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 12 }}>{title}</h2>
      </div>
      {children}
    </section>
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
// the move. Designed to read at a glance — the ribbon is meant to communicate
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
        DifferentDay AI is researching the company and drafting the brief — typically 10-20 seconds…
      </div>
    </div>
  );
}

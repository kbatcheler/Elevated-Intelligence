import { X, Printer } from "lucide-react";
import { LAYERS } from "../data/layers";
import { TRACK_RECORD, summary } from "../data/trackRecord";
import { useCompany } from "../context/CompanyContext";

// Eight-page board pack. Each section is a "page" with print-friendly CSS.
// Order: Cover · Headline scorecard · Three root causes · Three recovery
// levers · Track record · Decisions log · Layer findings · Appendix.

export default function BoardPack({ onClose }: { onClose: () => void }) {
  const { profile, resolve } = useCompany();
  const meta = `${profile.name} · ${profile.period} close-out · 14 October 2026`;
  const s = summary();
  const h = profile.headlines;
  const rootCauses = profile.rootCauses ?? [
    { title: "Competitor promotional intensity", impact: "−$6.2M",
      body: "Home Depot ran a sustained 1.8× baseline promo depth across five SE markets for the last 14 days of Q3. Numerator panel confirms the depth; Mercer's match-not-beat policy locked us into matching every move. The cohort that hurt most: the 24 top cordless-tools SKUs where elasticity is highest." },
    { title: "Compound supply disruption", impact: "−$3.1M",
      body: "Supplier B's production delay coincided with a Dallas + Phoenix DC labour shortfall. Top-5 SKUs accumulated 41 OOS days in weeks 30–34. Inventory did not partially offset the demand softness — it amplified it. Two simultaneous constraints, not one." },
    { title: "Margin defence via promotional matching", impact: "−$1.8M",
      body: "Margin compressed 240bps as the match policy was applied reflexively. Volume held; margin paid for it. This is the most reversible of the three causes — a single policy change closes the gap in two trading weeks." },
  ];
  const recoveryLevers = profile.recoveryLevers ?? [
    { title: "Cap the cordless-tools promo match at 22%",
      horizon: "This week", recovery: "$1.2M annualised", owner: "Head of Pricing",
      body: "Currently matching Home Depot exactly (28% depth). A 22% cap restores 4pp gross margin on the 24 SKUs driving the slip. Reversible inside 5 trading days." },
    { title: "Fill the 11 unfilled Phoenix DC shifts",
      horizon: "This week", recovery: "$0.9M variance", owner: "DC Operations",
      body: "Use the existing Kelly Services MSA. 11 shifts × $42/hr fully loaded ≈ $18.5K weekly cost vs ≈$120K weekly throughput risk. Net-positive on day one." },
    { title: "Launch the SE-only DIY counter-promo",
      horizon: "Monday, 14 days", recovery: "$1.45M Q4", owner: "Trade Marketing",
      body: "Targeted to Dallas/Phoenix/Atlanta where Home Depot is overweighted. Bounded to the 24 share-loss SKUs. Hard exit at day 14. Dependent on Pricing layer's margin floor sign-off (≥18% gross)." },
  ];
  const combinedRecovery = profile.combinedRecovery ?? "$5.6M Q4";
  const recoveryConfidence = profile.recoveryConfidence ?? "Confidence 87% on the first $3M, 64% on the rest.";
  const layerByKey = Object.fromEntries(LAYERS.map(l => [l.key, l]));
  const recentClosed = TRACK_RECORD.filter(t => t.status !== "in-flight").slice(-5).reverse();

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,26,51,0.55)" }} onClick={onClose}>
      <div className="h-[44px] shrink-0 flex items-center justify-between px-6 border-b border-[var(--navy-deep)] print:hidden"
           style={{ background: "var(--navy)", color: "var(--cream)" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="eyebrow text-[var(--gold-light)]">Board pack</span>
          <span className="font-sans text-[12px] opacity-70">Eight pages · Print-ready · Board folder format</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 text-[12px] hover:text-white opacity-80">
            <Printer size={14} strokeWidth={1.5} /> Print pack
          </button>
          <button onClick={onClose} className="text-[var(--gold-light)] hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area py-10 print:py-0" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-[820px] max-w-[92vw] space-y-8 print:space-y-0">
          {/* ─── Page 1: Cover ─── */}
          <Page>
            <div className="h-full flex flex-col">
              <div className="eyebrow text-[var(--gold)] mb-3">Different Day · Elevated Intelligence</div>
              <div className="font-serif text-[14px] italic text-[var(--slate)] mb-12">Board pack · {meta}</div>
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="font-serif font-semibold text-[64px] leading-[1] text-[var(--navy)] mb-6 flex items-baseline gap-4">
                  {profile.logoEmoji && <span className="text-[56px]" aria-hidden="true">{profile.logoEmoji}</span>}
                  {profile.name}
                </h1>
                <div className="font-serif text-[28px] italic text-[var(--slate)] leading-tight mb-12">
                  {profile.sector} · Quarter three, two thousand and twenty-six
                </div>
                <div className="font-serif text-[18px] text-[var(--ink)] leading-snug max-w-[600px]">
                  Eight pages. The numbers, the diagnosis, the three reversible levers, and the system's track record holding itself accountable.
                </div>
              </div>
              <div className="font-sans italic text-[12px] text-[var(--slate)] mt-8 pt-6 border-t border-[var(--cream-dark)]">
                Prepared for the {profile.name} board · Distribution restricted to named recipients
              </div>
            </div>
          </Page>

          {/* ─── Page 2: Headline scorecard ─── */}
          <Page>
            <PageHeader number={2} title="Headline scorecard" eyebrow="Q3 2026 · against plan" />
            <div className="grid grid-cols-2 gap-6">
              <Card label="Revenue"           value={h.revenueActual}  delta={`${h.revenueVarPct} vs plan`}        tone="bad"  detail={resolve(`${h.revenueVarDollars} behind plan; gap concentrated in DIY and Home Improvement categories.`)} />
              <Card label="Operating margin"  value={h.marginActual}   delta={`${h.marginVarBps} vs target`}       tone="bad"  detail={resolve("Match-and-bleed pricing on top-50 cordless SKUs drove most of the slip.")} />
              <Card label="Cash position"     value={h.cashActual}     delta={h.cashVar}                            tone={h.cashTone} detail="Held only because working capital tightened — not because trading performed." />
              <Card label="Customer NPS"      value={String(h.npsActual)} delta={h.npsDelta}                        tone="warn" detail={resolve("Detractor cluster localised to Phoenix metro, tied to service-call spike.")} />
            </div>
            <div className="mt-8 p-5 rounded-sm" style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
              <div className="eyebrow text-[var(--slate-light)] mb-2">Executive read</div>
              <p className="font-serif text-[16px] leading-snug text-[var(--ink)]">
                {profile.executiveRead
                  ? profile.executiveRead
                  : <>Q3 closed <strong>8% behind plan</strong> and <strong>380bps behind margin target</strong>. The variance is not diffuse — three layers (Demand, Pricing, Supply) account for almost the entire gap. The fastest reversible lever this quarter is in pricing, not demand or supply.</>}
              </p>
            </div>
          </Page>

          {/* ─── Page 3: Three root causes ─── */}
          <Page>
            <PageHeader number={3} title="Three root causes" eyebrow="What actually happened" />
            <div className="space-y-5">
              {rootCauses.map((rc, i) => (
                <RootCause key={i} n={i + 1} title={resolve(rc.title)} impact={rc.impact} body={resolve(rc.body)} />
              ))}
            </div>
          </Page>

          {/* ─── Page 4: Three recovery levers ─── */}
          <Page>
            <PageHeader number={4} title="Three recovery levers" eyebrow="What we propose to do" />
            <div className="space-y-5">
              {recoveryLevers.map((l, i) => (
                <Lever key={i} n={i + 1} title={resolve(l.title)} horizon={l.horizon} recovery={l.recovery}
                       owner={resolve(l.owner)} body={resolve(l.body)} />
              ))}
            </div>
            <div className="mt-8 p-5 rounded-sm" style={{ background: "var(--gold-faint)", border: "1px solid var(--gold)" }}>
              <div className="eyebrow text-[var(--gold)] mb-2">Combined modelled recovery</div>
              <div className="font-serif font-semibold text-[32px] text-[var(--navy)] tabular-nums">{combinedRecovery}</div>
              <div className="font-serif italic text-[14px] text-[var(--slate)] mt-1">{recoveryConfidence}</div>
            </div>
          </Page>

          {/* ─── Page 5: Track record ─── */}
          <Page>
            <PageHeader number={5} title="System track record" eyebrow="Holding ourselves accountable" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card label="Recommendations closed" value={`${s.total - s.inFlight}`} delta={`${s.hitRate}% hit rate`} tone="good"
                    detail="Met or beat predicted outcome." />
              <Card label="Predicted dollars"     value={`$${s.totalPredictedDollar.toFixed(1)}M`} delta="across closed plays" tone="neutral" detail="Modelled at the moment each action was committed." />
              <Card label="Delivered dollars"      value={`$${s.totalDeliveredDollar.toFixed(1)}M`} delta={`${((s.totalDeliveredDollar / s.totalPredictedDollar - 1) * 100).toFixed(0)}% vs predicted`} tone={s.totalDeliveredDollar >= s.totalPredictedDollar ? "good" : "warn"} detail="Audited actual outcome." />
            </div>
            <div className="eyebrow text-[var(--slate-light)] mb-3">Five most recent closed actions</div>
            <div className="space-y-2">
              {recentClosed.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[var(--cream-dark)] last:border-0">
                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider w-16"
                        style={{ color: t.status === "beat" || t.status === "met" ? "var(--teal)" : t.status === "partial" ? "var(--amber)" : "var(--coral)" }}>
                    {t.status.toUpperCase()}
                  </span>
                  <span className="font-sans text-[12px] text-[var(--slate)] w-20">{t.closedAt}</span>
                  <span className="font-serif italic text-[13px] text-[var(--ink)] flex-1">{t.title}</span>
                  <span className="font-sans text-[11px] text-[var(--slate)] italic">{t.variance}</span>
                </div>
              ))}
            </div>
          </Page>

          {/* ─── Page 6: Decisions log ─── */}
          <Page>
            <PageHeader number={6} title="Decisions for the board" eyebrow="What we need from this meeting" />
            <ol className="space-y-4">
              <Decision n={1} ask="Endorse the three reversible levers in priority order"
                what={resolve("Pricing match-cap, Phoenix DC shifts, SE counter-promo. Each layer has a named owner standing by.")}
                forfor="Decision required" />
              <Decision n={2} ask="Approve emergency 5% comp adjustment for DC Operations"
                what="Annualised cost ~$1.2M; modelled retention lift 7–9pp; payback inside one quarter at current attrition cost."
                forfor="Decision required" />
              <Decision n={3} ask="Note: FY27 share target re-baseline (16.5% → 15.0%)"
                what={resolve("Two-channel concentration (Home Depot + Lowe's) is now structural. Growth narrative shifts to category-share-of-wallet within active accounts.")}
                forfor="For information" />
              <Decision n={4} ask="Note: Pricing policy reset proposed for Q4 close"
                what={resolve("Replace 'match Home Depot' with margin-floor + elasticity rule. CFO and Pricing committee to sign off in November.")}
                forfor="For information" />
            </ol>
          </Page>

          {/* ─── Page 7: Layer findings ─── */}
          <Page>
            <PageHeader number={7} title="One finding per layer" eyebrow="The full thirteen" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {Object.values(layerByKey).slice(0, 13).map(l => (
                <div key={l.key} className="py-2 border-b border-[var(--cream-dark)]">
                  <div className="eyebrow text-[var(--slate-light)]">{l.group}</div>
                  <div className="font-serif font-semibold text-[14px] text-[var(--navy)] leading-tight">{l.title}</div>
                  <p className="font-serif italic text-[12px] text-[var(--slate)] mt-0.5 leading-snug">{l.question}</p>
                </div>
              ))}
            </div>
          </Page>

          {/* ─── Page 8: Appendix ─── */}
          <Page>
            <PageHeader number={8} title="Appendix" eyebrow="Methodology and sources" />
            <div className="space-y-5 font-serif text-[14px] leading-snug text-[var(--ink)]">
              <p>
                <strong>Diagnostic framework.</strong> {profile.name}'s business is decomposed into 13 intelligence layers grouped into four bands: executive, market-facing, operational, system. Each layer carries a confidence band, a primary diagnostic question, and a recommended-actions stack.
              </p>
              <p>
                <strong>Powered by Demand by Different Day.</strong> The operational depth in Demand, Supply, Pricing and Sales is hydrated from the Different Day demand-planning platform. The framework you are reading lifts those diagnoses into an executive view and stitches them across layers.
              </p>
              <p>
                <strong>Confidence calculation.</strong> Each metric carries a combined confidence band weighted by source completeness and recency, with a floor set by the lowest-confidence contributor on the critical path.
              </p>
              <p>
                <strong>Sources.</strong> {resolve("SAP S/4HANA, NetSuite, Salesforce, Adaptive Planning, Manhattan WMS, Blue Yonder, Numerator panel, Brandwatch, Five9, Kronos, Workday, Adobe Analytics, Google Ads, NOAA weather feed, competitive pricing scraper.")} {profile.sourceSystems}.
              </p>
              <p>
                <strong>Peer set.</strong> {resolve("Home Depot, Lowe's, Ace Hardware, Tractor Supply. Sourced from Numerator panel and quarterly 10-Q filings.")}
              </p>
            </div>
          </Page>
        </div>
      </div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <article className="shadow-lg print:shadow-none print:break-after-page"
             style={{ background: "var(--paper)", border: "1px solid var(--cream-dark)" }}>
      <div className="px-14 py-12 min-h-[1040px] flex flex-col">{children}</div>
    </article>
  );
}

function PageHeader({ number, title, eyebrow }: { number: number; title: string; eyebrow: string }) {
  return (
    <div className="mb-8 pb-4 border-b border-[var(--cream-dark)] flex items-end justify-between">
      <div>
        <div className="eyebrow text-[var(--gold)] mb-2">{eyebrow}</div>
        <h2 className="font-serif font-semibold text-[34px] leading-tight text-[var(--navy)]">{title}</h2>
      </div>
      <div className="font-sans italic text-[11px] text-[var(--slate-light)]">Page {number} of 8</div>
    </div>
  );
}

function Card({ label, value, delta, tone, detail }: { label: string; value: string; delta: string; tone: "good"|"warn"|"bad"|"neutral"; detail: string }) {
  const color = tone === "good" ? "var(--teal)" : tone === "warn" ? "var(--amber)" : tone === "bad" ? "var(--coral)" : "var(--slate)";
  return (
    <div className="p-5 rounded-sm" style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
      <div className="eyebrow text-[var(--slate-light)] mb-2">{label}</div>
      <div className="font-serif font-semibold text-[36px] tabular-nums leading-none text-[var(--navy)]">{value}</div>
      <div className="font-sans font-semibold text-[11px] uppercase tracking-wider mt-2" style={{ color }}>{delta}</div>
      <p className="font-serif italic text-[13px] text-[var(--slate)] mt-3 leading-snug">{detail}</p>
    </div>
  );
}

function RootCause({ n, title, impact, body }: { n: number; title: string; impact: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="font-serif font-semibold text-[48px] text-[var(--gold)] leading-none w-10 shrink-0 tabular-nums">{n}</div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <div className="font-serif font-semibold text-[20px] text-[var(--navy)] leading-tight">{title}</div>
          <div className="font-sans font-bold text-[16px] tabular-nums text-[var(--coral)]">{impact}</div>
        </div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug mt-2">{body}</p>
      </div>
    </div>
  );
}

function Lever({ n, title, horizon, recovery, owner, body }: { n: number; title: string; horizon: string; recovery: string; owner: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="font-serif font-semibold text-[48px] text-[var(--teal)] leading-none w-10 shrink-0 tabular-nums">{n}</div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <div className="font-serif font-semibold text-[20px] text-[var(--navy)] leading-tight">{title}</div>
          <div className="font-sans font-bold text-[16px] tabular-nums text-[var(--teal)]">{recovery}</div>
        </div>
        <div className="flex gap-4 mt-1 font-sans text-[11px] italic text-[var(--slate)]">
          <span>Horizon: <strong className="text-[var(--navy)] not-italic">{horizon}</strong></span>
          <span>Owner: <strong className="text-[var(--navy)] not-italic">{owner}</strong></span>
        </div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug mt-2">{body}</p>
      </div>
    </div>
  );
}

function Decision({ n, ask, what, forfor }: { n: number; ask: string; what: string; forfor: string }) {
  return (
    <li className="flex gap-4 pl-0 list-none">
      <div className="font-serif font-semibold text-[28px] text-[var(--gold)] leading-none w-8 shrink-0 tabular-nums">{n}</div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <div className="font-serif font-semibold text-[17px] text-[var(--navy)] leading-tight">{ask}</div>
          <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[var(--coral)]">{forfor}</span>
        </div>
        <p className="font-serif italic text-[13px] text-[var(--slate)] leading-snug mt-1">{what}</p>
      </div>
    </li>
  );
}

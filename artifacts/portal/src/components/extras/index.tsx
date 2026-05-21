import {
  Building2, Truck, Users2, Banknote, Receipt, UserPlus,
  ArrowUp, ArrowDown, Heart, MessageCircle, Share2, Eye,
  Instagram, Facebook, Youtube, Search,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Brand & social — creative campaign grid + media mentions
// ─────────────────────────────────────────────────────────────────────────────

const CAMPAIGNS = [
  { title: "Q3 Garden Refresh",       channel: "Meta + IG",   bg: "linear-gradient(135deg, #1D9E75 0%, #0F5740 100%)", sentiment: 78, mentions: "12.4k", reach: "2.1M", spend: "$84k", icon: Instagram },
  { title: "DIY Weekend Project",     channel: "YouTube",     bg: "linear-gradient(135deg, #C8A24A 0%, #8A6F22 100%)", sentiment: 71, mentions: "8.7k",  reach: "1.4M", spend: "$62k", icon: Youtube },
  { title: "Trade Pro Tour 2026",     channel: "Earned PR",   bg: "linear-gradient(135deg, #1B2A4E 0%, #0F1A33 100%)", sentiment: 84, mentions: "3.2k",  reach: "640k", spend: "$48k", icon: Search },
  { title: "Texas Storm Recovery",    channel: "Local + PR",  bg: "linear-gradient(135deg, #D85A30 0%, #8A2E10 100%)", sentiment: 41, mentions: "18.9k", reach: "3.8M", spend: "$32k", icon: Facebook },
  { title: "Hardware Heritage Story", channel: "Brand film",  bg: "linear-gradient(135deg, #534AB7 0%, #2F2780 100%)", sentiment: 88, mentions: "5.1k",  reach: "910k", spend: "$120k", icon: Youtube },
  { title: "Outdoor Living Lookbook", channel: "IG Stories",  bg: "linear-gradient(135deg, #BA7517 0%, #6B4209 100%)", sentiment: 69, mentions: "9.6k",  reach: "1.8M", spend: "$54k", icon: Instagram },
];

const MEDIA = [
  { source: "DFW Morning News",  outlet: "Local TV",  headline: "Mercer storefronts navigate Texas supply crunch", tone: "neg" as const, reach: "640k" },
  { source: "Trade Pro Weekly",  outlet: "B2B Trade", headline: "Contractor confidence in Mercer holds despite delays", tone: "neu" as const, reach: "84k" },
  { source: "Southern Living",   outlet: "Lifestyle", headline: "Five backyard transformations using Mercer Garden", tone: "pos" as const, reach: "2.1M" },
  { source: "Reddit r/HomeImprovement", outlet: "Community", headline: "Anyone else seeing Mercer OOS on power tools?", tone: "neg" as const, reach: "47k" },
  { source: "AP Newswire",       outlet: "Wire",      headline: "Mercer Group posts mixed Q3 amid retail headwinds", tone: "neu" as const, reach: "12M" },
];

export function BrandSocialExtras() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 card card-accent-coral">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Active campaigns · Q3 creative</div>
            <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">6 live · $400k spend · 58.0k mentions captured</div>
          </div>
          <span className="pill pill-coral">2 underperforming</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CAMPAIGNS.map((c, i) => {
            const Icon = c.icon;
            const sentColor = c.sentiment >= 75 ? "var(--teal)" : c.sentiment >= 60 ? "var(--amber)" : "var(--coral)";
            return (
              <div key={i} className="border border-[var(--cream-dark)] rounded-sm overflow-hidden">
                <div className="h-20 relative flex items-end p-2" style={{ background: c.bg }}>
                  <Icon size={14} strokeWidth={1.5} className="absolute top-2 right-2 text-white opacity-80" />
                  <div className="absolute top-2 left-2 eyebrow text-white opacity-70">{c.channel}</div>
                  <div className="font-serif text-[14px] font-semibold text-white leading-tight">{c.title}</div>
                </div>
                <div className="p-2.5 bg-[var(--paper)]">
                  <div className="flex items-center justify-between text-[10px] text-[var(--slate-light)] mb-1.5">
                    <span className="flex items-center gap-1"><Heart size={10} /> {c.mentions}</span>
                    <span className="flex items-center gap-1"><Eye size={10} /> {c.reach}</span>
                    <span className="font-semibold text-[var(--navy)]">{c.spend}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] text-[var(--slate-light)]">Sentiment</span>
                    <span className="font-sans font-bold text-[11px] tabular-nums" style={{ color: sentColor }}>{c.sentiment}%</span>
                  </div>
                  <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-full" style={{ width: `${c.sentiment}%`, background: sentColor }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-1">Earned media · last 7 days</div>
        <div className="font-sans italic text-[12px] text-[var(--slate-light)] mb-4">73% of negative cluster traces to availability — not brand</div>
        <ul className="space-y-3">
          {MEDIA.map((m, i) => {
            const tone = m.tone === "pos" ? "var(--teal)" : m.tone === "neg" ? "var(--coral)" : "var(--slate-light)";
            const toneBg = m.tone === "pos" ? "var(--teal-faint)" : m.tone === "neg" ? "var(--coral-faint)" : "var(--cream-dark)";
            return (
              <li key={i} className="flex items-start gap-2.5 pb-3 border-b border-[var(--cream-dark)] last:border-0 last:pb-0">
                <span className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: tone }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-[11px] text-[var(--navy)] truncate">{m.source}</span>
                    <span className="tag !text-[9px]" style={{ background: toneBg, color: tone }}>{m.outlet}</span>
                  </div>
                  <div className="font-serif italic text-[12px] text-[var(--ink)] leading-snug mt-1">"{m.headline}"</div>
                  <div className="font-sans text-[10px] text-[var(--slate-light)] mt-1">Reach {m.reach}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Supply chain — DC heat tiles + supplier OTD scorecard
// ─────────────────────────────────────────────────────────────────────────────

const DCS = [
  { name: "Dallas DC",  code: "DAL", role: "Primary",   throughput: 78, oos: 28, labour: -11, lanes: 14, status: "bad" as const },
  { name: "Phoenix DC", code: "PHX", role: "Secondary", throughput: 84, oos: 11, labour: -4,  lanes: 9,  status: "warn" as const },
  { name: "Atlanta DC", code: "ATL", role: "Tertiary",  throughput: 96, oos: 2,  labour: +1,  lanes: 7,  status: "good" as const },
];

const SUPPLIERS = [
  { code: "A", name: "Halverson Industries",   tier: "Tier-1", otd: 94, qty: "$8.2M", trend: +2,  status: "good" as const },
  { code: "B", name: "Sentinel Manufacturing", tier: "Tier-1", otd: 71, qty: "$6.4M", trend: -14, status: "bad" as const },
  { code: "C", name: "Bridgepoint Goods",      tier: "Tier-2", otd: 88, qty: "$3.1M", trend: -2,  status: "warn" as const },
  { code: "D", name: "Cottonwood Trading",     tier: "Tier-2", otd: 92, qty: "$2.4M", trend: +1,  status: "good" as const },
  { code: "E", name: "Marwick Supply Co.",     tier: "Tier-3", otd: 64, qty: "$1.8M", trend: -8,  status: "bad" as const },
  { code: "F", name: "Quanta Materials",       tier: "Tier-1", otd: 89, qty: "$5.7M", trend: -3,  status: "warn" as const },
];

const statusBg = (s: "good" | "warn" | "bad") =>
  s === "good" ? "var(--teal-faint)" : s === "warn" ? "var(--amber-faint)" : "var(--coral-faint)";
const statusFg = (s: "good" | "warn" | "bad") =>
  s === "good" ? "var(--teal)" : s === "warn" ? "var(--amber)" : "var(--coral)";

export function SupplyChainExtras() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 card card-accent-amber">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Distribution centre health · live</div>
            <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">Throughput, stockouts, and labour gap by node</div>
          </div>
          <span className="pill pill-amber">2 of 3 below target</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DCS.map(dc => (
            <div key={dc.code} className="border border-[var(--cream-dark)] rounded-sm overflow-hidden">
              <div className="flex items-center justify-between p-3" style={{ background: statusBg(dc.status) }}>
                <div className="flex items-center gap-2">
                  <Building2 size={16} strokeWidth={1.5} style={{ color: statusFg(dc.status) }} />
                  <div>
                    <div className="font-sans font-semibold text-[13px] text-[var(--navy)]">{dc.name}</div>
                    <div className="eyebrow text-[var(--slate-light)]">{dc.role}</div>
                  </div>
                </div>
                <span className="font-sans font-bold text-[10px] tabular-nums" style={{ color: statusFg(dc.status) }}>{dc.code}</span>
              </div>
              <div className="p-3 space-y-2.5 bg-[var(--paper)]">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans text-[10px] text-[var(--slate-light)]">Throughput</span>
                    <span className="font-sans font-bold text-[14px] tabular-nums" style={{ color: statusFg(dc.status) }}>{dc.throughput}%</span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-full" style={{ width: `${dc.throughput}%`, background: statusFg(dc.status) }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-serif text-[18px] font-semibold text-[var(--coral)] tabular-nums leading-none">{dc.oos}</div>
                    <div className="eyebrow text-[var(--slate-light)] mt-1">OOS</div>
                  </div>
                  <div>
                    <div className={"font-serif text-[18px] font-semibold tabular-nums leading-none"}
                         style={{ color: dc.labour < 0 ? "var(--coral)" : "var(--teal)" }}>
                      {dc.labour > 0 ? "+" : ""}{dc.labour}
                    </div>
                    <div className="eyebrow text-[var(--slate-light)] mt-1">Labour</div>
                  </div>
                  <div>
                    <div className="font-serif text-[18px] font-semibold text-[var(--navy)] tabular-nums leading-none">{dc.lanes}</div>
                    <div className="eyebrow text-[var(--slate-light)] mt-1">Lanes</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-1">Supplier OTD scorecard</div>
        <div className="font-sans italic text-[12px] text-[var(--slate-light)] mb-4">Top 6 suppliers · 60% of inbound value</div>
        <ul className="space-y-3">
          {SUPPLIERS.map(s => (
            <li key={s.code} className="flex items-center gap-3 pb-3 border-b border-[var(--cream-dark)] last:border-0 last:pb-0">
              <span className="h-7 w-7 rounded-sm flex items-center justify-center font-sans font-bold text-[12px] shrink-0"
                    style={{ background: statusBg(s.status), color: statusFg(s.status) }}>{s.code}</span>
              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{s.name}</div>
                <div className="font-sans text-[10px] text-[var(--slate-light)]">{s.tier} · {s.qty}</div>
              </div>
              <div className="text-right">
                <div className="font-sans font-bold text-[14px] tabular-nums" style={{ color: statusFg(s.status) }}>{s.otd}%</div>
                <div className="flex items-center justify-end gap-0.5 text-[10px]"
                     style={{ color: s.trend > 0 ? "var(--teal)" : s.trend < 0 ? "var(--coral)" : "var(--slate-light)" }}>
                  {s.trend > 0 ? <ArrowUp size={9} /> : s.trend < 0 ? <ArrowDown size={9} /> : null}
                  {Math.abs(s.trend)}pp
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer intelligence — top trade accounts table with risk badges
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { name: "Kessler Construction Group",  region: "TX",  initials: "KC", color: "#1B2A4E", ltv: "$487k", ytd: "$142k", trend: -18, risk: "high"   as const, lastOrder: "11d ago",  sla: 78 },
  { name: "Granger Contracting",         region: "AZ",  initials: "GC", color: "#534AB7", ltv: "$412k", ytd: "$118k", trend: -9,  risk: "med"    as const, lastOrder: "4d ago",   sla: 88 },
  { name: "Boone & Sons Trades",         region: "GA",  initials: "BS", color: "#1D9E75", ltv: "$378k", ytd: "$112k", trend: +4,  risk: "low"    as const, lastOrder: "2d ago",   sla: 96 },
  { name: "Heritage Pro Supply",         region: "TX",  initials: "HP", color: "#C8A24A", ltv: "$364k", ytd: "$98k",  trend: -22, risk: "crit"   as const, lastOrder: "18d ago",  sla: 64 },
  { name: "Sundial Build Partners",      region: "NM",  initials: "SB", color: "#D85A30", ltv: "$298k", ytd: "$87k",  trend: -3,  risk: "med"    as const, lastOrder: "6d ago",   sla: 84 },
  { name: "Magnolia Trade Co-op",        region: "FL",  initials: "MT", color: "#BA7517", ltv: "$284k", ytd: "$92k",  trend: +11, risk: "low"    as const, lastOrder: "1d ago",   sla: 98 },
];

const RISK = {
  crit: { label: "CRITICAL", bg: "var(--coral-faint)",  fg: "var(--coral)" },
  high: { label: "HIGH",     bg: "var(--coral-faint)",  fg: "var(--coral)" },
  med:  { label: "MED",      bg: "var(--amber-faint)",  fg: "var(--amber)" },
  low:  { label: "LOW",      bg: "var(--teal-faint)",   fg: "var(--teal)" },
};

export function CustomerExtras() {
  return (
    <div className="card card-accent-coral">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Top 6 trade accounts · at-risk lens</div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">Sorted by lifetime value · churn risk computed from service SLA and order cadence</div>
        </div>
        <span className="pill pill-coral">2 critical · $0.8M defence value</span>
      </div>
      <div className="grid grid-cols-12 gap-3 pb-2 border-b border-[var(--cream-dark)] eyebrow text-[var(--slate-light)]">
        <div className="col-span-4">Account</div>
        <div className="col-span-1 text-center">Region</div>
        <div className="col-span-2 text-right">LTV</div>
        <div className="col-span-2 text-right">Q3 spend</div>
        <div className="col-span-2 text-center">SLA</div>
        <div className="col-span-1 text-right">Risk</div>
      </div>
      {ACCOUNTS.map((a, i) => (
        <div key={i} className="grid grid-cols-12 gap-3 py-3 border-b border-[var(--cream-dark)] items-center last:border-0">
          <div className="col-span-4 flex items-center gap-2.5 min-w-0">
            <span className="h-8 w-8 rounded-sm flex items-center justify-center font-sans font-bold text-[11px] text-white shrink-0"
                  style={{ background: a.color }}>{a.initials}</span>
            <div className="min-w-0">
              <div className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{a.name}</div>
              <div className="font-sans text-[10px] text-[var(--slate-light)]">Last order {a.lastOrder}</div>
            </div>
          </div>
          <div className="col-span-1 text-center font-sans text-[11px] text-[var(--slate)]">{a.region}</div>
          <div className="col-span-2 text-right font-sans font-semibold text-[13px] text-[var(--navy)] tabular-nums">{a.ltv}</div>
          <div className="col-span-2 text-right">
            <div className="font-sans font-semibold text-[13px] text-[var(--navy)] tabular-nums">{a.ytd}</div>
            <div className="flex items-center justify-end gap-0.5 text-[10px]"
                 style={{ color: a.trend > 0 ? "var(--teal)" : "var(--coral)" }}>
              {a.trend > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />} {Math.abs(a.trend)}% YoY
            </div>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-sans font-semibold text-[11px] tabular-nums"
                    style={{ color: a.sla >= 90 ? "var(--teal)" : a.sla >= 80 ? "var(--amber)" : "var(--coral)" }}>{a.sla}%</span>
              <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                <div className="h-full" style={{ width: `${a.sla}%`, background: a.sla >= 90 ? "var(--teal)" : a.sla >= 80 ? "var(--amber)" : "var(--coral)" }} />
              </div>
            </div>
          </div>
          <div className="col-span-1 text-right">
            <span className="tag" style={{ background: RISK[a.risk].bg, color: RISK[a.risk].fg }}>{RISK[a.risk].label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance — cash bridge waterfall + departmental spend tiles
// ─────────────────────────────────────────────────────────────────────────────

const CASH_BRIDGE = [
  { label: "Opening cash",     value: 38.4, kind: "base" as const },
  { label: "Operating inflow", value: 84.2, kind: "in"   as const },
  { label: "Working cap freed", value: 11.6, kind: "in"  as const },
  { label: "Opex + COGS",      value: -71.4, kind: "out" as const },
  { label: "Capex",            value: -7.8,  kind: "out" as const },
  { label: "Debt service",     value: -4.2,  kind: "out" as const },
  { label: "Tax",              value: -8.6,  kind: "out" as const },
  { label: "Closing cash",     value: 42.2, kind: "base" as const },
];

const DEPT_SPEND = [
  { name: "Operations",        plan: 28.4, actual: 29.8, status: "warn" as const },
  { name: "Technology + Data", plan: 18.2, actual: 21.4, status: "bad"  as const },
  { name: "Marketing",         plan: 12.6, actual: 11.8, status: "good" as const },
  { name: "Sales + GTM",       plan: 9.8,  actual: 10.4, status: "warn" as const },
  { name: "People + HR",       plan: 6.4,  actual: 6.2,  status: "good" as const },
  { name: "Finance + Admin",   plan: 4.2,  actual: 4.0,  status: "good" as const },
];

export function FinanceExtras() {
  // Compute running totals for waterfall layout
  let running = 0;
  const enriched = CASH_BRIDGE.map(b => {
    if (b.kind === "base") {
      const item = { ...b, base: 0, height: b.value };
      running = b.value; return item;
    }
    const item = { ...b, base: b.value > 0 ? running : running + b.value, height: Math.abs(b.value) };
    running += b.value; return item;
  });
  const maxVal = Math.max(...enriched.map(e => e.base + e.height));
  const colorFor = (k: "base" | "in" | "out") =>
    k === "in" ? "var(--teal)" : k === "out" ? "var(--coral)" : "var(--navy)";

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 card card-accent-teal">
        <div className="flex items-center justify-between mb-1">
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Cash bridge · Q3 2026</div>
          <span className="pill pill-teal">+$3.8M vs plan</span>
        </div>
        <div className="font-sans italic text-[12px] text-[var(--slate-light)] mb-5">Working capital tightening offset operational shortfalls</div>
        <div className="flex items-end gap-2 h-[180px] border-b border-[var(--cream-dark)] pb-2">
          {enriched.map((b, i) => {
            const heightPct = (b.height / maxVal) * 100;
            const basePct = (b.base / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end relative" style={{ height: "100%" }}>
                <div className="font-sans font-bold text-[11px] tabular-nums mb-1"
                     style={{ color: colorFor(b.kind) }}>
                  {b.value > 0 ? "+" : ""}{b.value.toFixed(1)}
                </div>
                <div className="w-full relative" style={{ height: "calc(100% - 18px)" }}>
                  <div className="absolute left-0 right-0 rounded-sm"
                       style={{
                         bottom: `${basePct}%`,
                         height: `${heightPct}%`,
                         background: colorFor(b.kind),
                         opacity: b.kind === "base" ? 1 : 0.85,
                       }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          {enriched.map((b, i) => (
            <div key={i} className="flex-1 text-center font-sans text-[9px] text-[var(--slate-light)] leading-tight">{b.label}</div>
          ))}
        </div>
      </div>

      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-1">Departmental spend · plan v actual</div>
        <div className="font-sans italic text-[12px] text-[var(--slate-light)] mb-4">USD millions, Q3 2026</div>
        <ul className="space-y-3">
          {DEPT_SPEND.map((d, i) => {
            const variance = d.actual - d.plan;
            const pct = (d.actual / Math.max(...DEPT_SPEND.map(x => Math.max(x.plan, x.actual)))) * 100;
            return (
              <li key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-sans text-[12px] font-semibold text-[var(--navy)]">{d.name}</span>
                  <span className="font-sans text-[11px] tabular-nums font-bold"
                        style={{ color: statusFg(d.status) }}>
                    {variance > 0 ? "+" : ""}{variance.toFixed(1)}M
                  </span>
                </div>
                <div className="h-2 rounded-sm overflow-hidden relative" style={{ background: "var(--cream-dark)" }}>
                  <div className="absolute left-0 top-0 h-full" style={{ width: `${(d.plan / Math.max(...DEPT_SPEND.map(x => Math.max(x.plan, x.actual)))) * 100}%`, background: "var(--cream)", borderRight: "2px dashed var(--navy)" }} />
                  <div className="absolute left-0 top-0 h-full" style={{ width: `${pct}%`, background: statusFg(d.status), opacity: 0.85 }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--slate-light)] mt-1 font-sans tabular-nums">
                  <span>Plan ${d.plan.toFixed(1)}M</span>
                  <span>Actual ${d.actual.toFixed(1)}M</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receivables — AR aging buckets + top debtors
// ─────────────────────────────────────────────────────────────────────────────

const AGING = [
  { bucket: "Current",  range: "0–30 days",  value: 18.4, count: 412, status: "good" as const },
  { bucket: "Watch",    range: "31–60 days", value: 11.2, count: 184, status: "warn" as const },
  { bucket: "Overdue",  range: "61–90 days", value: 6.8,  count: 87,  status: "bad"  as const },
  { bucket: "Critical", range: "90+ days",   value: 4.1,  count: 41,  status: "bad"  as const },
];

const DEBTORS = [
  { name: "Heritage Pro Supply",       outstanding: "$842k", days: 96, status: "bad"  as const, action: "Final demand" },
  { name: "Mountain West Trades LLC",  outstanding: "$614k", days: 78, status: "bad"  as const, action: "Escalate" },
  { name: "Kessler Construction Group", outstanding: "$487k", days: 62, status: "warn" as const, action: "Call sequence" },
  { name: "Sundial Build Partners",    outstanding: "$362k", days: 48, status: "warn" as const, action: "Reminder 2" },
  { name: "Granger Contracting",       outstanding: "$284k", days: 41, status: "warn" as const, action: "Reminder 1" },
  { name: "Boone & Sons Trades",       outstanding: "$218k", days: 33, status: "good" as const, action: "On terms" },
];

export function ReceivablesExtras() {
  const total = AGING.reduce((s, a) => s + a.value, 0);
  return (
    <div className="space-y-6">
      <div className="card card-accent-coral">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Accounts receivable aging</div>
            <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">${total.toFixed(1)}M outstanding across 724 open invoices · DSO 51 days</div>
          </div>
          <span className="pill pill-coral">$10.9M past terms</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {AGING.map(a => {
            const pct = (a.value / total) * 100;
            return (
              <div key={a.bucket} className="border border-[var(--cream-dark)] rounded-sm p-4" style={{ background: statusBg(a.status) }}>
                <div className="eyebrow" style={{ color: statusFg(a.status) }}>{a.bucket}</div>
                <div className="font-sans text-[10px] text-[var(--slate-light)] mt-0.5 mb-2">{a.range}</div>
                <div className="font-serif font-semibold tabular-nums" style={{ fontSize: 32, lineHeight: 1.05, color: statusFg(a.status) }}>
                  ${a.value.toFixed(1)}M
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] font-sans">
                  <span className="text-[var(--slate-light)]">{a.count} invoices</span>
                  <span className="font-semibold tabular-nums" style={{ color: statusFg(a.status) }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full mt-1.5 overflow-hidden bg-white/50">
                  <div className="h-full" style={{ width: `${pct}%`, background: statusFg(a.status) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-accent-navy">
        <div className="flex items-center justify-between mb-4">
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Dunning queue · top 6 debtors</div>
          <span className="pill pill-amber">$2.8M in active workflow</span>
        </div>
        <div className="grid grid-cols-12 gap-3 pb-2 border-b border-[var(--cream-dark)] eyebrow text-[var(--slate-light)]">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Customer</div>
          <div className="col-span-2 text-right">Outstanding</div>
          <div className="col-span-1 text-right">Days</div>
          <div className="col-span-2">Next action</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        {DEBTORS.map((d, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 py-3 border-b border-[var(--cream-dark)] last:border-0 items-center">
            <div className="col-span-1 font-serif text-[18px] font-semibold text-[var(--slate-light)] tabular-nums">{String(i + 1).padStart(2, "0")}</div>
            <div className="col-span-5 flex items-center gap-2.5">
              <Receipt size={14} strokeWidth={1.5} style={{ color: statusFg(d.status) }} />
              <span className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{d.name}</span>
            </div>
            <div className="col-span-2 text-right font-sans font-bold text-[13px] tabular-nums" style={{ color: statusFg(d.status) }}>{d.outstanding}</div>
            <div className="col-span-1 text-right font-sans text-[12px] text-[var(--slate)] tabular-nums">{d.days}</div>
            <div className="col-span-2 font-sans text-[11px] text-[var(--slate)]">{d.action}</div>
            <div className="col-span-1 text-right">
              <span className="tag" style={{ background: statusBg(d.status), color: statusFg(d.status) }}>
                {d.status === "good" ? "ON TRACK" : d.status === "warn" ? "WATCH" : "ACTION"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Talent & HR — recruitment funnel + open roles grid + attrition by team
// ─────────────────────────────────────────────────────────────────────────────

const FUNNEL = [
  { stage: "Applied",      count: 1842, conv: 100 },
  { stage: "Screen",       count: 624,  conv: 34 },
  { stage: "First round",  count: 218,  conv: 12 },
  { stage: "Final round",  count: 84,   conv: 5 },
  { stage: "Offer",        count: 41,   conv: 2.2 },
  { stage: "Joined",       count: 24,   conv: 1.3 },
];

const OPEN_ROLES = [
  { title: "Sr Data Engineer",       team: "Technology",  region: "Dallas, TX", days: 84, prio: "crit" as const, status: "Final round" },
  { title: "DC Operations Lead",     team: "Operations",  region: "Dallas, TX", days: 62, prio: "crit" as const, status: "Sourcing" },
  { title: "Demand Planner",         team: "Planning",    region: "Remote",     days: 51, prio: "high" as const, status: "First round" },
  { title: "Pricing Manager · Trade",team: "Commercial",  region: "Atlanta, GA", days: 47, prio: "high" as const, status: "Offer pending" },
  { title: "Customer Success Lead",  team: "Customer",    region: "Phoenix, AZ", days: 38, prio: "med"  as const, status: "Screen" },
  { title: "Brand Manager · DIY",    team: "Marketing",   region: "Dallas, TX", days: 33, prio: "med"  as const, status: "First round" },
];

const ATTRITION = [
  { team: "DC Operations",    rate: 24, target: 12, headcount: 412 },
  { team: "Customer Service", rate: 21, target: 12, headcount: 184 },
  { team: "Technology",       rate: 17, target: 10, headcount: 96  },
  { team: "Retail Stores",    rate: 14, target: 14, headcount: 1240 },
  { team: "Commercial",       rate: 11, target: 9,  headcount: 142 },
  { team: "Corporate",        rate: 7,  target: 8,  headcount: 218 },
];

const PRIO = {
  crit: { bg: "var(--coral-faint)", fg: "var(--coral)", label: "CRITICAL" },
  high: { bg: "var(--amber-faint)", fg: "var(--amber)", label: "HIGH" },
  med:  { bg: "#E8ECF4",            fg: "var(--navy)",  label: "MED" },
};

export function TalentHRExtras() {
  const maxFunnel = FUNNEL[0].count;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card card-accent-navy">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Recruitment funnel · 90-day rolling</div>
              <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">1,842 applicants → 24 joiners · 1.3% end-to-end conversion</div>
            </div>
            <span className="pill pill-coral">24 critical roles open</span>
          </div>
          <div className="space-y-2.5">
            {FUNNEL.map((f, i) => {
              const w = (f.count / maxFunnel) * 100;
              const color = i === 0 ? "var(--navy)" : i < 3 ? "var(--navy-soft)" : i < 5 ? "var(--amber)" : "var(--teal)";
              return (
                <div key={f.stage} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 font-sans text-[12px] font-semibold text-[var(--navy)]">{f.stage}</div>
                  <div className="col-span-7">
                    <div className="h-6 rounded-sm overflow-hidden relative" style={{ background: "var(--cream-dark)" }}>
                      <div className="h-full flex items-center justify-end pr-2 transition-all"
                           style={{ width: `${Math.max(w, 6)}%`, background: color }}>
                        <span className="font-sans font-bold text-[11px] text-white tabular-nums">{f.count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 font-sans text-[11px] text-[var(--slate-light)] tabular-nums text-right">{f.conv}%</div>
                  <div className="col-span-2 font-sans text-[10px] text-[var(--slate-light)]">
                    {i > 0 && <>↓ {(((FUNNEL[i - 1].count - f.count) / FUNNEL[i - 1].count) * 100).toFixed(0)}% drop</>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-accent-coral">
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-1">Attrition by team · annualised</div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mb-4">vs target (dashed)</div>
          <ul className="space-y-3.5">
            {ATTRITION.map((t, i) => {
              const max = 30;
              const wActual = (t.rate / max) * 100;
              const wTarget = (t.target / max) * 100;
              const overTarget = t.rate > t.target;
              return (
                <li key={i}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-sans text-[11px] font-semibold text-[var(--navy)]">{t.team}</span>
                    <span className="font-sans text-[11px] tabular-nums font-bold"
                          style={{ color: overTarget ? "var(--coral)" : "var(--teal)" }}>{t.rate}%</span>
                  </div>
                  <div className="h-2 rounded-sm overflow-hidden relative" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-full" style={{ width: `${wActual}%`, background: overTarget ? "var(--coral)" : "var(--teal)" }} />
                    <div className="absolute top-0 h-full border-l border-dashed" style={{ left: `${wTarget}%`, borderColor: "var(--navy)" }} />
                  </div>
                  <div className="font-sans text-[10px] text-[var(--slate-light)] tabular-nums mt-0.5">{t.headcount.toLocaleString()} headcount · target {t.target}%</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="card card-accent-amber">
        <div className="flex items-center justify-between mb-4">
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Open critical roles · time-to-fill</div>
          <span className="pill pill-amber">Avg 53 days · target 32</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {OPEN_ROLES.map((r, i) => (
            <div key={i} className="border border-[var(--cream-dark)] rounded-sm p-3 bg-[var(--paper)]">
              <div className="flex items-start justify-between mb-2">
                <UserPlus size={14} strokeWidth={1.5} style={{ color: PRIO[r.prio].fg }} />
                <span className="tag" style={{ background: PRIO[r.prio].bg, color: PRIO[r.prio].fg }}>{PRIO[r.prio].label}</span>
              </div>
              <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight">{r.title}</div>
              <div className="font-sans text-[10px] text-[var(--slate-light)] mt-0.5">{r.team} · {r.region}</div>
              <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-[var(--cream-dark)]">
                <div>
                  <div className="font-serif font-semibold text-[20px] leading-none tabular-nums"
                       style={{ color: r.days > 60 ? "var(--coral)" : r.days > 40 ? "var(--amber)" : "var(--navy)" }}>{r.days}</div>
                  <div className="eyebrow text-[var(--slate-light)] mt-0.5">days open</div>
                </div>
                <div className="text-right">
                  <div className="font-sans text-[10px] text-[var(--slate-light)]">Stage</div>
                  <div className="font-sans text-[11px] font-semibold text-[var(--navy)]">{r.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry — Layer.tsx looks up by layer key
// ─────────────────────────────────────────────────────────────────────────────

export const EXTRAS: Record<string, React.FC> = {
  "brand-social":          BrandSocialExtras,
  "supply-chain":          SupplyChainExtras,
  "customer-intelligence": CustomerExtras,
  "finance":               FinanceExtras,
  "receivables":           ReceivablesExtras,
  "talent-hr":             TalentHRExtras,
};

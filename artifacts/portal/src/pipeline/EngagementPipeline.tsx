import { useMemo, useState } from "react";
import { ArrowRight, Radio, Clock, AlertTriangle, XCircle, FileText, Layers, Banknote, Target } from "lucide-react";
import { type DataFeed, type FeedStatus } from "../data/feeds";
import { useNarrative } from "../context/CompanyContext";

type Row = {
  layer: string;
  layerTitle: string;
  category: string;
  title: string;
  detail: string;
  value: number;
  valueLabel: string;
  source: "GAP" | "FEED";
  status?: FeedStatus;
};

const PARSE = (s?: string) => Number((s || "0").replace(/[^0-9.]/g, ""));

const STATUS_ICON: Record<FeedStatus, any> = { live: Radio, stale: Clock, partial: AlertTriangle, missing: XCircle, manual: FileText };

export default function EngagementPipeline({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { LAYERS, FEEDS } = useNarrative();
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    LAYERS.forEach(l => {
      l.gaps.forEach(g => {
        const v = PARSE(l.gapsPipelineUsd) / l.gaps.length;
        out.push({
          layer: l.key, layerTitle: l.title, category: g.category,
          title: g.title, detail: g.detail, value: v,
          valueLabel: `$${v.toFixed(2)}M`, source: "GAP",
        });
      });
      (FEEDS[l.key] || []).forEach(f => {
        if (!f.pipelineUsd) return;
        out.push({
          layer: l.key, layerTitle: l.title, category: f.status.toUpperCase(),
          title: f.source, detail: f.pipelineNote || `${f.status} feed — ${f.cadence}, last sync ${f.lastSync}`,
          value: PARSE(f.pipelineUsd), valueLabel: f.pipelineUsd, source: "FEED", status: f.status,
        });
      });
    });
    return out.sort((a, b) => b.value - a.value);
  }, [LAYERS, FEEDS]);
  const [filter, setFilter] = useState<"all" | "GAP" | "FEED">("all");
  const filtered = filter === "all" ? rows : rows.filter(r => r.source === filter);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const byLayer = useMemo(() => {
    const m = new Map<string, { title: string; value: number; count: number }>();
    rows.forEach(r => {
      const x = m.get(r.layer) || { title: r.layerTitle, value: 0, count: 0 };
      x.value += r.value; x.count += 1; m.set(r.layer, x);
    });
    return Array.from(m.entries()).sort((a, b) => b[1].value - a[1].value);
  }, [rows]);
  const maxLayerValue = Math.max(...byLayer.map(([, v]) => v.value));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">System · Engagement pipeline</div>
        <h1 className="font-serif text-[32px] leading-tight text-[var(--navy)]">Different Day engagement pipeline</h1>
        <p className="font-serif italic text-[18px] text-[var(--slate-light)] mt-1">Every architectural gap surfaced across the ten intelligence layers, prioritised by indicative recovery value.</p>
      </div>

      {/* Hero totals */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card card-accent-coral">
          <div className="eyebrow text-[var(--slate-light)]">Total indicative pipeline</div>
          <div className="font-serif font-semibold mt-2" style={{ fontSize: 44, lineHeight: 1.05, color: "var(--coral)" }}>
            ${total.toFixed(1)}M
          </div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">across {rows.length} opportunities</div>
        </div>
        <div className="card">
          <div className="eyebrow text-[var(--slate-light)]">Architectural gaps</div>
          <div className="font-serif font-semibold mt-2 text-[var(--navy)]" style={{ fontSize: 44, lineHeight: 1.05 }}>
            {rows.filter(r => r.source === "GAP").length}
          </div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">across 5 categories</div>
        </div>
        <div className="card">
          <div className="eyebrow text-[var(--slate-light)]">Missing or stale feeds</div>
          <div className="font-serif font-semibold mt-2 text-[var(--amber)]" style={{ fontSize: 44, lineHeight: 1.05 }}>
            {rows.filter(r => r.source === "FEED").length}
          </div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">data sources to rebuild or connect</div>
        </div>
        <div className="card card-accent-teal">
          <div className="eyebrow text-[var(--slate-light)]">Predicted Q4 confidence lift</div>
          <div className="font-serif font-semibold mt-2 text-[var(--teal)]" style={{ fontSize: 44, lineHeight: 1.05 }}>
            +9pp
          </div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">if top-10 opportunities ship</div>
        </div>
      </div>

      {/* By layer */}
      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-4">Pipeline value by intelligence layer</div>
        <div className="space-y-2.5">
          {byLayer.map(([key, v]) => {
            const pct = (v.value / maxLayerValue) * 100;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className="w-full grid grid-cols-12 gap-3 items-center text-left hover:bg-[var(--cream-light)] p-1.5 rounded-sm transition-colors"
              >
                <div className="col-span-3 font-sans text-[13px] text-[var(--navy)] font-semibold truncate">{v.title}</div>
                <div className="col-span-7">
                  <div className="h-3 rounded-sm overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--coral) 0%, var(--gold) 100%)" }} />
                  </div>
                </div>
                <div className="col-span-1 font-sans text-[12px] tabular-nums text-[var(--slate)]">{v.count} items</div>
                <div className="col-span-1 font-sans font-bold text-[14px] text-[var(--coral)] text-right">${v.value.toFixed(1)}M</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-[var(--slate-light)] mr-2">Filter</span>
          {[
            { k: "all" as const,  label: "All opportunities", icon: Layers },
            { k: "GAP" as const,  label: "Architectural gaps", icon: Target },
            { k: "FEED" as const, label: "Data feed work",     icon: Banknote },
          ].map(o => {
            const Icon = o.icon;
            const active = filter === o.k;
            return (
              <button key={o.k} onClick={() => setFilter(o.k)}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-sm border text-[11px] font-sans font-medium transition-colors"
                      style={{
                        background: active ? "var(--navy)" : "var(--paper)",
                        color: active ? "var(--cream)" : "var(--navy)",
                        borderColor: "var(--navy)",
                      }}>
                <Icon size={12} strokeWidth={1.5} /> {o.label}
              </button>
            );
          })}
        </div>
        <span className="eyebrow text-[var(--slate-light)]">{filtered.length} opportunities · sorted by value</span>
      </div>

      {/* Backlog */}
      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[var(--cream-dark)] eyebrow text-[var(--slate-light)]"
             style={{ background: "var(--cream-light)" }}>
          <div className="col-span-1">Rank</div>
          <div className="col-span-2">Layer</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-5">Opportunity</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1 text-right">Value</div>
        </div>
        {filtered.slice(0, 24).map((r, i) => {
          const Icon = r.source === "FEED" && r.status ? STATUS_ICON[r.status] : Target;
          const iconColor = r.source === "FEED"
            ? (r.status === "missing" ? "var(--coral)" : "var(--amber)")
            : "var(--navy)";
          return (
            <button key={i} onClick={() => onNavigate(r.layer)}
                    className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[var(--cream-dark)] text-left items-center hover:bg-[var(--cream-light)] w-full transition-colors">
              <div className="col-span-1 font-serif text-[20px] font-semibold text-[var(--slate-light)] tabular-nums">{String(i + 1).padStart(2, "0")}</div>
              <div className="col-span-2 font-sans text-[12px] text-[var(--navy)] font-semibold truncate">{r.layerTitle}</div>
              <div className="col-span-1">
                <span className="tag" style={{
                  background: r.source === "FEED" ? "var(--amber-faint)" : "var(--coral-faint)",
                  color:      r.source === "FEED" ? "var(--amber)"      : "var(--coral)",
                }}>{r.source}</span>
              </div>
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <Icon size={13} strokeWidth={1.6} style={{ color: iconColor }} />
                  <span className="font-sans text-[13px] font-semibold text-[var(--navy)]">{r.title}</span>
                </div>
                <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">{r.detail}</div>
              </div>
              <div className="col-span-2 font-sans text-[10px] uppercase tracking-wider text-[var(--slate)]">{r.category}</div>
              <div className="col-span-1 text-right">
                <div className="font-sans font-bold text-[14px] text-[var(--coral)] tabular-nums">{r.valueLabel}</div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--slate-light)] mt-0.5">view <ArrowRight size={10} /></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

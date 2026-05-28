import { useMemo, useState } from "react";
import { Activity, Database, AlertCircle, CheckCircle2, Cpu, Zap, Radio } from "lucide-react";
import { snapshotHealth, aggregate, fmtSync, type HealthStatus, type ConnectorHealth } from "../data/systemHealth";
import { CONNECTOR_CATEGORIES, type ConnectorCategory } from "../data/connectors";

interface Props { onNavigate: (key: string) => void }

const STATUS_META: Record<HealthStatus, { color: string; label: string }> = {
  healthy: { color: "var(--teal)",   label: "HEALTHY" },
  warning: { color: "var(--amber)",  label: "WARNING" },
  syncing: { color: "var(--gold)",   label: "SYNCING" },
  stale:   { color: "var(--coral)",  label: "STALE"   },
};

function ConnectorRow({ h }: { h: ConnectorHealth }) {
  const meta = STATUS_META[h.status];
  return (
    <div className="border border-[var(--cream-dark)] rounded-sm px-3 py-2.5 bg-[var(--cream-light)] hover:border-[var(--navy)] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight truncate">{h.connector.name}</div>
          <div className="font-mono text-[10px] text-[var(--slate-light)] mt-0.5">{h.connector.category}</div>
        </div>
        <span className="font-mono text-[9px] tracking-wide shrink-0" style={{ color: meta.color }}>● {meta.label}</span>
      </div>
      {/* Completeness bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="font-mono text-[9.5px] text-[var(--slate-light)] w-[60px]">completeness</div>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
          <div className="h-full rounded-full" style={{ width: `${h.completenessPct}%`, background: meta.color }} />
        </div>
        <div className="font-mono text-[10px] text-[var(--slate)] tabular-nums w-[40px] text-right">{h.completenessPct.toFixed(1)}%</div>
      </div>
      <div className="flex items-center gap-4 mt-2 font-mono text-[10px] text-[var(--slate)] tabular-nums">
        <span><span className="text-[var(--slate-light)]">sync</span> {fmtSync(h.lastSyncMinutesAgo)}</span>
        <span><span className="text-[var(--slate-light)]">p50</span> {h.p50Ms}ms</span>
        <span><span className="text-[var(--slate-light)]">p95</span> {h.p95Ms}ms</span>
        <span className="ml-auto"><span className="text-[var(--slate-light)]">24h</span> {h.events24h.toLocaleString()} events</span>
        {h.anomalies24h > 0 && (
          <span className="flex items-center gap-1 text-[var(--coral)]">
            <AlertCircle size={10} strokeWidth={1.8} /> {h.anomalies24h}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SystemHealth({ onNavigate }: Props) {
  const snapshot = useMemo(() => snapshotHealth(), []);
  const agg = useMemo(() => aggregate(snapshot), [snapshot]);

  const [status, setStatus] = useState<"all" | HealthStatus>("all");
  const [cat, setCat] = useState<ConnectorCategory | "All">("All");

  const filtered = snapshot.filter(h =>
    (status === "all" || h.status === status) &&
    (cat === "All" || h.connector.category === cat)
  );

  const counts: Record<HealthStatus, number> = { healthy: 0, warning: 0, syncing: 0, stale: 0 };
  snapshot.forEach(h => { counts[h.status]++; });

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div>
        <div className="eyebrow text-[var(--gold)] mb-2">System · Health</div>
        <h1 className="font-serif text-[36px] font-semibold text-[var(--navy)] leading-tight mb-2">
          The console your data team would tail in production
        </h1>
        <p className="font-serif italic text-[16px] text-[var(--slate)] max-w-[820px] leading-snug">
          Every connector, every cadence, every sync. The same status surface our on-call rotation watches. When a buyer asks "what happens when a feed goes stale on Tuesday morning at 3am", point at this page and walk them through it.
        </p>
      </div>

      {/* Aggregate strip */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { icon: CheckCircle2, label: "Uptime, 90d",   value: `${agg.uptimePct}%`,                     accent: "teal"  as const },
          { icon: Activity,     label: "Events, 24h",   value: agg.eventsLast24h.toLocaleString(),       accent: "gold"  as const },
          { icon: AlertCircle,  label: "Anomalies, 24h", value: agg.anomaliesLast24h.toLocaleString(),    accent: "coral" as const },
          { icon: Zap,          label: "Claims published, 24h", value: agg.claimsPublished24h.toLocaleString(), accent: "navy"  as const },
          { icon: Database,     label: "Connectors active", value: `${agg.connectorsActive} / ${agg.connectorsTotal}`, accent: "teal"  as const },
          { icon: Cpu,          label: "Reasoning p50",   value: `${agg.reasoningP50Ms}ms`,                accent: "amber" as const },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className={`card !p-3 card-accent-${accent}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} strokeWidth={1.8} className={`text-[var(--${accent === "gold" ? "gold" : accent === "coral" ? "coral" : accent === "teal" ? "teal" : accent === "amber" ? "amber" : "navy"})]`} />
              <div className="eyebrow text-[var(--slate-light)] text-[9.5px]">{label}</div>
            </div>
            <div className="font-mono font-semibold text-[18px] text-[var(--navy)] tabular-nums leading-none">{value}</div>
          </div>
        ))}
      </div>

      {/* Console */}
      <div className="card !p-0 overflow-hidden" style={{ background: "var(--navy-deep)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(244,241,234,0.12)" }}>
          <div className="flex items-center gap-3">
            <Radio size={14} className="text-[var(--gold-light)]" strokeWidth={1.6} />
            <div>
              <div className="font-sans font-semibold text-[13px] text-[var(--cream-light)] tracking-wide">CONNECTOR HEALTH</div>
              <div className="font-sans text-[11px] text-[var(--gold-light)]/70 italic">live · per-tenant snapshot</div>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10.5px] text-[var(--cream-light)]/80">
            {(["healthy", "warning", "syncing", "stale"] as HealthStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[s].color }} />
                <span className="tabular-nums">{counts[s]}</span>
                <span className="text-[var(--cream-light)]/50">{s}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b flex flex-wrap items-center gap-2" style={{ borderColor: "rgba(244,241,234,0.1)" }}>
          <span className="font-mono text-[10px] tracking-wide text-[var(--cream-light)]/50 mr-1">STATUS</span>
          {(["all", "healthy", "warning", "syncing", "stale"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2 py-0.5 rounded-sm text-[10.5px] font-mono uppercase tracking-wide transition-colors ${status === s ? "bg-[var(--gold)] text-[var(--navy-deep)]" : "text-[var(--cream-light)]/70 border border-[var(--cream-light)]/15 hover:border-[var(--gold-light)]"}`}
            >
              {s}
            </button>
          ))}
          <span className="font-mono text-[10px] tracking-wide text-[var(--cream-light)]/50 ml-3 mr-1">CATEGORY</span>
          <select
            value={cat}
            onChange={e => setCat(e.target.value as ConnectorCategory | "All")}
            className="px-2 py-1 rounded-sm bg-transparent border text-[10.5px] font-mono text-[var(--cream-light)]"
            style={{ borderColor: "rgba(244,241,234,0.15)" }}
          >
            <option value="All" style={{ background: "var(--navy-deep)" }}>All categories</option>
            {CONNECTOR_CATEGORIES.map(c => (
              <option key={c} value={c} style={{ background: "var(--navy-deep)" }}>{c}</option>
            ))}
          </select>
          <span className="ml-auto font-mono text-[10.5px] text-[var(--cream-light)]/60 tabular-nums">{filtered.length} shown</span>
        </div>

        {/* Grid */}
        <div className="p-4 grid grid-cols-2 gap-2 max-h-[640px] overflow-y-auto scroll-area">
          {filtered.map(h => <ConnectorRow key={h.connector.name} h={h} />)}
          {filtered.length === 0 && (
            <div className="col-span-2 py-8 text-center font-sans italic text-[12.5px] text-[var(--cream-light)]/60">
              Nothing matches this filter. Loosen the status or pick a different category.
            </div>
          )}
        </div>
      </div>

      {/* Footer pointer */}
      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)] mb-1">Where to take the buyer next</div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug">
          If they want to see the connector list as a sales artefact, send them to <button onClick={() => onNavigate("data-substrate")} className="underline text-[var(--coral)]">Data substrate</button>. If they want to verify how confident outputs actually are, send them to <button onClick={() => onNavigate("calibration")} className="underline text-[var(--coral)]">Calibration</button>. If they want to compare against an incumbent, send them to <button onClick={() => onNavigate("battle-cards")} className="underline text-[var(--coral)]">Battle cards</button>.
        </p>
      </div>
    </div>
  );
}

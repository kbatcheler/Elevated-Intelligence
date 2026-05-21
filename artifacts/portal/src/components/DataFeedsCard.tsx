import { Radio, Clock, AlertTriangle, XCircle, FileText, ArrowRight } from "lucide-react";
import { type DataFeed, type FeedStatus } from "../data/feeds";
import { useNarrative } from "../context/CompanyContext";

const STATUS_META: Record<FeedStatus, { label: string; color: string; bg: string; icon: any }> = {
  live:    { label: "LIVE",    color: "var(--teal)",  bg: "var(--teal-faint)",  icon: Radio },
  stale:   { label: "STALE",   color: "var(--amber)", bg: "var(--amber-faint)", icon: Clock },
  partial: { label: "PARTIAL", color: "var(--amber)", bg: "var(--amber-faint)", icon: AlertTriangle },
  missing: { label: "MISSING", color: "var(--coral)", bg: "var(--coral-faint)", icon: XCircle },
  manual:  { label: "MANUAL",  color: "var(--navy)",  bg: "#E8ECF4",            icon: FileText },
};

function StatusPip({ status }: { status: FeedStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-sm tag"
          style={{ background: m.bg, color: m.color }}>
      <Icon size={9} strokeWidth={2} /> {m.label}
    </span>
  );
}

function CompletenessBar({ value, status }: { value: number; status: FeedStatus }) {
  const color =
    status === "missing" ? "var(--coral)"
    : status === "live" ? "var(--teal)"
    : value >= 90 ? "var(--navy)"
    : value >= 70 ? "var(--amber)"
    : "var(--coral)";
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
      <div className="h-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function DataFeedsCard({ layerKey }: { layerKey: string }) {
  const { FEEDS } = useNarrative();
  const feeds: DataFeed[] = FEEDS[layerKey] || [];
  const live = feeds.filter(f => f.status === "live").length;
  const issues = feeds.filter(f => f.status !== "live" && f.status !== "manual");
  const totalPipeline = feeds
    .map(f => Number((f.pipelineUsd || "0").replace(/[^0-9.]/g, "")))
    .reduce((a, b) => a + b, 0);

  return (
    <div className="card card-accent-navy">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Data feeds powering this diagnosis</div>
          <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-0.5">
            {feeds.length} sources · {live} live · {issues.length} need work · Different Day pipeline {totalPipeline ? `$${totalPipeline.toFixed(1)}M` : "—"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(["live","stale","partial","missing","manual"] as FeedStatus[]).map(s => {
            const n = feeds.filter(f => f.status === s).length;
            if (n === 0) return null;
            return (
              <span key={s} className="tag" style={{ background: STATUS_META[s].bg, color: STATUS_META[s].color }}>
                {n} {STATUS_META[s].label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--cream-dark)]">
        {feeds.map((f, i) => (
          <div key={i}
               className="grid grid-cols-12 gap-3 py-2.5 border-b border-[var(--cream-dark)] items-center text-[12px]">
            <div className="col-span-4 flex items-center gap-2">
              <StatusPip status={f.status} />
              <span className="font-sans font-semibold text-[var(--navy)] truncate">{f.source}</span>
            </div>
            <div className="col-span-1 font-sans text-[10px] text-[var(--slate-light)] uppercase tracking-wider">{f.type}</div>
            <div className="col-span-2 font-sans text-[var(--slate)]">{f.cadence}</div>
            <div className="col-span-2 font-sans italic text-[var(--slate-light)]">
              {f.lastSync === "Never"
                ? <span className="text-[var(--coral)] not-italic font-semibold">Never connected</span>
                : <>Last sync {f.lastSync}</>}
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-sans text-[10px] text-[var(--slate-light)]">Completeness</span>
                <span className="font-sans font-semibold text-[11px]"
                      style={{ color: f.completeness === 0 ? "var(--coral)" : "var(--navy)" }}>
                  {f.completeness}%
                </span>
              </div>
              <CompletenessBar value={f.completeness || 4} status={f.status} />
            </div>
            <div className="col-span-1 text-right">
              {f.pipelineUsd && (
                <span className="pill pill-coral !text-[10px] !h-5 !px-2">{f.pipelineUsd}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {issues.length > 0 && (
        <div className="mt-4 p-3 rounded-sm border border-[var(--coral-faint)]" style={{ background: "var(--coral-faint)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow text-[var(--coral)] mb-1">Pipeline opportunity</div>
              <div className="font-serif italic text-[14px] text-[var(--ink)] leading-snug">
                {issues.length} feeds on this layer would lift confidence and reduce diagnostic uncertainty.
                Routing to the Different Day engagement pipeline.
              </div>
            </div>
            <a className="font-sans text-[11px] text-[var(--coral)] hover:text-[var(--navy)] whitespace-nowrap mt-1 flex items-center gap-1 cursor-pointer">
              View pipeline <ArrowRight size={12} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

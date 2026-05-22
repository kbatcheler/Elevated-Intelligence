import { CheckCircle2, Loader2, Zap, Globe, Circle, AlertTriangle, SkipForward } from "lucide-react";
import { useCompany, type SeedStep, type SeedStepStatus } from "../context/CompanyContext";

// Boot splash. Two modes:
//
// 1. Live seed flow (seedFlow present) — driven by CompanyPicker as real work
//    progresses. Every step's status and inline stats reflect a genuine
//    network round-trip or sync computation: homepage fetch, identify call,
//    seed call, narrative indexing, brief prefetch. No fake setTimeout
//    sequencing. The splash will not auto-close while work is in flight.
//
// 2. Library switch (seedFlow null) — the user picked a saved profile so
//    there's no live work to show; the splash renders a compact "loaded
//    saved profile" view with the historical receipt from when the profile
//    was first seeded.

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}
function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}
function formatInt(n: number): string {
  return n.toLocaleString();
}
function brandModel(_raw: string): string {
  return "DifferentDay AI · core";
}

export default function CompanyBootSplash() {
  const { bootSplash, dismissBootSplash } = useCompany();
  if (!bootSplash?.open) return null;

  const { profileName, meta, seedFlow } = bootSplash;
  const liveMode = !!seedFlow;
  const anyRunning  = !!seedFlow && seedFlow.some(s => s.status === "running");
  const allTerminal = !seedFlow || seedFlow.every(s => s.status === "done" || s.status === "skipped" || s.status === "failed");
  const anyFailed   = !!seedFlow && seedFlow.some(s => s.status === "failed");
  // The dismiss button must appear whenever the user could otherwise be
  // trapped: the flow finished, OR a failure has parked it (nothing is in
  // flight to wait on). Without this, a failed identify call leaves the
  // splash undismissable because remaining steps stay "pending" forever.
  const canDismiss = liveMode && (allTerminal || (anyFailed && !anyRunning));

  return (
    <div role="status" aria-live="polite" aria-label="Seeding company intelligence"
         className="fixed inset-0 z-[70] flex items-center justify-center px-6 py-8 overflow-y-auto"
         style={{ background: "rgba(15,26,51,0.92)" }}>
      <div className="w-[680px] max-w-full">
        <div className="text-center mb-6">
          <div className="eyebrow text-[var(--gold-light)] mb-2">Different Day · Elevated Intelligence</div>
          <h1 className="font-serif font-semibold text-[34px] leading-[1.05] text-[var(--cream)] mb-2">
            {liveMode ? "Seeding the framework for" : "Loading saved framework for"}
          </h1>
          <div className="font-serif font-bold text-[40px] leading-tight" style={{ color: "var(--gold-light)" }}>
            {profileName}
          </div>
        </div>

        {liveMode ? (
          <ul className="space-y-2">
            {seedFlow!.map((s, i) => <StepRow key={i} step={s} />)}
          </ul>
        ) : (
          <div className="text-center font-serif italic text-[13px] text-[var(--cream)]/70 py-3">
            No live fetch this time — receipts below come from the original seed.
          </div>
        )}

        {/* Final summary receipt — shown only after the flow is complete OR
            for library switches. Matches the brand of the seed _meta. */}
        {meta && (!liveMode || allTerminal) && (
          <div className="mt-5 p-4 rounded-sm"
               style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.30)" }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap size={12} strokeWidth={2} style={{ color: "var(--gold-light)" }} />
              <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--gold-light)]">
                {liveMode ? "Final receipt · this seed" : "Original seed receipt"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5">
              <Stat label="Engine"          value={brandModel(meta.model)} mono />
              <Stat label="Seed round-trip" value={formatDuration(meta.durationMs)} mono />
              <Stat label="Tokens in/out"   value={
                meta.inputTokens !== null && meta.outputTokens !== null
                  ? `${formatInt(meta.inputTokens)} → ${formatInt(meta.outputTokens)}`
                  : "—"
              } mono />
              <Stat label="Payload"         value={formatBytes(meta.bytesReturned)} mono />
              <Stat label="Vocab tokens"    value={formatInt(meta.vocabCount)} mono />
              <Stat label="Headline metrics" value={formatInt(meta.headlinesCount)} mono />
            </div>
            {meta.grounding && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(212,175,55,0.20)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Globe size={11} strokeWidth={2}
                         style={{ color: meta.grounding.ok ? "var(--gold-light)" : "rgba(255,255,255,0.45)" }} />
                  <span className="font-sans text-[10px] uppercase tracking-wider"
                        style={{ color: meta.grounding.ok ? "var(--gold-light)" : "rgba(255,255,255,0.50)" }}>
                    {meta.grounding.ok ? "Grounded on live homepage fetch" : "Homepage fetch unavailable · proceeded from memory"}
                  </span>
                </div>
                {meta.grounding.ok ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
                    <Stat label="Source"         value={meta.grounding.domain} mono />
                    <Stat label="HTML fetched"   value={formatBytes(meta.grounding.bytesFetched)} mono />
                    <Stat label="Text extracted" value={formatBytes(meta.grounding.bytesExtracted)} mono />
                    <Stat label="Fetch time"     value={formatDuration(meta.grounding.fetchMs)} mono />
                  </div>
                ) : (
                  <div className="font-sans text-[11px] text-[var(--cream)]/55 italic">
                    {meta.grounding.domain} returned no usable content — the brief leans on training-data knowledge and should be reviewed before the meeting.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-5 font-serif italic text-[12px] text-[var(--cream)]/55">
          {liveMode
            ? (allTerminal
                ? (anyFailed
                    ? "Some steps failed — the framework is still usable but receipts above show the gaps."
                    : "All work above is real and just happened. Splash will close in a moment.")
                : (anyFailed && !anyRunning
                    // Parked failure — some step failed and nothing's in flight,
                    // but later steps were never reached. Don't claim work is
                    // still progressing.
                    ? "The flow stopped on a failed step — dismiss to return to the picker and try again."
                    : "Each step advances when its underlying call resolves — nothing here is faked."))
            : (meta ? "Receipt above is from when this profile was originally seeded." : "Saved profile loaded.")}
        </div>

        {/* Manual dismiss — appears whenever there's nothing in flight (either
            the flow finished cleanly, or a failure parked it). Critical
            escape hatch: without this, a failed identify call would leave
            the splash undismissable since remaining steps stay pending. */}
        {canDismiss && (
          <div className="text-center mt-3">
            <button onClick={dismissBootSplash}
                    className="font-sans text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-sm"
                    style={{ background: "var(--gold-light)", color: "var(--navy)", border: "1px solid var(--gold)" }}>
              {anyFailed && !allTerminal ? "Dismiss" : "Continue to report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Per-step row ────────────────────────────────────────────────────────────
function StepRow({ step }: { step: SeedStep }) {
  const tone = toneFor(step.status);
  return (
    <li className="flex items-start gap-3 px-4 py-2.5 rounded-sm"
        style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
      <span className="shrink-0 mt-0.5"><StatusIcon status={step.status} /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-sans text-[13px]" style={{ color: tone.label }}>{step.label}</span>
          <span className="font-sans text-[10px] uppercase tracking-wider shrink-0"
                style={{ color: tone.statusFg }}>
            {statusLabel(step.status)}
          </span>
        </div>
        {step.detail && (
          <div className="font-serif italic text-[11px] text-[var(--cream)]/60 mt-1 leading-snug">
            {step.detail}
          </div>
        )}
        {step.errorReason && (
          <div className="font-sans text-[11px] mt-1 leading-snug"
               style={{ color: "rgba(245,166,123,0.85)" }}>
            ⚠ {step.errorReason}
          </div>
        )}
        {step.stats && step.stats.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {step.stats.map((st, i) => (
              <span key={i} className="font-sans text-[10.5px] text-[var(--cream)]/75">
                <span className="text-[var(--cream)]/45">{st.label}</span>
                <span className="mx-1 text-[var(--cream)]/30">·</span>
                <span className="font-mono text-[var(--cream)]/90">{st.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: SeedStepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={16} strokeWidth={1.8} style={{ color: "var(--gold-light)" }} />;
    case "running":
      return <Loader2 size={16} strokeWidth={1.8} className="animate-spin" style={{ color: "var(--gold-light)" }} />;
    case "skipped":
      return <SkipForward size={14} strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.50)" }} />;
    case "failed":
      return <AlertTriangle size={14} strokeWidth={1.8} style={{ color: "rgb(245,166,123)" }} />;
    case "pending":
    default:
      return <Circle size={14} strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.22)" }} />;
  }
}

function statusLabel(s: SeedStepStatus): string {
  switch (s) {
    case "done":    return "Done";
    case "running": return "In flight";
    case "skipped": return "Skipped";
    case "failed":  return "Failed";
    case "pending":
    default:        return "Queued";
  }
}

function toneFor(s: SeedStepStatus): { bg: string; border: string; label: string; statusFg: string } {
  switch (s) {
    case "done":
      return {
        bg: "rgba(212,175,55,0.10)", border: "rgba(212,175,55,0.35)",
        label: "var(--cream)", statusFg: "var(--gold-light)",
      };
    case "running":
      return {
        bg: "rgba(212,175,55,0.07)", border: "rgba(212,175,55,0.45)",
        label: "var(--cream)", statusFg: "var(--gold-light)",
      };
    case "skipped":
      return {
        bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.12)",
        label: "rgba(255,255,255,0.65)", statusFg: "rgba(255,255,255,0.45)",
      };
    case "failed":
      return {
        bg: "rgba(245,166,123,0.10)", border: "rgba(245,166,123,0.50)",
        label: "var(--cream)", statusFg: "rgb(245,166,123)",
      };
    case "pending":
    default:
      return {
        bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.08)",
        label: "rgba(255,255,255,0.55)", statusFg: "rgba(255,255,255,0.40)",
      };
  }
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-sans text-[9px] uppercase tracking-wider text-[var(--cream)]/55 mb-0.5">{label}</div>
      <div className={"text-[13px] text-[var(--cream)] truncate " + (mono ? "font-mono" : "font-sans")}>{value}</div>
    </div>
  );
}

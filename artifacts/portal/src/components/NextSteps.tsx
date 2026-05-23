import { Clock, CalendarDays, CalendarRange, ArrowRight, User, Zap } from "lucide-react";
import { type NextStep } from "../data/nextSteps";
import { useApp } from "../context/AppContext";
import { useNarrative, useIsDefaultProfile } from "../context/CompanyContext";

// Prescriptive playbook — every layer answers "what do I do next?" at three
// time horizons. Each step has an owner, an effort estimate, and a named
// outcome. A Commit button drops the step straight into the action tray.

const HORIZONS = [
  { key: "now",   icon: Clock,         label: "Now · this week",     accent: "var(--coral)", eyebrow: "DO TODAY"        },
  { key: "week",  icon: CalendarDays,  label: "Next 7 days",         accent: "var(--amber)", eyebrow: "NEXT 7 DAYS"     },
  { key: "month", icon: CalendarRange, label: "Next 30 days",        accent: "var(--teal)",  eyebrow: "NEXT 30 DAYS"    },
] as const;

export default function NextSteps({ layerKey, layerTitle }: { layerKey: string; layerTitle: string }) {
  const { NEXT_STEPS } = useNarrative();
  const isDefault = useIsDefaultProfile();
  const block = NEXT_STEPS[layerKey];
  if (!block) return null;
  // Every NEXT_STEPS entry is hand-authored Mercer copy (Home Depot promo,
  // Phoenix DC shifts, Kelly Services MSA, Greater Plains Co. AR holds). The
  // vocab swap layer cannot translate brand-specific entities, so for any
  // non-default profile we suppress this block rather than render wrong-brand
  // playbooks. The layer's recommended-actions card above is already LLM-
  // overridden per seeded company, so the user still sees what to do.
  if (!isDefault) return null;
  const { committed, commitAction } = useApp();

  return (
    <div className="card !p-0 overflow-hidden card-accent-navy">
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--cream-dark)]"
           style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="flex items-center gap-3">
          <Zap size={14} strokeWidth={1.8} className="text-[var(--gold-light)]" />
          <span className="eyebrow text-[var(--gold-light)]">Prescriptive next steps</span>
          <span className="font-sans italic text-[12px] opacity-70">three time horizons · owner-assigned · outcome-bound</span>
        </div>
        <span className="font-sans text-[11px] opacity-70 italic">Tap commit to land any step in the action tray</span>
      </div>

      {/* Three time horizons. Stacks to one column on tablet and below so
          card copy never gets squeezed to one word per line. NextSteps now
          renders full-width below the recommendation grid, so the lg
          breakpoint reliably gives each horizon ~300+ px of room. */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {HORIZONS.map((h, i) => {
          const step = block[h.key as keyof typeof block] as NextStep;
          const Icon = h.icon;
          const isCommitted = committed.some(c => c.layer === layerKey && c.title === step.title);
          return (
            <div key={h.key}
                 className={"p-5 relative " + (i > 0 ? "border-t lg:border-t-0 lg:border-l border-[var(--cream-dark)]" : "")}
                 style={{
                   background: i === 0 ? "var(--coral-faint)" : i === 1 ? "var(--amber-faint)" : "var(--teal-faint)",
                 }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} strokeWidth={1.8} style={{ color: h.accent }} />
                <span className="font-sans font-bold text-[10px] uppercase tracking-[0.16em]" style={{ color: h.accent }}>
                  {h.eyebrow}
                </span>
              </div>

              {/* Title + detail */}
              <div className="font-serif font-semibold text-[16px] text-[var(--navy)] leading-tight mb-2">{step.title}</div>
              <p className="font-serif text-[13px] leading-[1.55] text-[var(--ink)] mb-3">{step.detail}</p>

              {/* Meta strip */}
              <div className="space-y-1.5 mb-3 pb-3 border-b border-[var(--cream-dark)]">
                <Meta icon={<User size={11} strokeWidth={1.8} />} label="Owner" value={step.owner} />
                <Meta icon={<Clock size={11} strokeWidth={1.8} />} label="Effort" value={step.effort} />
                {step.depends && (
                  <Meta icon={<ArrowRight size={11} strokeWidth={1.8} />} label="Depends on" value={step.depends} italic />
                )}
              </div>

              {/* Outcome */}
              <div className="mb-3">
                <div className="eyebrow text-[var(--slate-light)] mb-1">Expected outcome</div>
                <div className="font-sans text-[12px] text-[var(--navy)] font-semibold leading-snug">{step.outcome}</div>
              </div>

              {/* Commit */}
              {isCommitted ? (
                <div className="font-sans font-bold text-[10px] uppercase tracking-wider text-[var(--teal)] flex items-center gap-1">
                  ✓ Committed to tray
                </div>
              ) : (
                <button
                  onClick={() => commitAction({
                    layer: layerKey,
                    layerTitle,
                    title: step.title,
                    detail: step.detail,
                    impact: step.outcome,
                    owner: step.owner,
                    due: h.label,
                  })}
                  className="w-full text-center px-3 py-1.5 rounded-sm font-sans text-[11px] font-bold uppercase tracking-wider border transition-colors"
                  style={{
                    borderColor: h.accent,
                    color: h.accent,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = h.accent; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = h.accent; }}
                >
                  Commit to action tray
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ icon, label, value, italic }: { icon: React.ReactNode; label: string; value: string; italic?: boolean }) {
  // Two-line layout: tiny eyebrow row (icon + LABEL) above the value. This
  // beats the prior single-row "icon · LABEL · value" layout because long
  // values like "Pricing layer signs off margin floor (gross ≥ 18%)" no
  // longer have to share horizontal space with the label — they get the
  // full card width and break at word boundaries, not character by character.
  return (
    <div className="leading-snug">
      <div className="flex items-center gap-1.5">
        <span className="text-[var(--slate-light)] shrink-0">{icon}</span>
        <span className="eyebrow text-[var(--slate-light)]">{label}</span>
      </div>
      <div className={"font-sans text-[12px] text-[var(--navy)] mt-0.5 break-words " + (italic ? "italic text-[var(--slate)]" : "font-semibold")}>
        {value}
      </div>
    </div>
  );
}

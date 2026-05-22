import { useEffect, useLayoutEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

// ----------------------------------------------------------------------------
// Coachmark / spotlight tour.
//
// First-visit education for the portal. Each step targets an element by
// data-tour selector and renders:
//   1. A dim overlay over the rest of the screen (box-shadow inset trick on
//      a transparent rect matching the target rect — keeps the target crisp
//      while dimming everything else, with no clip-path).
//   2. A gold ring around the target.
//   3. A popover anchored to the target with title + body + nav buttons.
//
// We don't lock pointer events on the target — clicking the target is fine
// and dismisses the tour, which is the natural behavior an attentive user
// would expect. Skip and Done dismiss explicitly. The "seen" flag is
// localStorage-keyed so it persists between sessions; the "?" help button in
// the header re-triggers regardless.
// ----------------------------------------------------------------------------

const TOUR_FLAG = "dd-tour-seen-v1";

interface Step {
  selector: string;
  title: string;
  body: string;
}

// Ordered tour steps. If a step's selector isn't in the DOM at runtime
// (e.g. the user closed something), the step is skipped silently.
const STEPS: Step[] = [
  {
    selector: '[data-tour="brief"]',
    title: "Morning brief",
    body: "The daily executive read. One page, ready before 7am — the lede, the deltas, the actions.",
  },
  {
    selector: '[data-tour="sidebar"]',
    title: "Intelligence layers",
    body: "Each entry here is a separate diagnosis of one slice of the business. The dots show health at a glance.",
  },
  {
    selector: '[data-tour="chat"]',
    title: "Ask Different Day",
    body: "Conversational interface to every signal — pre-grounded in the seeded company. Try the rotating suggestions.",
  },
  {
    selector: '[data-tour="switch"]',
    title: "Try another company",
    body: "Reseed the portal with any company — typed or one of the showcase chips — and watch the whole product re-skin live.",
  },
];

interface Props {
  /** Controlled "force open" flag from the header help button. */
  forceOpen: boolean;
  /** Notify parent when the tour closes so it can reset forceOpen. */
  onClose: () => void;
}

export default function CoachmarkTour({ forceOpen, onClose }: Props) {
  // Open if forced by the help button OR if the seen-flag is missing.
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // First-visit auto-open: wait two animation frames so the rest of the
  // shell has time to mount, then check the flag.
  useEffect(() => {
    if (forceOpen) {
      setStepIdx(0);
      setOpen(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (!localStorage.getItem(TOUR_FLAG)) {
            setStepIdx(0);
            setOpen(true);
          }
        } catch { /* localStorage might be blocked; just skip the tour */ }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [forceOpen]);

  // Resolve current step's target rect. Re-measure on resize and on each
  // step change. If selector misses, advance to the next step.
  useLayoutEffect(() => {
    if (!open) return;
    const step = STEPS[stepIdx];
    if (!step) {
      finish();
      return;
    }
    const measure = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        // Step's target is gone — advance silently.
        setStepIdx(i => i + 1);
        return;
      }
      // Bring the target into view if it's been scrolled out of the
      // sidebar (especially the chat launcher which sits at bottom).
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" as ScrollBehavior });
      setRect(el.getBoundingClientRect());
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, stepIdx]);

  // Esc to dismiss.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIdx]);

  function next() {
    if (stepIdx >= STEPS.length - 1) { finish(); return; }
    setStepIdx(i => i + 1);
  }
  function prev() {
    if (stepIdx === 0) return;
    setStepIdx(i => Math.max(0, i - 1));
  }
  function finish() {
    setOpen(false);
    try { localStorage.setItem(TOUR_FLAG, "1"); } catch { /* ignore */ }
    onClose();
  }

  if (!open || !rect) return null;

  const step = STEPS[stepIdx];
  if (!step) return null;

  // Position the popover. Prefer right of the target; flip to left if it
  // would overflow; flip to below if neither side has room.
  const pad = 14;
  const POP_W = 320;
  const POP_H = 180;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  let popLeft = rect.right + pad;
  let popTop = rect.top;
  if (popLeft + POP_W > winW - 16) {
    popLeft = rect.left - POP_W - pad;
  }
  if (popLeft < 16) {
    // Neither side fits — drop below the target, centered horizontally.
    popLeft = Math.max(16, Math.min(winW - POP_W - 16, rect.left + rect.width / 2 - POP_W / 2));
    popTop = rect.bottom + pad;
  }
  // Keep popover within viewport vertically.
  if (popTop + POP_H > winH - 16) popTop = Math.max(16, winH - POP_H - 16);

  // Inflate the spotlight rect so the gold ring breathes around the target.
  const HALO = 6;
  const spotLeft = rect.left - HALO;
  const spotTop = rect.top - HALO;
  const spotW = rect.width + HALO * 2;
  const spotH = rect.height + HALO * 2;

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog" aria-label="Product tour">
      {/* Spotlight: a transparent rectangle with a giant inset shadow paints
          the dim layer everywhere except inside this rect. pointer-events:none
          so the target underneath stays clickable. */}
      <div
        style={{
          position: "fixed",
          left: spotLeft,
          top: spotTop,
          width: spotW,
          height: spotH,
          borderRadius: 8,
          boxShadow: "0 0 0 9999px rgba(15,26,51,0.62), 0 0 0 2px var(--gold), 0 0 24px 4px rgba(212,175,55,0.45)",
          pointerEvents: "none",
          transition: "all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />

      {/* Click-catcher for the dim area — dismisses the tour. Sits below
          the popover but above the page. Excludes the spotlight area. */}
      <div className="absolute inset-0" onClick={finish} style={{ cursor: "pointer" }} />

      {/* Popover */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: popLeft,
          top: popTop,
          width: POP_W,
          background: "var(--cream)",
          border: "1px solid var(--cream-dark)",
          borderLeft: "3px solid var(--gold)",
          boxShadow: "0 20px 50px rgba(15,26,51,0.4)",
          borderRadius: 4,
          transition: "all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="p-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} strokeWidth={2} className="text-[var(--gold)]" />
            <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-[var(--gold)] font-semibold">
              Tour · {stepIdx + 1} of {STEPS.length}
            </span>
          </div>
          <button onClick={finish} aria-label="Close tour"
                  className="text-[var(--slate-light)] hover:text-[var(--navy)] transition-colors -mr-1 -mt-1">
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
        <h3 className="font-serif font-semibold text-[17px] text-[var(--navy)] leading-tight mb-1.5">
          {step.title}
        </h3>
        <p className="font-serif italic text-[13px] text-[var(--slate)] leading-relaxed mb-4">
          {step.body}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className="h-1 rounded-full transition-all"
                    style={{
                      width: i === stepIdx ? 16 : 6,
                      background: i === stepIdx ? "var(--gold)" : "var(--cream-dark)",
                    }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {stepIdx > 0 && (
              <button onClick={prev}
                      className="px-2.5 py-1 rounded-sm font-sans text-[11px] text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--cream-light)] transition-colors flex items-center gap-1">
                <ArrowLeft size={11} strokeWidth={1.8} /> Back
              </button>
            )}
            <button onClick={finish}
                    className="px-2.5 py-1 rounded-sm font-sans text-[11px] text-[var(--slate-light)] hover:text-[var(--slate)] transition-colors">
              Skip
            </button>
            <button onClick={next}
                    className="px-3 py-1.5 rounded-sm font-sans text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    style={{ background: "var(--navy)", color: "var(--cream)" }}>
              {stepIdx === STEPS.length - 1 ? "Done" : "Next"}
              {stepIdx < STEPS.length - 1 && <ArrowRight size={11} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

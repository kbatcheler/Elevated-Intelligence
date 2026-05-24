import { useState } from "react";
import { MessageSquareQuote, ArrowRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { PRESENTER_TRACKS } from "../data/presenterTracks";

// The strip docks below the global SignalTicker when Presenter mode is on.
// It is collapsible (so the demo can shift into "let them drive" mode without
// flipping the toggle off) and intentionally loud, gold left-rule and warm
// cream backdrop so an operator never confuses it with product chrome.

interface Props {
  routeKey: string;
  onNavigate: (key: string) => void;
  onOpenMorningBrief: () => void;
}

export default function PresenterStrip({ routeKey, onNavigate, onOpenMorningBrief }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const track = PRESENTER_TRACKS[routeKey];

  // Routes without an authored track (a rare miss) get a generic strip so the
  // operator still sees presenter chrome and doesn't think the toggle broke.
  if (!track) {
    return (
      <div className="border-b" style={{ background: "var(--gold-faint, #FBF3DC)", borderColor: "var(--gold)" }}>
        <div className="px-6 py-2 flex items-center gap-3 text-[12px]">
          <span className="font-sans font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm" style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>
            Presenter
          </span>
          <span className="font-sans italic text-[var(--slate)]">No track authored for this page yet, jump back to the Sales Playbook for the spine.</span>
          <button onClick={() => onNavigate("sales-playbook")} className="ml-auto font-sans text-[11px] text-[var(--coral)] hover:underline">
            Open Sales Playbook →
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (track.next.routeKey === "morning-brief") onOpenMorningBrief();
    else onNavigate(track.next.routeKey);
  };

  return (
    <div className="border-b" style={{ background: "var(--gold-faint, #FBF3DC)", borderColor: "var(--gold)", borderLeft: "4px solid var(--gold)" }}>
      <div className="px-6 py-2.5">
        {/* Top row: badge, frame, collapse toggle */}
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm shrink-0" style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>
            Presenter
          </span>
          <span className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{track.frame}</span>
          <button onClick={() => setCollapsed(c => !c)}
                  className="ml-auto flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-[var(--slate)] hover:text-[var(--navy)]">
            {collapsed ? <><ChevronDown size={11} /> expand</> : <><ChevronUp size={11} /> collapse</>}
          </button>
        </div>

        {!collapsed && (
          <div className="grid grid-cols-12 gap-4 mt-2.5">
            {/* Say */}
            <div className="col-span-5 flex gap-2">
              <Sparkles size={12} strokeWidth={1.8} className="text-[var(--coral)] shrink-0 mt-1" />
              <div>
                <div className="eyebrow text-[var(--slate-light)] mb-0.5">Say this</div>
                <div className="font-serif italic text-[13px] text-[var(--ink)] leading-snug">"{track.say}"</div>
              </div>
            </div>

            {/* Pushback */}
            <div className="col-span-4 flex gap-2 pl-4 border-l border-[var(--gold)] border-opacity-40">
              <MessageSquareQuote size={12} strokeWidth={1.8} className="text-[var(--slate)] shrink-0 mt-1" />
              <div className="min-w-0">
                <div className="eyebrow text-[var(--slate-light)] mb-0.5">If they push back</div>
                <div className="font-sans text-[11px] text-[var(--slate)] italic">"{track.pushback.q}"</div>
                <div className="font-sans text-[12px] text-[var(--navy)] mt-0.5">{track.pushback.a}</div>
              </div>
            </div>

            {/* Next */}
            <div className="col-span-3 pl-4 border-l border-[var(--gold)] border-opacity-40 flex flex-col">
              <div className="eyebrow text-[var(--slate-light)] mb-1">Take them next to</div>
              <button onClick={handleNext}
                      className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-sm border border-[var(--coral)] hover:bg-[var(--coral)] transition-colors">
                <span className="font-sans font-semibold text-[12px] text-[var(--coral)] group-hover:text-white truncate text-left">
                  {track.next.label}
                </span>
                <ArrowRight size={12} strokeWidth={2} className="text-[var(--coral)] group-hover:text-white shrink-0" />
              </button>
              <div className="font-sans italic text-[10px] text-[var(--slate-light)] mt-1 leading-tight">{track.next.rationale}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

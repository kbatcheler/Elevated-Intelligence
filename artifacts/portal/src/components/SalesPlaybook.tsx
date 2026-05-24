import { BookOpen, ArrowRight, MessageSquareQuote, Clock, Sparkles, ShieldAlert, Layers, BarChart3 } from "lucide-react";
import { PRESENTER_SPINE, PRESENTER_TRACKS, PRESENTER_TIMES } from "../data/presenterTracks";
import { useIsDefaultProfile, useCompany } from "../context/CompanyContext";

interface Props {
  onNavigate: (key: string) => void;
}

const OBJECTIONS: { tag: string; q: string; a: string; icon: typeof ShieldAlert }[] = [
  {
    tag: "Tooling overlap",
    q: "We already have a BI stack, Tableau, dbt, the works. How is this different?",
    a: "BI shows you the number. We show you the reasoning chain underneath it, fourteen operating layers fused into one diagnosis per week.",
    icon: BarChart3,
  },
  {
    tag: "AI scepticism",
    q: "Isn't this just a wrapper over GPT?",
    a: "It's a deterministic pipeline with five named agents, perceive, hypothesise, challenge, narrate, score, and a confidence number on every output.",
    icon: Sparkles,
  },
  {
    tag: "Data readiness",
    q: "Our data isn't clean enough for something like this.",
    a: "Day-one diagnosis runs off your last quarter's exports. We surface the data gaps as part of the first finding, not as a precondition.",
    icon: Layers,
  },
  {
    tag: "Pricing",
    q: "What does this cost?",
    a: "Engagements scope at 80k to 320k per quarter depending on layer count and data maturity. Diagnosis-first, then a 30/60/90 plan if it earns it.",
    icon: ShieldAlert,
  },
  {
    tag: "Roi proof",
    q: "Show me actual outcomes, not slides.",
    a: "The track-record page lists 12 closed engagements with named operators and named dollar outcomes, three of them in the last 18 months in mid-market industrials.",
    icon: BookOpen,
  },
  {
    tag: "Build vs buy",
    q: "Why wouldn't we build this internally?",
    a: "You could. It took us four years and a dedicated reasoning team. The 90-day diagnosis pays for the buy decision either way.",
    icon: Clock,
  },
  {
    tag: "Trust",
    q: "How do we trust an AI's confidence number?",
    a: "Every confidence score is back-linked to its evidence chain. Open any layer, click the confidence pill, the receipts are right there.",
    icon: ShieldAlert,
  },
  {
    tag: "Security",
    q: "Where does our data live?",
    a: "Single-tenant deployment in your VPC, or our SOC2 Type II environment if you prefer managed. Nothing leaves a named perimeter.",
    icon: ShieldAlert,
  },
];

export default function SalesPlaybook({ onNavigate }: Props) {
  const isDefault = useIsDefaultProfile();
  const { profile } = useCompany();
  const totalSec = PRESENTER_SPINE.reduce((s, k) => s + (PRESENTER_TIMES[k] ?? 0), 0);
  const mins = Math.round(totalSec / 60);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="card card-accent-gold">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="eyebrow text-[var(--gold)] mb-1">Internal · sales playbook</div>
            <h1 className="font-serif text-[28px] font-semibold text-[var(--navy)] tracking-tight leading-tight">
              The twelve-minute demo, on the wall
            </h1>
            <p className="font-serif italic text-[15px] text-[var(--ink)] mt-2 max-w-[760px] leading-snug">
              Eight stops, in order. Turn on Presenter mode, walk the spine, recover the room at any objection. Every stop has a frame, a thing to say, and a deliberate next click.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-sans font-bold text-[36px] text-[var(--navy)] tabular-nums leading-none">{mins}</div>
            <div className="eyebrow text-[var(--slate-light)] mt-1">minutes end to end</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--cream-dark)] flex items-center gap-3 text-[12px] flex-wrap">
          <span className="pill pill-gold">Shift Cmd P toggles Presenter</span>
          <span className="pill pill-navy">8 stops</span>
          <span className="pill pill-teal">No notes required</span>
          <span className="font-sans italic text-[var(--slate)] ml-auto">Hidden on prospect tenants by default, this page is for the demo team.</span>
        </div>
      </div>

      {!isDefault && (
        <div className="card card-accent-coral">
          <div className="flex items-start gap-3">
            <ShieldAlert size={16} strokeWidth={1.8} className="text-[var(--coral)] mt-0.5" />
            <div>
              <div className="font-sans font-semibold text-[14px] text-[var(--coral)]">Preview mode, {profile.name}</div>
              <div className="font-serif italic text-[13px] text-[var(--ink)] mt-1 leading-snug">
                You are looking at the demo spine through the {profile.name} preview. Numbers, objections, and frames stay anchored to the canonical Meridian Industrial diagnosis on purpose, the spine is universal.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The 8-step spine timeline */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[20px] font-semibold text-[var(--navy)]">The spine, eight stops</h2>
          <span className="font-sans italic text-[12px] text-[var(--slate-light)]">click any stop to walk the demo from there</span>
        </div>
        <div className="space-y-3">
          {PRESENTER_SPINE.map((key, idx) => {
            const t = PRESENTER_TRACKS[key];
            if (!t) return null;
            const seconds = PRESENTER_TIMES[key] ?? 60;
            return (
              <div key={key} className="card card-accent-navy hover:border-[var(--gold)] transition-colors">
                <div className="flex gap-4">
                  {/* Step rail */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center font-serif font-semibold text-[16px]"
                         style={{ background: "var(--navy)", color: "var(--gold-light)" }}>
                      {idx + 1}
                    </div>
                    {idx < PRESENTER_SPINE.length - 1 && (
                      <div className="w-px flex-1 mt-2" style={{ background: "var(--cream-dark)" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">{routeLabel(key)}</div>
                        <div className="font-sans italic text-[12px] text-[var(--slate)] mt-0.5">{t.frame}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-sans tabular-nums text-[11px] text-[var(--slate-light)] flex items-center gap-1">
                          <Clock size={11} strokeWidth={1.8} /> ~{seconds}s
                        </span>
                        <button onClick={() => { onNavigate(key === "morning-brief" ? "business-performance" : key); }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-sm border border-[var(--coral)] text-[var(--coral)] hover:bg-[var(--coral)] hover:text-white text-[11px] font-sans transition-colors">
                          Go <ArrowRight size={11} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 mt-3 pt-3 border-t border-[var(--cream-dark)]">
                      <div className="col-span-6 flex gap-2">
                        <Sparkles size={11} strokeWidth={1.8} className="text-[var(--coral)] shrink-0 mt-1" />
                        <div>
                          <div className="eyebrow text-[var(--slate-light)] mb-0.5">Say this</div>
                          <div className="font-serif italic text-[12.5px] text-[var(--ink)] leading-snug">"{t.say}"</div>
                        </div>
                      </div>
                      <div className="col-span-6 flex gap-2 pl-3 border-l border-[var(--cream-dark)]">
                        <ArrowRight size={11} strokeWidth={1.8} className="text-[var(--gold)] shrink-0 mt-1" />
                        <div className="min-w-0">
                          <div className="eyebrow text-[var(--slate-light)] mb-0.5">Then take them to</div>
                          <div className="font-sans font-semibold text-[12.5px] text-[var(--navy)]">{t.next.label}</div>
                          <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-0.5 leading-snug">{t.next.rationale}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objections deck */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[20px] font-semibold text-[var(--navy)]">If they push back</h2>
          <span className="font-sans italic text-[12px] text-[var(--slate-light)]">the eight pushbacks worth memorising</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {OBJECTIONS.map((o, i) => {
            const Icon = o.icon;
            return (
              <div key={i} className="card card-accent-coral">
                <div className="flex items-start gap-2 mb-2">
                  <Icon size={14} strokeWidth={1.8} className="text-[var(--coral)] shrink-0 mt-0.5" />
                  <div>
                    <div className="eyebrow text-[var(--coral)]">{o.tag}</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <MessageSquareQuote size={12} strokeWidth={1.8} className="text-[var(--slate-light)] shrink-0 mt-1" />
                  <div className="font-sans italic text-[12.5px] text-[var(--slate)] leading-snug">"{o.q}"</div>
                </div>
                <div className="pt-3 border-t border-[var(--cream-dark)] font-serif text-[13px] text-[var(--ink)] leading-snug">
                  {o.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer pointer */}
      <div className="card card-accent-amber">
        <div className="flex items-center gap-3">
          <BookOpen size={14} strokeWidth={1.8} className="text-[var(--amber)]" />
          <div className="font-sans font-semibold text-[13px] text-[var(--navy)]">First-week demo checklist</div>
          <span className="ml-auto font-sans italic text-[11px] text-[var(--slate)]">tick before your first prospect call</span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-sans text-[12.5px] text-[var(--slate)]">
          <li>• Run the spine end-to-end with Presenter on, once.</li>
          <li>• Memorise the four objections you find hardest.</li>
          <li>• Switch into a non-default tenant to feel preview mode.</li>
          <li>• Open the morning brief from stop one without notes.</li>
          <li>• Move the WhatIf sliders on pricing-margin in front of the team.</li>
          <li>• Hand the war-room controls to a teammate at stop eight.</li>
        </ul>
      </div>
    </div>
  );
}

function routeLabel(key: string): string {
  const map: Record<string, string> = {
    "morning-brief":              "Morning brief",
    "business-performance":       "Business performance",
    "pricing-margin":             "Pricing and margin",
    "intelligence-architecture":  "Intelligence architecture",
    "dependency-graph":           "Cross-layer map",
    "engagement-pipeline":        "Engagement pipeline",
    "track-record":               "Outcome track record",
    "scenario-warroom":           "Scenario war-room",
  };
  return map[key] ?? key;
}

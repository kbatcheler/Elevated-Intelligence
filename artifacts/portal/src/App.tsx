import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, TrendingUp, Crosshair, Users, Megaphone,
  Truck, Tag, GitBranch, Target, UserCog, Cpu, ChevronDown, Briefcase,
  Banknote, Receipt, UserPlus, Network, Newspaper, CheckSquare, Lock,
} from "lucide-react";
import { LAYERS } from "./data/layers";
import Layer from "./components/Layer";
import Narrator from "./narrator/Narrator";
import Architecture from "./architecture/Architecture";
import SystemHeartbeat from "./components/SystemHeartbeat";
import EngagementPipeline from "./pipeline/EngagementPipeline";
import { ANOMALIES } from "./data/signals";
import SignalTicker from "./components/SignalTicker";
import AnomalyInbox from "./components/AnomalyInbox";
import EvidencePanel from "./components/EvidencePanel";
import CommittedTray from "./components/CommittedTray";
import DependencyGraph from "./dependency/DependencyGraph";
import MorningBrief from "./brief/MorningBrief";
import ChatAssistant from "./components/ChatAssistant";
import { useApp } from "./context/AppContext";

type NavItem = { key: string; label: string; group: string; icon: any; status: "good" | "warn" | "bad" };

const NAV: NavItem[] = [
  { key: "business-performance",     label: "Business performance",     group: "Executive",      icon: BarChart3, status: "warn" },
  { key: "finance",                  label: "Finance",                  group: "Executive",      icon: Banknote,   status: "bad"  },
  { key: "demand-intelligence",      label: "Demand intelligence",      group: "Market-facing",  icon: TrendingUp, status: "bad"  },
  { key: "competitive-intelligence", label: "Competitive intelligence", group: "Market-facing",  icon: Crosshair,  status: "bad"  },
  { key: "customer-intelligence",    label: "Customer intelligence",    group: "Market-facing",  icon: Users,      status: "warn" },
  { key: "brand-social",             label: "Brand and social",         group: "Market-facing",  icon: Megaphone,  status: "warn" },
  { key: "supply-chain",             label: "Supply chain",             group: "Operational",    icon: Truck,      status: "bad"  },
  { key: "pricing-margin",           label: "Pricing and margin",       group: "Operational",    icon: Tag,        status: "warn" },
  { key: "sales-pipeline",           label: "Sales pipeline",           group: "Operational",    icon: GitBranch,  status: "bad"  },
  { key: "marketing-performance",    label: "Marketing performance",    group: "Operational",    icon: Target,     status: "warn" },
  { key: "people-operations",        label: "People and operations",    group: "Operational",    icon: UserCog,    status: "bad"  },
  { key: "receivables",              label: "Receivables and invoicing", group: "Operational",    icon: Receipt,    status: "bad"  },
  { key: "talent-hr",                label: "Talent and HR",            group: "Operational",    icon: UserPlus,   status: "bad"  },
  { key: "intelligence-architecture",label: "Intelligence architecture",group: "System",         icon: Cpu,        status: "good" },
  { key: "engagement-pipeline",      label: "Engagement pipeline",      group: "System",         icon: Briefcase,  status: "warn" },
  { key: "dependency-graph",         label: "Cross-layer map",          group: "System",         icon: Network,    status: "good" },
  { key: "committed-actions",        label: "Committed actions",        group: "System",         icon: CheckSquare,status: "good" },
];

const GROUPS = ["Executive", "Market-facing", "Operational", "System"] as const;

const statusColor = (s: NavItem["status"]) =>
  s === "good" ? "var(--teal)" : s === "warn" ? "var(--amber)" : "var(--coral)";

export default function App() {
  const [active, setActive] = useState("business-performance");
  const [highlight, setHighlight] = useState<string | undefined>(undefined);
  const [clientOpen, setClientOpen] = useState(false);
  const {
    setActiveLayer, openInbox, openBrief, briefOpen, committed,
  } = useApp();

  const layer = useMemo(() => LAYERS.find(l => l.key === active), [active]);

  useEffect(() => {
    setActiveLayer(active);
  }, [active, setActiveLayer]);

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(undefined), 2500);
    return () => clearTimeout(t);
  }, [highlight, active]);

  const handleNavigate = (key: string, field?: string) => {
    setActive(key);
    setHighlight(field || "header");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <header
        className="h-[60px] shrink-0 flex items-center justify-between px-8 border-b relative"
        style={{ background: "var(--navy)", borderColor: "var(--navy-deep)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
          <span className="font-serif text-[20px] font-semibold text-[var(--cream)] tracking-tight">Different Day</span>
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-[var(--gold-light)] ml-1">Elevated Intelligence</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setClientOpen(o => !o)}
            className="flex items-center gap-3 px-4 py-1.5 rounded-sm hover:bg-white/10 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <span className="font-sans text-[12px] text-[var(--cream)]">Q3 2026</span>
            <span className="opacity-30 text-[var(--cream)]">·</span>
            <span className="font-sans text-[12px] text-[var(--cream)]">Mercer Group</span>
            <span className="opacity-30 text-[var(--cream)]">·</span>
            <span className="font-sans text-[12px] text-[var(--cream)]">All channels</span>
            <ChevronDown size={14} strokeWidth={1.5} className="text-[var(--gold-light)] ml-1" />
          </button>
          {clientOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setClientOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 rounded-sm overflow-hidden z-40"
                   style={{ background: "var(--paper)", border: "1px solid var(--cream-dark)", boxShadow: "0 8px 24px rgba(15,26,51,0.18)" }}>
                <div className="px-4 py-2 eyebrow text-[var(--slate-light)]" style={{ background: "var(--cream-light)" }}>Active engagement</div>
                <button className="w-full text-left px-4 py-2.5 flex items-center justify-between border-b border-[var(--cream-dark)]"
                        onClick={() => setClientOpen(false)}>
                  <div>
                    <div className="font-sans font-semibold text-[13px] text-[var(--navy)]">Mercer Group</div>
                    <div className="font-sans italic text-[11px] text-[var(--slate)]">US retail · Q3 2026 close-out</div>
                  </div>
                  <span className="pill pill-teal">Live</span>
                </button>
                <div className="px-4 py-2 eyebrow text-[var(--slate-light)]" style={{ background: "var(--cream-light)" }}>Diagnosis pending</div>
                <button disabled className="w-full text-left px-4 py-2.5 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <div>
                    <div className="font-sans font-semibold text-[13px] text-[var(--slate)] flex items-center gap-1.5">
                      <Lock size={11} strokeWidth={1.8} /> Nordic Outdoor
                    </div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)]">EU outdoor retail · onboarding</div>
                  </div>
                  <span className="pill" style={{ background: "var(--cream-dark)", color: "var(--slate)" }}>Onboarding</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={openBrief}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-sans text-[12px] text-[var(--cream)] hover:bg-white/10 transition-colors"
                  style={{ border: "1px solid var(--gold)" }}>
            <Newspaper size={14} strokeWidth={1.5} className="text-[var(--gold-light)]" />
            Morning brief
          </button>
          <span className="font-sans text-[12px] text-[var(--cream)] opacity-70">Katherine Boyd · Lead analyst</span>
          <span className="h-8 w-8 rounded-full flex items-center justify-center font-sans font-semibold text-[12px]"
                style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>KB</span>
        </div>
      </header>

      <SystemHeartbeat onNavigate={handleNavigate} />
      <SignalTicker onNavigate={handleNavigate} />

      <div className="flex flex-1 min-h-0">
        {/* Left nav */}
        <nav className="w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--cream-light)] overflow-y-auto scroll-area">
          {GROUPS.map(group => (
            <div key={group} className="pt-5 px-3">
              <div className="eyebrow text-[var(--slate-light)] px-3 mb-2">{group}</div>
              <ul>
                {NAV.filter(n => n.group === group).map(n => {
                  const isActive = active === n.key;
                  const Icon = n.icon;
                  const isCommitted = n.key === "committed-actions";
                  return (
                    <li key={n.key}>
                      <button
                        onClick={() => handleNavigate(n.key)}
                        className={"w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2 text-left transition-colors " +
                          (isActive
                            ? "bg-[var(--cream-dark)]/60"
                            : "hover:bg-[var(--cream-dark)]/40")}
                        style={isActive ? { borderLeft: "3px solid var(--navy)", paddingLeft: 9 } : { borderLeft: "3px solid transparent" }}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={16} strokeWidth={1.5} style={{ color: isActive ? "var(--navy)" : "var(--slate)" }} />
                          <span className={"font-sans text-[13px] " + (isActive ? "text-[var(--navy)] font-semibold" : "text-[var(--slate)]")}>
                            {n.label}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          {isCommitted && committed.length > 0 && (
                            <span className="font-sans font-bold text-[10px] tabular-nums px-1.5 py-0.5 rounded-sm"
                                  style={{ background: "var(--coral)", color: "white" }}>
                              {committed.length}
                            </span>
                          )}
                          {isActive && <span className="h-1 w-1 rounded-full" style={{ background: "var(--gold)" }} />}
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor(n.status) }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="px-6 py-6 mt-4 border-t border-[var(--cream-dark)]">
            <div className="eyebrow text-[var(--slate-light)] mb-1">Period</div>
            <div className="font-sans text-[12px] text-[var(--slate)]">1 Jul – 30 Sep 2026</div>
            <div className="eyebrow text-[var(--slate-light)] mt-3 mb-1">Sources</div>
            <div className="font-sans text-[12px] text-[var(--slate)]">14 systems · 312 feeds</div>
            <button onClick={openInbox}
                    className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-sm border border-[var(--cream-dark)] hover:border-[var(--coral)] hover:bg-[var(--coral-faint)] transition-colors group">
              <span className="eyebrow text-[var(--slate-light)] group-hover:text-[var(--coral)]">Anomaly inbox</span>
              <span className="font-sans font-bold text-[11px] tabular-nums text-[var(--coral)]">{ANOMALIES.length} today</span>
            </button>
          </div>
        </nav>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto scroll-area" style={{ background: "var(--cream)" }}>
          <div className="px-8 py-8 max-w-[1200px] mx-auto">
            {active === "intelligence-architecture" ? <Architecture />
              : active === "engagement-pipeline"     ? <EngagementPipeline onNavigate={handleNavigate} />
              : active === "dependency-graph"        ? <DependencyGraph onNavigate={handleNavigate} />
              : active === "committed-actions"       ? <CommittedTray onNavigate={handleNavigate} />
              : layer && <Layer layer={layer} highlight={highlight} key={active} />}
          </div>
        </main>

        {/* Narrator */}
        <Narrator layerKey={
          active === "engagement-pipeline" || active === "dependency-graph" || active === "committed-actions"
            ? "intelligence-architecture"
            : active
        } onNavigate={handleNavigate} />
      </div>

      {/* Global overlays */}
      <AnomalyInbox onNavigate={handleNavigate} />
      <EvidencePanel />
      {briefOpen && <MorningBrief />}
      <ChatAssistant onNavigate={handleNavigate} />
    </div>
  );
}

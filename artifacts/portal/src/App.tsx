import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, TrendingUp, Crosshair, Users, Megaphone,
  Truck, Tag, GitBranch, Target, UserCog, Cpu, ChevronDown,
} from "lucide-react";
import { LAYERS } from "./data/layers";
import Layer from "./components/Layer";
import Narrator from "./narrator/Narrator";
import Architecture from "./architecture/Architecture";

type NavItem = { key: string; label: string; group: string; icon: any; status: "good" | "warn" | "bad" };

const NAV: NavItem[] = [
  { key: "business-performance",     label: "Business performance",     group: "Executive",      icon: BarChart3, status: "warn" },
  { key: "demand-intelligence",      label: "Demand intelligence",      group: "Market-facing",  icon: TrendingUp, status: "bad"  },
  { key: "competitive-intelligence", label: "Competitive intelligence", group: "Market-facing",  icon: Crosshair,  status: "bad"  },
  { key: "customer-intelligence",    label: "Customer intelligence",    group: "Market-facing",  icon: Users,      status: "warn" },
  { key: "brand-social",             label: "Brand and social",         group: "Market-facing",  icon: Megaphone,  status: "warn" },
  { key: "supply-chain",             label: "Supply chain",             group: "Operational",    icon: Truck,      status: "bad"  },
  { key: "pricing-margin",           label: "Pricing and margin",       group: "Operational",    icon: Tag,        status: "warn" },
  { key: "sales-pipeline",           label: "Sales pipeline",           group: "Operational",    icon: GitBranch,  status: "bad"  },
  { key: "marketing-performance",    label: "Marketing performance",    group: "Operational",    icon: Target,     status: "warn" },
  { key: "people-operations",        label: "People and operations",    group: "Operational",    icon: UserCog,    status: "bad"  },
  { key: "intelligence-architecture",label: "Intelligence architecture", group: "System",        icon: Cpu,        status: "good" },
];

const GROUPS = ["Executive", "Market-facing", "Operational", "System"] as const;

const statusColor = (s: NavItem["status"]) =>
  s === "good" ? "var(--teal)" : s === "warn" ? "var(--amber)" : "var(--coral)";

export default function App() {
  const [active, setActive] = useState("business-performance");
  const [highlight, setHighlight] = useState<string | undefined>(undefined);

  const layer = useMemo(() => LAYERS.find(l => l.key === active), [active]);

  // Clear highlight after the pulse animation completes
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
        className="h-[60px] shrink-0 flex items-center justify-between px-8 border-b"
        style={{ background: "var(--navy)", borderColor: "var(--navy-deep)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
          <span className="font-serif text-[20px] font-semibold text-[var(--cream)] tracking-tight">Different Day</span>
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-[var(--gold-light)] ml-1">Elevated Intelligence</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
          <span className="font-sans text-[12px] text-[var(--cream)]">Q3 2026</span>
          <span className="opacity-30 text-[var(--cream)]">·</span>
          <span className="font-sans text-[12px] text-[var(--cream)]">Mercer Group</span>
          <span className="opacity-30 text-[var(--cream)]">·</span>
          <span className="font-sans text-[12px] text-[var(--cream)]">All channels</span>
          <ChevronDown size={14} strokeWidth={1.5} className="text-[var(--gold-light)] ml-1" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-sans text-[12px] text-[var(--cream)] opacity-70">Katherine Boyd · Lead analyst</span>
          <span className="h-8 w-8 rounded-full flex items-center justify-center font-sans font-semibold text-[12px]"
                style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>KB</span>
        </div>
      </header>

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
          </div>
        </nav>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto scroll-area" style={{ background: "var(--cream)" }}>
          <div className="px-8 py-8 max-w-[1100px] mx-auto">
            {active === "intelligence-architecture"
              ? <Architecture />
              : layer && <Layer layer={layer} highlight={highlight} key={active} />}
          </div>
        </main>

        {/* Narrator */}
        <Narrator layerKey={active} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

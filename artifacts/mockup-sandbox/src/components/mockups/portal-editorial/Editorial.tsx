import React, { useEffect } from "react";
import { 
  BarChart3, TrendingUp, Crosshair, Users, Megaphone, 
  Truck, Tag, GitBranch, Target, UserCog, FileSignature, 
  Receipt, UserPlus, BookOpen, Cpu, Briefcase, Network, 
  Sliders, CheckSquare, Award
} from "lucide-react";
import "./tokens.css";

const NAV = [
  { key: "business-performance",     label: "Business performance",     group: "Executive",      icon: BarChart3, status: "warn" },
  { key: "finance",                  label: "Finance",                  group: "Executive",      icon: Receipt,   status: "bad"  },
  { key: "demand-intelligence",      label: "Demand intelligence",      group: "Market-facing",  icon: TrendingUp, status: "bad"  },
  { key: "competitive-intelligence", label: "Competitive intelligence", group: "Market-facing",  icon: Crosshair,  status: "bad"  },
  { key: "customer-intelligence",    label: "Customer intelligence",    group: "Market-facing",  icon: Users,      status: "warn" },
  { key: "brand-social",             label: "Brand and social",         group: "Market-facing",  icon: Megaphone,  status: "warn" },
  { key: "supply-chain",             label: "Supply chain",             group: "Operational",    icon: Truck,      status: "bad"  },
  { key: "pricing-margin",           label: "Pricing and margin",       group: "Operational",    icon: Tag,        status: "warn" },
  { key: "sales-pipeline",           label: "Sales pipeline",           group: "Operational",    icon: GitBranch,  status: "bad"  },
  { key: "marketing-performance",    label: "Marketing performance",    group: "Operational",    icon: Target,     status: "warn" },
  { key: "people-operations",        label: "People and operations",    group: "Operational",    icon: UserCog,    status: "bad"  },
  { key: "contract-management",      label: "Contract management",      group: "Operational",    icon: FileSignature, status: "good" },
  { key: "receivables",              label: "Receivables and invoicing", group: "Operational",    icon: Receipt,    status: "bad"  },
  { key: "talent-hr",                label: "Talent and HR",            group: "Operational",    icon: UserPlus,   status: "bad"  },
  { key: "sales-playbook",           label: "Sales playbook",           group: "System",         icon: BookOpen,   status: "good" },
  { key: "intelligence-architecture",label: "Intelligence architecture",group: "System",         icon: Cpu,        status: "good" },
  { key: "engagement-pipeline",      label: "Engagement pipeline",      group: "System",         icon: Briefcase,  status: "warn" },
  { key: "dependency-graph",         label: "Cross-layer map",          group: "System",         icon: Network,    status: "good" },
  { key: "scenario-warroom",         label: "Scenario war-room",        group: "System",         icon: Sliders,    status: "good" },
  { key: "committed-actions",        label: "Committed actions",        group: "System",         icon: CheckSquare,status: "good" },
  { key: "track-record",             label: "Outcome track record",     group: "System",         icon: Award,      status: "good" },
];

const GROUPS = ["Executive", "Market-facing", "Operational", "System"];

export function Editorial() {
  return (
    <div className="editorial-theme min-h-screen flex flex-col selection:bg-[var(--ed-faint)]">
      {/* HEADER */}
      <header className="flex-none h-14 border-b ed-border flex items-center justify-between px-8 text-sm">
        <div className="flex items-center gap-6">
          <div className="font-semibold text-lg tracking-tight">Different Day <span className="font-normal opacity-50 px-1">·</span> Elevated Intelligence</div>
          <div className="ed-smallcaps flex gap-2">
            <span>Patagonia</span>
            <span className="opacity-50">·</span>
            <span>Q3 2026</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 ed-smallcaps">
          <button className="hover:text-[var(--ed-forest)] transition-colors">Morning Brief</button>
          <button className="hover:text-[var(--ed-forest)] transition-colors">Board Pack</button>
          <button className="hover:text-[var(--ed-forest)] transition-colors">Intelligence</button>
          <button className="hover:text-[var(--ed-forest)] transition-colors">Switch Company</button>
          
          <div className="h-4 w-px bg-[var(--ed-border)] mx-1" />
          
          <span className="opacity-70">Persona: Board</span>
          <div className="flex items-center gap-2 border-l ed-border pl-6">
            <span>M. Chen</span>
            <span className="border ed-border rounded-full h-7 w-7 flex items-center justify-center italic text-xs font-semibold bg-[var(--ed-faint)]">MC</span>
          </div>
        </div>
      </header>

      <div className="border-b border-b-2 ed-border mx-8 mt-1 mb-0" />

      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR */}
        <nav className="w-[220px] flex-none border-r ed-border py-8 px-6 overflow-y-auto scroll-area">
          <div className="text-center border-b ed-border pb-4 mb-6">
            <div className="ed-smallcaps text-xs opacity-60 mb-1">Vol. XII, Issue 41</div>
            <div className="text-sm">XIV.X.MMXXVI</div>
          </div>

          {GROUPS.map((group, gIdx) => (
            <div key={group} className="mb-6">
              <div className="ed-smallcaps font-semibold mb-3 border-b ed-border pb-1 tracking-widest">{group}</div>
              <ul className="space-y-2">
                {NAV.filter(n => n.group === group).map(n => {
                  const isActive = n.key === "brand-social";
                  const statusColor = n.status === "good" ? "var(--ed-forest)" : n.status === "warn" ? "#BA7517" : "var(--ed-oxblood)";
                  return (
                    <li key={n.key}>
                      <button 
                        className={`w-full text-left flex items-start justify-between group transition-colors ${isActive ? "font-semibold" : "opacity-80 hover:opacity-100"}`}
                      >
                        <span className="flex-1 text-[13px] pr-2 leading-tight">
                          {n.label}
                        </span>
                        {isActive && <span className="font-serif italic text-xs pt-[2px]" style={{color: "var(--ed-oxblood)"}}>04</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* MAIN PANE */}
        <main className="flex-1 overflow-y-auto scroll-area px-16 py-12 relative">
          
          {/* Header Strip */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="ed-smallcaps tracking-widest text-[var(--ed-oxblood)] mb-4 border-b ed-border pb-2 inline-block">Intelligence layer · Market-facing</div>
            <h1 className="text-5xl font-semibold leading-tight mb-4">Brand and social</h1>
            <p className="italic text-2xl text-[var(--ed-ink)] opacity-80 max-w-2xl mx-auto">What is our brand earning us, and where are we leaking it?</p>
            
            <div className="flex items-center justify-center gap-4 mt-8 text-sm opacity-70 ed-smallcaps">
              <span>By M. Chen · Senior Analyst</span>
              <span>·</span>
              <span>Diagnosed Oct 14 2026</span>
              <span>·</span>
              <span>78% Confidence</span>
              <span>·</span>
              <span>11 Sources</span>
            </div>
          </div>

          <div className="flex gap-16 max-w-6xl mx-auto">
            
            {/* LEFT COLUMN: Narrative & Actions */}
            <div className="flex-1">
              {/* §1 Recommendation */}
              <section className="mb-16">
                <div className="flex items-center justify-between border-b ed-border mb-6 pb-2">
                  <h2 className="ed-smallcaps font-semibold text-lg tracking-widest">I. Recommendation</h2>
                  <span className="font-semibold italic text-[var(--ed-forest)]">+ $28.4M brand-led revenue recovery</span>
                </div>
                
                <div className="ed-justified text-lg leading-relaxed ed-dropcap mb-8">
                  Patagonia's marketing model runs on $15M paid media plus owned activism (Worn Wear, 1% for the Planet, Don't Buy This Jacket lineage). KPMG ranks the brand top-3 in U.S. customer experience and 80% of buyers self-identify as loyal, yet DTC revenue is flat at $513.8M as Worn Wear ($13M resale) cannibalises full-price units. The earned-media multiplier on activism campaigns is doing the heavy lifting that paid media used to.
                </div>

                <div className="space-y-8 pl-4 border-l ed-border">
                  <div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-bold text-[var(--ed-oxblood)]">01.</span>
                      <h3 className="font-semibold text-xl">Reframe Worn Wear as acquisition not cannibalisation</h3>
                    </div>
                    <div className="text-sm font-semibold italic text-[var(--ed-forest)] mb-2 pl-8">Impact: + $11.2M new-to-brand DTC</div>
                    <p className="pl-8 ed-justified leading-relaxed">Treat trade-in as the first touch in an LTV ladder, not a discount on the next jacket. Re-segment buyers by repair-shop visits to find latent advocates.</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-bold text-[var(--ed-oxblood)]">02.</span>
                      <h3 className="font-semibold text-xl">Double down on activism earned-media in Q4</h3>
                    </div>
                    <div className="text-sm font-semibold italic text-[var(--ed-forest)] mb-2 pl-8">Impact: + $9.6M earned media value</div>
                    <p className="pl-8 ed-justified leading-relaxed">Two activism stunts per quarter generated 4.2× the engagement of paid campaigns. Stage one anchor campaign in November against fossil-fuel sponsorship of outdoor brands.</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-bold text-[var(--ed-oxblood)]">03.</span>
                      <h3 className="font-semibold text-xl">Localise CX scores by store cluster</h3>
                    </div>
                    <div className="text-sm font-semibold italic text-[var(--ed-forest)] mb-2 pl-8">Impact: + $7.6M LTV from at-risk advocates</div>
                    <p className="pl-8 ed-justified leading-relaxed">KPMG's top-3 score masks a 14-point gap between flagship and outlet stores. Deploy NPS triggers at the SKU-cluster level so the brand team can intervene before churn.</p>
                  </div>
                </div>
              </section>

              {/* §3 Diagnosis */}
              <section className="mb-16">
                <div className="border-b ed-border mb-6 pb-2">
                  <h2 className="ed-smallcaps font-semibold text-lg tracking-widest">III. Root Causes</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="text-[var(--ed-oxblood)]">§</span>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Worn Wear cannibalisation outpacing new-customer pull-through</h4>
                      <div className="text-sm italic opacity-80 mb-2">Cost: $11.2M</div>
                      <p className="ed-justified">Resale grew 38% YoY while full-price units fell 6%. Repair customers do not convert to new-buyer cohort.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[var(--ed-oxblood)]">§</span>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Paid media efficiency declining</h4>
                      <div className="text-sm italic opacity-80 mb-2">Cost: $5.8M</div>
                      <p className="ed-justified">CPM up 22% YoY on Meta. Earned-media campaigns deliver 4.2× engagement at 0.3× CPM.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[var(--ed-oxblood)]">§</span>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Loyalty score masking regional decline</h4>
                      <div className="text-sm italic opacity-80 mb-2">Cost: $11.4M</div>
                      <p className="ed-justified">National 80% loyalty hides 62% in Sun Belt outlets where Arc'teryx is gaining share.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Fact Boxes (KPIs, Peers, Details) */}
            <div className="w-[320px] flex-none space-y-12">
              
              {/* KPIs */}
              <aside className="border ed-border bg-[var(--ed-faint)] p-6 shadow-sm">
                <div className="ed-smallcaps text-center border-b border-[var(--ed-ink)] pb-2 mb-4 font-semibold tracking-widest">II. Current Situation</div>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm italic opacity-80 mb-1">Earned media value</div>
                    <div className="text-3xl font-semibold text-[var(--ed-forest)]">$42.1M</div>
                    <div className="text-xs mt-1">+18% YoY</div>
                  </div>
                  <div className="border-t ed-border pt-4">
                    <div className="text-sm italic opacity-80 mb-1">Paid spend</div>
                    <div className="text-3xl font-semibold">$15.0M</div>
                    <div className="text-xs mt-1">Flat</div>
                  </div>
                  <div className="border-t ed-border pt-4">
                    <div className="text-sm italic opacity-80 mb-1">KPMG CX rank</div>
                    <div className="text-3xl font-semibold text-[var(--ed-forest)]">#3</div>
                    <div className="text-xs mt-1">+1 spot</div>
                  </div>
                  <div className="border-t ed-border pt-4">
                    <div className="text-sm italic opacity-80 mb-1">Loyalty self-ID</div>
                    <div className="text-3xl font-semibold" style={{color: "#BA7517"}}>80%</div>
                    <div className="text-xs mt-1">Slipping QoQ</div>
                  </div>
                </div>
              </aside>

              {/* Spotlight */}
              <aside>
                <div className="ed-smallcaps border-b ed-border pb-1 mb-3 font-semibold">Spotlight Entities</div>
                <ul className="text-sm space-y-2">
                  <li className="flex justify-between"><span>Competitor</span> <span className="font-semibold">REI Co-op</span></li>
                  <li className="flex justify-between border-t ed-border pt-2"><span>Competitor</span> <span className="font-semibold">Arc'teryx</span></li>
                  <li className="flex justify-between border-t ed-border pt-2"><span>Segment</span> <span className="font-semibold">Worn Wear cohort</span></li>
                  <li className="flex justify-between border-t ed-border pt-2"><span>Channel</span> <span className="font-semibold">Instagram Reels</span></li>
                </ul>
              </aside>

              {/* Peer Benchmark */}
              <aside className="border-y border-y-2 border-y-[var(--ed-ink)] py-4">
                <div className="ed-smallcaps text-center mb-4 font-semibold">Peer Benchmark</div>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b ed-border">
                      <th className="font-normal italic pb-2">Peer</th>
                      <th className="font-normal italic pb-2 text-right">EM Mult.</th>
                      <th className="font-normal italic pb-2 text-right">CX</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="py-2 font-semibold">Patagonia</td><td className="py-2 text-right">4.2×</td><td className="py-2 text-right">#3</td></tr>
                    <tr className="border-t ed-border"><td className="py-2">REI Co-op</td><td className="py-2 text-right">2.8×</td><td className="py-2 text-right">#1</td></tr>
                    <tr className="border-t ed-border"><td className="py-2">Arc'teryx</td><td className="py-2 text-right">3.1×</td><td className="py-2 text-right">#4</td></tr>
                    <tr className="border-t ed-border"><td className="py-2">Cotopaxi</td><td className="py-2 text-right">3.8×</td><td className="py-2 text-right">#6</td></tr>
                    <tr className="border-t ed-border"><td className="py-2">Fjällräven</td><td className="py-2 text-right">1.9×</td><td className="py-2 text-right">#9</td></tr>
                  </tbody>
                </table>
              </aside>

              {/* Data Feeds & Gaps */}
              <aside>
                <div className="ed-smallcaps border-b ed-border pb-1 mb-3 font-semibold tracking-widest">IV. Detail</div>
                <div className="mb-6">
                  <div className="italic text-sm mb-2">Sources</div>
                  <div className="text-xs leading-relaxed opacity-80">
                    Meta Ads API, GA4, KPMG CX panel, Worn Wear POS, Net-A-Porter mention scrape, Sprinklr social listening, Brandwatch, ClimateScope earned-media tracker.
                  </div>
                </div>
                <div>
                  <div className="italic text-sm mb-2 text-[var(--ed-oxblood)]">Architectural Gaps</div>
                  <ul className="text-xs space-y-3">
                    <li className="flex gap-2">
                      <span className="font-bold">DATA</span>
                      <span className="opacity-80">Missing omnichannel view across retail/DTC.</span>
                    </li>
                    <li className="flex gap-2 border-t ed-border pt-3">
                      <span className="font-bold">MODEL</span>
                      <span className="opacity-80">LTV attribution does not credit repair.</span>
                    </li>
                    <li className="flex gap-2 border-t ed-border pt-3">
                      <span className="font-bold">INTEG</span>
                      <span className="opacity-80">NPS signals stranded from POS.</span>
                    </li>
                  </ul>
                </div>
              </aside>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

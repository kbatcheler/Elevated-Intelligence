import React, { useEffect } from "react";
import { 
  BarChart3, TrendingUp, Crosshair, Users, Megaphone, 
  Truck, Tag, GitBranch, Target, UserCog, FileSignature, 
  Receipt, UserPlus, BookOpen, Cpu, Briefcase, Network, 
  Sliders, CheckSquare, Award, Sparkles, HelpCircle, 
  ChevronDown, Hexagon, Shield, FileText, Lock, ShieldAlert,
  ArrowRight, Activity, GitCommit, Search, Database, Layers
} from "lucide-react";

export function Finance() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#F5EFE3", color: "#1A2238" }}>
      <style>{`
        .font-mono-custom { font-family: 'JetBrains Mono', monospace; }
        .font-serif-custom { font-family: 'Playfair Display', serif; }
        .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(122, 132, 153, 0.1) 1px, transparent 1px);
          background-size: calc(100% / 12) 100%;
        }
        .provenance-flag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 12px;
          height: 12px;
          background: #C8A24A;
          color: #0F1A33;
          font-size: 8px;
          font-family: 'JetBrains Mono', monospace;
          margin-left: 4px;
          vertical-align: super;
          border-radius: 1px;
        }
        .provenance-flag.modelled {
          background: #FAF6EC;
          border: 1px solid #E8DFC9;
          color: #4A5570;
        }
        .status-dot-good::before { content: "●"; color: #1D9E75; }
        .status-dot-warn::before { content: "◐"; color: #D69A2D; }
        .status-dot-bad::before { content: "○"; color: #D85A30; }
        
        .tab-num { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* TOP HEADER */}
      <header className="h-[48px] shrink-0 flex items-center justify-between px-6 border-b"
              style={{ background: "#08101F", borderColor: "#1A2238" }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hexagon size={16} strokeWidth={1.5} className="text-[#C8A24A]" />
            <span className="font-serif-custom text-[15px] font-medium tracking-wide text-[#F5EFE3]">Different Day</span>
            <span className="font-mono-custom text-[9px] tracking-widest uppercase text-[#D4B466] ml-2 opacity-80">Elevated Intelligence</span>
          </div>
          
          <div className="h-4 w-px bg-[#1A2238] mx-2"></div>
          
          {/* Foundry-like Breadcrumb / Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-[2px]" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Database size={12} className="text-[#7A8499]" />
              <span className="font-mono-custom text-[10px] text-[#F5EFE3]">Tenant ontology · Patagonia.finance</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-custom text-[10px] text-[#7A8499]">
              <GitCommit size={12} />
              <span>Diagnosed Oct 14</span>
              <span className="text-[#D4B466] ml-1">#a7f92b4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {["Morning brief", "Board pack", "Intelligence (AI)", "Switch company"].map((btn, i) => (
              <button key={i} className="font-mono-custom text-[10px] uppercase tracking-wider text-[#7A8499] hover:text-[#F5EFE3] transition-colors">
                {btn}
              </button>
            ))}
          </div>
          
          <div className="h-4 w-px bg-[#1A2238] mx-2"></div>
          
          <div className="flex items-center gap-3">
            <span className="font-mono-custom text-[10px] text-[#D4B466]">Persona: CEO</span>
            <span className="font-mono-custom text-[10px] text-[#7A8499]">M. Chen</span>
            <span className="h-6 w-6 rounded-[2px] flex items-center justify-center font-mono-custom text-[10px] font-bold"
                  style={{ background: "#C8A24A", color: "#08101F" }}>MC</span>
          </div>
        </div>
      </header>

      {/* THIN STATUS BAR */}
      <div className="h-[22px] flex items-center px-6 border-b text-[10px] font-mono-custom"
           style={{ background: "#0F1A33", borderColor: "#1A2238", color: "#7A8499" }}>
        <div className="flex items-center gap-4 flex-1">
          <span className="flex items-center gap-1.5"><Activity size={10} className="text-[#1D9E75]"/> SYSTEM_HEALTH: NOMINAL</span>
          <span>LATENCY: 42ms</span>
          <span>INGEST: 14h ago</span>
        </div>
        <div>ENV: PRODUCTION // TIER: 1</div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT SIDEBAR */}
        <nav className="w-[260px] shrink-0 border-r overflow-y-auto" style={{ background: "#FAF6EC", borderColor: "#E8DFC9" }}>
          <div className="p-5 flex flex-col gap-6">
            
            {[
              {
                title: "Executive",
                items: [
                  { label: "Business performance", conf: 94, status: "warn" },
                  { label: "Finance", conf: 82, status: "bad", active: true }
                ]
              },
              {
                title: "Market-facing",
                items: [
                  { label: "Demand intelligence", conf: 82, status: "bad" },
                  { label: "Competitive intelligence", conf: 88, status: "bad" },
                  { label: "Customer intelligence", conf: 91, status: "warn" },
                  { label: "Brand and social", conf: 78, status: "warn" }
                ]
              },
              {
                title: "Operational",
                items: [
                  { label: "Supply chain", conf: 85, status: "bad" },
                  { label: "Pricing and margin", conf: 92, status: "warn" },
                  { label: "Sales pipeline", conf: 76, status: "bad" },
                  { label: "Marketing performance", conf: 84, status: "warn" },
                  { label: "People and operations", conf: 89, status: "bad" },
                  { label: "Contract management", conf: 99, status: "good" },
                  { label: "Receivables", conf: 95, status: "bad" },
                  { label: "Talent and HR", conf: 81, status: "bad" }
                ]
              }
            ].map((group, idx) => (
              <div key={idx}>
                <div className="font-mono-custom text-[9px] uppercase tracking-widest mb-3 text-[#7A8499] px-2">{group.title}</div>
                <ul className="space-y-0.5">
                  {group.items.map((item, i) => (
                    <li key={i}>
                      <button className={"w-full flex items-center justify-between px-2 py-1.5 text-left font-mono-custom text-[11px] " + 
                                       (item.active ? "bg-[#E8DFC9] text-[#08101F] font-bold" : "text-[#4A5570] hover:bg-[rgba(232,223,201,0.5)]")}>
                        <div className="flex items-center gap-2">
                          <span className={`status-dot-${item.status}`}></span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="opacity-60">{item.conf}%</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "#E8DFC9" }}>
              <div className="font-mono-custom text-[9px] uppercase tracking-widest mb-3 text-[#7A8499] px-2">Pipelines (Collapsed)</div>
            </div>

          </div>
        </nav>

        {/* MAIN PANE (12-col grid background) */}
        <main className="flex-1 overflow-y-auto relative bg-[#F5EFE3]">
          <div className="absolute inset-0 grid-bg pointer-events-none opacity-50 z-0 mx-8 max-w-[1200px]"></div>
          
          <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-10">
            
            {/* Header Strip */}
            <div className="mb-12 border-b pb-6" style={{ borderColor: "#E8DFC9" }}>
              <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-3">Intelligence layer · Executive</div>
              <h1 className="font-serif-custom text-5xl text-[#0F1A33] mb-4">Finance</h1>
              <p className="font-serif-custom italic text-xl text-[#4A5570]">"Where is cash actually being made, and where is margin quietly leaking?"</p>
              
              <div className="flex items-center gap-6 mt-6 font-mono-custom text-[11px] text-[#4A5570]">
                <div className="flex items-center gap-2"><GitCommit size={14} className="text-[#C8A24A]"/> Diagnosed Oct 14 2026</div>
                <div className="flex items-center gap-2">Confidence 82% <span className="text-[#D85A30]">Close 2 gaps → 91% confidence</span></div>
                <div>14 sources</div>
              </div>
            </div>

            {/* §1 Recommendation */}
            <section className="mb-16">
              <div className="font-mono-custom text-[11px] text-[#7A8499] mb-4 flex items-center gap-2">
                <span className="text-[#C8A24A] font-bold">§1</span> Recommendation
              </div>
              
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4">
                  <div className="p-6 border-t-2" style={{ background: "#FFFEFA", borderColor: "#D85A30" }}>
                    <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-4">Executive Narrative</div>
                    <p className="font-serif-custom text-[15px] leading-relaxed text-[#1A2238]">
                      FY26 trailing-twelve revenue holds at $1.51B against a $1.55B plan, but contribution margin has compressed 230bps to 28.4% as Worn Wear scale costs absorb DTC gains. Free cash flow of $187M (53M below plan) is being suppressed by 41-day inventory in Reno (39% of total holding cost) and a $24M working-capital hit from extended supplier terms granted in Q2. Tax-equity from the 1% for the Planet structure offsets $9.6M but masks softer underlying operating leverage.
                    </p>
                    <div className="mt-6 pt-4 border-t font-mono-custom text-[12px] font-bold text-[#1D9E75]" style={{ borderColor: "#E8DFC9" }}>
                      +$62.4M cash unlock and margin restore
                    </div>
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        num: "01",
                        title: "Compress Reno inventory days from 41 to 32",
                        impact: "+$28M working capital",
                        detail: "Re-tier slow-mover SKUs and shift to a 4-week replen cadence. Reno is 39% of holding cost on 24% of throughput."
                      },
                      {
                        num: "02",
                        title: "Repatriate Worn Wear unit economics into margin reporting",
                        impact: "+170bps contribution · +$10.4M",
                        detail: "Restate Worn Wear as acquisition channel, not discount. Stops the cost-pool drift that inflated SG&A by $11.4M."
                      },
                      {
                        num: "03",
                        title: "Renegotiate two top-five suppliers back to Net-30",
                        impact: "+$24M working capital",
                        detail: "Q2 extension to Net-60 was a goodwill gesture during the wholesale renegotiation. Two suppliers will revert in exchange for a volume commit."
                      }
                    ].map((act, i) => (
                      <div key={i} className="p-6 relative" style={{ background: "#FFFEFA", border: "1px solid #E8DFC9" }}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C8A24A]"></div>
                        <div className="font-serif-custom text-2xl text-[#C8A24A] mb-3">{act.num}</div>
                        <div className="font-sans font-bold text-[14px] leading-snug mb-2 text-[#0F1A33]">{act.title}</div>
                        <div className="font-mono-custom text-[11px] text-[#1D9E75] mb-4">{act.impact}<span className="provenance-flag modelled">M</span></div>
                        <p className="font-serif-custom text-[13px] text-[#4A5570] leading-relaxed">{act.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* §2 Situation */}
            <section className="mb-16">
              <div className="font-mono-custom text-[11px] text-[#7A8499] mb-4 flex items-center gap-2">
                <span className="text-[#C8A24A] font-bold">§2</span> Situation
              </div>

              {/* 4-up KPI strip */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Revenue", val: "$1.51B", sub: "vs $1.55B plan", color: "#D69A2D", t: "V" },
                  { label: "Contribution margin", val: "28.4%", sub: "-230bps YoY", color: "#D85A30", t: "V" },
                  { label: "Free cash flow", val: "$187M", sub: "-$53M vs plan", color: "#D85A30", t: "V" },
                  { label: "Inventory days", val: "41", sub: "+8 vs plan", color: "#D85A30", t: "V" }
                ].map((kpi, i) => (
                  <div key={i} className="p-5 border-l-2" style={{ background: "#FFFEFA", borderColor: kpi.color, borderRight: "1px solid #E8DFC9", borderTop: "1px solid #E8DFC9", borderBottom: "1px solid #E8DFC9" }}>
                    <div className="font-mono-custom text-[10px] uppercase text-[#7A8499] mb-2">{kpi.label}</div>
                    <div className="font-mono-custom text-3xl mb-1" style={{ color: kpi.color }}>{kpi.val}<span className={`provenance-flag ${kpi.t==='M'?'modelled':''}`}>{kpi.t}</span></div>
                    <div className="font-serif-custom text-[12px] italic text-[#4A5570]">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Hero panel */}
              <div className="mb-8 p-8 border-y" style={{ background: "#FAF6EC", borderColor: "#D4B466" }}>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Region</div>
                    <div className="font-sans font-bold text-[15px]">Reno DC (holding cost $24M)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Supplier</div>
                    <div className="font-sans font-bold text-[15px]">Tier-1 Vietnam (Net-60)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Channel</div>
                    <div className="font-sans font-bold text-[15px]">Worn Wear (margin drag)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Metric</div>
                    <div className="font-sans font-bold text-[15px]">Operating cash flow</div>
                  </div>
                </div>
              </div>

              {/* Peer Benchmark */}
              <div style={{ background: "#FFFEFA", border: "1px solid #E8DFC9" }}>
                <table className="w-full text-left font-mono-custom text-[12px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Peer</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Gross margin %</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Free cash flow $M</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Inventory days</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">DTC share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-[#FAF6EC]" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4 font-bold text-[#0F1A33]">Patagonia</td>
                      <td className="py-3 px-4 text-[#D85A30]">28.4%<span className="provenance-flag">V</span></td>
                      <td className="py-3 px-4 text-[#D85A30]">187</td>
                      <td className="py-3 px-4 text-[#D85A30]">41</td>
                      <td className="py-3 px-4 text-[#4A5570]">32%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">REI Co-op</td>
                      <td className="py-3 px-4">34.2%<span className="provenance-flag modelled">M</span></td>
                      <td className="py-3 px-4">240</td>
                      <td className="py-3 px-4">38</td>
                      <td className="py-3 px-4">40%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Arc'teryx</td>
                      <td className="py-3 px-4">38.5%</td>
                      <td className="py-3 px-4">310</td>
                      <td className="py-3 px-4">30</td>
                      <td className="py-3 px-4">45%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Cotopaxi</td>
                      <td className="py-3 px-4">42.1%</td>
                      <td className="py-3 px-4">120</td>
                      <td className="py-3 px-4">34</td>
                      <td className="py-3 px-4">55%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Fjällräven</td>
                      <td className="py-3 px-4">36.0%</td>
                      <td className="py-3 px-4">150</td>
                      <td className="py-3 px-4">45</td>
                      <td className="py-3 px-4">25%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* §3 Diagnosis */}
            <section className="mb-16">
              <div className="font-mono-custom text-[11px] text-[#7A8499] mb-4 flex items-center gap-2">
                <span className="text-[#C8A24A] font-bold">§3</span> Diagnosis
              </div>

              <div className="p-8 border-t-2" style={{ background: "#FFFEFA", borderColor: "#D69A2D" }}>
                <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D69A2D] mb-6">Root Causes</div>
                
                <div className="space-y-6">
                  {[
                    {
                      title: "Inventory pile-up in Reno absorbing working capital",
                      impact: "$28M",
                      detail: "41 days vs 32-day target. Slow-mover SKUs not retiered after Q2 demand pivot."
                    },
                    {
                      title: "Worn Wear scale costs hitting SG&A not COGS",
                      impact: "$11.4M",
                      detail: "Misclassification inflates operating cost line, suppresses contribution margin reporting."
                    },
                    {
                      title: "Supplier-term extension financing the AR book",
                      impact: "$24M",
                      detail: "Net-60 terms granted in Q2 mean working capital sits with us instead of suppliers."
                    }
                  ].map((cause, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="font-serif-custom text-xl text-[#D69A2D] shrink-0 mt-0.5">0{i+1}.</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="font-sans font-bold text-[15px] text-[#0F1A33]">{cause.title}</div>
                          <div className="font-mono-custom text-[12px] text-[#D85A30] bg-[#FCE9DF] px-2 py-0.5 rounded-[2px]">{cause.impact}</div>
                        </div>
                        <p className="font-serif-custom text-[14px] text-[#4A5570] leading-relaxed">{cause.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* §4 Detail */}
            <section className="mb-16">
              <div className="font-mono-custom text-[11px] text-[#7A8499] mb-4 flex items-center gap-2">
                <span className="text-[#C8A24A] font-bold">§4</span> Detail
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border" style={{ background: "#FFFEFA", borderColor: "#E8DFC9" }}>
                  <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#7A8499] mb-4">Data Feeds (8)</div>
                  <ul className="space-y-2 font-mono-custom text-[11px] text-[#4A5570]">
                    <li>● NetSuite GL</li>
                    <li>● Reno WMS</li>
                    <li>● Worn Wear POS</li>
                    <li>● AP aging report</li>
                    <li>● Treasury cash position</li>
                    <li>● FactSet peer GM panel</li>
                    <li>● 1% for the Planet remittance</li>
                    <li>● Supplier-term register</li>
                  </ul>
                </div>
                
                <div className="p-6 border-t-2" style={{ background: "#FFFEFA", borderColor: "#D85A30" }}>
                  <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-4">Architectural Gaps (3)</div>
                  <ul className="space-y-4">
                    {[
                      { cat: "DATA", title: "Reno SKU velocity not tied to financial period close", val: "+4pp", fix: "Closed by warehouse-finance API" },
                      { cat: "MODEL", title: "Worn Wear cost allocation model classifies labor as SG&A", val: "+3pp", fix: "Closed by activity-based cost rebuild" },
                      { cat: "INTEG", title: "Supplier-term register not linked to AP aging", val: "+2pp", fix: "Closed by ERP join" }
                    ].map((gap, i) => (
                      <li key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono-custom text-[9px] bg-[#1A2238] text-[#F5EFE3] px-1.5 py-0.5 rounded-[2px]">{gap.cat}</span>
                          <span className="font-mono-custom text-[10px] text-[#D85A30]">{gap.val} confidence</span>
                        </div>
                        <div className="font-sans text-[13px] font-bold text-[#0F1A33]">{gap.title}</div>
                        <div className="font-serif-custom italic text-[12px] text-[#4A5570]">{gap.fix}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

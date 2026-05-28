import React, { useEffect } from "react";
import { 
  BarChart3, TrendingUp, Crosshair, Users, Megaphone, 
  Truck, Tag, GitBranch, Target, UserCog, FileSignature, 
  Receipt, UserPlus, BookOpen, Cpu, Briefcase, Network, 
  Sliders, CheckSquare, Award, Sparkles, HelpCircle, 
  ChevronDown, Hexagon, Shield, FileText, Lock, ShieldAlert,
  ArrowRight, Activity, GitCommit, Search, Database, Layers
} from "lucide-react";

export function Pricing() {
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
              <span className="font-mono-custom text-[10px] text-[#F5EFE3]">Tenant ontology · Patagonia.pricing</span>
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
                  { label: "Finance", conf: 98, status: "bad" }
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
                  { label: "Pricing and margin", conf: 92, status: "warn", active: true },
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
              <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-3">Intelligence layer · Operational</div>
              <h1 className="font-serif-custom text-5xl text-[#0F1A33] mb-4">Pricing and margin</h1>
              <p className="font-serif-custom italic text-xl text-[#4A5570]">"Where is the price elasticity hiding, and which SKUs are giving margin away?"</p>
              
              <div className="flex items-center gap-6 mt-6 font-mono-custom text-[11px] text-[#4A5570]">
                <div className="flex items-center gap-2"><GitCommit size={14} className="text-[#C8A24A]"/> Diagnosed Oct 14 2026</div>
                <div className="flex items-center gap-2">Confidence 74% <span className="text-[#D85A30]">Close 3 gaps → 88% confidence</span></div>
                <div>12 sources</div>
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
                      Realised gross margin compressed to 51.2% in Q3 from 53.8% in the comparable, driven by a 220bps mix-shift to Worn Wear resale (51% GM) and a 90bps inflation absorb in the technical-outerwear line that retail pricing has not yet caught up with. Elasticity modelling across the top-200 SKUs shows the Better Sweater fleece line is underpriced by $12 to $15 (low elasticity, high search intent) while the Black Hole duffle range is overpriced by $8 (elastic, losing to cross-shop competitors).
                    </p>
                    <div className="mt-6 pt-4 border-t font-mono-custom text-[12px] font-bold text-[#1D9E75]" style={{ borderColor: "#E8DFC9" }}>
                      +$38.4M margin restore
                    </div>
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        num: "01",
                        title: "Reprice the Better Sweater family +$12 for the Q4 drop",
                        impact: "+$19.6M margin",
                        detail: "Five SKUs, ladder pricing from $139 to $159. Demand elasticity at -0.4, search rank holds at #2."
                      },
                      {
                        num: "02",
                        title: "Reduce Black Hole duffle range to a $129 anchor",
                        impact: "+$8.4M units",
                        detail: "Elastic at -1.6. Volume uplift of 38% recovers 130% of unit-margin compression."
                      },
                      {
                        num: "03",
                        title: "Strip Worn Wear cannibalisation by SKU-level price-fence",
                        impact: "+$10.4M margin",
                        detail: "Two-tier Worn Wear pricing: 'Like-New' at 65% retail, 'Field-Used' at 45%. Stops the resale floor undercutting full-price on the same SKU."
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
                  { label: "Gross margin", val: "51.2%", sub: "-260bps YoY", color: "#D85A30", t: "V" },
                  { label: "Avg price realisation", val: "$147", sub: "-$6 vs plan", color: "#D69A2D", t: "V" },
                  { label: "Elasticity coverage", val: "47%", sub: "target 80%", color: "#D69A2D", t: "V" },
                  { label: "Worn Wear cannibalisation", val: "14%", sub: "+6pp YoY", color: "#D85A30", t: "M" }
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
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Product</div>
                    <div className="font-sans font-bold text-[15px]">Better Sweater (underpriced)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Product</div>
                    <div className="font-sans font-bold text-[15px]">Black Hole duffle (overpriced)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Channel</div>
                    <div className="font-sans font-bold text-[15px]">Worn Wear resale (cannibalisation)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Metric</div>
                    <div className="font-sans font-bold text-[15px]">SKU elasticity coverage</div>
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
                      <th className="py-3 px-4 text-[#7A8499] font-normal">AUR $</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Markdown %</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Resale GM %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-[#FAF6EC]" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4 font-bold text-[#0F1A33]">Patagonia</td>
                      <td className="py-3 px-4 text-[#D85A30]">51.2%<span className="provenance-flag">V</span></td>
                      <td className="py-3 px-4 text-[#D69A2D]">$147</td>
                      <td className="py-3 px-4 text-[#D85A30]">12.4%</td>
                      <td className="py-3 px-4 text-[#1D9E75]">51.0%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">REI Co-op</td>
                      <td className="py-3 px-4">48.5%<span className="provenance-flag modelled">M</span></td>
                      <td className="py-3 px-4">$120</td>
                      <td className="py-3 px-4">18.2%</td>
                      <td className="py-3 px-4">45.0%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Arc'teryx</td>
                      <td className="py-3 px-4">58.0%</td>
                      <td className="py-3 px-4">$210</td>
                      <td className="py-3 px-4">8.5%</td>
                      <td className="py-3 px-4">55.0%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Cotopaxi</td>
                      <td className="py-3 px-4">53.0%</td>
                      <td className="py-3 px-4">$135</td>
                      <td className="py-3 px-4">14.0%</td>
                      <td className="py-3 px-4">48.0%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Fjällräven</td>
                      <td className="py-3 px-4">55.5%</td>
                      <td className="py-3 px-4">$165</td>
                      <td className="py-3 px-4">10.0%</td>
                      <td className="py-3 px-4">50.0%</td>
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
                      title: "Better Sweater family priced below elasticity-implied optimum",
                      impact: "$19.6M",
                      detail: "Demand elasticity -0.4, $12 headroom on five SKUs."
                    },
                    {
                      title: "Black Hole duffle range losing volume to elastic-segment competitors",
                      impact: "$8.4M",
                      detail: "Elasticity -1.6, $129 anchor unlocks 38% volume lift."
                    },
                    {
                      title: "Worn Wear resale undercuts full-price floor without price-fence",
                      impact: "$10.4M",
                      detail: "14% cannibalisation, +6pp YoY. SKU-level two-tier pricing closes the gap."
                    },
                    {
                      title: "Technical-outerwear inflation not yet passed through to retail",
                      impact: "$3.8M",
                      detail: "90bps margin absorb. Pricing committee deferred decision to Q4."
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
                  <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#7A8499] mb-4">Data Feeds (7)</div>
                  <ul className="space-y-2 font-mono-custom text-[11px] text-[#4A5570]">
                    <li>● SAP price master</li>
                    <li>● Demand-elasticity model output</li>
                    <li>● Markdown register</li>
                    <li>● Worn Wear pricing log</li>
                    <li>● Competitor-price scrape (Granular, DataWeave)</li>
                    <li>● Net-A-Porter style index</li>
                    <li>● Pricefx workflow</li>
                  </ul>
                </div>
                
                <div className="p-6 border-t-2" style={{ background: "#FFFEFA", borderColor: "#D85A30" }}>
                  <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-4">Architectural Gaps (3)</div>
                  <ul className="space-y-4">
                    {[
                      { cat: "MODEL", title: "Elasticity model coverage at 47% of SKU base", val: "+6pp", detail: "Closed by extending to long-tail SKUs" },
                      { cat: "DATA", title: "Competitor price scrape misses REI clearance events", val: "+4pp", detail: "Closed by DataWeave clearance feed" },
                      { cat: "WORKFLOW", title: "Pricing committee cadence quarterly, decisions lag market", val: "+3pp", detail: "Closed by moving to monthly with Pricefx workflow" }
                    ].map((gap, i) => (
                      <li key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono-custom text-[9px] bg-[#1A2238] text-[#F5EFE3] px-1.5 py-0.5 rounded-[2px]">{gap.cat}</span>
                          <span className="font-mono-custom text-[10px] text-[#D85A30]">{gap.val} confidence</span>
                        </div>
                        <div className="font-sans text-[13px] font-bold text-[#0F1A33]">{gap.title}</div>
                        <div className="font-serif-custom text-[12px] text-[#4A5570] mt-1">{gap.detail}</div>
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

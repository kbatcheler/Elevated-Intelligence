import React, { useEffect } from "react";
import { 
  BarChart3, TrendingUp, Crosshair, Users, Megaphone, 
  Truck, Tag, GitBranch, Target, UserCog, FileSignature, 
  Receipt, UserPlus, BookOpen, Cpu, Briefcase, Network, 
  Sliders, CheckSquare, Award, Sparkles, HelpCircle, 
  ChevronDown, Hexagon, Shield, FileText, Lock, ShieldAlert,
  ArrowRight, Activity, GitCommit, Search, Database, Layers
} from "lucide-react";

export function Customer() {
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
              <span className="font-mono-custom text-[10px] text-[#F5EFE3]">Tenant ontology · Patagonia.customerIntel</span>
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
                  { label: "Customer intelligence", conf: 91, status: "warn", active: true },
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
              <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-3">Intelligence layer · Market-facing</div>
              <h1 className="font-serif-custom text-5xl text-[#0F1A33] mb-4">Customer intelligence</h1>
              <p className="font-serif-custom italic text-xl text-[#4A5570]">"Who is staying with us, who is silently leaving, and what would it take to win back the activists?"</p>
              
              <div className="flex items-center gap-6 mt-6 font-mono-custom text-[11px] text-[#4A5570]">
                <div className="flex items-center gap-2"><GitCommit size={14} className="text-[#C8A24A]"/> Diagnosed Oct 14 2026</div>
                <div className="flex items-center gap-2">Confidence 76% <span className="text-[#D85A30]">Close 2 gaps → 86% confidence</span></div>
                <div>13 sources</div>
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
                      Active customer base of 3.2M is masking a structural shift: the climate-activist segment (840k, 26%) has grown LTV 19% YoY to $612 while the general-outdoor segment (1.4M) has declined 8% to $284 as REI's co-op pricing wins basket frequency. The Worn Wear repair-customer cohort, 312k strong, indexes 2.4x on next-twelve-month LTV but only 31% are tagged for retention treatment. A 12pp NPS gap between flagship stores (74) and outlet network (62) is concentrated in three Sun Belt markets where Arc'teryx is now top-of-mind.
                    </p>
                    <div className="mt-6 pt-4 border-t font-mono-custom text-[12px] font-bold text-[#1D9E75]" style={{ borderColor: "#E8DFC9" }}>
                      +$41.6M retained and reactivated LTV
                    </div>
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        num: "01",
                        title: "Build a Worn Wear retention loop for the 312k repair cohort",
                        impact: "+$22.4M LTV",
                        detail: "Tag repair visits as a high-intent signal. Trigger a 90-day activation sequence: new-arrival drops, activism story, member event."
                      },
                      {
                        num: "02",
                        title: "Outlet-cluster NPS intervention in Phoenix, Austin, San Diego",
                        impact: "+$11.8M churn recovery",
                        detail: "Three flagship managers rotate into outlet leads. Add an in-store ambassador programme tied to local climate non-profits."
                      },
                      {
                        num: "03",
                        title: "Reclaim the general-outdoor segment with bundle pricing",
                        impact: "+$7.4M basket",
                        detail: "REI is winning on co-op rebate optics. Counter with a Patagonia Members trial on layering bundles, 90 days, no commitment."
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
                  { label: "Active customers", val: "3.2M", sub: "-2% YoY", color: "#D69A2D", t: "V" },
                  { label: "Activist LTV", val: "$612", sub: "+19% YoY", color: "#1D9E75", t: "V" },
                  { label: "Outlet NPS", val: "62", sub: "-12 vs flagship", color: "#D85A30", t: "V" },
                  { label: "Repair cohort LTV index", val: "2.4x", sub: "312k customers", color: "#1D9E75", t: "M" }
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
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Segment</div>
                    <div className="font-sans font-bold text-[15px]">Climate activists (840k)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Segment</div>
                    <div className="font-sans font-bold text-[15px]">Worn Wear cohort (312k)</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Region</div>
                    <div className="font-sans font-bold text-[15px]">Sun Belt outlets</div>
                  </div>
                  <div>
                    <div className="font-mono-custom text-[10px] text-[#7A8499] mb-1">Spotlight Competitor</div>
                    <div className="font-sans font-bold text-[15px]">REI Co-op (basket share)</div>
                  </div>
                </div>
              </div>

              {/* Peer Benchmark */}
              <div style={{ background: "#FFFEFA", border: "1px solid #E8DFC9" }}>
                <table className="w-full text-left font-mono-custom text-[12px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Peer</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">NPS</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Repeat-rate %</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">LTV $</th>
                      <th className="py-3 px-4 text-[#7A8499] font-normal">Lapsed-12mo %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-[#FAF6EC]" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4 font-bold text-[#0F1A33]">Patagonia</td>
                      <td className="py-3 px-4 text-[#1D9E75]">74<span className="provenance-flag">V</span></td>
                      <td className="py-3 px-4 text-[#1D9E75]">45%</td>
                      <td className="py-3 px-4 text-[#D69A2D]">$420</td>
                      <td className="py-3 px-4 text-[#D85A30]">24%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">REI Co-op</td>
                      <td className="py-3 px-4">71<span className="provenance-flag modelled">M</span></td>
                      <td className="py-3 px-4">48%</td>
                      <td className="py-3 px-4">$380</td>
                      <td className="py-3 px-4">21%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Arc'teryx</td>
                      <td className="py-3 px-4">76</td>
                      <td className="py-3 px-4">42%</td>
                      <td className="py-3 px-4">$650</td>
                      <td className="py-3 px-4">28%</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: "#E8DFC9" }}>
                      <td className="py-3 px-4">Cotopaxi</td>
                      <td className="py-3 px-4">68</td>
                      <td className="py-3 px-4">38%</td>
                      <td className="py-3 px-4">$310</td>
                      <td className="py-3 px-4">35%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Fjällräven</td>
                      <td className="py-3 px-4">65</td>
                      <td className="py-3 px-4">35%</td>
                      <td className="py-3 px-4">$340</td>
                      <td className="py-3 px-4">30%</td>
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
                      title: "Worn Wear repair cohort under-tagged for retention treatment",
                      impact: "$22.4M",
                      detail: "Only 31% receive activation sequence. Cohort indexes 2.4x on forward LTV."
                    },
                    {
                      title: "Outlet NPS regional gap concentrated in Sun Belt",
                      impact: "$11.8M",
                      detail: "Phoenix, Austin, San Diego scoring 56-58 vs flagship 74. Arc'teryx top-of-mind."
                    },
                    {
                      title: "General-outdoor segment losing basket share to REI co-op",
                      impact: "$7.4M",
                      detail: "Co-op rebate optics winning low-loyalty customers. Bundle response untested."
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
                    <li>● Salesforce CDP</li>
                    <li>● Worn Wear repair-shop POS</li>
                    <li>● Medallia in-store NPS</li>
                    <li>● Yotpo reviews</li>
                    <li>● Member registry</li>
                    <li>● Sprout Social</li>
                    <li>● REI co-op share-of-wallet panel</li>
                    <li>● Klaviyo behaviour stream</li>
                  </ul>
                </div>
                
                <div className="p-6 border-t-2" style={{ background: "#FFFEFA", borderColor: "#D85A30" }}>
                  <div className="font-mono-custom text-[10px] uppercase tracking-widest text-[#D85A30] mb-4">Architectural Gaps (3)</div>
                  <ul className="space-y-4">
                    {[
                      { cat: "DATA", title: "Repair-cohort flag not propagated to Klaviyo segments", val: "+5pp", msg: "Closed by CDP routing fix" },
                      { cat: "MODEL", title: "LTV model does not weight activism-score input", val: "+3pp", msg: "Closed by feature-set extension" },
                      { cat: "WORKFLOW", title: "Outlet-cluster NPS scoring rolls up monthly, not weekly", val: "+2pp", msg: "Closed by Medallia cadence change" }
                    ].map((gap, i) => (
                      <li key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono-custom text-[9px] bg-[#1A2238] text-[#F5EFE3] px-1.5 py-0.5 rounded-[2px]">{gap.cat}</span>
                          <span className="font-mono-custom text-[10px] text-[#D85A30]">{gap.val} confidence</span>
                          <span className="font-mono-custom text-[10px] text-[#1D9E75]"> // {gap.msg}</span>
                        </div>
                        <div className="font-sans text-[13px] font-bold text-[#0F1A33]">{gap.title}</div>
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

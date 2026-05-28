import React, { useEffect } from "react";
import { 
  BarChart3, TrendingUp, Crosshair, Users, Megaphone,
  Truck, Tag, GitBranch, Target, UserCog, FileSignature, Receipt,
  UserPlus, BookOpen, Cpu, Briefcase, Network, Sliders, CheckSquare, Award,
  Command, ChevronDown, Activity, Clock, FileText, Play, MoveUpRight,
  TrendingDown, Minus, ArrowRight, Server, ShieldAlert, CircleSlash,
  AlertCircle
} from "lucide-react";
import "./tokens.css";

export function Demand() {
  useEffect(() => {
    document.title = "War-Room Console · Patagonia";
  }, []);

  return (
    <div className="warroom-theme min-h-screen flex flex-col font-['Inter'] text-[var(--ink)] bg-[var(--cream)] selection:bg-[var(--gold)] selection:text-white">
      
      {/* COMMAND BAR (HEADER) */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[var(--navy-deep)] text-white relative border-b-2 border-[var(--gold)] scanlines">
        {/* Left: Wordmark + Tenant */}
        <div className="flex items-center gap-6 w-1/4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
            <div className="leading-none">
              <span className="font-['Crimson_Pro'] text-[18px] font-semibold text-[var(--cream)] tracking-tight block">Different Day</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--gold-light)] block mt-0.5">Elevated Intelligence</span>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
            <span className="text-[12px] text-[var(--cream)]">Patagonia</span>
            <span className="opacity-40 text-[10px]">·</span>
            <span className="text-[12px] text-[var(--cream-dark)]">Q3 2026</span>
            <ChevronDown size={14} className="text-[var(--gold-light)] ml-1" />
          </button>
        </div>

        {/* Center: Command Palette Input */}
        <div className="w-2/4 flex justify-center">
          <div className="relative w-full max-w-xl group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Command size={14} className="text-[var(--gold-light)] opacity-70" />
            </div>
            <input 
              type="text" 
              placeholder="Jump to layer, action, KPI, or evidence..." 
              className="w-full bg-[var(--navy)] border border-white/10 rounded-md py-1.5 pl-9 pr-12 text-[13px] text-[var(--cream)] placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all glass-panel"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block border border-white/20 rounded px-1.5 text-[10px] font-medium text-white/40 bg-white/5">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Right: SLA Stats & User Profile */}
        <div className="flex items-center justify-end gap-5 w-1/4">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-['JetBrains_Mono'] text-[var(--gold-light)] opacity-80 hidden lg:flex">
            <div className="flex items-center gap-1.5" title="Response Time">
              <Activity size={12} />
              <span>42ms</span>
            </div>
            <div className="flex items-center gap-1.5" title="Confidence Delta">
              <TrendingUp size={12} className="text-[var(--teal)]" />
              <span className="text-[var(--teal)]">+1.2%</span>
            </div>
            <div className="flex items-center gap-1.5" title="Open Commits">
              <CheckSquare size={12} className="text-[var(--amber)]" />
              <span className="text-[var(--amber)]">3 open</span>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10 hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[12px] font-semibold text-[var(--cream)] leading-tight">M. Chen</div>
              <div className="text-[10px] text-[var(--slate-light)] leading-tight">Lead Analyst</div>
            </div>
            <div className="h-8 w-8 rounded bg-[var(--gold)] text-[var(--navy-deep)] flex items-center justify-center font-bold text-[12px] shadow-[0_0_10px_rgba(200,162,74,0.3)]">
              MC
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: Two-column micro-layout */}
        <nav className="w-[280px] shrink-0 flex bg-[var(--cream-light)] border-r border-[var(--cream-dark)]">
          {/* Left Rail: Icon-only group pivots */}
          <div className="w-[48px] flex flex-col items-center py-4 gap-4 bg-[var(--cream-dark)]/50 border-r border-[var(--cream-dark)]">
            <button className="h-8 w-8 flex items-center justify-center rounded text-[var(--slate)] hover:bg-[var(--cream)] hover:text-[var(--navy)] transition-colors" title="Executive">
              <Briefcase size={16} strokeWidth={2} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded bg-[var(--navy)] text-[var(--gold)] shadow-sm relative" title="Market-facing">
              <Megaphone size={16} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded text-[var(--slate)] hover:bg-[var(--cream)] hover:text-[var(--navy)] transition-colors" title="Operational">
              <Sliders size={16} strokeWidth={2} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded text-[var(--slate)] hover:bg-[var(--cream)] hover:text-[var(--navy)] transition-colors mt-auto" title="System">
              <Server size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Right Rail: Active Group Layer List (Market-facing) */}
          <div className="flex-1 flex flex-col py-4">
            <div className="px-4 mb-3">
              <h2 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[var(--slate-light)]">Market-facing</h2>
            </div>
            <ul className="flex-1 space-y-0.5">
              {[
                { label: "Demand intelligence", status: "bad", icon: TrendingUp, active: true },
                { label: "Competitive intelligence", status: "bad", icon: Crosshair },
                { label: "Customer intelligence", status: "warn", icon: Users },
                { label: "Brand and social", status: "warn", icon: Megaphone },
              ].map((item, idx) => (
                <li key={idx}>
                  <button className={`w-full flex items-center justify-between px-4 py-2 text-left relative transition-colors ${
                    item.active 
                      ? "bg-[var(--cream)] text-[var(--navy)] font-semibold" 
                      : "text-[var(--slate)] hover:bg-[var(--cream-dark)]/40 hover:text-[var(--navy)]"
                  }`}>
                    {item.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--gold)] gold-glow" />}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon size={14} strokeWidth={item.active ? 2.5 : 1.5} className={item.active ? "text-[var(--navy)]" : "text-[var(--slate-light)]"} />
                      <span className="text-[13px] truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {item.status === "bad" && <TrendingDown size={10} className="text-[var(--red)]" strokeWidth={3} />}
                      {item.status === "warn" && <Minus size={10} className="text-[var(--amber)]" strokeWidth={3} />}
                      {item.status === "good" && <TrendingUp size={10} className="text-[var(--teal)]" strokeWidth={3} />}
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "bad" ? "bg-[var(--red)]" : 
                        item.status === "warn" ? "bg-[var(--amber)]" : "bg-[var(--teal)]"
                      }`} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* MAIN PANE: 3-Row Stack */}
        <main className="flex-1 overflow-y-auto bg-[var(--cream)]">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-6">
            
            {/* ROW 1: Diagnosis at a glance */}
            <section className="bg-white border border-[var(--cream-dark)] rounded-lg p-5 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--coral)]" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate-light)] bg-[var(--cream-dark)] px-2 py-0.5 rounded-sm">Layer Diagnosis</span>
                  <span className="text-[11px] text-[var(--slate)] font-['JetBrains_Mono'] flex items-center gap-1"><Clock size={12}/> Oct 14, 2026</span>
                </div>
                <h1 className="font-['Crimson_Pro'] text-[32px] md:text-[40px] font-semibold text-[var(--navy)] leading-tight tracking-tight">Demand intelligence</h1>
                <p className="font-['Crimson_Pro'] italic text-[18px] text-[var(--slate)] mt-1 max-w-2xl leading-snug">"What is the market signalling we should ship, and how soon will it tip?"</p>
              </div>

              <div className="flex items-center gap-8 shrink-0 bg-[var(--cream-light)] p-4 rounded border border-[var(--cream-dark)]">
                {/* Confidence Dial */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-10 overflow-hidden mb-1">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--cream-dark)" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--navy)" strokeWidth="12" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset="36.4" /* 71% of 125.6 */ />
                    </svg>
                    <div className="absolute bottom-0 left-0 w-full text-center">
                      <span className="font-['JetBrains_Mono'] text-[18px] font-bold text-[var(--navy)]">71<span className="text-[12px]">%</span></span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--slate)] text-center font-medium">Confidence<br/><span className="text-[var(--navy)] font-bold">17 sources</span></div>
                </div>

                <div className="w-px h-12 bg-[var(--cream-dark)]" />

                {/* Gap Diptych */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold text-[var(--slate)]">Recovery</span>
                    <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[var(--teal)]">+$34.0M</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold text-[var(--slate)]">Gaps to close (3)</span>
                    <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[var(--navy)]">→ 88%</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                <button className="bg-[var(--coral)] hover:bg-[#C24E27] text-white px-6 py-3 rounded text-[13px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  Commit All <MoveUpRight size={14} strokeWidth={2.5}/>
                </button>
              </div>
            </section>

            {/* ROW 2: 2-Column Split (Narrative + Actions vs KPIs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Narrative & Actions */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Narrative Card */}
                <div className="bg-white border border-[var(--cream-dark)] rounded p-5 relative shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--coral)] rounded-t" />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--coral)]">Executive Narrative</h3>
                  </div>
                  <p className="font-['Crimson_Pro'] text-[17px] leading-relaxed text-[var(--ink)]">
                    Search demand for technical layering is up 34% YoY heading into the Q4 wholesale window, but Patagonia's share of voice on the three highest-converting long-tail clusters (wool baselayer, packable down, recycled fleece) slipped from #2 to #4 behind Arc'teryx and a surging Cotopaxi. Reddit and TikTok sentiment for the Nano Puff line collapsed 18 points after the Q2 PFAS reformulation. Without a Q4 SKU intervention we project a $34M demand shortfall.
                  </p>
                </div>

                {/* Actions Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[13px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare size={14} className="text-[var(--teal)]"/>
                      Recommended Actions
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      {
                        title: "Re-seed the Nano Puff narrative on TikTok and Reddit",
                        impact: "+$14.2M units",
                        detail: "Targeted creator drops plus a 6-week founder-storytelling arc against the PFAS reformulation rumour. Pair with in-store demos at the top 12 dealers."
                      },
                      {
                        title: "Surge SKU coverage on the wool baselayer cluster",
                        impact: "+$11.8M revenue",
                        detail: "Cotopaxi is winning long-tail because they have a five-weight ladder. Patagonia has three. Add weight-200 and weight-260 by Nov 15."
                      },
                      {
                        title: "Wholesale pre-order push to recover SoV from Arc'teryx",
                        impact: "+$8.0M retainer",
                        detail: "REI and Backcountry Q4 books still open for 9 days. Pre-commit on packable down plus dealer co-op for end-cap placement."
                      }
                    ].map((act, i) => (
                      <div key={i} className="bg-[#EAE4D3] border border-[var(--cream-dark)] rounded p-4 flex gap-4 hover:border-[var(--gold)] transition-colors relative group">
                        <div className="shrink-0 flex flex-col items-center">
                          <span className="font-['JetBrains_Mono'] font-bold text-[var(--navy)] bg-white w-6 h-6 rounded flex items-center justify-center text-[12px] shadow-sm">
                            0{i+1}
                          </span>
                          <div className="w-px h-full bg-[var(--cream-dark)] my-2 group-last:hidden" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex justify-between items-start gap-4 mb-1">
                            <h4 className="font-bold text-[14px] text-[var(--navy)] leading-snug">{act.title}</h4>
                            <span className="shrink-0 text-[11px] font-['JetBrains_Mono'] font-bold text-[var(--teal-deep)] bg-[var(--teal-faint)] px-2 py-0.5 rounded border border-[var(--teal)]/20 whitespace-nowrap">
                              {act.impact}
                            </span>
                          </div>
                          <p className="font-['Crimson_Pro'] italic text-[14px] text-[var(--slate)] leading-snug mb-3">
                            {act.detail}
                          </p>
                          <div className="flex items-center justify-between border-t border-[var(--cream-dark)]/50 pt-3">
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-[var(--navy)] text-white flex items-center justify-center text-[9px] font-bold">JD</span>
                              <span className="text-[10px] text-[var(--slate)] font-medium bg-white/50 px-1.5 py-0.5 rounded">Due Q4</span>
                            </div>
                            <button className="text-[11px] font-bold text-[var(--navy)] hover:text-[var(--coral)] flex items-center gap-1 transition-colors">
                              Commit <MoveUpRight size={10} />
                            </button>
                          </div>
                        </div>
                        <div className="absolute top-2 -right-1.5 w-3 h-3 rounded-full bg-[var(--gold)] border-2 border-[var(--cream-light)] shadow-sm animate-pulse" title="Uncommitted Action" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Instrument Cluster (KPIs) & Hero Spotlight */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 4-Up KPI Strip */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Search demand", val: "+34%", sub: "category index", tone: "good" },
                    { label: "SoV rank", val: "#4", sub: "fell from #2", tone: "bad" },
                    { label: "TikTok sentiment", val: "62", sub: "-18 since reformulation", tone: "bad" },
                    { label: "Wholesale book", val: "47%", sub: "-12pp vs plan", tone: "warn" }
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white border border-[var(--cream-dark)] rounded p-3 shadow-sm hover:border-[var(--navy)] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate-light)] group-hover:text-[var(--navy)] transition-colors">{kpi.label}</span>
                        {kpi.tone === "good" && <TrendingUp size={12} className="text-[var(--teal)]" />}
                        {kpi.tone === "warn" && <Minus size={12} className="text-[var(--amber)]" />}
                        {kpi.tone === "bad" && <TrendingDown size={12} className="text-[var(--red)]" />}
                      </div>
                      <div className={`font-['JetBrains_Mono'] text-[24px] font-bold leading-none my-1.5 ${
                        kpi.tone === "good" ? "text-[var(--teal-deep)]" : 
                        kpi.tone === "warn" ? "text-[var(--amber)]" : "text-[var(--red)]"
                      }`}>
                        {kpi.val}
                      </div>
                      <div className="text-[10px] text-[var(--slate)] font-medium bg-[var(--cream)] inline-block px-1.5 py-0.5 rounded-sm">
                        {kpi.sub}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spotlight Entities */}
                <div className="bg-[var(--navy-deep)] text-white rounded p-5 border border-[var(--gold)]/20 shadow-md">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold-light)] mb-4 flex items-center gap-2">
                    <Target size={14} /> Spotlight Entities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white/10 border border-white/20 rounded px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]" /> Cotopaxi <span className="opacity-50 ml-1">Competitor</span>
                    </span>
                    <span className="bg-white/10 border border-white/20 rounded px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]" /> Arc'teryx <span className="opacity-50 ml-1">Competitor</span>
                    </span>
                    <span className="bg-white/10 border border-white/20 rounded px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" /> Nano Puff <span className="opacity-50 ml-1">Product</span>
                    </span>
                    <span className="bg-white/10 border border-white/20 rounded px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" /> TikTok creator network <span className="opacity-50 ml-1">Channel</span>
                    </span>
                  </div>
                </div>

                {/* Peer Benchmark Mini-table */}
                <div className="bg-white border border-[var(--cream-dark)] rounded p-4 shadow-sm">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate-light)] mb-3 flex items-center gap-2">
                    <Users size={14} /> Peer Benchmark
                  </h3>
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-[var(--cream-dark)] text-[var(--slate)]">
                        <th className="pb-2 font-medium">Brand</th>
                        <th className="pb-2 font-medium">SoV Rank</th>
                        <th className="pb-2 font-medium">Search Lift</th>
                        <th className="pb-2 font-medium">Sentiment</th>
                        <th className="pb-2 font-medium">Fill %</th>
                      </tr>
                    </thead>
                    <tbody className="font-['JetBrains_Mono']">
                      <tr className="bg-[var(--cream-light)] font-bold text-[var(--navy)]">
                        <td className="py-2 px-1 rounded-l">Patagonia</td>
                        <td className="py-2 text-[var(--red)]">#4</td>
                        <td className="py-2 text-[var(--teal-deep)]">+34%</td>
                        <td className="py-2 text-[var(--red)]">62</td>
                        <td className="py-2 px-1 rounded-r">47%</td>
                      </tr>
                      <tr className="border-b border-[var(--cream-dark)]/50 text-[var(--slate)]">
                        <td className="py-2 px-1">REI Co-op</td>
                        <td className="py-2">#1</td>
                        <td className="py-2">+12%</td>
                        <td className="py-2">84</td>
                        <td className="py-2">100%</td>
                      </tr>
                      <tr className="border-b border-[var(--cream-dark)]/50 text-[var(--slate)]">
                        <td className="py-2 px-1">Arc'teryx</td>
                        <td className="py-2">#2</td>
                        <td className="py-2">+28%</td>
                        <td className="py-2">78</td>
                        <td className="py-2">85%</td>
                      </tr>
                      <tr className="text-[var(--slate)]">
                        <td className="py-2 px-1">Cotopaxi</td>
                        <td className="py-2">#3</td>
                        <td className="py-2">+56%</td>
                        <td className="py-2">82</td>
                        <td className="py-2">92%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            {/* ROW 3: Horizontally-scrolling Evidence Rail */}
            <div className="pt-4 border-t-2 border-[var(--cream-dark)]">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[13px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-2">
                  <Server size={14} className="text-[var(--slate)]"/>
                  Supporting Evidence & Infrastructure
                </h3>
              </div>
              
              {/* Card Rail */}
              <div className="flex gap-4 overflow-x-auto pb-4 rail-scroll snap-x">
                
                {/* Causes Card */}
                <div className="min-w-[320px] max-w-[320px] shrink-0 bg-white border border-[var(--amber)]/40 rounded shadow-sm snap-start flex flex-col">
                  <div className="p-3 border-b border-[var(--cream-dark)] bg-[var(--amber-faint)] rounded-t">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--amber)] flex items-center gap-1.5">
                      <AlertCircle size={12}/> Root Causes (3)
                    </span>
                  </div>
                  <div className="p-4 space-y-4 flex-1">
                    {[
                      { t: "Nano Puff sentiment collapse after PFAS reformulation", d: "$12.0M", desc: "62/100 sentiment vs 80 pre-reformulation. Creator network missed pre-brief." },
                      { t: "SKU ladder gaps in wool baselayer category", d: "$14.0M", desc: "Three weights vs Cotopaxi's five. Long-tail traffic bounces." },
                      { t: "Wholesale book trailing on packable down", d: "$8.0M", desc: "REI and Backcountry pre-orders 12pp behind plan. End-cap placement at risk." }
                    ].map((cause, i) => (
                      <div key={i} className="text-[11px]">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <strong className="text-[var(--navy)] leading-tight">{cause.t}</strong>
                          <span className="font-['JetBrains_Mono'] text-[var(--coral)] font-bold">{cause.d}</span>
                        </div>
                        <p className="text-[var(--slate)] leading-snug">{cause.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps Card */}
                <div className="min-w-[320px] max-w-[320px] shrink-0 bg-white border border-[var(--coral)]/40 rounded shadow-sm snap-start flex flex-col">
                  <div className="p-3 border-b border-[var(--cream-dark)] bg-[var(--coral-faint)] rounded-t">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] flex items-center gap-1.5">
                      <CircleSlash size={12}/> Architectural Gaps (3)
                    </span>
                  </div>
                  <div className="p-4 space-y-3 flex-1">
                    {[
                      { c: "SIGNAL", t: "TikTok sentiment not weighted by audience activism score", fix: "Closed by Brandwatch enrichment", impact: "+5pp" },
                      { c: "DATA", t: "Wholesale pre-order EDI lags 4 days", fix: "Closed by direct retailer API", impact: "+4pp" },
                      { c: "MODEL", t: "Long-tail search-to-revenue model needs Cotopaxi share input", fix: "Closed by competitive-search rebuild", impact: "+8pp" }
                    ].map((gap, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest mt-0.5 ${
                          gap.c === "DATA" ? "bg-[var(--blue-faint)] text-[var(--blue)]" :
                          gap.c === "MODEL" ? "bg-[var(--coral-faint)] text-[var(--coral)]" :
                          gap.c === "SIGNAL" ? "bg-purple-100 text-purple-700" :
                          "bg-[var(--amber-faint)] text-[var(--amber)]"
                        }`}>
                          {gap.c}
                        </span>
                        <div>
                          <div className="text-[11px] text-[var(--navy)] font-medium leading-snug">{gap.t}</div>
                          <div className="text-[10px] text-[var(--slate)] mt-1 flex justify-between items-center pr-2">
                            <span>{gap.fix}</span>
                            <span className="font-['JetBrains_Mono'] text-[var(--teal-deep)] font-bold">{gap.impact}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="text-[10px] font-bold text-[var(--navy)] hover:text-[var(--coral)] mt-2 flex items-center gap-1 transition-colors w-full justify-end">
                      Route to pipeline <ArrowRight size={10} />
                    </button>
                  </div>
                </div>

                {/* Data Feeds Card */}
                <div className="min-w-[320px] max-w-[320px] shrink-0 bg-white border border-[var(--cream-dark)] rounded shadow-sm snap-start flex flex-col">
                  <div className="p-3 border-b border-[var(--cream-dark)] bg-[var(--cream-light)] rounded-t">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate-light)] flex items-center gap-1.5">
                      <Network size={12}/> Active Data Feeds
                    </span>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Google Trends API", "Meta interest graph", "TikTok Creator API", "Reddit r/ultralight scrape",
                        "REI/Backcountry pre-order EDI", "Net-A-Porter mention stream", "Sprinklr", "Brandwatch", "Spate trend index"
                      ].map((feed, i) => (
                        <span key={i} className="text-[10px] border border-[var(--cream-dark)] bg-[var(--cream)] px-2 py-1 rounded text-[var(--slate)] font-['JetBrains_Mono'] leading-tight">
                          {feed}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blank space filler for scrolling comfort */}
                <div className="min-w-[20px] shrink-0" />

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

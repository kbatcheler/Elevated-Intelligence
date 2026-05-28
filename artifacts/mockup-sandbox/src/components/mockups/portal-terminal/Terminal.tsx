import React, { useState, useEffect } from "react";

const COLORS = {
  bg: "#0B1320",
  surface: "#131C2E",
  border: "#2A3650",
  text: "#E8EEF7",
  amber: "#F4B83A",
  cyan: "#4DD8E6",
  green: "#4EE0A0",
  red: "#FF6B5B",
};

export function Terminal() {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const int = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col font-mono text-[12px] leading-tight" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .blink { opacity: ${cursorVisible ? 1 : 0}; }
        .ticker { display: flex; white-space: nowrap; animation: ticker 20s linear infinite; }
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; border-left: 1px solid ${COLORS.border}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; }
      `}} />

      {/* Top Header */}
      <div className="shrink-0 border-b flex flex-col" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center justify-between px-4 py-1.5" style={{ backgroundColor: COLORS.surface }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold" style={{ color: COLORS.cyan }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }}></span>
              DIFFERENT DAY · ELEVATED INTELLIGENCE
            </div>
            <div className="flex gap-4 text-[11px]">
              <span style={{ color: COLORS.amber }}>TENANT: PATAGONIA</span>
              <span style={{ color: COLORS.amber }}>PRD: Q3 2026</span>
              <span style={{ color: COLORS.text }}>USER: M. CHEN [ANALYST]</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button className="hover:bg-white/10 px-2 py-0.5 border border-transparent hover:border-[${COLORS.border}] transition-colors">[F1] MORN_BRF</button>
            <button className="hover:bg-white/10 px-2 py-0.5 border border-transparent hover:border-[${COLORS.border}] transition-colors">[F2] BRD_PACK</button>
            <button className="hover:bg-white/10 px-2 py-0.5 border border-transparent hover:border-[${COLORS.border}] transition-colors" style={{ color: COLORS.cyan }}>[F3] INTEL_AI</button>
            <button className="hover:bg-white/10 px-2 py-0.5 border border-transparent hover:border-[${COLORS.border}] transition-colors">[F4] SW_CO</button>
            <button className="hover:bg-white/10 px-2 py-0.5 border border-transparent hover:border-[${COLORS.border}] transition-colors">[F5] LENS</button>
            <span className="bg-[${COLORS.border}] px-1.5 py-0.5 text-black" style={{ backgroundColor: COLORS.amber }}>MC</span>
          </div>
        </div>
        
        {/* Command Line & Ticker */}
        <div className="flex border-t" style={{ borderColor: COLORS.border }}>
          <div className="flex-1 flex items-center px-4 py-1.5 gap-2" style={{ backgroundColor: COLORS.bg }}>
            <span style={{ color: COLORS.green }}>&gt;</span>
            <span style={{ color: COLORS.cyan }}>/layer brand-social patagonia q3 --diff peers</span>
            <span className="w-1.5 h-3 inline-block blink" style={{ backgroundColor: COLORS.green }}></span>
          </div>
        </div>
        <div className="overflow-hidden border-t py-1 text-[11px]" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
          <div className="ticker flex gap-8" style={{ color: COLORS.amber }}>
            <span>EARNED MEDIA VAL $42.1M (+18%) ▲</span>
            <span>PAID SPEND $15.0M (FLAT) ▬</span>
            <span>KPMG CX RNK #3 (+1) ▲</span>
            <span style={{ color: COLORS.red }}>LOYALTY ID 80% (WARN) ▼</span>
            <span>DTC REV $513.8M ▬</span>
            <span>WORN WEAR $13M ▲</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 border-r flex flex-col overflow-y-auto" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
          <div className="p-2 space-y-4">
            <div>
              <div className="font-bold mb-1" style={{ color: COLORS.cyan }}>[EXEC]</div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>BUS_PERF</span><span style={{ color: COLORS.amber }}>AMB</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>FINANCE</span><span style={{ color: COLORS.red }}>RED</span></div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: COLORS.cyan }}>[MKT]</div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>DMND_INTEL</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>COMP_INTEL</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>CUST_INTEL</span><span style={{ color: COLORS.amber }}>AMB</span></div>
              <div className="flex justify-between bg-white/10 px-1"><span style={{ color: COLORS.cyan }} className="font-bold">&gt; BRAND_SOC</span><span style={{ color: COLORS.amber }}>AMB</span></div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: COLORS.cyan }}>[OPS]</div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>SUPPLY_CHN</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>PRC_MARGIN</span><span style={{ color: COLORS.amber }}>AMB</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>SLS_PIPELN</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>MKTG_PERF</span><span style={{ color: COLORS.amber }}>AMB</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>PPL_OPER</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>CNTRCT_MGT</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>RECEIVBLS</span><span style={{ color: COLORS.red }}>RED</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>TLNT_HR</span><span style={{ color: COLORS.red }}>RED</span></div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: COLORS.cyan }}>[SYS]</div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>SLS_PLYBK</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>INTEL_ARCH</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>ENG_PIPELN</span><span style={{ color: COLORS.amber }}>AMB</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>X_LAYR_MAP</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>WAR_ROOM</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>CMIT_ACTNS</span><span style={{ color: COLORS.green }}>GRN</span></div>
              <div className="flex justify-between hover:bg-white/5 cursor-pointer px-1"><span>OUTCM_TRK</span><span style={{ color: COLORS.green }}>GRN</span></div>
            </div>
          </div>
        </div>

        {/* Main Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Split: Narrative & Actions */}
          <div className="flex-1 border-r flex flex-col overflow-y-auto" style={{ borderColor: COLORS.border }}>
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <div className="flex gap-4">
                <span className="font-bold" style={{ color: COLORS.text }}>[F1 NARR]</span>
                <span className="opacity-50">[F2 ACTIONS]</span>
                <span className="opacity-50">[F3 CAUSES]</span>
                <span className="opacity-50">[F4 FEEDS]</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span style={{ color: COLORS.amber }}>DIAG: OCT 14 2026</span>
                <span style={{ color: COLORS.green }}>CONF: 78%</span>
                <span style={{ color: COLORS.cyan }}>3 GAPS -&gt; 92%</span>
                <span>SRC: 11</span>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Context Header */}
              <div>
                <div style={{ color: COLORS.amber }} className="mb-1">INTEL_LAYER: MARKET-FACING</div>
                <div className="text-xl font-bold uppercase" style={{ color: COLORS.cyan }}>Brand and Social</div>
                <div className="italic mt-1" style={{ color: COLORS.text }}>"What is our brand earning us, and where are we leaking it?"</div>
              </div>

              {/* Exec Narrative */}
              <div className="border p-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                <div className="flex justify-between border-b pb-2 mb-2" style={{ borderColor: COLORS.border }}>
                  <span className="font-bold" style={{ color: COLORS.cyan }}>:: EXECUTIVE NARRATIVE</span>
                  <span className="bg-red-500/20 px-1 font-bold" style={{ color: COLORS.red }}>ACT: +$28.4M REC</span>
                </div>
                <div className="leading-relaxed">
                  Patagonia's marketing model runs on $15M paid media plus owned activism (Worn Wear, 1% for the Planet, Don't Buy This Jacket lineage). KPMG ranks the brand top-3 in U.S. customer experience and 80% of buyers self-identify as loyal, yet DTC revenue is flat at $513.8M as Worn Wear ($13M resale) cannibalises full-price units. The earned-media multiplier on activism campaigns is doing the heavy lifting that paid media used to.
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="font-bold mb-3 border-b pb-1" style={{ color: COLORS.cyan, borderColor: COLORS.border }}>:: RECOMMENDED ACTIONS (3)</div>
                <div className="space-y-3">
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">01. REFRAME WORN WEAR AS ACQUISITION</span>
                      <span style={{ color: COLORS.green }}>+$11.2M DTC</span>
                    </div>
                    <div className="text-[11px] opacity-80 leading-relaxed">
                      Treat trade-in as the first touch in an LTV ladder, not a discount on the next jacket. Re-segment buyers by repair-shop visits to find latent advocates.
                    </div>
                  </div>
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">02. DOUBLE DOWN ON ACTIVISM IN Q4</span>
                      <span style={{ color: COLORS.green }}>+$9.6M EMV</span>
                    </div>
                    <div className="text-[11px] opacity-80 leading-relaxed">
                      Two activism stunts per quarter generated 4.2x the engagement of paid campaigns. Stage one anchor campaign in November against fossil-fuel sponsorship of outdoor brands.
                    </div>
                  </div>
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">03. LOCALIZE CX SCORES BY CLUSTER</span>
                      <span style={{ color: COLORS.green }}>+$7.6M LTV</span>
                    </div>
                    <div className="text-[11px] opacity-80 leading-relaxed">
                      KPMG's top-3 score masks a 14-point gap between flagship and outlet stores. Deploy NPS triggers at the SKU-cluster level so the brand team can intervene before churn.
                    </div>
                  </div>
                </div>
              </div>

              {/* Causes */}
              <div>
                <div className="font-bold mb-3 border-b pb-1" style={{ color: COLORS.red, borderColor: COLORS.border }}>:: ROOT CAUSES (3)</div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span style={{ color: COLORS.red }}>[C1]</span>
                    <div>
                      <div className="flex justify-between w-full">
                        <span className="font-bold">Worn Wear cannibalisation outpacing new-customer pull-through</span>
                        <span style={{ color: COLORS.red }}>$11.2M</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">Resale grew 38% YoY while full-price units fell 6%. Repair customers do not convert to new-buyer cohort.</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ color: COLORS.red }}>[C2]</span>
                    <div>
                      <div className="flex justify-between w-full">
                        <span className="font-bold">Paid media efficiency declining</span>
                        <span style={{ color: COLORS.red }}>$5.8M</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">CPM up 22% YoY on Meta. Earned-media campaigns deliver 4.2x engagement at 0.3x CPM.</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ color: COLORS.red }}>[C3]</span>
                    <div>
                      <div className="flex justify-between w-full">
                        <span className="font-bold">Loyalty score masking regional decline</span>
                        <span style={{ color: COLORS.red }}>$11.4M</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">National 80% loyalty hides 62% in Sun Belt outlets where Arc'teryx is gaining share.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Gaps */}
              <div>
                <div className="font-bold mb-3 border-b pb-1" style={{ color: COLORS.cyan, borderColor: COLORS.border }}>:: ARCHITECTURE & FEEDS</div>
                <div className="mb-4">
                  <div className="opacity-50 mb-1">ACTIVE FEEDS:</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {["Meta Ads API", "GA4", "KPMG CX panel", "Worn Wear POS", "Net-A-Porter mention scrape", "Sprinklr social listening", "Brandwatch", "ClimateScope tracker"].map(f => (
                      <span key={f} className="border px-1" style={{ borderColor: COLORS.border, color: COLORS.amber }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="opacity-50 mb-1">ARCH GAPS:</div>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span style={{ color: COLORS.cyan }}>[DATA]</span><span>Missing regional store NPS overlay</span></div>
                    <div className="flex gap-2"><span style={{ color: COLORS.cyan }}>[MODEL]</span><span>Incomplete LTV attribution for Worn Wear</span></div>
                    <div className="flex gap-2"><span style={{ color: COLORS.cyan }}>[INTEG]</span><span>Meta CPM alerting disconnected from media mix</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Split: KPIs & Matrix */}
          <div className="w-[480px] flex flex-col overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <span className="font-bold" style={{ color: COLORS.text }}>[F5 MATRIX]</span>
              <span className="opacity-50">[F6 PEERS]</span>
            </div>
            
            <div className="p-4 space-y-6">
              {/* KPI Strip */}
              <div>
                <div className="font-bold mb-2" style={{ color: COLORS.cyan }}>:: TELEMETRY (4)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="text-[10px] opacity-70 mb-1">EMV</div>
                    <div className="text-xl font-bold" style={{ color: COLORS.green }}>$42.1M</div>
                    <div className="text-[11px]" style={{ color: COLORS.green }}>+18% YOY ▲</div>
                  </div>
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="text-[10px] opacity-70 mb-1">PAID SPEND</div>
                    <div className="text-xl font-bold" style={{ color: COLORS.amber }}>$15.0M</div>
                    <div className="text-[11px] opacity-70">FLAT ▬</div>
                  </div>
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="text-[10px] opacity-70 mb-1">KPMG CX</div>
                    <div className="text-xl font-bold" style={{ color: COLORS.green }}>#3</div>
                    <div className="text-[11px]" style={{ color: COLORS.green }}>+1 SPOT ▲</div>
                  </div>
                  <div className="border p-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="text-[10px] opacity-70 mb-1">LOYALTY SELF-ID</div>
                    <div className="text-xl font-bold" style={{ color: COLORS.amber }}>80%</div>
                    <div className="text-[11px]" style={{ color: COLORS.red }}>SLIPPING QOQ ▼</div>
                  </div>
                </div>
              </div>

              {/* Hero Entities */}
              <div>
                <div className="font-bold mb-2" style={{ color: COLORS.cyan }}>:: SPOTLIGHT ENTITIES</div>
                <div className="border border-collapse" style={{ borderColor: COLORS.border }}>
                  <div className="flex border-b" style={{ borderColor: COLORS.border }}>
                    <div className="w-24 p-1 border-r opacity-50" style={{ borderColor: COLORS.border }}>TYPE</div>
                    <div className="flex-1 p-1 opacity-50">ENTITY</div>
                  </div>
                  <div className="flex border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="w-24 p-1 border-r" style={{ borderColor: COLORS.border, color: COLORS.amber }}>COMPETITOR</div>
                    <div className="flex-1 p-1">REI CO-OP</div>
                  </div>
                  <div className="flex border-b" style={{ borderColor: COLORS.border }}>
                    <div className="w-24 p-1 border-r" style={{ borderColor: COLORS.border, color: COLORS.amber }}>COMPETITOR</div>
                    <div className="flex-1 p-1">ARC'TERYX</div>
                  </div>
                  <div className="flex border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                    <div className="w-24 p-1 border-r" style={{ borderColor: COLORS.border, color: COLORS.cyan }}>SEGMENT</div>
                    <div className="flex-1 p-1">WORN WEAR COHORT</div>
                  </div>
                  <div className="flex" style={{ borderColor: COLORS.border }}>
                    <div className="w-24 p-1 border-r" style={{ borderColor: COLORS.border, color: COLORS.green }}>CHANNEL</div>
                    <div className="flex-1 p-1">INSTAGRAM REELS</div>
                  </div>
                </div>
              </div>

              {/* Peer Benchmark */}
              <div>
                <div className="font-bold mb-2" style={{ color: COLORS.cyan }}>:: PEER BENCHMARK MATRIX</div>
                <div className="border overflow-hidden" style={{ borderColor: COLORS.border }}>
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead style={{ backgroundColor: COLORS.surface }}>
                      <tr className="border-b" style={{ borderColor: COLORS.border }}>
                        <th className="p-1.5 font-normal opacity-50">PEER</th>
                        <th className="p-1.5 font-normal opacity-50 text-right">EM_MULT</th>
                        <th className="p-1.5 font-normal opacity-50 text-right">CX_RNK</th>
                        <th className="p-1.5 font-normal opacity-50 text-right">LOYAL%</th>
                        <th className="p-1.5 font-normal opacity-50 text-right">DTC_SHR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-white/5" style={{ borderColor: COLORS.border }}>
                        <td className="p-1.5 font-bold" style={{ color: COLORS.cyan }}>&gt; PATAGONIA</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>4.2x</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>#3</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.amber }}>80%</td>
                        <td className="p-1.5 text-right">41%</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: COLORS.border }}>
                        <td className="p-1.5">REI CO-OP</td>
                        <td className="p-1.5 text-right">2.8x</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>#1</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>92%</td>
                        <td className="p-1.5 text-right">100%</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                        <td className="p-1.5">ARC'TERYX</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.amber }}>1.9x</td>
                        <td className="p-1.5 text-right">#8</td>
                        <td className="p-1.5 text-right">71%</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>62%</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: COLORS.border }}>
                        <td className="p-1.5">COTOPAXI</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.green }}>5.1x</td>
                        <td className="p-1.5 text-right">#12</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.red }}>54%</td>
                        <td className="p-1.5 text-right">81%</td>
                      </tr>
                      <tr>
                        <td className="p-1.5">FJÄLLRÄVEN</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.red }}>1.1x</td>
                        <td className="p-1.5 text-right">#15</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.amber }}>68%</td>
                        <td className="p-1.5 text-right" style={{ color: COLORS.red }}>34%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

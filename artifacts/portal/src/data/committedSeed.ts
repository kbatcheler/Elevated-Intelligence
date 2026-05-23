// Pre-seeded committed actions for the Mercer demo profile. Without these,
// the Committed Actions page is empty until a user manually clicks "commit"
// inside a layer — which defeats the point of the page as a stand-alone view
// the leadership team should be able to walk into cold.
//
// Every entry here is drawn from a real action recommendation that already
// lives inside one of the LAYERS (data/layers.ts) — same titles, same dollar
// impacts, same dates — so the tray is consistent with what the operator
// would see if they navigated to that layer and committed by hand.

import type { CommittedAction } from "../context/AppContext";

export type CommittedSeed = Omit<CommittedAction, "id" | "committedAt">;

export const MERCER_COMMITTED_SEED: CommittedSeed[] = [
  // ── In-flight, this week ───────────────────────────────────────────
  {
    layer: "pricing-margin",
    layerTitle: "Pricing and margin",
    title: "Targeted reset on top 50 cordless SKUs",
    detail: "Lift price 2–4% on 31 SKUs, hold on 19. First three days of trading tracking 8% ahead of the modelled volume curve.",
    impact: "$1.2M margin",
    owner: "Head of Pricing",
    due: "31 Oct 2026",
    status: "in-flight",
  },
  {
    layer: "supply-chain",
    layerTitle: "Supply chain",
    title: "Dallas DC labour augmentation",
    detail: "Temp staffing across inbound + pick zones for 8 weeks via Kelly MSA. 9 of 11 shifts filled by week 1.",
    impact: "$0.5M throughput",
    owner: "J. Mendoza (DC Ops)",
    due: "08 Dec 2026",
    status: "in-flight",
  },
  {
    layer: "contract-management",
    layerTitle: "Contract management",
    title: "Close Supplier C legal review this week",
    detail: "Escalate indemnity and audit clauses to GC; target 5-day close. Day 2 of 5 — both clauses out for redline.",
    impact: "$0.8M Q4 unlock",
    owner: "GC + Procurement",
    due: "21 Oct 2026",
    status: "in-flight",
  },
  {
    layer: "marketing-performance",
    layerTitle: "Marketing performance",
    title: "Brand → Email reallocation, $50K/wk",
    detail: "Shift display spend from 1.8× ROAS Brand into 8.25× ROAS Email. First-week incremental open rate +14%.",
    impact: "$0.6M Q4 revenue",
    owner: "Performance Marketing Lead",
    due: "01 Dec 2026",
    status: "in-flight",
  },

  // ── Committed, not yet started ─────────────────────────────────────
  {
    layer: "supply-chain",
    layerTitle: "Supply chain",
    title: "Activate qualified Supplier C on cordless range",
    detail: "Dual-source the top-4 velocity SKUs. Ships in 14 days once contract closes (see Contract management).",
    impact: "$0.8M Q4 revenue",
    owner: "Supply Planning",
    due: "04 Nov 2026",
    status: "committed",
  },
  {
    layer: "demand-intelligence",
    layerTitle: "Demand intelligence",
    title: "SE-only DIY counter-promo, 24 SKUs",
    detail: "Targeted 15%-off in Dallas, Phoenix, Atlanta metros for 2 weeks. Approved by CFO + VP Trade.",
    impact: "$0.9M Q4 revenue",
    owner: "Demand Planning + Trade",
    due: "11 Nov 2026",
    status: "committed",
  },
  {
    layer: "receivables",
    layerTitle: "Receivables and invoicing",
    title: "Recovery contact on top 6 debtors",
    detail: "Joint AM + finance call sequence within 10 days. Sequenced behind service-restoration on three accounts.",
    impact: "$1.4M cash",
    owner: "CFO + Head of Trade Sales",
    due: "27 Oct 2026",
    status: "committed",
  },
  {
    layer: "contract-management",
    layerTitle: "Contract management",
    title: "Renegotiate DC labour rate cards",
    detail: "Phoenix rate card renews 1 Nov — reset to off-peak benchmark before counter-signing.",
    impact: "$0.6M Q4 opex",
    owner: "Procurement + DC Ops",
    due: "01 Nov 2026",
    status: "committed",
  },
  {
    layer: "talent-hr",
    layerTitle: "Talent and HR",
    title: "Compensation review · DC + senior data engineering",
    detail: "Market+8% reset for Dallas and Phoenix DC roles and the data-engineering lead blocking three model retrains.",
    impact: "$0.6M productivity",
    owner: "CHRO + CFO",
    due: "15 Nov 2026",
    status: "committed",
  },
  {
    layer: "customer-intelligence",
    layerTitle: "Customer intelligence",
    title: "Named-account outreach · 12 detractor trade accounts",
    detail: "Direct VP-level outreach within 14 days. Mirrors the Q2 play that delivered +11 NPS in the detractor cohort.",
    impact: "$1.1M ARR retained",
    owner: "VP Trade Sales",
    due: "28 Oct 2026",
    status: "committed",
  },

  // ── Done this quarter ──────────────────────────────────────────────
  {
    layer: "supply-chain",
    layerTitle: "Supply chain",
    title: "Top-SKU safety-stock lift, 22 SKUs",
    detail: "Cover lifted from 7 to 14 days on 22 SKUs in the Home Improvement category. Cost of carry within budget.",
    impact: "$0.3M protected",
    owner: "Supply Planning",
    due: "30 Sep 2026",
    status: "done",
  },
  {
    layer: "pricing-margin",
    layerTitle: "Pricing and margin",
    title: "Suspend auto-matching on margin-protected lines",
    detail: "Manual approval re-introduced on competitor-match depth for 19 SKUs. Halted unforced margin give-away.",
    impact: "$0.4M margin",
    owner: "Head of Pricing",
    due: "05 Oct 2026",
    status: "done",
  },
];

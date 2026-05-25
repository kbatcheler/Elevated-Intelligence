// The 26 real DiffDay apps that ship today on demo.diffday.dev. Mirrored
// verbatim from the public App Library so the cross-layer map stops being
// a fictional catalog and shows what actually exists. Each app is tagged
// with the capability product(s) from deficiencies.ts that it instantiates,
// so the map can answer "this conceptual capability ships as which real
// app?", closing the loop between the abstract dependency graph and
// what a buyer can actually deploy.

import type { ProductId } from "./deficiencies";

export type AppDomain =
  | "Retail & CPG"
  | "Financial services"
  | "Real estate"
  | "Legal & professional"
  | "Education"
  | "Operations & supply chain"
  | "Customer & growth"
  | "Communications"
  | "Cross-industry";

export interface DiffDayApp {
  id: string;
  initials: string;        // 1-2 letters shown in the chip square
  name: string;
  tagline: string;         // the headline one-liner from demo.diffday.dev
  description: string;     // the body paragraph, trimmed
  domain: AppDomain;
  capabilities: ProductId[]; // which conceptual products this app instantiates
}

export const DIFFDAY_APPS: DiffDayApp[] = [
  {
    id: "retail-intelligence", initials: "RI", name: "Retail Intelligence",
    tagline: "Real-time intelligence for winning prices",
    description: "Competitive pricing intelligence that monitors competitor prices, delivers AI pricing recommendations, and helps retailers protect margin through data-driven strategy.",
    domain: "Retail & CPG",
    capabilities: ["comp-sales", "news-monitor"],
  },
  {
    id: "venture-vision", initials: "VV", name: "Venture Vision",
    tagline: "See your portfolio. Shape outcomes",
    description: "AI-powered venture capital portfolio management, tracks company performance, generates LP reports, analyses risk, and surfaces investment insights.",
    domain: "Financial services",
    capabilities: ["news-monitor", "ai-companion"],
  },
  {
    id: "churn-shield", initials: "CS", name: "Churn Shield",
    tagline: "Predict churn. Protect revenue",
    description: "Customer intelligence platform that predicts churn risk, analyses lifetime value, and automates retention campaigns for Retail, CPG and Beauty.",
    domain: "Customer & growth",
    capabilities: ["contact-ownership", "ai-companion"],
  },
  {
    id: "venture-iq", initials: "VI", name: "Venture IQ",
    tagline: "Screen smarter. Invest better",
    description: "Helps VC firms screen deals 60% faster, AI analyses pitch decks, scores opportunities, and generates investment memos.",
    domain: "Financial services",
    capabilities: ["contract-hub", "ai-companion"],
  },
  {
    id: "counsel-command", initials: "CC", name: "Counsel Command",
    tagline: "Operational clarity for modern law firms",
    description: "AI back-office for law firms, delegate work, orchestrate workflows, track compliance and surface partner-level business insights in one place.",
    domain: "Legal & professional",
    capabilities: ["contract-hub", "ops-intel"],
  },
  {
    id: "armando", initials: "A", name: "Armando",
    tagline: "Talk to your CRM, close more deals",
    description: "Update your CRM by chatting naturally, AI handles data entry, surfaces insights, and keeps the pipeline organised so reps focus on closing.",
    domain: "Customer & growth",
    capabilities: ["unified-chat", "ai-companion", "contact-ownership"],
  },
  {
    id: "ai-doc-agent", initials: "AD", name: "AI Doc Agent",
    tagline: "Where documents become intelligence",
    description: "Enterprise document intelligence, process, analyse and extract insights from documents; natural-language Q&A, comparison and anomaly detection turn unstructured docs into business intelligence.",
    domain: "Cross-industry",
    capabilities: ["contract-hub", "data-integration", "nl-search"],
  },
  {
    id: "iris-insure", initials: "II", name: "IRIS Insure",
    tagline: "Smarter underwriting. Faster decisions",
    description: "Transforms the 45-day life insurance underwriting cycle into 8 days through AI document processing, automated risk analysis and multi-carrier matching.",
    domain: "Financial services",
    capabilities: ["contract-hub", "data-integration"],
  },
  {
    id: "university-compliance", initials: "UC", name: "University Compliance",
    tagline: "The intelligent backbone of university compliance",
    description: "Streamlines IPEDS, state and accreditor reporting with automated tracking, real-time deadline monitoring and executive dashboards, cuts reporting time by 60%.",
    domain: "Education",
    capabilities: ["legislative", "ops-intel"],
  },
  {
    id: "store-task-orchestrator", initials: "ST", name: "Store Task Orchestrator",
    tagline: "All the tasks of a retail store in one AI app",
    description: "Turns real-time store signals into AI-prioritised, role-specific task queues, the right person doing the right thing at the right time, replacing hours of manual triage.",
    domain: "Operations & supply chain",
    capabilities: ["ops-intel", "ai-companion"],
  },
  {
    id: "styleforge", initials: "SF", name: "StyleForge AI",
    tagline: "Visualize any product configuration instantly",
    description: "Multi-vertical product visualisation, turns any combination of colours, materials and settings into photorealistic imagery in under a second, replacing photoshoots.",
    domain: "Retail & CPG",
    capabilities: ["web-conversion", "property-intel"],
  },
  {
    id: "community-assist", initials: "CA", name: "Community Assist",
    tagline: "Your trusted companion",
    description: "White-label platform for deploying trusted, citation-backed AI assistants, curated knowledge bases plus web search and persistent memory for verifiable answers.",
    domain: "Customer & growth",
    capabilities: ["unified-chat", "nl-search", "ai-companion"],
  },
  {
    id: "politzer", initials: "PZ", name: "Politzer",
    tagline: "Full-spectrum social listening and PR intelligence",
    description: "Monitors brand mentions across 20+ social platforms, tracks narrative spread with semantic analysis, detects bots, surfaces crises early and maps influencer networks for PR agencies.",
    domain: "Communications",
    capabilities: ["news-monitor", "ai-companion"],
  },
  {
    id: "gersh", initials: "G", name: "Gersh",
    tagline: "Every deal, every dollar, every rule, in seconds",
    description: "Commission intelligence for talent agencies, replaces spreadsheets with real-time dashboards, runs SAG-AFTRA and California labour-law compliance checks, audits every deal end-to-end.",
    domain: "Legal & professional",
    capabilities: ["contract-hub", "legislative", "invoicing"],
  },
  {
    id: "family-dollar", initials: "FD", name: "Family Dollar",
    tagline: "AI that works the floor, not just the boardroom",
    description: "Operations platform across 7,251 stores, catches freight overcharges, recovers supplier deductions, puts real-time inventory answers in every associate's pocket, and accelerates new-hire ramp.",
    domain: "Retail & CPG",
    capabilities: ["ops-intel", "invoicing", "unified-chat"],
  },
  {
    id: "maurices", initials: "M", name: "Maurices",
    tagline: "Six AI tools. One P&L. Built in 72 hours",
    description: "Six AI micro-apps, from real-time markdown optimisation to store-level allocation intelligence, protecting gross margin, cutting returns and driving an estimated +$23.4M EBITDA across 840 stores.",
    domain: "Retail & CPG",
    capabilities: ["ops-intel", "comp-sales", "ai-companion"],
  },
  {
    id: "demand", initials: "D", name: "Demand",
    tagline: "AI supply-chain planning end-to-end",
    description: "Consolidates multi-source sales data, runs AI demand forecasting and delivers end-to-end supply-chain planning, multi-source sync built in.",
    domain: "Operations & supply chain",
    capabilities: ["ops-intel", "data-integration"],
  },
  {
    id: "financial-aid", initials: "FA", name: "Financial Aid",
    tagline: "Automating Title IV refunds for universities",
    description: "Title IV refund automation, replaces the 2-3 hour manual calculation with an automated workflow; pulls data from SIS via SFTP, applies HCM1 rules and routes via approval pipeline.",
    domain: "Education",
    capabilities: ["invoicing", "data-integration"],
  },
  {
    id: "transcript", initials: "TA", name: "Transcript App",
    tagline: "Smarter transfer-credit decisions",
    description: "Automates evaluation of academic transcripts for transfer credit, AI scoring engine analyses coursework across six dimensions to reduce manual review.",
    domain: "Education",
    capabilities: ["contract-hub", "data-integration"],
  },
  {
    id: "surmount-re", initials: "SR", name: "Surmount RE",
    tagline: "Real-estate portfolio intelligence for net-lease teams",
    description: "AI portfolio intelligence for net-lease teams, from data to decisions in one click.",
    domain: "Real estate",
    capabilities: ["property-intel", "comp-sales", "contact-ownership"],
  },
  {
    id: "student-success", initials: "SS", name: "Student Success",
    tagline: "From early insight to lasting student success",
    description: "Early-warning and intervention platform that turns institutional data into student-success outcomes.",
    domain: "Education",
    capabilities: ["ai-companion", "data-integration"],
  },
  {
    id: "contract-intelligence-hub", initials: "CH", name: "Contract Intelligence Hub",
    tagline: "Every clause, every renewal, every dollar of exposure",
    description: "Ingests supplier, customer and labour contracts, extracts terms with AI, surfaces expiration dates and early-termination exposure, and flags high-risk agreements before they bite the P&L.",
    domain: "Cross-industry",
    capabilities: ["contract-hub", "ai-companion"],
  },
  {
    id: "website-conversion-companion", initials: "WC", name: "Website Conversion Companion",
    tagline: "Turn site visitors into qualified buyers",
    description: "AI-guided on-site survey that interviews visitors about their need, budget and timing, then routes each one to the best-fit product or rep, lifting conversion without adding headcount.",
    domain: "Customer & growth",
    capabilities: ["web-conversion", "ai-companion"],
  },
  {
    id: "legislative-tracking-tool", initials: "LT", name: "Legislative Tracking Tool",
    tagline: "Politico-lite for your business, not for D.C. insiders",
    description: "Monitors federal, state and local legislation across the US, isolates bills that touch your operations, summarises the dollar and compliance impact, and recommends courses of action to support, shape or block.",
    domain: "Cross-industry",
    capabilities: ["legislative", "news-monitor", "ai-companion"],
  },
  {
    id: "operations-intelligence", initials: "OI", name: "Operations Intelligence",
    tagline: "Plan, replenish and execute in one orchestrated loop",
    description: "Operations orchestration purpose-built for CPG manufacturers and distributors, syncs demand, production, inventory and DC throughput signals into a single AI-managed plan.",
    domain: "Operations & supply chain",
    capabilities: ["ops-intel", "data-integration"],
  },
  {
    id: "invoicing-intelligence", initials: "IV", name: "Invoicing Intelligence",
    tagline: "Recover every cent off-spec invoices try to keep",
    description: "For meat and protein buyers, reconciles invoiced product weight against actual scaled weight at receipt, flags the discrepancy, and auto-drafts reimbursement requests so finance recovers the difference at scale.",
    domain: "Operations & supply chain",
    capabilities: ["invoicing", "ops-intel"],
  },
];

// Reverse index: for a given capability ProductId, which real apps ship it?
// Used by the cross-layer map so a buyer can click "Contract Intelligence
// Hub" and see "this is what AI Doc Agent, Counsel Command and IRIS Insure
// give you today".
export function appsForProduct(productId: ProductId): DiffDayApp[] {
  return DIFFDAY_APPS.filter(a => a.capabilities.includes(productId));
}

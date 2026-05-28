// Data-feed catalogue.
//
// One block per layer key. Source names are picked from the live
// CONNECTORS catalogue (see ./connectors.ts) so the "we ingest your
// stack" narrative reads consistently across the Data substrate page,
// the System health page, and the per-layer "Data feeds powering this
// diagnosis" strip on each layer page.
//
// Health is roughly aligned with each layer's NAV status (good / warn /
// bad) so that a "bad" layer shows visible feed pain (stale, partial,
// or missing rows) and a "good" layer shows mostly-live rows. The
// pipelineUsd values are the revenue we estimate Different Day could
// release for the buyer by closing that specific feed gap, and feed
// into the Engagement pipeline page totals.
//
// Phase 2 will replace this static catalogue with a server-side per-
// tenant feed inventory. Until then this file is the source of truth
// for the canonical Meridian Industrial demo and serves as a sensible
// default for every other tenant.

export type FeedStatus = "live" | "stale" | "partial" | "missing" | "manual";
export type FeedType =
  | "ERP" | "CRM" | "WMS" | "POS" | "DW"
  | "Web" | "Ads" | "CDP" | "Social" | "Search"
  | "Survey" | "Panel" | "Scraper" | "External" | "HRIS"
  | "Sensor" | "EDI" | "Audit" | "Model" | "Manual" | "GEO";

export interface DataFeed {
  source: string;
  type: FeedType;
  cadence: string;
  lastSync: string;
  completeness: number;
  status: FeedStatus;
  pipelineUsd?: string;
  pipelineNote?: string;
}

export interface ActivityEvent {
  ts: string;
  layer: string;
  text: string;
  tone: "info" | "warn" | "alert" | "good";
}

export const FEEDS: Record<string, DataFeed[]> = {
  "business-performance": [
    { source: "NetSuite, GL roll-up",       type: "ERP",      cadence: "Hourly",  lastSync: "12 min ago", completeness: 98, status: "live" },
    { source: "Snowflake, finance mart",    type: "DW",       cadence: "Realtime", lastSync: "2 min ago", completeness: 96, status: "live" },
    { source: "Salesforce, bookings",       type: "CRM",      cadence: "5-min",   lastSync: "4 min ago",  completeness: 94, status: "live" },
    { source: "Anaplan, plan vs actual",    type: "Model",    cadence: "Daily",   lastSync: "yesterday",  completeness: 78, status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Plan version reconciliation behind by one cycle" },
    { source: "Board pack, manual upload",  type: "Manual",   cadence: "Weekly",  lastSync: "Mon 09:14",  completeness: 100, status: "manual" },
    { source: "FX rates, treasury",         type: "External", cadence: "Daily",   lastSync: "6 hours ago",completeness: 100, status: "live" },
  ],

  "finance": [
    { source: "NetSuite, GL + AR + AP",     type: "ERP",      cadence: "Hourly",  lastSync: "14 min ago", completeness: 97, status: "live" },
    { source: "Stripe, payment events",     type: "POS",      cadence: "Realtime", lastSync: "live",      completeness: 99, status: "live" },
    { source: "Ramp, corporate cards",      type: "ERP",      cadence: "Daily",   lastSync: "yesterday",  completeness: 92, status: "live" },
    { source: "Snowflake, finance mart",    type: "DW",       cadence: "Realtime", lastSync: "1 min ago", completeness: 95, status: "live" },
    { source: "Treasury cash positions",    type: "Manual",   cadence: "Weekly",  lastSync: "Fri 17:02",  completeness: 100, status: "manual", pipelineNote: "Weekly upload only, real-time cash visibility blocked" },
    { source: "Bank statements, JPM",       type: "Manual",   cadence: "Daily",   lastSync: "3 days ago", completeness: 64, status: "stale", pipelineUsd: "$0.9M", pipelineNote: "SFTP feed paused since payment-rail migration" },
    { source: "Sage Intacct, subsidiaries", type: "ERP",      cadence: "Daily",   lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$1.6M", pipelineNote: "EMEA + APAC books still consolidated by spreadsheet" },
  ],

  "demand-intelligence": [
    { source: "Shopify, orders + carts",    type: "POS",      cadence: "5-min",   lastSync: "3 min ago",  completeness: 96, status: "live" },
    { source: "GA4, sessions + funnels",    type: "Web",      cadence: "Hourly",  lastSync: "22 min ago", completeness: 91, status: "live" },
    { source: "Klaviyo, list + flow stats", type: "CDP",      cadence: "5-min",   lastSync: "6 min ago",  completeness: 94, status: "live" },
    { source: "Amplitude, product events",  type: "Web",      cadence: "5-min",   lastSync: "8 min ago",  completeness: 88, status: "live" },
    { source: "SimilarWeb, category demand",type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 82, status: "partial", pipelineUsd: "$0.6M", pipelineNote: "Two priority categories not yet on the watch list" },
    { source: "Amazon Vendor Central",      type: "EDI",      cadence: "Daily",   lastSync: "5 days ago", completeness: 41, status: "stale", pipelineUsd: "$2.2M", pipelineNote: "EDI 852 sell-through stopped after vendor portal change" },
    { source: "Google Trends, query mix",   type: "External", cadence: "Daily",   lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$0.8M", pipelineNote: "Adjacent-category lead indicators not wired" },
  ],

  "competitive-intelligence": [
    { source: "SimilarWeb, share of search",type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 86, status: "live" },
    { source: "G2 Reviews, sentiment",      type: "External", cadence: "Weekly",  lastSync: "4 days ago", completeness: 78, status: "partial", pipelineUsd: "$0.3M", pipelineNote: "Crawler is hitting their rate limit" },
    { source: "Apollo.io, hiring signals",  type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 84, status: "live" },
    { source: "SEC EDGAR, peer filings",    type: "External", cadence: "Daily",   lastSync: "3 hours ago",completeness: 100, status: "live" },
    { source: "News + wire, Factiva",       type: "Scraper",  cadence: "Hourly",  lastSync: "38 min ago", completeness: 91, status: "live" },
    { source: "Reddit + forums, mentions",  type: "Social",   cadence: "Hourly",  lastSync: "12 days ago",completeness: 22, status: "stale", pipelineUsd: "$0.5M", pipelineNote: "Reddit OAuth token revoked, re-auth pending" },
    { source: "Win/loss interviews",        type: "Manual",   cadence: "Monthly", lastSync: "last month", completeness: 100, status: "manual" },
    { source: "Battle-card analyst notes",  type: "Manual",   cadence: "Weekly",  lastSync: "Tue 11:30",  completeness: 100, status: "manual" },
  ],

  "customer-intelligence": [
    { source: "Salesforce, accounts + opps",type: "CRM",      cadence: "5-min",   lastSync: "3 min ago",  completeness: 93, status: "live" },
    { source: "Zendesk, ticket history",    type: "CRM",      cadence: "Hourly",  lastSync: "44 min ago", completeness: 96, status: "live" },
    { source: "Gong, call transcripts",     type: "CRM",      cadence: "Hourly",  lastSync: "27 min ago", completeness: 89, status: "live" },
    { source: "Segment, identity graph",    type: "CDP",      cadence: "Realtime", lastSync: "live",      completeness: 92, status: "live" },
    { source: "Trustpilot, ratings",        type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 100, status: "live" },
    { source: "NPS survey, Delighted",      type: "Survey",   cadence: "Weekly",  lastSync: "8 days ago", completeness: 71, status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Quarterly cohort send fell off the cron" },
    { source: "Customer success notes",     type: "Manual",   cadence: "Weekly",  lastSync: "Wed 16:48",  completeness: 100, status: "manual" },
  ],

  "brand-social": [
    { source: "Meta, page + ad insights",   type: "Social",   cadence: "Hourly",  lastSync: "31 min ago", completeness: 94, status: "live" },
    { source: "TikTok, organic + paid",     type: "Social",   cadence: "Hourly",  lastSync: "18 min ago", completeness: 92, status: "live" },
    { source: "Reddit + forums, mentions",  type: "Social",   cadence: "Hourly",  lastSync: "12 days ago",completeness: 28, status: "stale", pipelineUsd: "$0.3M", pipelineNote: "Same OAuth revocation as Competitive intel" },
    { source: "News + wire, Factiva",       type: "Scraper",  cadence: "Hourly",  lastSync: "38 min ago", completeness: 91, status: "live" },
    { source: "Glassdoor, reviews",         type: "External", cadence: "Weekly",  lastSync: "6 days ago", completeness: 88, status: "live" },
    { source: "Trustpilot, sentiment",      type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 100, status: "live" },
    { source: "Brand tracking, YouGov",     type: "Survey",   cadence: "Monthly", lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$0.7M", pipelineNote: "Awareness + consideration tracker not yet contracted" },
  ],

  "supply-chain": [
    { source: "Manhattan Active WMS",       type: "WMS",      cadence: "Hourly",  lastSync: "41 min ago", completeness: 95, status: "live" },
    { source: "Blue Yonder, demand plan",   type: "Model",    cadence: "Daily",   lastSync: "yesterday",  completeness: 87, status: "live" },
    { source: "SAP S/4HANA, inventory",     type: "ERP",      cadence: "Hourly",  lastSync: "1 hour ago", completeness: 92, status: "live" },
    { source: "FourKites, in-transit ETA",  type: "Sensor",   cadence: "Hourly",  lastSync: "22 min ago", completeness: 88, status: "live" },
    { source: "EDI 856, ASN feeds",         type: "EDI",      cadence: "Hourly",  lastSync: "4 hours ago",completeness: 64, status: "stale", pipelineUsd: "$1.8M", pipelineNote: "Two top-15 vendors fell off the ASN spec last release" },
    { source: "Supplier scorecards",        type: "Manual",   cadence: "Monthly", lastSync: "last month", completeness: 100, status: "manual" },
    { source: "Port + ocean carrier ETAs",  type: "External", cadence: "Daily",   lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$2.6M", pipelineNote: "Long-lead Asia routes blind, drives the safety-stock buffer" },
    { source: "Coupa, supplier payments",   type: "ERP",      cadence: "Daily",   lastSync: "yesterday",  completeness: 81, status: "partial", pipelineUsd: "$0.5M", pipelineNote: "Indirect-spend category mapping incomplete" },
  ],

  "pricing-margin": [
    { source: "NetSuite, item + price list",type: "ERP",      cadence: "Hourly",  lastSync: "16 min ago", completeness: 97, status: "live" },
    { source: "Shopify, transacted price",  type: "POS",      cadence: "5-min",   lastSync: "3 min ago",  completeness: 96, status: "live" },
    { source: "Snowflake, margin mart",     type: "DW",       cadence: "Realtime", lastSync: "1 min ago", completeness: 93, status: "live" },
    { source: "Competitor price scrape",    type: "Scraper",  cadence: "Daily",   lastSync: "yesterday",  completeness: 82, status: "live" },
    { source: "Promotion calendar",         type: "Manual",   cadence: "Weekly",  lastSync: "Mon 10:22",  completeness: 100, status: "manual" },
    { source: "Trade-spend, deductions",    type: "ERP",      cadence: "Weekly",  lastSync: "6 days ago", completeness: 68, status: "partial", pipelineUsd: "$1.2M", pipelineNote: "Distributor deduction codes not yet mapped" },
    { source: "Elasticity model, in-house", type: "Model",    cadence: "Weekly",  lastSync: "Fri 23:10",  completeness: 88, status: "live" },
  ],

  "sales-pipeline": [
    { source: "Salesforce, opps + stages",  type: "CRM",      cadence: "5-min",   lastSync: "2 min ago",  completeness: 95, status: "live" },
    { source: "Gong, call recordings",      type: "CRM",      cadence: "Hourly",  lastSync: "31 min ago", completeness: 92, status: "live" },
    { source: "Outreach, sequence stats",   type: "CRM",      cadence: "Hourly",  lastSync: "48 min ago", completeness: 90, status: "live" },
    { source: "LinkedIn Sales Navigator",   type: "External", cadence: "Daily",   lastSync: "yesterday",  completeness: 86, status: "live" },
    { source: "Marketo, lead scoring",      type: "Ads",      cadence: "Hourly",  lastSync: "3 hours ago",completeness: 72, status: "partial", pipelineUsd: "$0.8M", pipelineNote: "MQL → SQL hand-off webhook is failing 18% of the time" },
    { source: "ZoomInfo, account fit",      type: "External", cadence: "Daily",   lastSync: "5 days ago", completeness: 54, status: "stale", pipelineUsd: "$1.1M", pipelineNote: "ICP refresh paused since last quota plan landed" },
    { source: "Deal review notes",          type: "Manual",   cadence: "Weekly",  lastSync: "Tue 14:00",  completeness: 100, status: "manual" },
    { source: "Win/loss interviews",        type: "Manual",   cadence: "Monthly", lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$0.6M", pipelineNote: "Programme paused, no recent loss reasons in the feed" },
  ],

  "marketing-performance": [
    { source: "Google Ads",                 type: "Ads",      cadence: "Hourly",  lastSync: "26 min ago", completeness: 96, status: "live" },
    { source: "Meta Ads",                   type: "Ads",      cadence: "Hourly",  lastSync: "31 min ago", completeness: 94, status: "live" },
    { source: "TikTok Ads",                 type: "Ads",      cadence: "Hourly",  lastSync: "44 min ago", completeness: 90, status: "live" },
    { source: "LinkedIn Ads",               type: "Ads",      cadence: "Hourly",  lastSync: "39 min ago", completeness: 88, status: "live" },
    { source: "Klaviyo, email + SMS",       type: "CDP",      cadence: "5-min",   lastSync: "6 min ago",  completeness: 93, status: "live" },
    { source: "GA4 + Snowplow, web events", type: "Web",      cadence: "5-min",   lastSync: "9 min ago",  completeness: 91, status: "live" },
    { source: "Attribution model, MMM",     type: "Model",    cadence: "Weekly",  lastSync: "11 days ago",completeness: 60, status: "stale", pipelineUsd: "$1.4M", pipelineNote: "MMM retrain skipped two cycles, blended ROAS drift unmonitored" },
    { source: "Affiliate + influencer mix", type: "Manual",   cadence: "Monthly", lastSync: "last month", completeness: 100, status: "manual" },
  ],

  "people-operations": [
    { source: "Workday HCM, roster",        type: "HRIS",     cadence: "Daily",   lastSync: "6 hours ago",completeness: 96, status: "live" },
    { source: "Greenhouse, hiring funnel",  type: "HRIS",     cadence: "Daily",   lastSync: "yesterday",  completeness: 91, status: "live" },
    { source: "Lattice, performance + 1:1", type: "HRIS",     cadence: "Weekly",  lastSync: "Mon 08:00",  completeness: 84, status: "live" },
    { source: "Slack, channel sentiment",   type: "Social",   cadence: "Hourly",  lastSync: "52 min ago", completeness: 73, status: "partial", pipelineUsd: "$0.3M", pipelineNote: "DM-private channels excluded by policy, blind to two ops squads" },
    { source: "Glassdoor, internal reviews",type: "External", cadence: "Weekly",  lastSync: "5 days ago", completeness: 88, status: "live" },
    { source: "Pay-equity audit, in-house", type: "Audit",    cadence: "Quarterly", lastSync: "Never",    completeness: 0,  status: "missing", pipelineUsd: "$0.8M", pipelineNote: "Annual audit ran in 2024, no continuous-monitoring feed" },
    { source: "Workforce plan",             type: "Manual",   cadence: "Quarterly", lastSync: "last quarter", completeness: 100, status: "manual" },
  ],

  "contract-management": [
    { source: "DocuSign CLM, contracts",    type: "ERP",      cadence: "Hourly",  lastSync: "18 min ago", completeness: 98, status: "live" },
    { source: "Salesforce, opportunity tie",type: "CRM",      cadence: "5-min",   lastSync: "3 min ago",  completeness: 96, status: "live" },
    { source: "Ironclad, redline history",  type: "ERP",      cadence: "Hourly",  lastSync: "42 min ago", completeness: 94, status: "live" },
    { source: "SEC EDGAR, counterparty",    type: "External", cadence: "Daily",   lastSync: "3 hours ago",completeness: 100, status: "live" },
    { source: "Legal exception log",        type: "Manual",   cadence: "Weekly",  lastSync: "Thu 09:30",  completeness: 100, status: "manual" },
    { source: "Insurance + surety bonds",   type: "Manual",   cadence: "Monthly", lastSync: "last month", completeness: 100, status: "manual" },
  ],

  "receivables": [
    { source: "NetSuite, AR sub-ledger",    type: "ERP",      cadence: "Hourly",  lastSync: "21 min ago", completeness: 97, status: "live" },
    { source: "Stripe + Adyen, payments",   type: "POS",      cadence: "Realtime", lastSync: "live",      completeness: 99, status: "live" },
    { source: "Salesforce, dispute cases",  type: "CRM",      cadence: "5-min",   lastSync: "4 min ago",  completeness: 92, status: "live" },
    { source: "Zendesk, billing tickets",   type: "CRM",      cadence: "Hourly",  lastSync: "47 min ago", completeness: 94, status: "live" },
    { source: "Collections workflow",       type: "Manual",   cadence: "Weekly",  lastSync: "Wed 11:00",  completeness: 100, status: "manual" },
    { source: "Credit scores, D&B",         type: "External", cadence: "Weekly",  lastSync: "9 days ago", completeness: 58, status: "stale", pipelineUsd: "$0.9M", pipelineNote: "Refresh paused mid-RFP, credit limits stale on 14 accounts" },
    { source: "Bank statements, JPM",       type: "Manual",   cadence: "Daily",   lastSync: "3 days ago", completeness: 64, status: "stale", pipelineUsd: "$0.6M", pipelineNote: "Same SFTP outage as Finance" },
    { source: "Lockbox, BAI2 feed",         type: "Manual",   cadence: "Daily",   lastSync: "Never",      completeness: 0,  status: "missing", pipelineUsd: "$1.4M", pipelineNote: "Cheque-payment posting still manual, day-3 cash visibility blocked" },
  ],

  "talent-hr": [
    { source: "Workday HCM, employees",     type: "HRIS",     cadence: "Daily",   lastSync: "6 hours ago",completeness: 96, status: "live" },
    { source: "Greenhouse, ATS",            type: "HRIS",     cadence: "Daily",   lastSync: "yesterday",  completeness: 91, status: "live" },
    { source: "Lever, recruiter pipeline",  type: "HRIS",     cadence: "Daily",   lastSync: "yesterday",  completeness: 84, status: "live" },
    { source: "Lattice, performance",       type: "HRIS",     cadence: "Weekly",  lastSync: "Mon 08:00",  completeness: 78, status: "partial", pipelineUsd: "$0.3M", pipelineNote: "Review-cycle calibration scores blocked behind comp planning" },
    { source: "Comp benchmarks, Radford",   type: "External", cadence: "Quarterly", lastSync: "last quarter", completeness: 100, status: "live" },
    { source: "Engagement survey, Culture Amp", type: "Survey", cadence: "Quarterly", lastSync: "Never",  completeness: 0,  status: "missing", pipelineUsd: "$0.5M", pipelineNote: "Annual cycle only, no pulse cadence between waves" },
    { source: "Exit interview notes",       type: "Manual",   cadence: "Monthly", lastSync: "last month", completeness: 100, status: "manual" },
    { source: "DEI dashboard",              type: "Audit",    cadence: "Quarterly", lastSync: "Never",    completeness: 0,  status: "missing", pipelineUsd: "$0.4M", pipelineNote: "Demographic representation only refreshes at fiscal year-end" },
  ],
};

// Rolling activity strip shown at the top of the page. Each entry is a
// short narrated event, tagged with the layer it relates to. The
// SystemHeartbeat cycles through these on a 3.2s interval. Keep the
// tone honest: alert for things requiring action, warn for drift, info
// for routine syncs, good for releases.
export const ACTIVITY_STREAM: ActivityEvent[] = [
  { ts: "08:14", layer: "receivables",           tone: "alert", text: "Lockbox BAI2 feed never connected, $1.4M cash visibility blocked" },
  { ts: "08:21", layer: "supply-chain",          tone: "alert", text: "Port + ocean carrier ETAs missing, long-lead Asia routes blind" },
  { ts: "08:33", layer: "finance",               tone: "warn",  text: "Bank SFTP from JPM stale 3 days, treasury working from spreadsheets" },
  { ts: "08:41", layer: "demand-intelligence",   tone: "warn",  text: "Amazon EDI 852 sell-through paused 5 days, vendor portal change suspected" },
  { ts: "08:52", layer: "competitive-intelligence", tone: "warn", text: "Reddit OAuth revoked, mentions feed stale 12 days" },
  { ts: "09:02", layer: "pricing-margin",        tone: "info",  text: "Margin mart materialised, 412k rows in 1m 22s" },
  { ts: "09:10", layer: "sales-pipeline",        tone: "warn",  text: "Marketo to Salesforce webhook failing on 18% of MQL hand-offs" },
  { ts: "09:18", layer: "people-operations",     tone: "info",  text: "Workday HCM sync clean, 0 schema drift" },
  { ts: "09:24", layer: "customer-intelligence", tone: "good",  text: "Gong call sentiment back online after Tuesday outage" },
  { ts: "09:31", layer: "marketing-performance", tone: "warn",  text: "MMM retrain skipped two cycles, blended ROAS drift unmonitored" },
  { ts: "09:38", layer: "brand-social",          tone: "info",  text: "TikTok organic ingest caught up, 2.1M events processed" },
  { ts: "09:46", layer: "contract-management",   tone: "good",  text: "Ironclad redline diffing now feeding exposure scoring" },
  { ts: "09:54", layer: "talent-hr",             tone: "warn",  text: "Engagement-survey pulse never wired, only annual signal available" },
  { ts: "10:02", layer: "business-performance",  tone: "info",  text: "Plan-vs-actual reconciled, FX rates applied at 09:00 close" },
];

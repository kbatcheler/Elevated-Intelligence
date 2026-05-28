// Connector catalogue. This is the source of truth for the connector
// library shown on the Data substrate page. Entries are real, currently-
// shipping products with the auth method and cadence we actually support;
// keep them honest because Sales reads from this page in front of buyers.
//
// Categories are deliberately broad — we don't break out e.g. Klaviyo
// from Iterable, because the buyer cares about "we ingest your marketing
// stack", not whether row 17 is Klaviyo or Iterable specifically.

export type ConnectorCategory =
  | "ERP & Finance"
  | "CRM & Sales"
  | "Marketing & Ads"
  | "E-commerce & Payments"
  | "Product & Analytics"
  | "Support & CX"
  | "HRIS & People"
  | "Warehouse & Lake"
  | "Reverse ETL"
  | "Collaboration"
  | "Supply Chain & Ops"
  | "External Signals"
  | "Custom & Generic";

export type ConnectorAuth = "OAuth" | "API key" | "Service account" | "JDBC" | "SAML" | "SFTP" | "Webhook" | "S3";
export type ConnectorCadence = "Realtime" | "5-min" | "Hourly" | "Daily" | "Weekly" | "On-demand";

export interface Connector {
  name: string;
  category: ConnectorCategory;
  auth: ConnectorAuth;
  cadence: ConnectorCadence;
  // Whether this connector is generally-available (live), in private beta
  // (beta), or on the public roadmap (planned). The library colour-codes
  // these so prospects can see the depth of the catalogue without us
  // overselling unfinished work.
  status: "live" | "beta" | "planned";
}

export const CONNECTORS: Connector[] = [
  // ── ERP & Finance ──────────────────────────────────────────────────
  { name: "NetSuite",              category: "ERP & Finance", auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "SAP S/4HANA",           category: "ERP & Finance", auth: "Service account", cadence: "Hourly", status: "live" },
  { name: "Oracle Fusion Cloud",   category: "ERP & Finance", auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Microsoft Dynamics 365",category: "ERP & Finance", auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Workday Financials",    category: "ERP & Finance", auth: "SAML",           cadence: "Daily",  status: "live" },
  { name: "Sage Intacct",          category: "ERP & Finance", auth: "API key",        cadence: "Daily",  status: "live" },
  { name: "QuickBooks Online",     category: "ERP & Finance", auth: "OAuth",          cadence: "Daily",  status: "live" },
  { name: "Xero",                  category: "ERP & Finance", auth: "OAuth",          cadence: "Daily",  status: "live" },
  { name: "Ramp",                  category: "ERP & Finance", auth: "OAuth",          cadence: "Daily",  status: "live" },
  { name: "Brex",                  category: "ERP & Finance", auth: "API key",        cadence: "Daily",  status: "live" },

  // ── CRM & Sales ────────────────────────────────────────────────────
  { name: "Salesforce",            category: "CRM & Sales",   auth: "OAuth",          cadence: "5-min",  status: "live" },
  { name: "HubSpot",               category: "CRM & Sales",   auth: "OAuth",          cadence: "5-min",  status: "live" },
  { name: "Microsoft Dynamics CRM",category: "CRM & Sales",   auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Pipedrive",             category: "CRM & Sales",   auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Close",                 category: "CRM & Sales",   auth: "API key",        cadence: "Hourly", status: "live" },
  { name: "Outreach",              category: "CRM & Sales",   auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Gong",                  category: "CRM & Sales",   auth: "OAuth",          cadence: "Hourly", status: "live" },
  { name: "Chorus",                category: "CRM & Sales",   auth: "OAuth",          cadence: "Hourly", status: "beta" },

  // ── Marketing & Ads ────────────────────────────────────────────────
  { name: "Google Ads",            category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "Meta Ads",              category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "LinkedIn Ads",          category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "TikTok Ads",            category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "Reddit Ads",            category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "beta" },
  { name: "Microsoft Advertising", category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "Klaviyo",               category: "Marketing & Ads", auth: "API key",      cadence: "5-min",  status: "live" },
  { name: "Iterable",              category: "Marketing & Ads", auth: "API key",      cadence: "5-min",  status: "live" },
  { name: "Braze",                 category: "Marketing & Ads", auth: "API key",      cadence: "5-min",  status: "live" },
  { name: "Customer.io",           category: "Marketing & Ads", auth: "API key",      cadence: "Hourly", status: "live" },
  { name: "Marketo",               category: "Marketing & Ads", auth: "OAuth",        cadence: "Hourly", status: "live" },
  { name: "Mailchimp",             category: "Marketing & Ads", auth: "OAuth",        cadence: "Daily",  status: "live" },

  // ── E-commerce & Payments ──────────────────────────────────────────
  { name: "Shopify",               category: "E-commerce & Payments", auth: "OAuth",  cadence: "5-min",  status: "live" },
  { name: "BigCommerce",           category: "E-commerce & Payments", auth: "OAuth",  cadence: "Hourly", status: "live" },
  { name: "Magento",               category: "E-commerce & Payments", auth: "API key",cadence: "Hourly", status: "live" },
  { name: "WooCommerce",           category: "E-commerce & Payments", auth: "API key",cadence: "Hourly", status: "live" },
  { name: "Stripe",                category: "E-commerce & Payments", auth: "API key",cadence: "Realtime", status: "live" },
  { name: "Adyen",                 category: "E-commerce & Payments", auth: "API key",cadence: "Hourly", status: "live" },
  { name: "Recharge",              category: "E-commerce & Payments", auth: "API key",cadence: "Hourly", status: "live" },
  { name: "Returnly / Loop",       category: "E-commerce & Payments", auth: "API key",cadence: "Daily",  status: "live" },

  // ── Product & Analytics ────────────────────────────────────────────
  { name: "Segment",               category: "Product & Analytics", auth: "API key", cadence: "Realtime", status: "live" },
  { name: "Snowplow",              category: "Product & Analytics", auth: "Service account", cadence: "Realtime", status: "live" },
  { name: "Amplitude",             category: "Product & Analytics", auth: "API key", cadence: "5-min",  status: "live" },
  { name: "Mixpanel",              category: "Product & Analytics", auth: "API key", cadence: "5-min",  status: "live" },
  { name: "Heap",                  category: "Product & Analytics", auth: "API key", cadence: "Hourly", status: "live" },
  { name: "PostHog",               category: "Product & Analytics", auth: "API key", cadence: "5-min",  status: "live" },
  { name: "Google Analytics 4",    category: "Product & Analytics", auth: "OAuth",   cadence: "Hourly", status: "live" },

  // ── Support & CX ───────────────────────────────────────────────────
  { name: "Zendesk",               category: "Support & CX", auth: "OAuth",   cadence: "Hourly", status: "live" },
  { name: "Intercom",              category: "Support & CX", auth: "OAuth",   cadence: "5-min",  status: "live" },
  { name: "Front",                 category: "Support & CX", auth: "OAuth",   cadence: "Hourly", status: "live" },
  { name: "Help Scout",            category: "Support & CX", auth: "OAuth",   cadence: "Hourly", status: "live" },
  { name: "Gorgias",               category: "Support & CX", auth: "API key", cadence: "Hourly", status: "live" },
  { name: "Freshdesk",             category: "Support & CX", auth: "API key", cadence: "Hourly", status: "live" },

  // ── HRIS & People ──────────────────────────────────────────────────
  { name: "Workday HCM",           category: "HRIS & People", auth: "SAML",    cadence: "Daily", status: "live" },
  { name: "BambooHR",              category: "HRIS & People", auth: "API key", cadence: "Daily", status: "live" },
  { name: "Rippling",              category: "HRIS & People", auth: "OAuth",   cadence: "Daily", status: "live" },
  { name: "Gusto",                 category: "HRIS & People", auth: "OAuth",   cadence: "Daily", status: "live" },
  { name: "ADP Workforce Now",     category: "HRIS & People", auth: "OAuth",   cadence: "Daily", status: "live" },
  { name: "Greenhouse",            category: "HRIS & People", auth: "API key", cadence: "Daily", status: "live" },
  { name: "Lever",                 category: "HRIS & People", auth: "OAuth",   cadence: "Daily", status: "live" },
  { name: "Lattice",               category: "HRIS & People", auth: "API key", cadence: "Weekly", status: "live" },

  // ── Warehouse & Lake ───────────────────────────────────────────────
  { name: "Snowflake",             category: "Warehouse & Lake", auth: "JDBC", cadence: "Realtime", status: "live" },
  { name: "Databricks",            category: "Warehouse & Lake", auth: "JDBC", cadence: "Realtime", status: "live" },
  { name: "BigQuery",              category: "Warehouse & Lake", auth: "Service account", cadence: "Realtime", status: "live" },
  { name: "Redshift",              category: "Warehouse & Lake", auth: "JDBC", cadence: "Hourly", status: "live" },
  { name: "ClickHouse",            category: "Warehouse & Lake", auth: "JDBC", cadence: "Realtime", status: "live" },
  { name: "Postgres",              category: "Warehouse & Lake", auth: "JDBC", cadence: "Realtime", status: "live" },
  { name: "MotherDuck",            category: "Warehouse & Lake", auth: "API key", cadence: "Hourly", status: "beta" },
  { name: "S3 / Parquet lake",     category: "Warehouse & Lake", auth: "S3",   cadence: "Hourly", status: "live" },

  // ── Reverse ETL ────────────────────────────────────────────────────
  { name: "Hightouch",             category: "Reverse ETL", auth: "API key", cadence: "On-demand", status: "live" },
  { name: "Census",                category: "Reverse ETL", auth: "API key", cadence: "On-demand", status: "live" },
  { name: "RudderStack",           category: "Reverse ETL", auth: "API key", cadence: "On-demand", status: "live" },

  // ── Collaboration ──────────────────────────────────────────────────
  { name: "Slack",                 category: "Collaboration", auth: "OAuth", cadence: "Realtime", status: "live" },
  { name: "Microsoft Teams",       category: "Collaboration", auth: "OAuth", cadence: "Realtime", status: "live" },
  { name: "Gmail / Workspace",     category: "Collaboration", auth: "OAuth", cadence: "5-min",  status: "live" },
  { name: "Outlook / M365",        category: "Collaboration", auth: "OAuth", cadence: "5-min",  status: "live" },
  { name: "Notion",                category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },
  { name: "Confluence",            category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },
  { name: "Google Drive",          category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },
  { name: "SharePoint",            category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },
  { name: "Jira",                  category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },
  { name: "Linear",                category: "Collaboration", auth: "OAuth", cadence: "5-min",  status: "live" },
  { name: "Asana",                 category: "Collaboration", auth: "OAuth", cadence: "Hourly", status: "live" },

  // ── Supply Chain & Ops ─────────────────────────────────────────────
  { name: "Manhattan Active",      category: "Supply Chain & Ops", auth: "Service account", cadence: "Hourly", status: "live" },
  { name: "Blue Yonder",           category: "Supply Chain & Ops", auth: "Service account", cadence: "Hourly", status: "live" },
  { name: "SAP IBP",               category: "Supply Chain & Ops", auth: "Service account", cadence: "Daily",  status: "live" },
  { name: "Anaplan",               category: "Supply Chain & Ops", auth: "OAuth",    cadence: "Daily",  status: "live" },
  { name: "o9 Solutions",          category: "Supply Chain & Ops", auth: "OAuth",    cadence: "Daily",  status: "beta" },
  { name: "FourKites",             category: "Supply Chain & Ops", auth: "API key",  cadence: "Hourly", status: "live" },
  { name: "project44",             category: "Supply Chain & Ops", auth: "API key",  cadence: "Hourly", status: "live" },
  { name: "Coupa",                 category: "Supply Chain & Ops", auth: "OAuth",    cadence: "Daily",  status: "live" },

  // ── External Signals ───────────────────────────────────────────────
  { name: "SimilarWeb",            category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "Apollo.io",             category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "ZoomInfo",              category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "G2 Reviews",            category: "External Signals", auth: "API key", cadence: "Weekly",  status: "live" },
  { name: "Trustpilot",            category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "Glassdoor reviews",     category: "External Signals", auth: "API key", cadence: "Weekly",  status: "beta" },
  { name: "BLS / FRED macro",      category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "USPTO patents",         category: "External Signals", auth: "API key", cadence: "Weekly",  status: "live" },
  { name: "SEC EDGAR",             category: "External Signals", auth: "API key", cadence: "Daily",   status: "live" },
  { name: "News & wire (Factiva)", category: "External Signals", auth: "API key", cadence: "Hourly",  status: "live" },
  { name: "Reddit / forums",       category: "External Signals", auth: "OAuth",   cadence: "Hourly",  status: "live" },

  // ── Custom & Generic ───────────────────────────────────────────────
  { name: "REST / GraphQL bridge", category: "Custom & Generic", auth: "API key", cadence: "On-demand", status: "live" },
  { name: "Webhook ingest",        category: "Custom & Generic", auth: "Webhook",  cadence: "Realtime",  status: "live" },
  { name: "SFTP drop",             category: "Custom & Generic", auth: "SFTP",     cadence: "Hourly",    status: "live" },
  { name: "S3 / GCS bucket",       category: "Custom & Generic", auth: "S3",       cadence: "Hourly",    status: "live" },
  { name: "gRPC stream",           category: "Custom & Generic", auth: "Service account", cadence: "Realtime", status: "beta" },
];

export const CONNECTOR_CATEGORIES: ConnectorCategory[] = [
  "ERP & Finance",
  "CRM & Sales",
  "Marketing & Ads",
  "E-commerce & Payments",
  "Product & Analytics",
  "Support & CX",
  "HRIS & People",
  "Warehouse & Lake",
  "Reverse ETL",
  "Collaboration",
  "Supply Chain & Ops",
  "External Signals",
  "Custom & Generic",
];

// Live cortex POC — synthetic but realistic ingestion events that flow
// through the four pipeline stages on the Data substrate page. Each row
// represents one "lane" (a single feed-to-output trace). Authors should
// keep the latency numbers plausible and the narrative human, because
// this panel runs in front of buyers as a live demo.
export interface CortexLane {
  feed: string;            // e.g. "Shopify · orders"
  ingestMs: number;        // observed ingest latency
  signal: string;          // extracted observation
  hypothesis: string;      // proposed explanation
  evidence: string[];      // 1-3 corroborating sources
  conclusion: string;      // final narrated line
  confidence: number;      // 0-100
}

export const CORTEX_LANES: CortexLane[] = [
  {
    feed: "Shopify · orders",
    ingestMs: 184,
    signal: "AOV down 6.2% week-over-week on the kids' apparel line",
    hypothesis: "Promo pull-forward from last week's 20% sitewide email",
    evidence: ["Klaviyo · campaign sends", "Stripe · refund rate", "GA4 · returning-customer mix"],
    conclusion: "AOV erosion is a borrowed-demand artefact, not category weakness; will recover within 9 days",
    confidence: 82,
  },
  {
    feed: "NetSuite · GL",
    ingestMs: 412,
    signal: "FY25Q3 receivables aging > 60 days jumped to 14.1% from 9.8%",
    hypothesis: "Dispute-driven, concentrated in two anchor accounts",
    evidence: ["Salesforce · open cases", "Zendesk · billing tickets", "Stripe Billing · failed retries"],
    conclusion: "$1.1M trapped behind two named disputes; collections workflow can release in 11 days",
    confidence: 88,
  },
  {
    feed: "Snowflake · web events",
    ingestMs: 61,
    signal: "Spike in PDP bounce rate on the top-12 SKUs after the site-speed deploy",
    hypothesis: "LCP regression on the size-selector component",
    evidence: ["Snowplow · core web vitals", "PostHog · session replays", "Segment · checkout starts"],
    conclusion: "Roll back commit 7e2af1 or ship the deferred-hydration fix to recover ~$24K/wk in lost conversions",
    confidence: 76,
  },
  {
    feed: "Workday HCM · roster",
    ingestMs: 1820,
    signal: "Regrettable attrition in mid-market AE cohort up 3.4pp this quarter",
    hypothesis: "Quota lift on the May plan without territory rebalancing",
    evidence: ["Gong · call sentiment", "Lattice · 1:1 themes", "Greenhouse · outbound interviews"],
    conclusion: "Three named reps at elevated leave risk; pipeline coverage falls below 3.2x if any depart",
    confidence: 71,
  },
  {
    feed: "Klaviyo · campaign sends",
    ingestMs: 92,
    signal: "Winback flow open-rate drifted from 38% to 24% over 6 weeks",
    hypothesis: "List fatigue + iOS Mail Privacy noise inflated baseline",
    evidence: ["Iterable · A/B holdout", "GA4 · email-attributed sessions", "Shopify · repeat-rate"],
    conclusion: "Rebuild winback with predicted-CLV gating; recover ~$78K/qtr in attributed revenue",
    confidence: 79,
  },
  {
    feed: "Zendesk · tickets",
    ingestMs: 230,
    signal: "First-response SLA breach rate at 11.4%, up from 5.2% baseline",
    hypothesis: "Routing rule change on Tuesday rerouted billing to T1 instead of Finance Ops",
    evidence: ["Slack · ops-alerts channel", "Front · macro usage", "HubSpot · churn-risk score"],
    conclusion: "Revert the routing rule, hand billing back to Finance Ops; SLA returns within 36 hours",
    confidence: 91,
  },
];

// Capability parity matrix vs Palantir Foundry. We DO NOT mention price
// anywhere on this page — the asymmetry we sell is time-to-value and
// deployment posture, not licence cost.
export interface ParityRow {
  capability: string;
  foundry: string;
  diffday: string;
  // "match" = we do this too, equivalently
  // "edge" = we do this in a materially better way for the buyer
  // "trade" = Foundry does this more deeply, we are deliberate about not chasing
  verdict: "match" | "edge" | "trade";
}

export const PARITY: ParityRow[] = [
  { capability: "Ontology / semantic layer",     foundry: "Bespoke ontology project, weeks to model", diffday: "Pre-built 14-layer schema, inferred from your exports on day one", verdict: "edge" },
  { capability: "Reasoning chain transparency",  foundry: "AIP traceback with cited evidence",        diffday: "Five named agents with token + ms accounting on every output",   verdict: "match" },
  { capability: "Confidence scoring",            foundry: "Per-output AIP confidence",                diffday: "Per-layer confidence band, back-linked to evidence chain",        verdict: "match" },
  { capability: "Connector breadth",             foundry: "200+ first-party connectors",              diffday: "100+ connectors plus webhook / SFTP / S3 / REST escape hatches",   verdict: "match" },
  { capability: "Time-to-first-diagnosis",       foundry: "8 to 14 weeks for the first AIP brief",    diffday: "Defended diagnosis in the first week off existing exports",       verdict: "edge" },
  { capability: "Workflow apps",                 foundry: "Workshop + Quiver, low-code app builder",  diffday: "26 pre-built diagnostic apps, configurable per tenant",           verdict: "match" },
  { capability: "Deployment posture",            foundry: "Apollo, customer cloud or Foundry SaaS",   diffday: "Single-tenant VPC or managed SOC2 Type II environment",           verdict: "match" },
  { capability: "Government-grade controls",     foundry: "IL5/IL6, FedRAMP High",                    diffday: "SOC2 Type II, FedRAMP Moderate on the roadmap",                    verdict: "trade" },
  { capability: "Custom code surface",           foundry: "TypeScript / Python in Code Repositories", diffday: "Hooks at every reasoning stage, plus REST + webhook escape hatches", verdict: "match" },
  { capability: "What-if simulation",            foundry: "Quiver scenario modelling",                diffday: "Scenario war-room with named levers per layer",                    verdict: "match" },
  { capability: "Defended on-call narrative",    foundry: "Operator must build the brief themselves", diffday: "Brief is the product, with sources stamped on every claim",       verdict: "edge" },
  { capability: "Buyer ramp",                    foundry: "Six to eighteen months to demonstrable ROI", diffday: "Friday-of-week-one diagnosis is the demo and the deliverable",   verdict: "edge" },
];

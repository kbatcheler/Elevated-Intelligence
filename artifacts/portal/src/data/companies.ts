// Type definitions for tenant profiles consumed by the portal shell.
//
// Phase 1 migration (2026-Q4): the hardcoded MERIDIAN / GUITAR_CENTER /
// SWEETGREEN profiles and the LIBRARY / DEFAULT_PROFILE_ID constants have
// been deleted. Profile content is now fetched per-tenant from the server
// (GET /api/tenants/:id) and adapted into the CompanyProfile shape inside
// CompanyContext. Types remain so consumer components keep compiling; the
// resolver helpers below are retained @deprecated for possible Phase 2 use.

export interface CompanyHeadlines {
  revenueActual?: string;
  revenuePlan?: string;
  revenueVarPct?: string;
  revenueVarDollars?: string;
  marginActual?: string;
  marginTarget?: string;
  marginVarBps?: string;
  cashActual?: string;
  cashVar?: string;
  cashTone?: "good" | "warn" | "bad";
  npsActual?: number;
  npsDelta?: string;
}

export interface CompanyFinding {
  finding: string;
  impact: string;
  lever?: string;
}

export interface CompanyRootCause {
  title: string;
  impact: string;
  body: string;
}

export interface CompanyRecoveryLever {
  title: string;
  horizon: string;
  recovery: string;
  owner: string;
  body: string;
}

// Provenance metadata, kept for backward compatibility with the boot-splash
// receipt panel. Populated from the server response when a fresh seed run
// completes; older saved profiles will lack it.
export interface CompanyProfileMeta {
  model: string;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  bytesReturned: number;
  vocabCount: number;
  headlinesCount: number;
  grounding?: {
    ok: boolean;
    domain: string;
    bytesFetched: number;
    bytesExtracted: number;
    fetchMs: number;
    status: number;
  };
}

export interface CompanyProfile {
  id: string;
  name: string;
  url: string;
  _meta?: CompanyProfileMeta;
  logoMonogram: string;
  logoEmoji?: string;
  sector: string;
  hqCity: string;
  hqState?: string;
  revenueBand: string;
  parent?: string;
  ownership: string;
  founded?: number;

  period: string;
  channelLabel: string;
  tagline: string;
  accentColor?: string;

  vocab: Record<string, string>;

  headlines: CompanyHeadlines;

  executiveRead?: string;
  pullQuote?: string;
  topFindings?: Partial<Record<string, CompanyFinding>>;
  rootCauses?: CompanyRootCause[];
  recoveryLevers?: CompanyRecoveryLever[];
  combinedRecovery?: string;
  recoveryConfidence?: string;

  sourceSystems: string;
  analyst: string;

  marketSharePct?: number;

  datasets?: Record<string, unknown>;

  layerOverrides?: Partial<Record<string, {
    narrative?: string;
    metrics?: Array<{ label: string; value: string; sub: string; tone: "good"|"bad"|"warn"|"neutral" }>;
    causes?:  Array<{ title: string; impact: string; detail: string }>;
    actions?: Array<{ title: string; detail: string; impact: string }>;
  }>>;

  isGenerated?: boolean;
  generatedAt?: string;
}

/**
 * Build a substring-substitution resolver from a profile's vocab map.
 *
 * @deprecated for Phase 1, retained because some legacy demo components may
 * still call useSwap/useDataset. Phase 1 tenants are LLM-authored end-to-end
 * so token swaps are a no-op. May be removed in Phase 4.
 */
export function makeResolver(profile: CompanyProfile): (text: string) => string {
  const entries = Object.entries(profile.vocab || {});
  if (entries.length === 0) return (s: string) => s;
  // Sort by source length desc so longer phrases match first.
  entries.sort((a, b) => b[0].length - a[0].length);
  return (text: string) => {
    if (typeof text !== "string" || text.length === 0) return text;
    let out = text;
    for (const [from, to] of entries) {
      if (!from) continue;
      out = out.split(from).join(to);
    }
    return out;
  };
}

/**
 * Recursively apply a string resolver to every string leaf in a value.
 *
 * @deprecated for Phase 1, see makeResolver. May be removed in Phase 4.
 */
export function deepResolveWith<T>(value: T, resolve: (s: string) => string): T {
  if (value == null) return value;
  if (typeof value === "string") return resolve(value) as unknown as T;
  if (Array.isArray(value)) return value.map(v => deepResolveWith(v, resolve)) as unknown as T;
  if (typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      out[k] = deepResolveWith(v, resolve);
    }
    return out as unknown as T;
  }
  return value;
}

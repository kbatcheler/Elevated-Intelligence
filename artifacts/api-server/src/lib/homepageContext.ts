// Fetch a prospect's homepage and extract a compact, LLM-friendly ground-truth
// snippet (title, meta description, og tags, headings, first paragraphs). This
// is the *empirical* anchor for every downstream Claude call — without it the
// model is guessing from training-data memory and hallucinating on anything
// not a household name.
//
// Design constraints:
// - No new deps. Native fetch + regex extraction is plenty for what we need.
// - Hard timeout (6s) so a slow site can't block a user request indefinitely.
// - Size cap on returned context (~6KB) so it doesn't blow up the LLM prompt.
// - Best-effort: a failed fetch must NOT block the route — return `ok:false`
//   and let the caller fall back to the un-grounded prompt.
//
// Security:
// - SSRF-hardened. The URL is taken from arbitrary user input, so:
//     * We accept only http/https with a real DNS hostname (no raw IPs).
//     * We resolve the hostname and reject any private / loopback / link-local
//       / reserved address. Both v4 and v6 ranges are checked.
//     * Redirects are followed manually (up to 3 hops), and every hop is
//       re-validated. A redirect to an internal IP cannot win the race.
// - We intentionally do NOT pass the snippet to any HTML renderer; downstream
//   it's stuffed into a Claude prompt fenced as untrusted source text.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { logger } from "./logger";

export interface HomepageContext {
  ok: boolean;
  // The cleaned domain the request was sent to (no protocol, no path).
  domain: string;
  // The final URL after redirects, or the requested URL if fetch failed.
  finalUrl: string;
  // HTTP status of the final response, or 0 if the request never completed.
  status: number;
  // Bytes of raw HTML received (pre-extraction). Surfaces to the UI as proof.
  bytesFetched: number;
  // Bytes of extracted text passed to the LLM. The receipt the UI shows.
  bytesExtracted: number;
  // How long the fetch + parse took.
  durationMs: number;
  // The compact extract: title / description / og / headings / first paras.
  // Always a string — empty if extraction failed. Cap ~6000 chars.
  snippet: string;
  // If `ok=false`, why — for logs only, not user-facing.
  errorReason?: string;
}

const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES   = 600_000;   // hard cap on bytes we'll buffer
const MAX_SNIPPET_LEN  = 6000;      // hard cap on chars sent to LLM
const MAX_REDIRECTS    = 3;         // redirect chain depth limit
const USER_AGENT =
  "DifferentDayBot/1.0 (+intelligence-portal; sales-research grounding)";

export async function fetchHomepageContext(rawUrl: string): Promise<HomepageContext> {
  const tStart = Date.now();
  const initialDomain = rawUrl
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .toLowerCase();
  const tryUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${initialDomain}`;

  const empty = (status: number, reason: string, finalUrl = tryUrl, domain = initialDomain): HomepageContext => ({
    ok: false, domain, finalUrl, status,
    bytesFetched: 0, bytesExtracted: 0,
    durationMs: Date.now() - tStart, snippet: "", errorReason: reason,
  });

  // SSRF gate before *any* network IO. Hostname must be a real DNS name; raw
  // IPs are rejected outright because there's no legitimate reason a sales
  // prospect's homepage URL would be an IP literal.
  let parsedUrl: URL;
  try { parsedUrl = new URL(tryUrl); } catch {
    return empty(0, "invalid URL");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return empty(0, `unsupported protocol: ${parsedUrl.protocol}`);
  }
  if (isIP(parsedUrl.hostname)) {
    return empty(0, "URL must be a hostname, not a raw IP");
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);

  try {
    // Manual redirect walk so we can re-validate every hop. `redirect:"follow"`
    // would let the platform silently chase a 302 to 169.254.169.254.
    let currentUrl = parsedUrl;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const safety = await isHostnameSafe(currentUrl.hostname);
      if (!safety.ok) {
        return empty(0, `blocked by SSRF policy: ${safety.reason}`, currentUrl.toString(), currentUrl.hostname);
      }
      res = await fetch(currentUrl.toString(), {
        method: "GET",
        redirect: "manual",
        signal: ctl.signal,
        headers: {
          "user-agent": USER_AGENT,
          // Many sites short-circuit non-HTML accepts. Be permissive but prefer HTML.
          "accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "en-US,en;q=0.9",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return empty(res.status, "redirect without Location header", currentUrl.toString());
        let nextUrl: URL;
        try { nextUrl = new URL(loc, currentUrl); } catch {
          return empty(res.status, `redirect to invalid URL: ${loc.slice(0, 200)}`, currentUrl.toString());
        }
        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          return empty(res.status, `redirect to non-http protocol: ${nextUrl.protocol}`, currentUrl.toString());
        }
        if (isIP(nextUrl.hostname)) {
          return empty(res.status, "redirect to raw IP", nextUrl.toString());
        }
        currentUrl = nextUrl;
        // drain the redirect body so the socket can be reused
        try { await res.arrayBuffer(); } catch { /* ignore */ }
        continue;
      }
      break;
    }
    if (!res) return empty(0, "no response after redirect walk");
    if (res.status >= 300 && res.status < 400) {
      return empty(res.status, `exceeded ${MAX_REDIRECTS} redirects`, currentUrl.toString());
    }

    // The "domain" we report is the FINAL hostname (post-redirects). UI shows
    // this so the rep can see if a redirect crossed a brand boundary.
    const finalDomain = currentUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (!res.ok) {
      return empty(res.status, `non-2xx (${res.status})`, currentUrl.toString(), finalDomain);
    }
    const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!ctype.includes("html") && !ctype.includes("xml") && ctype !== "") {
      return empty(res.status, `non-html content-type: ${ctype}`, currentUrl.toString(), finalDomain);
    }

    // Stream-read with a byte cap so a 50MB hostile response can't OOM us.
    const reader = res.body?.getReader();
    if (!reader) return empty(res.status, "no response body", currentUrl.toString(), finalDomain);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      chunks.push(value);
      if (total >= MAX_HTML_BYTES) { void reader.cancel(); break; }
    }
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)));
    const html = buf.toString("utf8");

    const snippet = extractContext(html, finalDomain);
    return {
      ok: snippet.length > 0,
      domain:         finalDomain,
      finalUrl:       currentUrl.toString(),
      status:         res.status,
      bytesFetched:   buf.byteLength,
      bytesExtracted: Buffer.byteLength(snippet, "utf8"),
      durationMs:     Date.now() - tStart,
      snippet,
      ...(snippet.length === 0 ? { errorReason: "extracted snippet empty" } : {}),
    };
  } catch (e) {
    const reason = e instanceof Error && e.name === "AbortError"
      ? `timeout after ${FETCH_TIMEOUT_MS}ms`
      : `fetch failed: ${e instanceof Error ? e.message : String(e)}`;
    logger.warn({ domain: initialDomain, reason }, "homepageContext: fetch failed");
    return empty(0, reason);
  } finally {
    clearTimeout(timer);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// SSRF defence — resolve the hostname and reject any address that targets
// the host itself, the loopback interface, the link-local block (including
// AWS/GCP metadata service 169.254.169.254), RFC1918 private networks, or
// the IPv6 equivalents. Called for every hop in the redirect walk, BEFORE
// we open a socket to that hop.
// ───────────────────────────────────────────────────────────────────────────
async function isHostnameSafe(hostname: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Block obvious local aliases without paying DNS.
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local") || lower === "metadata") {
    return { ok: false, reason: `hostname '${lower}' is a local alias` };
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(hostname, { all: true, verbatim: true });
  } catch (e) {
    return { ok: false, reason: `DNS lookup failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (addrs.length === 0) return { ok: false, reason: "DNS returned no addresses" };
  for (const a of addrs) {
    if (isPrivateAddress(a.address)) {
      return { ok: false, reason: `resolved to non-public address ${a.address}` };
    }
  }
  return { ok: true };
}

function isPrivateAddress(addr: string): boolean {
  // IPv6 first — handles ::1, link-local, ULA, IPv4-mapped.
  if (addr.includes(":")) {
    const lc = addr.toLowerCase();
    if (lc === "::" || lc === "::1") return true;
    if (lc.startsWith("fe80:") || lc.startsWith("fc") || lc.startsWith("fd")) return true;
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — extract and re-check as v4.
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(addr);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  const parts = addr.split(".").map(p => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, link-local 169.254/16, 172.16-31/12,
  // 192.168/16, multicast 224/4, broadcast/reserved 240/4, CGNAT 100.64/10.
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

// ───────────────────────────────────────────────────────────────────────────
// Extraction — regex-driven because we deliberately avoid an HTML-parsing
// dependency. The goal isn't a perfect DOM tree; it's a high-signal text
// snippet the LLM can use as ground truth. Keys we pull:
//   - <title>
//   - <meta name="description">
//   - <meta property="og:title|og:description|og:site_name|og:type">
//   - <h1>, <h2> (first ~10)
//   - First ~6 <p> paragraphs of meaningful length
// Then we strip scripts/styles/HTML and collapse whitespace.
// ───────────────────────────────────────────────────────────────────────────
function extractContext(html: string, domain: string): string {
  // Strip <script>, <style>, <noscript>, comments — pure noise for our purpose.
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const title  = pickText(/<title[^>]*>([\s\S]*?)<\/title>/i, stripped);
  const desc   = pickAttr(/<meta\s+[^>]*name=["']description["'][^>]*>/i, "content", stripped);
  const ogTitle= pickAttr(/<meta\s+[^>]*property=["']og:title["'][^>]*>/i, "content", stripped);
  const ogDesc = pickAttr(/<meta\s+[^>]*property=["']og:description["'][^>]*>/i, "content", stripped);
  const ogSite = pickAttr(/<meta\s+[^>]*property=["']og:site_name["'][^>]*>/i, "content", stripped);
  const ogType = pickAttr(/<meta\s+[^>]*property=["']og:type["'][^>]*>/i, "content", stripped);

  const h1s = matchAllText(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, stripped, 4);
  const h2s = matchAllText(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, stripped, 10);
  const paras = matchAllText(/<p[^>]*>([\s\S]*?)<\/p>/gi, stripped, 30)
    .filter(p => p.length >= 40 && p.length <= 600)
    .slice(0, 8);

  const lines: string[] = [];
  lines.push(`Source: ${domain}`);
  if (title)   lines.push(`Page title: ${title}`);
  if (ogSite && ogSite !== title) lines.push(`Site name: ${ogSite}`);
  if (ogType)  lines.push(`Page type: ${ogType}`);
  if (desc)    lines.push(`Meta description: ${desc}`);
  if (ogDesc && ogDesc !== desc)  lines.push(`OG description: ${ogDesc}`);
  if (ogTitle && ogTitle !== title) lines.push(`OG title: ${ogTitle}`);
  if (h1s.length) {
    lines.push("");
    lines.push("Main headings (H1):");
    for (const h of h1s) lines.push(`  • ${h}`);
  }
  if (h2s.length) {
    lines.push("");
    lines.push("Section headings (H2):");
    for (const h of h2s) lines.push(`  • ${h}`);
  }
  if (paras.length) {
    lines.push("");
    lines.push("Homepage paragraphs:");
    for (const p of paras) lines.push(`  ¶ ${p}`);
  }

  const out = lines.join("\n").slice(0, MAX_SNIPPET_LEN);
  return out.length > Math.min(60, `Source: ${domain}`.length + 1) ? out : "";
}

function pickText(re: RegExp, html: string): string {
  const m = re.exec(html);
  return m ? cleanText(m[1]) : "";
}
function pickAttr(tagRe: RegExp, attr: string, html: string): string {
  const m = tagRe.exec(html);
  if (!m) return "";
  const attrRe = new RegExp(attr + `\\s*=\\s*["']([^"']*)["']`, "i");
  const m2 = attrRe.exec(m[0]);
  return m2 ? cleanText(m2[1]) : "";
}
function matchAllText(re: RegExp, html: string, cap: number): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < cap) {
    const t = cleanText(m[1]);
    if (t.length > 0) out.push(t);
  }
  return out;
}
function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")            // strip nested tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

// Wrapper around the Anthropic AI Integrations proxy.
//
// Phase 1: callClaudeJson — strict JSON, schema-validated, one retry.
// Phase 2: same call now supports `useWebSearch`, which enables Anthropic's
// built-in web_search_20250305 tool and surfaces the URLs Claude consulted
// on the result for downstream provenance and the verified_claims track.

import { z, type ZodType } from "zod/v4";
import { logger as rootLogger } from "../logger";

const MODEL = "claude-sonnet-4-6";
const WEB_SEARCH_TOOL = { type: "web_search_20250305" as const, name: "web_search" as const };

export type CallOptions<T> = {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
  log?: typeof rootLogger;
  // Where in the pipeline this call sits (for log breadcrumbs).
  context?: string;
  // Phase 2: when true, enables Anthropic's web_search tool. The wrapper
  // walks the response blocks and returns the consulted URLs on the result.
  useWebSearch?: boolean;
};

export type CallResult<T> =
  | {
      ok: true;
      value: T;
      durationMs: number;
      model: string;
      inputTokens: number | null;
      outputTokens: number | null;
      // Phase 2: populated only when useWebSearch=true and Claude actually searched.
      consultedUrls: string[];
      searchCallCount: number;
    }
  | { ok: false; reason: string; durationMs: number };

function getEnv(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env["AI_INTEGRATIONS_ANTHROPIC_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_ANTHROPIC_API_KEY"];
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

// Walk Claude's content blocks to extract:
// - The final text answer (last `text` block; Anthropic appends the model's
//   prose after the tool turns).
// - The URLs Claude consulted via `web_search_tool_result` blocks.
// - How many search tool calls happened.
type ContentBlock =
  | { type: "text"; text?: string }
  | { type: "server_tool_use"; name?: string; id?: string }
  | {
      type: "web_search_tool_result";
      content?: Array<{ type?: string; url?: string; title?: string }>;
    }
  | { type: string; [k: string]: unknown };

function walkContent(
  blocks: ContentBlock[] | undefined,
): { text: string; consultedUrls: string[]; searchCallCount: number } {
  if (!blocks?.length) return { text: "", consultedUrls: [], searchCallCount: 0 };
  let lastText = "";
  let searchCallCount = 0;
  const urls = new Set<string>();
  for (const b of blocks) {
    if (b.type === "text" && typeof (b as { text?: string }).text === "string") {
      lastText = (b as { text?: string }).text ?? lastText;
    } else if (b.type === "server_tool_use" && (b as { name?: string }).name === "web_search") {
      searchCallCount += 1;
    } else if (b.type === "web_search_tool_result") {
      // Anthropic occasionally returns a non-array `content` (e.g. an error
      // object). Guard before iterating.
      const raw = (b as { content?: unknown }).content;
      if (Array.isArray(raw)) {
        for (const item of raw as Array<{ url?: string }>) {
          if (item && typeof item.url === "string" && item.url) urls.add(item.url);
        }
      }
    }
  }
  return { text: lastText, consultedUrls: Array.from(urls), searchCallCount };
}

async function callOnce<T>(opts: CallOptions<T>, env: { baseUrl: string; apiKey: string }): Promise<CallResult<T>> {
  const tStart = Date.now();
  const log = opts.log ?? rootLogger;
  try {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 8192,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    };
    if (opts.useWebSearch) {
      body.tools = [WEB_SEARCH_TOOL];
    }
    // Up to 4 sub-attempts to respect Anthropic Retry-After on 429s.
    let apiRes: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      apiRes = await fetch(`${env.baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": env.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (apiRes.status !== 429) break;
      const ra = Number(apiRes.headers.get("retry-after"));
      const waitMs = Math.min(45_000, (Number.isFinite(ra) && ra > 0 ? ra : 5 + attempt * 5) * 1000);
      log.warn({ ctx: opts.context, attempt, waitMs }, "Anthropic 429, backing off");
      // Drain body so the socket frees.
      await apiRes.text().catch(() => undefined);
      await new Promise((r) => setTimeout(r, waitMs));
    }
    if (!apiRes || !apiRes.ok) {
      const status = apiRes?.status ?? 0;
      const errBody = apiRes ? await apiRes.text().catch(() => "") : "";
      log.error(
        { ctx: opts.context, status, body: errBody.slice(0, 300) },
        "Anthropic call non-2xx",
      );
      return { ok: false, reason: `Anthropic HTTP ${status}`, durationMs: Date.now() - tStart };
    }
    const payload = (await apiRes.json()) as {
      content?: ContentBlock[];
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const { text, consultedUrls, searchCallCount } = walkContent(payload.content);
    if (!text) {
      return { ok: false, reason: "Anthropic returned no text content", durationMs: Date.now() - tStart };
    }
    if (opts.useWebSearch && (searchCallCount > 0 || consultedUrls.length > 0)) {
      log.info(
        { ctx: opts.context, searchCallCount, urlCount: consultedUrls.length, urls: consultedUrls.slice(0, 5) },
        "Anthropic web search consulted URLs",
      );
    }
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: extract the largest balanced {...} block from the response.
      // Handles cases where Claude prefixes prose like "Here is the JSON: {...}".
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first !== -1 && last > first) {
        try {
          parsed = JSON.parse(cleaned.slice(first, last + 1));
        } catch (e2) {
          log.warn(
            { ctx: opts.context, snippet: cleaned.slice(0, 200), err: String(e2) },
            "Anthropic returned non-JSON (substring parse also failed)",
          );
          return { ok: false, reason: "Anthropic returned invalid JSON", durationMs: Date.now() - tStart };
        }
      } else {
        log.warn({ ctx: opts.context, snippet: cleaned.slice(0, 200) }, "Anthropic returned non-JSON");
        return { ok: false, reason: "Anthropic returned invalid JSON", durationMs: Date.now() - tStart };
      }
    }
    const result = opts.schema.safeParse(parsed);
    if (!result.success) {
      const summary = z.prettifyError(result.error).slice(0, 400);
      log.warn({ ctx: opts.context, zodErr: summary }, "Anthropic JSON failed schema validation");
      return { ok: false, reason: `schema validation failed: ${summary}`, durationMs: Date.now() - tStart };
    }
    return {
      ok: true,
      value: result.data,
      durationMs: Date.now() - tStart,
      model: payload.model ?? MODEL,
      inputTokens: payload.usage?.input_tokens ?? null,
      outputTokens: payload.usage?.output_tokens ?? null,
      consultedUrls,
      searchCallCount,
    };
  } catch (e) {
    const reason = `network error: ${e instanceof Error ? e.message : String(e)}`;
    log.error({ ctx: opts.context, err: reason }, "Anthropic call threw");
    return { ok: false, reason, durationMs: Date.now() - tStart };
  }
}

/**
 * Call Claude with strict JSON output, validate against schema, retry once
 * on failure. Returns the validated value or a failure reason. Never throws.
 */
export async function callClaudeJson<T>(opts: CallOptions<T>): Promise<CallResult<T>> {
  const env = getEnv();
  if (!env) {
    return { ok: false, reason: "Anthropic AI integration env not configured", durationMs: 0 };
  }
  const first = await callOnce(opts, env);
  if (first.ok) return first;
  (opts.log ?? rootLogger).info({ ctx: opts.context, reason: first.reason }, "Anthropic call failed, retrying once");
  const second = await callOnce(opts, env);
  if (second.ok) return second;
  return { ok: false, reason: `${first.reason} -> retry: ${second.reason}`, durationMs: first.durationMs + second.durationMs };
}

export const PIPELINE_MODEL = MODEL;

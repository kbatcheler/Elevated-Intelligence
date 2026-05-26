// Thin wrapper around the Anthropic AI Integrations proxy for Phase 1.
// Validates JSON output against a Zod schema, with one retry on
// validation failure (the brief's contract).

import { z, type ZodType } from "zod/v4";
import { logger as rootLogger } from "../logger";

const MODEL = "claude-sonnet-4-6";

export type CallOptions<T> = {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
  log?: typeof rootLogger;
  // Where in the pipeline this call sits (for log breadcrumbs).
  context?: string;
};

export type CallResult<T> =
  | { ok: true; value: T; durationMs: number; model: string; inputTokens: number | null; outputTokens: number | null }
  | { ok: false; reason: string; durationMs: number };

function getEnv(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env["AI_INTEGRATIONS_ANTHROPIC_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_ANTHROPIC_API_KEY"];
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

async function callOnce<T>(opts: CallOptions<T>, env: { baseUrl: string; apiKey: string }): Promise<CallResult<T>> {
  const tStart = Date.now();
  const log = opts.log ?? rootLogger;
  try {
    const apiRes = await fetch(`${env.baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": env.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 8192,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    if (!apiRes.ok) {
      const errBody = await apiRes.text().catch(() => "");
      log.error(
        { ctx: opts.context, status: apiRes.status, body: errBody.slice(0, 300) },
        "Anthropic call non-2xx",
      );
      return { ok: false, reason: `Anthropic HTTP ${apiRes.status}`, durationMs: Date.now() - tStart };
    }
    const payload = (await apiRes.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const textBlock = payload.content?.find((b) => b.type === "text");
    const text = textBlock?.text ?? "";
    if (!text) {
      return { ok: false, reason: "Anthropic returned no text content", durationMs: Date.now() - tStart };
    }
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      log.warn(
        { ctx: opts.context, snippet: cleaned.slice(0, 200), err: String(e) },
        "Anthropic returned non-JSON",
      );
      return { ok: false, reason: "Anthropic returned invalid JSON", durationMs: Date.now() - tStart };
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

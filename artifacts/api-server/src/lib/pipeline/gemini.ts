// Thin wrapper around the Gemini API via the Replit AI Integrations proxy.
// Mirrors the shape of callClaudeJson in anthropic.ts: one automatic retry
// on transient errors, structured return type, never throws.
//
// Web grounding (Google Search tool) is opt-in per call. When enabled,
// grounding chunks (the URLs Gemini consulted) are surfaced on the result.

import { GoogleGenAI, type GroundingChunk } from "@google/genai";
import { z, type ZodType } from "zod/v4";
import { logger as rootLogger } from "../logger";

const MODEL = "gemini-2.5-pro";

let cachedClient: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (cachedClient) return cachedClient;
  const baseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];
  if (!baseUrl || !apiKey) return null;
  cachedClient = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "", baseUrl },
  });
  return cachedClient;
}

export type GeminiTextOptions = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  useGrounding?: boolean;
  responseFormat?: "text" | "json";
  log?: typeof rootLogger;
  context?: string;
};

export type GeminiTextResult = {
  text: string;
  groundingChunks: Array<{ uri: string; title: string }>;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
};

function extractGroundingUrls(chunks: GroundingChunk[] | undefined): Array<{ uri: string; title: string }> {
  if (!chunks?.length) return [];
  const seen = new Set<string>();
  const out: Array<{ uri: string; title: string }> = [];
  for (const chunk of chunks) {
    const web = chunk.web;
    if (!web?.uri) continue;
    if (seen.has(web.uri)) continue;
    seen.add(web.uri);
    out.push({ uri: web.uri, title: web.title ?? web.uri });
  }
  return out;
}

async function callGeminiTextOnce(
  opts: GeminiTextOptions,
  client: GoogleGenAI,
): Promise<{ ok: true; value: GeminiTextResult } | { ok: false; reason: string; durationMs: number }> {
  const tStart = Date.now();
  const log = opts.log ?? rootLogger;
  try {
    const config: Record<string, unknown> = {
      systemInstruction: opts.systemPrompt,
      maxOutputTokens: opts.maxTokens ?? 8192,
    };
    if (opts.useGrounding) {
      config.tools = [{ googleSearch: {} }];
    }
    if (opts.responseFormat === "json" && !opts.useGrounding) {
      // Note: Gemini does not allow responseMimeType=json together with the
      // googleSearch tool. When both are requested we keep grounding and
      // rely on prompt-level JSON discipline.
      config.responseMimeType = "application/json";
    }
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: opts.userPrompt }] }],
      config,
    });
    const text = (response.text ?? "").trim();
    if (!text) {
      return { ok: false, reason: "Gemini returned no text content", durationMs: Date.now() - tStart };
    }
    const grounding = extractGroundingUrls(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
    const usage = response.usageMetadata;
    return {
      ok: true,
      value: {
        text,
        groundingChunks: grounding,
        durationMs: Date.now() - tStart,
        inputTokens: usage?.promptTokenCount ?? null,
        outputTokens: usage?.candidatesTokenCount ?? null,
      },
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    log.warn({ ctx: opts.context, err: reason.slice(0, 300) }, "Gemini call threw");
    return { ok: false, reason: `gemini error: ${reason}`, durationMs: Date.now() - tStart };
  }
}

/**
 * Call Gemini for a text or JSON response with optional Google Search
 * grounding. One automatic retry on transient errors before throwing.
 */
export async function callGemini(opts: GeminiTextOptions): Promise<GeminiTextResult> {
  const client = getClient();
  if (!client) {
    throw new Error("Gemini AI integration env not configured (AI_INTEGRATIONS_GEMINI_*)");
  }
  const first = await callGeminiTextOnce(opts, client);
  if (first.ok) return first.value;
  (opts.log ?? rootLogger).info({ ctx: opts.context, reason: first.reason }, "Gemini call failed, retrying once");
  const second = await callGeminiTextOnce(opts, client);
  if (second.ok) return second.value;
  throw new Error(`Gemini call failed twice: ${first.reason} -> retry: ${second.reason}`);
}

// JSON-validated variant. Mirrors callClaudeJson: never throws, returns a
// CallResult-style discriminated union so the pipeline can route to fallback
// stubs on failure.
export type GeminiJsonOptions<T> = {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  maxTokens?: number;
  useGrounding?: boolean;
  log?: typeof rootLogger;
  context?: string;
};

export type GeminiJsonResult<T> =
  | {
      ok: true;
      value: T;
      durationMs: number;
      groundingChunks: Array<{ uri: string; title: string }>;
      inputTokens: number | null;
      outputTokens: number | null;
      model: string;
    }
  | { ok: false; reason: string; durationMs: number };

function stripJsonFence(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function callGeminiJsonOnce<T>(
  opts: GeminiJsonOptions<T>,
  client: GoogleGenAI,
): Promise<GeminiJsonResult<T>> {
  const textOnce = await callGeminiTextOnce(
    {
      systemPrompt: opts.systemPrompt,
      userPrompt: opts.userPrompt,
      maxTokens: opts.maxTokens,
      useGrounding: opts.useGrounding,
      responseFormat: "json",
      log: opts.log,
      context: opts.context,
    },
    client,
  );
  if (!textOnce.ok) return textOnce;
  const cleaned = stripJsonFence(textOnce.value.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return {
      ok: false,
      reason: `Gemini returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      durationMs: textOnce.value.durationMs,
    };
  }
  const result = opts.schema.safeParse(parsed);
  if (!result.success) {
    const summary = z.prettifyError(result.error).slice(0, 400);
    return {
      ok: false,
      reason: `Gemini JSON failed schema validation: ${summary}`,
      durationMs: textOnce.value.durationMs,
    };
  }
  return {
    ok: true,
    value: result.data,
    durationMs: textOnce.value.durationMs,
    groundingChunks: textOnce.value.groundingChunks,
    inputTokens: textOnce.value.inputTokens,
    outputTokens: textOnce.value.outputTokens,
    model: MODEL,
  };
}

export async function callGeminiJson<T>(opts: GeminiJsonOptions<T>): Promise<GeminiJsonResult<T>> {
  const client = getClient();
  if (!client) {
    return { ok: false, reason: "Gemini AI integration env not configured", durationMs: 0 };
  }
  const first = await callGeminiJsonOnce(opts, client);
  if (first.ok) return first;
  (opts.log ?? rootLogger).info({ ctx: opts.context, reason: first.reason }, "Gemini JSON call failed, retrying once");
  const second = await callGeminiJsonOnce(opts, client);
  if (second.ok) return second;
  return {
    ok: false,
    reason: `${first.reason} -> retry: ${second.reason}`,
    durationMs: first.durationMs + second.durationMs,
  };
}

export const GEMINI_MODEL = MODEL;

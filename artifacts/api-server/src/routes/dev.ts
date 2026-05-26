// Dev-only diagnostics endpoints. Mounted in routes/index.ts only when
// NODE_ENV !== "production" so probe surfaces never reach prod.

import { Router, type IRouter } from "express";
import { callGemini, GEMINI_MODEL } from "../lib/pipeline/gemini";
import { callClaudeJson, PIPELINE_MODEL } from "../lib/pipeline/anthropic";
import { z } from "zod/v4";

const router: IRouter = Router();

// Smoke test for the Gemini wrapper. Hits the model with a fixed grounded
// prompt and returns the text plus the grounding URLs Gemini consulted.
router.get("/dev/gemini-test", async (req, res) => {
  try {
    const result = await callGemini({
      systemPrompt:
        "You are a concise research assistant. Answer in two short sentences. Cite sources via Google Search grounding.",
      userPrompt:
        "What is the most recent quarterly revenue Stripe has publicly disclosed? Cite the source.",
      maxTokens: 1024,
      useGrounding: true,
      log: req.log,
      context: "dev/gemini-test",
    });
    res.json({
      ok: true,
      model: GEMINI_MODEL,
      text: result.text,
      groundingChunks: result.groundingChunks,
      durationMs: result.durationMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    req.log.error({ err: message }, "dev/gemini-test failed");
    res.status(500).json({ ok: false, error: message });
  }
});

// Smoke test for the Claude web-search wrapper. Verifies that
// callClaudeJson({ useWebSearch: true }) returns consultedUrls.
router.get("/dev/claude-search-test", async (req, res) => {
  const schema = z.object({
    answer: z.string().min(1),
    cited_companies: z.array(z.string()).max(10),
  });
  const result = await callClaudeJson({
    system:
      "You are a concise research assistant. Use web search to ground your answer. Return JSON only.",
    user:
      'Name 3 named competitors of Stripe in the payments space, as of 2025. ' +
      'Respond with JSON: {"answer": "...", "cited_companies": ["..."]}',
    schema,
    useWebSearch: true,
    maxTokens: 2048,
    log: req.log,
    context: "dev/claude-search-test",
  });
  if (!result.ok) {
    res.status(500).json({ ok: false, error: result.reason, durationMs: result.durationMs });
    return;
  }
  res.json({
    ok: true,
    model: PIPELINE_MODEL,
    value: result.value,
    durationMs: result.durationMs,
    consultedUrls: result.consultedUrls,
    searchCallCount: result.searchCallCount,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });
});

export default router;

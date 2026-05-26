// Chat assistant brain. Phase 1: the per-tenant question/answer corpus
// previously hardcoded against the Meridian demo profile has been removed.
// The brain now returns a neutral fallback that routes users into the
// tenant's morning brief or a named layer. Per-tenant Q&A is deferred to
// Phase 2 (will be wired to the same LLM that produces the artifacts).

export interface ChatCitation {
  layer: string;
  label: string;
}

export interface ChatResponse {
  text: string;
  citations: ChatCitation[];
  navigate?: string;
  openInbox?: boolean;
  openBrief?: boolean;
  followups?: string[];
}

export interface ChatPattern {
  match: (q: string, activeLayer: string) => boolean;
  respond: (q: string, activeLayer: string) => ChatResponse;
}

export const SUGGESTED: string[] = [
  "What's the headline diagnosis?",
  "Where should I start?",
  "What's the biggest risk?",
  "Read me the morning brief",
];

export const PATTERNS: ChatPattern[] = [];

export const FALLBACK: ChatResponse = {
  text:
    "The per-tenant chat brain is not enabled yet. Open the **morning brief** from the topbar for the headline, or jump to any layer from the left nav for the underlying diagnosis.",
  citations: [],
  openBrief: true,
  followups: SUGGESTED,
};

export function answer(_q: string, _activeLayer: string): ChatResponse {
  return FALLBACK;
}

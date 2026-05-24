import { useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Sparkles, ArrowRight, ExternalLink, Lightbulb } from "lucide-react";
import { answer, type ChatResponse } from "../data/chatBrain";
import { useApp } from "../context/AppContext";
import { useCompany } from "../context/CompanyContext";
import { deepResolveWith, DEFAULT_PROFILE_ID } from "../data/companies";
import type { LayerData } from "../data/layers";

// Build a set of suggested chat prompts grounded in the actually-seeded
// company's layer data, metric movers, top causes, top recommended actions.
// Unlike static SUGGESTED (which is just vocab-swapped Meridian Industrial copy), these
// reference the seeded company's real signals so they feel like "questions
// the system already has answers to."
function buildGroundedSuggestions(layers: LayerData[]): string[] {
  const out: string[] = [];
  // Walk through 4-5 layers and pull one prompt each, alternating prompt
  // shapes (why / what-if / cause-drill / action-impact) to keep variety.
  const pickLayers = layers.slice(0, 6);
  pickLayers.forEach((layer, i) => {
    const shape = i % 4;
    if (shape === 0 && layer.metrics?.[0]) {
      out.push(`Why is ${layer.metrics[0].label.toLowerCase()} where it is?`);
    } else if (shape === 1 && layer.actions?.[0]) {
      out.push(`What would happen if we acted on: "${layer.actions[0].title}"?`);
    } else if (shape === 2 && layer.causes?.[0]) {
      out.push(`What's really driving ${layer.causes[0].title.toLowerCase()}?`);
    } else {
      out.push(`Where should we start in ${layer.title}?`);
    }
  });
  // De-dupe while preserving order.
  return Array.from(new Set(out)).slice(0, 6);
}

interface Message {
  id: number;
  from: "user" | "system";
  text: string;
  response?: ChatResponse;
  ts: string;
}

const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

// Tiny markdown-lite: **bold** and _italic_
function rich(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={key++} className="text-[var(--navy)] font-semibold">{tok.slice(2, -2)}</strong>);
    else parts.push(<em key={key++} className="italic">{tok.slice(1, -1)}</em>);
    lastIndex = m.index + tok.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function ChatAssistant({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { activeLayer, openInbox, openBrief } = useApp();
  const { profile, resolve, narrative } = useCompany();
  const { LAYERS } = narrative;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const idCounter = useRef(0);
  const pendingTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Suggestions grounded in the seeded company's actual layer signals.
  // Rebuilt whenever the active profile changes so a new company brings
  // a new set immediately.
  const groundedSuggestions = useMemo(() => buildGroundedSuggestions(LAYERS), [LAYERS]);

  // Two-of-six rotating window shown above the input field. Advances every
  // ~6s while the chat is open and the user isn't actively typing so the
  // suggestions don't feel static and demos can stand in front of the chat
  // panel with something visibly moving.
  const [rotationIdx, setRotationIdx] = useState(0);
  useEffect(() => {
    if (!open || input.length > 0) return;
    const id = window.setInterval(() => {
      setRotationIdx(i => (i + 2) % Math.max(1, groundedSuggestions.length));
    }, 6000);
    return () => window.clearInterval(id);
  }, [open, input.length, groundedSuggestions.length]);
  const visibleSuggestions = groundedSuggestions.length === 0 ? [] : [
    groundedSuggestions[rotationIdx % groundedSuggestions.length],
    groundedSuggestions[(rotationIdx + 1) % groundedSuggestions.length],
  ];

  // Reset the assistant session when the active company profile changes.
  // Cancel pending fake-network timeouts, clear chat history and draft input
  // so each profile starts fresh without leaking the previous tenant's lines.
  useEffect(() => {
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
      pendingTimeouts.current = [];
      setThinking(false);
      setMessages([]);
      setInput("");
    };
  }, [profile.id]);

  // ESC closes panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Restore focus to the launcher after it remounts
        setTimeout(() => launcherRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input when the panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: idCounter.current++,
        from: "system",
        text: "",
        response: {
          text:
            "I'm the **Different Day** assistant. I can answer the questions an executive actually asks of this portal, diagnosis, recovery, risk, what-if, where to start. " +
            "Try one of the suggestions below, or just type.",
          citations: [],
          followups: groundedSuggestions,
        },
        ts: now(),
      }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Message = { id: idCounter.current++, from: "user", text: q, ts: now() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setThinking(true);
    const isDefault = profile.id === DEFAULT_PROFILE_ID;
    const t = setTimeout(() => {
      const rawResp: ChatResponse = isDefault
        ? answer(q, activeLayer)
        : {
            text: `I don't have a grounded answer for ${profile.name} on that yet. Try one of the suggested prompts above, or open a specific layer for its narrative.`,
            citations: [],
          };
      const resp = deepResolveWith(rawResp, resolve);
      const sysMsg: Message = { id: idCounter.current++, from: "system", text: "", response: resp, ts: now() };
      setMessages(m => [...m, sysMsg]);
      setThinking(false);
      if (resp.openInbox) {
        const t2 = setTimeout(() => openInbox(), 600);
        pendingTimeouts.current.push(t2);
      }
      if (resp.openBrief) {
        const t3 = setTimeout(() => openBrief(), 600);
        pendingTimeouts.current.push(t3);
      }
    }, 700 + Math.random() * 400);
    pendingTimeouts.current.push(t);
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          ref={launcherRef}
          data-tour="chat"
          onClick={() => setOpen(true)}
          aria-label="Open Different Day assistant"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full font-sans font-semibold text-[13px] transition-all"
          style={{
            background: "var(--navy)",
            color: "var(--cream)",
            border: "1px solid var(--gold)",
            boxShadow: "0 8px 24px rgba(15,26,51,0.25)",
          }}
        >
          <Sparkles size={16} strokeWidth={1.8} className="text-[var(--gold-light)]" />
          Ask Different Day
        </button>
      )}

      {/* Panel */}
      {open && (
        <div role="dialog" aria-modal="false" aria-label="Different Day assistant"
             className="fixed bottom-6 right-6 z-40 w-[440px] max-w-[calc(100vw-32px)] h-[640px] max-h-[calc(100vh-100px)] flex flex-col rounded-sm"
             style={{ background: "var(--paper)", border: "1px solid var(--navy)", boxShadow: "0 24px 64px rgba(15,26,51,0.35)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0"
               style={{ background: "var(--navy)", color: "var(--cream)" }}>
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} strokeWidth={1.8} className="text-[var(--gold-light)]" />
              <div>
                <div className="font-serif font-semibold text-[15px] leading-tight">Ask Different Day</div>
                <div className="font-sans italic text-[10px] opacity-70 leading-tight">Natural-language access to the intelligence stack</div>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setTimeout(() => launcherRef.current?.focus(), 0); }}
                    aria-label="Close assistant"
                    className="text-[var(--gold-light)] hover:text-white">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-area px-5 py-4 space-y-4" style={{ background: "var(--cream-light)" }}>
            {messages.map(m => m.from === "user" ? (
              <UserBubble key={m.id} text={m.text} ts={m.ts} />
            ) : (
              <SystemBubble key={m.id} resp={m.response!} ts={m.ts} ask={ask} navigate={onNavigate} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2 font-sans italic text-[11px] text-[var(--slate-light)]">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                Reading the stack…
              </div>
            )}
          </div>

          {/* Rotating grounded suggestions, visible whenever the chat is
              open and the user isn't actively typing. Two chips at a time,
              cycling every 6s through the 6 suggestions derived from the
              seeded company's actual layer signals. Click → fires the
              question through the same ask() pipeline as typed input. */}
          {visibleSuggestions.length > 0 && input.length === 0 && (
            <div className="px-4 pt-2 pb-1 border-t border-[var(--cream-dark)] shrink-0"
                 style={{ background: "var(--cream-light)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={10} strokeWidth={2} className="text-[var(--gold)]" />
                <span className="font-sans text-[9px] uppercase tracking-wider text-[var(--slate-light)]">
                  Try asking about {profile.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleSuggestions.map((s, i) => (
                  <button
                    key={`${rotationIdx}-${i}`}
                    onClick={() => ask(s)}
                    className="text-left px-2.5 py-1 rounded-sm font-sans italic text-[11px] text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--gold-faint)] border border-[var(--cream-dark)] hover:border-[var(--gold)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form className="px-4 py-3 border-t border-[var(--cream-dark)] flex items-center gap-2 shrink-0"
                onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diagnosis, recovery, risk, or any layer…"
              aria-label="Ask Different Day a question"
              className="flex-1 px-3 py-2 rounded-sm font-serif italic text-[13px]"
              style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)", color: "var(--ink)" }}
            />
            <button type="submit" disabled={!input.trim()}
                    aria-label="Send question"
                    className="p-2 rounded-sm disabled:opacity-40"
                    style={{ background: "var(--navy)", color: "var(--cream)" }}>
              <Send size={14} strokeWidth={1.8} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function UserBubble({ text, ts }: { text: string; ts: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="px-3.5 py-2 rounded-sm font-sans text-[13px]"
             style={{ background: "var(--navy)", color: "var(--cream)" }}>
          {text}
        </div>
        <div className="text-right font-sans text-[10px] text-[var(--slate-light)] italic mt-1 tabular-nums">{ts}</div>
      </div>
    </div>
  );
}

function SystemBubble({ resp, ts, ask, navigate }: { resp: ChatResponse; ts: string; ask: (q: string) => void; navigate: (key: string) => void }) {
  const { LAYERS } = useCompany().narrative;
  const layerByKey = Object.fromEntries(LAYERS.map(l => [l.key, l]));
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%]">
        <div className="px-4 py-3 rounded-sm"
             style={{ background: "var(--paper)", border: "1px solid var(--cream-dark)" }}>
          <p className="font-serif text-[14px] leading-[1.6] text-[var(--ink)]">{rich(resp.text)}</p>

          {resp.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] flex flex-wrap gap-1.5">
              {resp.citations.map((c, i) => (
                <button key={i} onClick={() => navigate(c.layer)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-sans text-[10px] font-semibold border border-[var(--cream-dark)] text-[var(--navy)] hover:bg-[var(--gold-faint)] hover:border-[var(--gold)] transition-colors">
                  <ExternalLink size={9} strokeWidth={2} />
                  {layerByKey[c.layer]?.title ?? c.layer} · {c.label}
                </button>
              ))}
            </div>
          )}

          {resp.navigate && (
            <button onClick={() => navigate(resp.navigate!)}
                    className="mt-3 inline-flex items-center gap-1 text-[var(--coral)] hover:text-[var(--navy)] font-sans font-semibold text-[11px] uppercase tracking-wider">
              Open the layer <ArrowRight size={11} strokeWidth={2} />
            </button>
          )}
        </div>

        {resp.followups && resp.followups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resp.followups.map((f, i) => (
              <button key={i} onClick={() => ask(f)}
                      className="px-2.5 py-1 rounded-sm font-sans italic text-[11px] text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--cream-dark)]/60 border border-[var(--cream-dark)] transition-colors">
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="font-sans text-[10px] text-[var(--slate-light)] italic mt-1 tabular-nums">Different Day · {ts}</div>
      </div>
    </div>
  );
}

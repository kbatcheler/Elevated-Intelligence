import { useEffect, useMemo, useRef, useState } from "react";
import { type LucideIcon, Search, CornerDownLeft, Command as CommandIcon } from "lucide-react";

// ----------------------------------------------------------------------------
// Command palette (Cmd-K / Ctrl-K).
//
// Two kinds of items: navigation routes (driven directly off the NAV
// array App.tsx already owns) and hot actions (passed in from App.tsx
// where the openBrief / openInbox / setPresenter functions live).
// This is the single guarantee that the palette can never desync with
// the sidebar: there is no parallel route registry.
// ----------------------------------------------------------------------------

export interface PaletteNavItem {
  key: string;
  label: string;
  group: string;
  icon: LucideIcon;
}

export interface PaletteAction {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  run: () => void;
}

interface Props {
  nav: PaletteNavItem[];
  actions: PaletteAction[];
  onNavigate: (key: string) => void;
}

interface Row {
  kind: "nav" | "action";
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  fire: () => void;
}

export default function CommandPalette({ nav, actions, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K to toggle. Captures even when focus is inside a
  // text field, that is the convention every modern app follows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen(o => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset query + cursor + focus the input on each open.
  useEffect(() => {
    if (!open) return;
    setQ("");
    setCursor(0);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  const rows: Row[] = useMemo(() => {
    const navRows: Row[] = nav.map(n => ({
      kind: "nav", id: `nav:${n.key}`, label: n.label, group: n.group, icon: n.icon,
      fire: () => { onNavigate(n.key); setOpen(false); },
    }));
    const actionRows: Row[] = actions.map(a => ({
      kind: "action", id: `act:${a.id}`, label: a.label, group: a.group, icon: a.icon,
      fire: () => { a.run(); setOpen(false); },
    }));
    return [...actionRows, ...navRows];
  }, [nav, actions, onNavigate]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r =>
      r.label.toLowerCase().includes(needle) || r.group.toLowerCase().includes(needle)
    );
  }, [q, rows]);

  // Group for display.
  const grouped = useMemo(() => {
    const m = new Map<string, Row[]>();
    filtered.forEach(r => {
      const list = m.get(r.group) ?? [];
      list.push(r);
      m.set(r.group, list);
    });
    return Array.from(m.entries());
  }, [filtered]);

  useEffect(() => { setCursor(0); }, [q]);

  const flatIds = filtered.map(r => r.id);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, Math.max(0, flatIds.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = filtered[cursor];
      if (row) row.fire();
    }
  };

  if (!open) return null;

  let runningIdx = -1;

  return (
    <>
      <div onClick={() => setOpen(false)} className="fixed inset-0 z-[70]" style={{ background: "rgba(15,26,51,0.55)" }} />
      <div
        role="dialog"
        aria-label="Command palette"
        className="fixed left-1/2 top-[18vh] z-[71] -translate-x-1/2 w-[min(640px,92vw)] rounded-sm overflow-hidden flex flex-col"
        style={{
          background: "var(--cream-light)",
          border: "1px solid var(--cream-dark)",
          boxShadow: "0 24px 48px rgba(15,26,51,0.32)",
          maxHeight: "70vh",
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--cream-dark)" }}>
          <Search size={15} strokeWidth={1.8} className="text-[var(--slate-light)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Jump to anything, by name or by group"
            className="flex-1 bg-transparent outline-none font-sans text-[14px] text-[var(--ink)] placeholder:text-[var(--slate-light)]"
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--slate-light)] flex items-center gap-1">
            <CommandIcon size={11} strokeWidth={1.8} />K
          </span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scroll-area py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-6 font-sans italic text-[13px] text-[var(--slate-light)] text-center">
              Nothing matches "{q}". Try a layer name or "brief".
            </div>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-4 py-1 eyebrow text-[var(--slate-light)]">{group}</div>
              <ul>
                {items.map(r => {
                  runningIdx++;
                  const active = runningIdx === cursor;
                  const Icon = r.icon;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={r.fire}
                        onMouseEnter={() => setCursor(filtered.findIndex(f => f.id === r.id))}
                        className={"w-full flex items-center gap-3 px-4 py-2 text-left transition-colors " +
                          (active ? "bg-[var(--cream-dark)]/70" : "hover:bg-[var(--cream-dark)]/40")}
                      >
                        <Icon size={14} strokeWidth={1.6} className="text-[var(--slate)]" />
                        <span className="flex-1 font-sans text-[13px] text-[var(--navy)]">{r.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--slate-light)]">
                          {r.kind === "nav" ? "open" : "run"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-[var(--slate-light)]" style={{ borderColor: "var(--cream-dark)" }}>
          <span className="flex items-center gap-1.5">
            <span className="px-1 py-0.5 border rounded-sm text-[var(--slate)]" style={{ borderColor: "var(--cream-dark)" }}>↑↓</span>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft size={11} strokeWidth={1.8} /> select
          </span>
          <span className="flex items-center gap-1.5 ml-auto">Esc to close</span>
        </div>
      </div>
    </>
  );
}

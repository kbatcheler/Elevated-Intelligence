import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";

const OWNERS = ["K. Boyd", "M. Tanaka", "R. Okafor", "J. Mendoza", "S. Patel"];
const DUES = ["End of W42", "End of W43", "End of October", "Mid-November", "End of Q4"];

export default function CommitButton({
  layer, layerTitle, title, detail, impact, idx,
}: {
  layer: string;
  layerTitle: string;
  title: string;
  detail: string;
  impact: string;
  idx: number;
}) {
  const { committed, commitAction } = useApp();
  const [justCommitted, setJustCommitted] = useState(false);
  const alreadyCommitted = committed.some(c => c.layer === layer && c.title === title);

  if (alreadyCommitted || justCommitted) {
    return (
      <span className="inline-flex items-center gap-1 font-sans font-bold text-[10px] uppercase tracking-wider text-[var(--teal)] shrink-0">
        <Check size={11} strokeWidth={2.5} /> Committed
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        commitAction({
          layer, layerTitle, title, detail, impact,
          owner: OWNERS[idx % OWNERS.length],
          due:   DUES[idx % DUES.length],
        });
        setJustCommitted(true);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-sans text-[10px] font-bold uppercase tracking-wider text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white border border-[var(--cream-dark)] hover:border-[var(--navy)] transition-colors shrink-0">
      <Plus size={10} strokeWidth={2.5} /> Commit
    </button>
  );
}

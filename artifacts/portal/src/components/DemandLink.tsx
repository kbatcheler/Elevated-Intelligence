import { ExternalLink } from "lucide-react";

// Small contextual pill that appears on layers whose deep planning lives in
// Demand by Different Day. Reinforces the "skeletal framework + deep product"
// positioning without being intrusive.

const PRODUCT_FOR: Record<string, string> = {
  "demand-intelligence": "Demand planning module",
  "supply-chain":        "Network + inventory module",
  "pricing-margin":      "Price + margin module",
  "sales-pipeline":      "Pipeline + forecast module",
};

export default function DemandLink({ layerKey }: { layerKey: string }) {
  const module = PRODUCT_FOR[layerKey];
  if (!module) return null;
  return (
    <a href="https://demand.diffday.dev/discovery" target="_blank" rel="noreferrer"
       className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm font-sans text-[11px] transition-colors group"
       style={{ background: "var(--cream-dark)", color: "var(--navy)", border: "1px solid var(--cream-dark)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold)" }} />
      <span className="font-semibold">Powered by Demand by Different Day</span>
      <span className="opacity-40">·</span>
      <span className="italic text-[var(--slate)]">{module}</span>
      <ExternalLink size={11} strokeWidth={1.8} className="text-[var(--slate-light)] group-hover:text-[var(--coral)] group-hover:translate-x-0.5 transition-all" />
    </a>
  );
}

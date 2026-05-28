import type { LayerData, HeroPanel, Tone } from "../../data/layers";
import {
  TrendingDown, TrendingUp, Minus, MapPin, Users2, Package,
  Truck, Tv, Activity, Trophy,
} from "lucide-react";

type Props = { layer: LayerData };

const toneFg = (t: Tone | undefined) =>
  t === "bad"  ? "var(--coral)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--slate)";

const toneBg = (t: Tone | undefined) =>
  t === "bad"  ? "var(--coral-faint)"
  : t === "warn" ? "var(--amber-faint)"
  : t === "good" ? "var(--teal-faint)"
                 : "var(--cream-dark)";

const pillClass = (t: Tone) =>
  t === "bad"  ? "pill pill-coral"
  : t === "warn" ? "pill pill-amber"
  : t === "good" ? "pill pill-teal"
                 : "pill";

const KindIcon = ({ kind, color }: { kind: HeroPanel["spotlight_entities"][number]["kind"]; color: string }) => {
  const props = { size: 14, strokeWidth: 1.8, style: { color } } as const;
  switch (kind) {
    case "competitor": return <Trophy {...props} />;
    case "region":     return <MapPin {...props} />;
    case "segment":    return <Users2 {...props} />;
    case "supplier":   return <Truck {...props} />;
    case "product":    return <Package {...props} />;
    case "channel":    return <Tv {...props} />;
    case "metric":     return <Activity {...props} />;
  }
};

const ToneArrow = ({ tone }: { tone: Tone | undefined }) => {
  if (tone === "bad")  return <TrendingDown size={10} strokeWidth={2} className="inline mr-1" />;
  if (tone === "good") return <TrendingUp   size={10} strokeWidth={2} className="inline mr-1" />;
  if (tone === "warn") return <Minus        size={10} strokeWidth={2} className="inline mr-1" />;
  return null;
};

export default function GenericHero({ layer }: Props) {
  const h = layer.heroPanel;
  if (!h) return null;

  return (
    <div className="card card-accent-coral !p-0 overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-3 border-b border-[var(--cream-dark)]"
        style={{ background: "var(--cream-dark)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "var(--coral)" }} />
          <span className="eyebrow text-[var(--coral)] truncate">{h.eyebrow}</span>
          <span className="font-sans text-[12px] text-[var(--slate)] shrink-0">
            Q3 2026 · {layer.sources} sources
          </span>
        </div>
        {h.highlight_pills.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {h.highlight_pills.map((p, i) => (
              <span key={i} className={pillClass(p.tone)}>
                <ToneArrow tone={p.tone} />
                {p.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-5">
        <h3 className="font-serif text-[22px] leading-[1.2] text-[var(--navy)] font-semibold max-w-[760px] break-words">
          {h.headline}
        </h3>
        {h.subhead && (
          <p className="font-sans text-[13px] leading-[1.55] text-[var(--slate)] mt-2 max-w-[760px]">
            {h.subhead}
          </p>
        )}

        {h.spotlight_entities.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {h.spotlight_entities.map((e, i) => (
              <div
                key={i}
                className="rounded-md border border-[var(--cream-dark)] px-3 py-2.5"
                style={{ background: "var(--paper)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <KindIcon kind={e.kind} color={toneFg(e.tone)} />
                    <span className="eyebrow text-[var(--slate-light)] truncate">{e.kind}</span>
                  </div>
                  {e.value && (
                    <span
                      className="tag shrink-0"
                      style={{ background: toneBg(e.tone), color: toneFg(e.tone) }}
                    >
                      {e.value}
                    </span>
                  )}
                </div>
                <div className="font-sans font-semibold text-[14px] text-[var(--navy)] leading-tight break-words">
                  {e.name}
                </div>
                {e.note && (
                  <div className="font-sans text-[11.5px] text-[var(--slate-light)] mt-1 leading-snug break-words">
                    {e.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

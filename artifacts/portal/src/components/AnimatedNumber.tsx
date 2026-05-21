import { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  decimals,
}: {
  value: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  // Parse leading number out of value like "$127M", "11.4%", "1.8x", "+71"
  const match = value.match(/^([^\d\-+.]*)([\-+]?[\d,.]+)(.*)$/);
  const detectedPrefix = prefix || (match?.[1] ?? "");
  const numericStr = match?.[2] ?? "";
  const detectedSuffix = suffix || (match?.[3] ?? "");
  const target = Number(numericStr.replace(/,/g, ""));
  const dec = decimals ?? (numericStr.includes(".") ? (numericStr.split(".")[1]?.length || 0) : 0);

  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    let raf = 0;
    startRef.current = null;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  if (!Number.isFinite(target)) return <>{value}</>;
  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
  return <>{detectedPrefix}{formatted}{detectedSuffix}</>;
}

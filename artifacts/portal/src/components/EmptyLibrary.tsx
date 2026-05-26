import { Sparkles } from "lucide-react";
import { useCompany } from "../context/CompanyContext";

// Empty-library landing. Rendered by App.tsx when GET /api/tenants returns
// an empty list. Dark navy background, single CTA that opens the picker
// straight into the seed-new form.
export default function EmptyLibrary() {
  const { setPickerOpen } = useCompany();
  return (
    <div
      role="region"
      aria-label="No tenants seeded yet"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--navy)" }}
    >
      <div className="eyebrow text-[var(--gold-light)] mb-3">
        Elevated Intelligence
      </div>
      <h1
        className="font-serif font-semibold leading-[1.05] mb-3"
        style={{ fontSize: 36, color: "var(--cream)" }}
      >
        No tenants yet.
      </h1>
      <p className="font-serif italic text-[15px] mb-8" style={{ color: "var(--gold-light)" }}>
        Seed a company to generate its intelligence framework.
      </p>
      <button
        onClick={() => setPickerOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-sans text-[12px] uppercase tracking-wider font-semibold transition-colors"
        style={{ background: "var(--gold)", color: "var(--navy-deep)", border: "1px solid var(--gold)" }}
      >
        <Sparkles size={14} strokeWidth={1.8} />
        Seed a company
      </button>
    </div>
  );
}

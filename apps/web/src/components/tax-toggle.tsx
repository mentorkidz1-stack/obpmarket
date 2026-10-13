"use client";

import { useTax } from "@/components/tax-provider";

/** Choix « Avec taxe (TTC) » / « Hors taxe (HT) ». Absent quand la TVA est désactivée sur le site. */
export function TaxToggle({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { enabled, mode, setMode, defaultRate } = useTax();
  if (!enabled) return null;

  const base = tone === "dark" ? "border-white/25 text-app" : "border-line text-ink";
  const on = tone === "dark" ? "bg-white text-[#0a2f1d]" : "bg-brand text-on-brand";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`text-[11px] font-semibold ${tone === "dark" ? "text-app/80" : "text-ink-2"}`} id="tax-toggle-label">
        Prix
      </span>
      <div role="radiogroup" aria-labelledby="tax-toggle-label" className={`flex overflow-hidden rounded-md border text-[12px] font-bold ${base}`}>
        {(
          [
            ["TTC", "TTC", `Avec taxe : TVA de ${defaultRate} % comprise`],
            ["HT", "HT", "Hors taxe : TVA non comprise"],
          ] as const
        ).map(([value, text, title]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            title={title}
            onClick={() => setMode(value)}
            className={`px-2 py-1 transition-colors ${mode === value ? on : "opacity-80 hover:opacity-100"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

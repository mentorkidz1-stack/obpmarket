import type { Market } from "@/lib/api";

/** Bandeau de confiance : les vrais marchés où nos agents relèvent les prix. */
export function MarketStrip({ markets }: { markets: Market[] }) {
  if (markets.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold">Les marchés suivis par nos agents</h2>
      <p className="mt-1 text-sm text-ink-2">Chaque prix affiché vient d&apos;un relevé fait sur le terrain, dans l&apos;un de ces marchés.</p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {markets.map((m) => (
          <div key={m.id} className="flex flex-none items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3">
            <svg viewBox="0 0 24 24" className="size-6 flex-none text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </svg>
            <div>
              <p className="whitespace-nowrap text-sm font-bold">{m.name}</p>
              <p className="whitespace-nowrap text-xs text-ink-2">{m.city}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

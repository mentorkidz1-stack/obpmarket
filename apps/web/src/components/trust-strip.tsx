const ITEMS = [
  {
    icon: <path d="M12 2.5l2.3 5.6 6 .5-4.6 4 1.4 5.9L12 15.7l-5.1 2.8 1.4-5.9-4.6-4 6-.5z" />,
    title: "Prix juste",
    text: "Calculé sur les relevés terrain",
  },
  {
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 3.5v5M17 3.5v5" strokeLinecap="round" />
      </>
    ),
    title: "Retrait ou dépôt",
    text: "Au magasin, selon votre choix",
  },
  {
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
        <path d="M2.5 9.5h19" strokeLinecap="round" />
      </>
    ),
    title: "Paiement sécurisé",
    text: "Mobile Money et carte bancaire",
  },
  {
    icon: (
      <>
        <path d="M12 3l7 3.2v5c0 4.6-3 8.6-7 9.8-4-1.2-7-5.2-7-9.8v-5z" />
        <path d="M9 12l2.2 2.2L15.5 10" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    title: "Vendeurs vérifiés",
    text: "Modérés par OBP Market",
  },
];

export function TrustStrip() {
  return (
    <section className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <div key={item.title} className="flex items-center gap-3 bg-surface px-4 py-4">
          <span className="grid size-11 flex-none place-items-center rounded-full bg-brand-soft text-brand">
            <svg viewBox="0 0 24 24" className="size-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{item.title}</p>
            <p className="text-xs text-ink-2">{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

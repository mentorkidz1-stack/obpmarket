import Link from "next/link";

const STEPS = [
  {
    title: "Nos agents relèvent les prix",
    text: "Sur les marchés du Bénin, des agents notent chaque jour le prix réel des produits.",
    icon: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></>,
  },
  {
    title: "OBP calcule le prix moyen",
    text: "Les relevés sont croisés pour obtenir un prix de référence juste, mis à jour en continu.",
    icon: <><path d="M4 19V9M10 19V5M16 19v-8M22 19H2" /></>,
  },
  {
    title: "Vous achetez, retirez ou déposez",
    text: "Payez par Mobile Money ou carte, puis retirez au magasin ou laissez le produit en dépôt à votre nom.",
    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 11h18M8 3.5v4M16 3.5v4" /></>,
  },
  {
    title: "Revendez quand vous voulez",
    text: "Remettez votre stock en vente au prix du marché, ou demandez une offre de rachat à OBP.",
    icon: <><path d="M7 7h11l-3-3M17 17H6l3 3" /></>,
  },
];

export function HowItWorks() {
  return (
    <section className="mt-10 rounded-3xl bg-brand-soft px-5 py-9 sm:px-9 sm:py-11">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Simple et transparent</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Comment ça marche</h2>
        </div>
        <Link href="/comment-ca-marche" className="text-sm font-bold text-brand">
          En savoir plus →
        </Link>
      </div>
      <ol className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl bg-surface p-5">
            <span className="absolute right-4 top-3 font-display text-4xl font-extrabold text-brand/10">{i + 1}</span>
            <span className="grid size-11 place-items-center rounded-full bg-brand text-on-brand">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {s.icon}
              </svg>
            </span>
            <p className="mt-4 font-display text-base font-bold leading-snug">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

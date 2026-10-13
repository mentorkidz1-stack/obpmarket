import Link from "next/link";

const STEPS = [
  {
    title: "Vous choisissez",
    text: "Parcourez les produits d'OBP Market et de ses vendeurs partenaires, à des prix accessibles.",
    icon: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  },
  {
    title: "Vous commandez",
    text: "Ajoutez au panier et payez en toute sécurité par Mobile Money ou carte bancaire.",
    icon: <><path d="M4 5h2l1.8 9h9.4l1.8-6.5H7" /><circle cx="9.5" cy="18.5" r="1.3" /><circle cx="16.5" cy="18.5" r="1.3" /></>,
  },
  {
    title: "Vous retirez ou vous êtes livré",
    text: "Récupérez votre commande au magasin avec votre bon de retrait, ou faites-vous livrer à domicile. Vous pouvez aussi la laisser en dépôt à votre nom.",
    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 11h18M8 3.5v4M16 3.5v4" /></>,
  },
  {
    title: "Revendez quand vous voulez",
    text: "Remettez les produits que vous avez en dépôt en vente, ou demandez une offre de rachat à OBP.",
    icon: <><path d="M7 7h11l-3-3M17 17H6l3 3" /></>,
  },
];

export function HowItWorks() {
  return (
    <section className="mt-10 rounded-3xl bg-brand-soft px-5 py-9 sm:px-9 sm:py-11">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Simple et rapide</p>
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

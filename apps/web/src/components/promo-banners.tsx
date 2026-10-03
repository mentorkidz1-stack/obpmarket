import Link from "next/link";
import { Photo } from "@/components/photo";

const CARDS = [
  {
    image: "/promos/promo-vendeur.jpg",
    position: "center 30%",
    title: "Vendez vos produits",
    text: "Ouvrez votre boutique partenaire : nous modérons vos annonces et réceptionnons votre stock.",
    cta: "Devenir vendeur",
    href: "/vendeur",
  },
  {
    image: "/promos/promo-depot.jpg",
    position: "center",
    title: "Stockez chez OBP",
    text: "Achetez au prix du jour, laissez en dépôt, revendez quand le prix vous convient.",
    cta: "Mon stock",
    href: "/mon-stock",
  },
  {
    image: "/promos/promo-paiement.jpg",
    position: "center 30%",
    title: "Payez par Mobile Money",
    text: "MTN MoMo, Moov, Orange ou carte bancaire — votre commande est confirmée automatiquement.",
    cta: "Voir la boutique",
    href: "/boutique",
  },
];

/** Bandeaux photo « nos services » — uniquement des fonctionnalités réelles de la plateforme. */
export function PromoBanners() {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-extrabold">Ce que vous pouvez faire sur OBP Market</h2>
      <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="relative min-h-60 overflow-hidden rounded-2xl">
            <Photo src={c.image} alt="" sizes="(max-width: 768px) 100vw, 360px" quality={60} className={c.position === "center" ? "object-center" : "object-[center_30%]"} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d20]/90 via-[#0b0d20]/35 to-transparent" />
            <div className="relative flex h-full min-h-60 flex-col justify-end p-5 text-white">
              <p className="font-display text-xl font-extrabold leading-tight">{c.title}</p>
              <p className="mt-1.5 max-w-xs text-[13px] leading-snug text-white/85">{c.text}</p>
              <Link
                href={c.href}
                className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#15172b]"
              >
                {c.cta}
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

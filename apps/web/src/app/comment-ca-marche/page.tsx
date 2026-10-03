import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { HowItWorks } from "@/components/how-it-works";
import { Photo } from "@/components/photo";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Comment OBP Market calcule le prix du marché, et comment acheter, déposer en stock, revendre ou vendre vos produits.",
};

const BLOCKS = [
  {
    image: "/promos/hero-1.jpg",
    kicker: "Le prix",
    title: "Un prix moyen, calculé sur le terrain",
    text: [
      "Des agents OBP Market se rendent sur les marchés du Bénin et relèvent les prix réels, produit par produit. Ces relevés sont contrôlés puis moyennés pour obtenir un prix de référence.",
      "Ce prix est mis à jour à chaque nouveau relevé. Vous voyez toujours la date de la dernière mise à jour et son évolution sur 7, 30 ou 90 jours.",
    ],
  },
  {
    image: "/promos/promo-depot.jpg",
    kicker: "Acheter et stocker",
    title: "Retirez au magasin ou laissez en dépôt",
    text: [
      "Après paiement, vous retirez votre produit au magasin avec un bon de retrait. Pour les produits stockables, vous pouvez aussi choisir de le laisser en dépôt, à votre nom.",
      "Votre stock est valorisé chaque jour au prix du marché : vous suivez ce qu'il vaut aujourd'hui par rapport à votre prix d'achat.",
    ],
  },
  {
    image: "/promos/hero-2.jpg",
    kicker: "Revendre",
    title: "Revendez ou liquidez votre stock",
    text: [
      "Mettez en revente tout ou partie de votre stock : il est vendu au prix du marché au moment de la vente, et le montant est crédité sur votre portefeuille.",
      "Besoin d'argent rapidement ? Demandez une offre de rachat à OBP Market : vous êtes libre de l'accepter ou de la refuser.",
    ],
  },
  {
    image: "/promos/promo-vendeur.jpg",
    kicker: "Vendre",
    title: "Devenez vendeur partenaire",
    text: [
      "Producteurs, commerçants et coopératives peuvent publier leurs produits. Chaque annonce est vérifiée par l'équipe OBP Market, qui réceptionne le stock avant la mise en vente.",
      "Vos ventes sont créditées sur votre portefeuille après confirmation du paiement de l'acheteur, puis retirables vers Mobile Money.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero title="Comment ça marche" crumb="Comment ça marche" subtitle="Du relevé de prix à la revente : tout le parcours, simplement." />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
        <HowItWorks />

        <div className="mt-12 grid gap-12">
          {BLOCKS.map((b, i) => (
            <section key={b.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${i % 2 ? "md:order-2" : ""}`}>
                <Photo src={b.image} alt="" sizes="(max-width: 768px) 100vw, 560px" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{b.kicker}</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{b.title}</h2>
                <div className="mt-4 grid gap-3 leading-relaxed text-ink-2">
                  {b.text.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-3xl bg-ink px-6 py-10 text-center text-app sm:px-12">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Prêt à commencer ?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-app/80">Découvrez les prix du jour ou ouvrez votre espace vendeur.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/boutique" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#15172b]">
              Voir la boutique
            </Link>
            <Link href="/vendeur" className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold">
              Devenir vendeur
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

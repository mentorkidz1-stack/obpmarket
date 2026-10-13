import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { HowItWorks } from "@/components/how-it-works";
import { Photo } from "@/components/photo";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Comment acheter sur OBP Market : choisir, commander, retirer ou se faire livrer, laisser en dépôt, revendre ou vendre vos produits.",
};

const BLOCKS = [
  {
    image: "/promos/hero-1.jpg",
    kicker: "Les produits",
    title: "Des produits à un prix facile, accessible",
    text: [
      "OBP Market vend ses propres produits agricoles, vivriers et électroménagers, ainsi que ceux de vendeurs partenaires choisis. Notre objectif : que chacun trouve ce dont il a besoin, à un prix accessible.",
      "Le prix de chaque produit est affiché clairement, avec son évolution sur 7, 30 ou 90 jours. Vous pouvez demander à être prévenu dès qu'il baisse.",
    ],
  },
  {
    image: "/promos/promo-depot.jpg",
    kicker: "Acheter et stocker",
    title: "Retirez au magasin ou laissez en dépôt",
    text: [
      "Après paiement, vous retirez votre produit au magasin avec un bon de retrait, ou vous vous faites livrer. Pour les produits stockables, vous pouvez aussi choisir de le laisser en dépôt, à votre nom.",
      "Dans « Mon stock », vous suivez ce que vaut votre stock aujourd'hui par rapport à votre prix d'achat.",
    ],
  },
  {
    image: "/promos/hero-2.jpg",
    kicker: "Revendre",
    title: "Revendez ou liquidez votre stock",
    text: [
      "Mettez en revente tout ou partie de votre stock : il est vendu au prix du jour au moment de la vente, et le montant est crédité sur votre portefeuille.",
      "Besoin d'argent rapidement ? Demandez une offre de rachat à OBP Market : vous êtes libre de l'accepter ou de la refuser.",
    ],
  },
  {
    image: "/promos/promo-vendeur.jpg",
    kicker: "Vendre",
    title: "Les vendeurs partenaires",
    text: [
      "OBP Market choisit ses vendeurs : producteurs, commerçants et coopératives rejoignent la plateforme sur invitation, après un partenariat. Chaque annonce est vérifiée par l'équipe OBP Market, qui réceptionne le stock avant la mise en vente.",
      "Vos ventes sont créditées sur votre portefeuille après confirmation du paiement de l'acheteur, puis retirables vers Mobile Money.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero title="Comment ça marche" crumb="Comment ça marche" subtitle="De la commande à la revente : tout le parcours, simplement." />
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
          <p className="mx-auto mt-2 max-w-md text-sm text-app/80">Découvrez nos produits à prix accessibles, ou parlez-nous de votre activité pour devenir partenaire.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/boutique" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a2f1d]">
              Voir la boutique
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold">
              Nous contacter
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

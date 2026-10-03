import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Réponses aux questions les plus courantes : prix, paiement, retrait, dépôt, revente et compte vendeur.",
};

const GROUPS = [
  {
    title: "Prix et produits",
    items: [
      {
        q: "Comment le prix est-il fixé ?",
        a: "Le prix affiché est la moyenne des relevés réalisés par nos agents sur plusieurs marchés du Bénin. Il est recalculé à chaque nouveau relevé, et vous voyez la date de la dernière mise à jour sur chaque produit.",
      },
      {
        q: "Pourquoi le prix d'un produit change-t-il ?",
        a: "Les prix des marchés évoluent avec l'offre, la saison et la demande. Le prix OBP Market suit ces variations ; la fiche produit montre son évolution sur 7, 30 ou 90 jours.",
      },
      {
        q: "Le prix de ma commande peut-il changer après l'avoir ajoutée au panier ?",
        a: "Le panier donne une estimation au prix du marché actuel. Le montant exact est fixé au moment de la validation de la commande, puis ne bouge plus.",
      },
      {
        q: "Puis-je voir les prix dans une autre devise ?",
        a: "Oui : le menu « Devise » permet d'afficher les prix en euro, dollar, naira ou cedi, à titre indicatif. Le paiement s'effectue toujours en FCFA.",
      },
    ],
  },
  {
    title: "Commander et payer",
    items: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "MTN Mobile Money, Moov Money, Orange Money et cartes bancaires Visa ou Mastercard. Votre commande est confirmée automatiquement dès que le paiement réussit.",
      },
      {
        q: "Que faire si le paiement en ligne ne passe pas ?",
        a: "Sur la page de paiement, l'option « Payer autrement » vous permet d'envoyer le montant par Mobile Money puis de saisir la référence reçue par SMS. Votre commande est alors confirmée après vérification par notre équipe.",
      },
      {
        q: "Comment récupérer ma commande ?",
        a: "Une fois la commande payée, vous recevez un bon de retrait sur la page de la commande. Présentez ce code au magasin OBP Market pour récupérer vos produits.",
      },
    ],
  },
  {
    title: "Mon stock et mes ventes",
    items: [
      {
        q: "Qu'est-ce que le dépôt ?",
        a: "Pour les produits stockables, vous pouvez choisir « Je laisse en dépôt » : le produit reste stocké chez OBP Market, à votre nom. Vous le retrouvez dans « Mon stock », valorisé au prix du marché du jour.",
      },
      {
        q: "Comment revendre un produit que j'ai en dépôt ?",
        a: "Depuis « Mon stock », choisissez « Mettre en revente » : il est vendu au prix du marché au moment de la vente et le montant est crédité sur votre portefeuille. Vous pouvez aussi demander une offre de rachat à OBP Market (« Vente en liquidité »).",
      },
      {
        q: "Comment retirer l'argent de mon portefeuille ?",
        a: "Depuis la page Portefeuille, le bouton « Retirer vers MoMo » transfère votre solde disponible vers votre compte MTN MoMo ou Moov Money.",
      },
    ],
  },
  {
    title: "Immobilier",
    items: [
      {
        q: "Qui propose les parcelles et les biens immobiliers ?",
        a: "Les parcelles, terrains, maisons, chambres et guest houses de la rubrique Immobilier sont proposés directement par OBP Market.",
      },
      {
        q: "Comment visiter un bien ?",
        a: "Sur la fiche du bien, cliquez sur « Être rappelé(e) » et laissez votre numéro. L'équipe OBP Market vous rappelle pour organiser la visite et vous communiquer les documents disponibles.",
      },
      {
        q: "Peut-on payer un bien en ligne ?",
        a: "Non : l'achat ou la location d'un bien immobilier se conclut avec l'équipe OBP Market après la visite. Aucun paiement n'est demandé sur le site pour l'immobilier.",
      },
      {
        q: "Comment est indiquée la superficie ?",
        a: "Elle est indiquée par OBP Market dans l'unité du bien : mètres carrés, ares ou hectares. Quand ce n'est pas en m², l'équivalent en m² est affiché à côté.",
      },
    ],
  },
  {
    title: "Devenir vendeur",
    items: [
      {
        q: "Comment devenir vendeur ?",
        a: "Depuis l'Espace vendeur, envoyez votre demande (particulier, professionnel ou coopérative). Elle est validée par OBP Market sous 24 à 48 h. Vous gardez votre compte acheteur, votre stock et votre portefeuille.",
      },
      {
        q: "Comment publier une annonce ?",
        a: "Choisissez le produit, la quantité, votre prix et ajoutez au moins 2 photos. L'équipe OBP Market vérifie l'annonce ; elle est signalée au modérateur si votre prix s'écarte trop du prix du marché. L'annonce est mise en vente après réception du stock au magasin.",
      },
      {
        q: "Quand suis-je payé ?",
        a: "Vos ventes sont créditées sur votre portefeuille dès que le paiement de l'acheteur est confirmé. Vous pouvez ensuite les retirer vers Mobile Money.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero title="Questions fréquentes" crumb="FAQ" subtitle="Vous ne trouvez pas votre réponse ? Écrivez-nous depuis la page Contact." />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid gap-10">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h2 className="font-display text-xl font-extrabold">{g.title}</h2>
              <div className="mt-4 grid gap-2.5">
                {g.items.map((item) => (
                  <details key={item.q} className="group rounded-2xl border border-line bg-surface open:border-brand/40">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <svg viewBox="0 0 24 24" className="size-4 flex-none transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-2">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-brand-soft p-8 text-center">
          <p className="font-display text-xl font-extrabold">Une autre question ?</p>
          <p className="mt-1 text-sm text-ink-2">Notre équipe vous répond.</p>
          <Link href="/contact" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
            Nous contacter
          </Link>
        </div>
      </main>
    </>
  );
}

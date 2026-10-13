import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

const SECTIONS = [
  {
    title: "1. Objet",
    text: "OBP Market, service de ONE BUILD PLUS GROUPE (OBP), est une plateforme de vente en ligne de produits agricoles, vivriers et d'électroménager, proposés par OBP et par ses vendeurs partenaires. Elle permet de les acheter, de les retirer ou de se les faire livrer, de les déposer en stock et de les revendre ; elle présente aussi des biens immobiliers proposés par OBP.",
  },
  {
    title: "2. Prix",
    text: "Les prix affichés sont les prix de vente d'OBP Market, en FCFA. Ils peuvent évoluer ; le prix d'une commande est celui qui s'affiche à la validation de la commande, puis il ne change plus. Les montants affichés dans une autre devise que le FCFA sont donnés à titre indicatif ; le paiement s'effectue en FCFA.",
  },
  {
    title: "3. Commande et paiement",
    text: "Une commande est confirmée dès que son paiement est reçu, par Mobile Money, par carte bancaire ou après vérification d'une référence de paiement manuel. Le stock est réservé à la création de la commande ; il est libéré si le paiement n'aboutit pas ou est refusé.",
  },
  {
    title: "4. Retrait et dépôt",
    text: "Les produits payés se retirent au magasin OBP Market sur présentation du bon de retrait. Pour les produits stockables, le client peut choisir de les laisser en dépôt : ils restent stockés à son nom et leur valeur du jour est indiquée dans son espace.",
  },
  {
    title: "5. Revente et liquidité",
    text: "Le client peut remettre en vente un produit en dépôt : il est vendu au prix du jour au moment de la vente. Il peut aussi demander une offre de rachat à OBP Market, qu'il est libre d'accepter ou de refuser. Les gains sont crédités sur son portefeuille et retirables vers Mobile Money.",
  },
  {
    title: "6. Vendeurs partenaires",
    text: "Les vendeurs sont des partenaires choisis par OBP Market, qui les invite à ouvrir leur compte. Chaque annonce est vérifiée avant sa mise en vente et le stock est réceptionné au magasin. Les ventes sont créditées au vendeur après confirmation du paiement de l'acheteur.",
  },
  {
    title: "7. Compte",
    text: "L'accès au compte se fait par numéro de téléphone et code de vérification. Le client est responsable de la confidentialité de son accès et des opérations réalisées depuis son compte.",
  },
  {
    title: "8. Contact",
    text: "Pour toute question ou réclamation, utilisez la page Contact du site.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero title="Conditions d'utilisation" crumb="Conditions" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid gap-7">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-extrabold">{s.title}</h2>
              <p className="mt-1.5 leading-relaxed text-ink-2">{s.text}</p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

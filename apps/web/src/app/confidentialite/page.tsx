import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "Confidentialité" };

const SECTIONS = [
  {
    title: "Données collectées",
    text: "Numéro de téléphone et nom (compte), commandes, stock, opérations du portefeuille, informations de réception des paiements pour les vendeurs, et messages envoyés via le formulaire de contact.",
  },
  {
    title: "Utilisation",
    text: "Ces données servent uniquement à faire fonctionner la plateforme : authentifier votre compte, traiter vos commandes et paiements, gérer votre stock et votre portefeuille, et répondre à vos messages.",
  },
  {
    title: "Paiements",
    text: "Les paiements en ligne sont traités par notre prestataire de paiement. OBP Market ne conserve ni numéro de carte bancaire ni code secret Mobile Money.",
  },
  {
    title: "Stockage sur votre appareil",
    text: "Votre navigateur conserve localement votre panier, vos favoris, votre devise d'affichage, votre session de connexion et les derniers produits consultés. Vous pouvez les effacer à tout moment depuis les réglages de votre navigateur.",
  },
  {
    title: "Vos droits",
    text: "Vous pouvez demander l'accès, la correction ou la suppression de vos données en nous écrivant depuis la page Contact.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Confidentialité" crumb="Confidentialité" />
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

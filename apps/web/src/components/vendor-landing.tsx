import Link from "next/link";
import type { ReactNode } from "react";
import { Photo } from "@/components/photo";

const BENEFITS = [
  { title: "Un prix de référence honnête", text: "Votre produit est comparé au prix moyen relevé sur les marchés : les acheteurs vous font confiance." },
  { title: "OBP Market s'occupe de la vente", text: "Nous vérifions l'annonce, réceptionnons le stock au magasin et encaissons l'acheteur à votre place." },
  { title: "Payé sur votre portefeuille", text: "Dès que le paiement de l'acheteur est confirmé, votre gain est crédité. Retrait vers Mobile Money." },
  { title: "Un compte, tous vos usages", text: "Vous gardez votre compte acheteur, votre stock en dépôt et votre portefeuille." },
];

const STEPS = [
  { title: "Demandez votre compte vendeur", text: "Particulier, professionnel ou coopérative : quelques informations suffisent. Réponse sous 24 à 48 h." },
  { title: "Publiez votre annonce", text: "Choisissez le produit, la quantité, votre prix, et ajoutez au moins 2 photos." },
  { title: "OBP Market valide et réceptionne", text: "Nous vérifions l'annonce, puis vous déposez le stock au magasin. Elle est mise en vente à réception." },
  { title: "Vous êtes payé", text: "À chaque vente confirmée, votre portefeuille est crédité. Vous retirez quand vous voulez." },
];

const RULES = [
  "Produits stockables non périssables (céréales, huiles, tubercules séchés, électroménager…).",
  "Au moins 2 photos nettes du produit réel, jusqu'à 6.",
  "Un prix proche du prix du marché : l'annonce hors de ±10 % est examinée de plus près.",
  "Le stock doit être déposé au magasin OBP Market : l'annonce n'est achetable qu'à réception.",
];

/** Page de présentation « Devenir vendeur » : ouverte aux visiteurs non connectés. */
export function VendorLanding({ cta }: { cta: ReactNode }) {
  return (
    <div className="grid gap-12">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#15172b] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
          <Photo src="/promos/promo-vendeur.jpg" alt="" sizes="(max-width: 1152px) 50vw, 560px" className="opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#15172b] via-[#15172b]/60 to-transparent" />
        </div>
        <div className="relative max-w-xl p-7 sm:p-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Vendeurs partenaires</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-5xl">Vendez vos produits avec OBP Market</h1>
          <p className="mt-4 text-white/80">
            Publiez votre stock, nous le vérifions, le réceptionnons et le vendons au juste prix. Vous êtes payé dès que l&apos;acheteur a réglé.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">{cta}</div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold">Pourquoi vendre avec nous</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-full bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <div>
                <p className="font-display font-bold">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-brand-soft p-6 sm:p-9">
        <h2 className="font-display text-2xl font-extrabold">Comment ça se passe</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl bg-surface p-5">
              <span className="grid size-9 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-on-brand">{i + 1}</span>
              <p className="mt-3 font-display font-bold leading-snug">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 md:grid-cols-2 md:items-start">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Ce qu&apos;il faut savoir</h2>
          <ul className="mt-4 grid gap-3">
            {RULES.map((r) => (
              <li key={r} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                <span className="mt-1.5 size-1.5 flex-none rounded-full bg-brand" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-display text-lg font-extrabold">Une question avant de vous lancer ?</p>
          <p className="mt-1 text-sm text-ink-2">Consultez la FAQ ou écrivez-nous : nous vous répondons rapidement.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/faq" className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold hover:bg-surface-2">
              Questions fréquentes
            </Link>
            <Link href="/contact" className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold hover:bg-surface-2">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

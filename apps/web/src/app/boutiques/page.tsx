import type { Metadata } from "next";
import Link from "next/link";
import { getShops } from "@/lib/api";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Boutiques vendeurs",
  description: "Les vendeurs partenaires d'OBP Market : produits au prix du marché, paiement sécurisé, retrait ou livraison.",
};

const TYPE_LABEL = { PARTICULIER: "Particulier", PROFESSIONNEL: "Professionnel", COOPERATIVE: "Coopérative" } as const;

export default async function ShopsPage() {
  const shops = await getShops().catch(() => []);

  return (
    <>
      <PageHero title="Boutiques vendeurs" crumb="Boutiques" subtitle="Les vendeurs partenaires vérifiés par OBP Market. Chaque boutique a son lien à partager." />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {shops.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Les premières boutiques arrivent</p>
            <p className="mt-1 text-sm text-ink-2">Vous produisez ou vendez ? Ouvrez votre boutique et partagez-la à vos clients.</p>
            <Link href="/vendeur" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Devenir vendeur
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <li key={s.slug}>
                <Link href={`/boutique-de/${s.slug}`} className="flex h-full gap-4 rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]">
                  <span className="grid size-14 flex-none place-items-center rounded-2xl bg-brand font-display text-2xl font-extrabold text-on-brand">{s.name.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold">{s.name}</p>
                    <p className="text-xs text-ink-2">
                      {TYPE_LABEL[s.type]} · {s.zone}
                    </p>
                    {s.description && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{s.description}</p>}
                    <p className="mt-2 text-xs font-bold text-brand">
                      {s.liveListings} produit{s.liveListings > 1 ? "s" : ""} en vente →
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

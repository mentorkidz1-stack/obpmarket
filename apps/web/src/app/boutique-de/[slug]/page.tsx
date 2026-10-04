import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getShop, type Product, type Shop } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { ShopContact, ShopListingCard, ShopShare, ShopTracker } from "@/components/shop-actions";
import { SITE } from "@/lib/site";

const TYPE_LABEL = { PARTICULIER: "Particulier", PROFESSIONNEL: "Professionnel", COOPERATIVE: "Coopérative" } as const;

async function load(slug: string): Promise<Shop | null> {
  try {
    return await getShop(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps<"/boutique-de/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const shop = await load(slug);
  if (!shop) return { title: "Boutique introuvable" };
  const description = shop.description?.slice(0, 160) || `${shop.name} : produits au prix du marché, vendus et livrés par ${SITE.name}.`;
  return {
    title: `${shop.name} · boutique vendeur`,
    description,
    alternates: { canonical: `${SITE.url}/boutique-de/${shop.slug}` },
    openGraph: { title: shop.name, description, url: `${SITE.url}/boutique-de/${shop.slug}`, type: "website" },
  };
}

export default async function ShopPage(props: PageProps<"/boutique-de/[slug]">) {
  const { slug } = await props.params;
  const shop = await load(slug);
  if (!shop) notFound();

  const products = await getProducts().catch(() => [] as Product[]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const since = new Date(shop.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <>
      <ShopTracker slug={shop.slug} />
      <PageHero title={shop.name} crumb="Boutiques" subtitle={shop.description ?? undefined}>
        <ShopShare slug={shop.slug} name={shop.name} />
      </PageHero>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-up/10 px-3 py-1 text-up">✓ Vendeur vérifié par {SITE.name}</span>
          <span className="rounded-full bg-surface-2 px-3 py-1">{TYPE_LABEL[shop.type]}</span>
          <span className="rounded-full bg-surface-2 px-3 py-1">{shop.zone}</span>
          <span className="rounded-full bg-surface-2 px-3 py-1">Membre depuis {since}</span>
          {shop.whatsapp && <ShopContact slug={shop.slug} whatsapp={shop.whatsapp} name={shop.name} />}
        </div>

        {shop.listings.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Aucun produit en vente pour le moment</p>
            <p className="mt-1 text-sm text-ink-2">Cette boutique renouvelle son stock régulièrement. Découvrez en attendant tous les produits au prix du marché.</p>
            <Link href="/boutique" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.listings.map((l) => (
              <ShopListingCard key={l.id} listing={l} product={byId.get(l.productId)} slug={shop.slug} shopName={shop.name} />
            ))}
          </div>
        )}

        <section className="mt-10 grid gap-3 rounded-2xl border border-line bg-surface p-5 text-sm sm:grid-cols-3">
          <div>
            <p className="font-display font-bold">Prix du marché</p>
            <p className="text-ink-2">Vous payez le prix moyen relevé sur les marchés le jour de votre commande.</p>
          </div>
          <div>
            <p className="font-display font-bold">Paiement sécurisé</p>
            <p className="text-ink-2">Mobile Money ou carte, directement sur {SITE.name} : le vendeur n&apos;encaisse jamais de main à main.</p>
          </div>
          <div>
            <p className="font-display font-bold">Retrait ou livraison</p>
            <p className="text-ink-2">Les produits sont conservés dans les dépôts OBP : retrait en magasin, ou livraison à domicile selon votre zone.</p>
          </div>
        </section>
      </main>
    </>
  );
}

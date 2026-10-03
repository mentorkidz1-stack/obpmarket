"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getLatestReferencePrices,
  getProduct,
  getProducts,
  getReferencePriceHistory,
  parseProductPhotos,
  type Product,
  type ReferencePrice,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money, useMoneyText } from "@/components/money";
import { useWishlist } from "@/components/wishlist-provider";
import { useUI } from "@/components/ui-provider";
import { useCart, type Fulfillment } from "@/components/cart-provider";
import { ProductImage } from "@/components/product-image";
import { ProductCard } from "@/components/product-card";
import { PriceChart } from "@/components/price-chart";
import { PriceTrend } from "@/components/price-trend";

const PERIODS = [
  { label: "7 j", days: 7 },
  { label: "30 j", days: 30 },
  { label: "90 j", days: 90 },
];

const GUARANTEES = [
  { title: "Prix juste", text: "Calculé sur les relevés terrain de nos agents" },
  { title: "Paiement sécurisé", text: "Mobile Money ou carte bancaire" },
  { title: "Retrait ou dépôt", text: "Au magasin, ou stocké à votre nom" },
];

function change7d(history: ReferencePrice[]): number | null {
  if (history.length < 2) return null;
  const last = history[history.length - 1];
  const cutoff = new Date(last.computedAt).getTime() - 7 * 24 * 60 * 60 * 1000;
  let ref = history[0];
  for (const h of history) {
    if (new Date(h.computedAt).getTime() <= cutoff) ref = h;
    else break;
  }
  if (!ref.value) return null;
  return ((last.value - ref.value) / ref.value) * 100;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; product: Product; history: ReferencePrice[] };

export default function ProductPage(props: PageProps<"/produits/[id]">) {
  const { id } = use(props.params);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillmentChoice] = useState<Fulfillment>("RETRAIT");
  const [added, setAdded] = useState(false);
  const [days, setDays] = useState(30);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [related, setRelated] = useState<Array<{ product: Product; price?: ReferencePrice }> | null>(null);
  const { addItem } = useCart();
  const moneyText = useMoneyText();
  const { has, toggle: toggleWish } = useWishlist();
  const { notify } = useUI();
  const [tab, setTab] = useState<"infos" | "retrait" | "prix">("infos");
  const [recent, setRecent] = useState<Product[]>([]);

  // Produits récemment consultés : mémorisés dans le navigateur du visiteur.
  useEffect(() => {
    if (state.status !== "ready") return;
    try {
      const raw = localStorage.getItem("obp-recent");
      const list: Product[] = raw ? JSON.parse(raw) : [];
      setRecent(list.filter((p) => p.id !== id).slice(0, 4));
      const next = [state.product, ...list.filter((p) => p.id !== id)].slice(0, 8);
      localStorage.setItem("obp-recent", JSON.stringify(next));
    } catch {
      // stockage indisponible : pas d'historique
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "ready" ? state.product.id : null, id]);

  useEffect(() => {
    Promise.all([getProduct(id), getReferencePriceHistory(id, 30)])
      .then(([product, history]) => setState({ status: "ready", product, history }))
      .catch((err: Error) => setState({ status: "error", message: err.message }));
  }, [id]);

  useEffect(() => {
    if (state.status !== "ready") return;
    getReferencePriceHistory(id, days).then((history) => setState((s) => (s.status === "ready" ? { ...s, history } : s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, id]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const categoryId = state.product.categoryId;
    Promise.all([getProducts(), getLatestReferencePrices()]).then(([all, prices]) => {
      const priceById = new Map(prices.map((p) => [p.productId, p]));
      setRelated(
        all
          .filter((p) => p.categoryId === categoryId && p.id !== id)
          .slice(0, 4)
          .map((product) => ({ product, price: priceById.get(product.id) })),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "ready" ? state.product.categoryId : null, id]);

  if (state.status === "loading") {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }
  if (state.status === "error") {
    return <main className="flex flex-1 items-center justify-center p-8 text-sm text-ink-2">{state.message}</main>;
  }

  const { product, history } = state;
  const latest = history.at(-1);
  const outOfStock = product.stockQuantity === 0;
  const photos = parseProductPhotos(product);
  const unitWord = product.unitLabel.split(" ")[0];
  const wished = has(product.id);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text: `${product.name} sur OBP Market`, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Lien copié dans le presse-papiers");
      }
    } catch {
      // partage annulé par le visiteur
    }
  }

  function addToCart() {
    if (!latest) return;
    addItem(product, quantity, fulfillment);
    notify(`${product.name} ajouté au panier`, { label: "Voir le panier", href: "/panier" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const addLabel = outOfStock
    ? "Rupture de stock"
    : added
      ? "Ajouté ✓"
      : latest
        ? `Ajouter au panier · ${moneyText(latest.value * quantity)}`
        : "Indisponible";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 sm:px-6 lg:pb-16">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 overflow-hidden py-5 text-sm text-ink-2">
        <Link href="/boutique" className="hover:text-ink">Boutique</Link>
        <span>/</span>
        <Link href={`/boutique?categorie=${product.categoryId}`} className="hover:text-ink">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="truncate font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Galerie */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <ProductImage product={product} size="hero" photoIndex={photoIndex} />
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${product.name} — photo ${i + 1}`}
                  onClick={() => setPhotoIndex(i)}
                  className={`size-20 flex-none cursor-pointer rounded-xl border-2 object-cover ${i === photoIndex ? "border-brand" : "border-line"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
              {product.category.name}
            </span>
            <span
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                product.isStockable ? "bg-surface-2 text-ink-2" : "bg-accent-soft text-accent"
              }`}
            >
              {product.isStockable ? "Stockable" : "Produit frais"}
            </span>
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
            <div className="flex flex-none gap-2">
              <button
                type="button"
                onClick={() => {
                  const added = toggleWish(product.id);
                  notify(added ? "Ajouté aux favoris" : "Retiré des favoris", added ? { label: "Voir", href: "/favoris" } : undefined);
                }}
                aria-pressed={wished}
                aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={`grid size-10 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2 ${wished ? "text-down" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={share}
                aria-label="Partager ce produit"
                className="grid size-10 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5.5" r="2.5" />
                  <circle cx="6" cy="12" r="2.5" />
                  <circle cx="18" cy="18.5" r="2.5" />
                  <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-ink-2">{product.unitLabel}</p>

          {latest ? (
            <div className="mt-5 border-y border-line py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">
                Prix moyen du marché · le {product.unitLabel}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <p className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
                  <Money value={latest.value} unitClassName="text-lg font-semibold text-ink-2" />
                </p>
                <PriceTrend value={change7d(history)} size="md" />
              </div>
              <p className="mt-2 text-xs text-ink-2">
                {latest.marketsCount} marché{latest.marketsCount > 1 ? "s" : ""} · {latest.readingsCount} relevé
                {latest.readingsCount > 1 ? "s" : ""} · {formatRelativeTime(latest.computedAt)}
              </p>
              <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${outOfStock ? "text-down" : "text-up"}`}>
                <span className={`size-2 rounded-full ${outOfStock ? "bg-down" : "bg-up"}`} />
                {outOfStock
                  ? "Rupture de stock"
                  : `${product.stockQuantity} ${unitWord}${product.stockQuantity > 1 ? "s" : ""} en stock au magasin`}
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-line bg-surface p-4 text-sm text-ink-2">
              Pas encore de prix publié pour ce produit.
            </p>
          )}

          {product.isStockable && !product.isPerishable && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">Mode de réception</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { value: "RETRAIT", title: "Je retire", text: "Au magasin, sous 7 jours." },
                    { value: "DEPOT", title: "Je laisse en dépôt", text: "Stocké à mon nom, revente possible." },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFulfillmentChoice(opt.value)}
                    aria-pressed={fulfillment === opt.value}
                    className={`rounded-xl border-2 p-3 text-left text-sm transition-colors ${
                      fulfillment === opt.value ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-ink-2"
                    }`}
                  >
                    <span className="block font-bold">{opt.title}</span>
                    <span className="text-xs text-ink-2">{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Achat : barre fixe sur mobile, intégrée sur desktop */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface p-3 lg:static lg:z-auto lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="mx-auto flex max-w-6xl items-center gap-3">
              <div className="flex flex-none items-center rounded-xl border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-3 text-lg font-bold"
                  aria-label="Diminuer la quantité"
                >
                  −
                </button>
                <span className="min-w-9 text-center font-mono text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(product.stockQuantity, 1), q + 1))}
                  className="px-3.5 py-3 text-lg font-bold"
                  aria-label="Augmenter la quantité"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={outOfStock || !latest}
                onClick={addToCart}
                className="flex-1 rounded-xl bg-brand py-3.5 text-center text-sm font-bold text-on-brand transition-opacity disabled:opacity-50 sm:text-base"
              >
                {addLabel}
              </button>
            </div>
          </div>

          <ul className="mt-6 grid gap-2.5 rounded-2xl border border-line bg-surface p-4">
            {GUARANTEES.map((g) => (
              <li key={g.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-brand-soft text-brand">
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <p className="text-sm">
                  <span className="font-bold">{g.title}</span>
                  <span className="text-ink-2"> — {g.text}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
          {(
            [
              { v: "infos", l: "Informations" },
              { v: "retrait", l: "Retrait et dépôt" },
              { v: "prix", l: "Comment le prix est fixé" },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              type="button"
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => setTab(t.v)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${tab === t.v ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="p-5 text-sm leading-relaxed text-ink-2 sm:p-6">
          {tab === "infos" && (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                ["Catégorie", product.category.name],
                ["Conditionnement", product.unitLabel],
                ["Nature", product.isPerishable ? "Produit frais (périssable)" : "Produit non périssable"],
                ["Dépôt en stock", product.isStockable ? "Possible : vous pouvez le laisser à votre nom" : "Non proposé pour ce produit"],
                ["Disponibilité", outOfStock ? "Rupture de stock" : `${product.stockQuantity} ${unitWord}${product.stockQuantity > 1 ? "s" : ""} au magasin`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-2.5">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "retrait" && (
            <div className="grid gap-3">
              <p>
                <span className="font-bold text-ink">Je retire :</span> après paiement, vous recevez un bon de retrait à présenter au magasin OBP Market pour récupérer votre produit.
              </p>
              {product.isStockable && !product.isPerishable ? (
                <p>
                  <span className="font-bold text-ink">Je laisse en dépôt :</span> le produit reste stocké à votre nom. Vous le retrouvez dans « Mon stock », où vous pouvez le remettre en vente au prix du marché ou demander une offre de rachat à OBP.
                </p>
              ) : (
                <p>Ce produit n&apos;est pas proposé en dépôt : il est à retirer au magasin.</p>
              )}
            </div>
          )}
          {tab === "prix" && (
            <p>
              Le prix affiché est la moyenne des relevés réalisés par les agents OBP Market sur plusieurs marchés du Bénin. Il est recalculé à chaque nouveau relevé : le montant exact de votre commande est fixé au moment du paiement, au prix du marché du jour.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold">Évolution du prix</h2>
          <div className="flex rounded-full bg-surface-2 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold ${
                  days === p.days ? "bg-surface text-ink shadow-sm" : "text-ink-2"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <PriceChart history={history} />
      </section>

      {related && related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold">Vous aimerez aussi · {product.category.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map(({ product: r, price: rp }) => (
              <ProductCard key={r.id} product={r} price={rp} />
            ))}
          </div>
        </section>
      )}
      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold">Récemment consultés</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {recent.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

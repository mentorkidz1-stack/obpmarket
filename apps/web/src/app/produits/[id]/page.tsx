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
import { formatFCFA, formatRelativeTime } from "@/lib/format";
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

  function addToCart() {
    if (!latest) return;
    addItem(product, quantity, fulfillment);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const addLabel = outOfStock
    ? "Rupture de stock"
    : added
      ? "Ajouté ✓"
      : latest
        ? `Ajouter au panier · ${formatFCFA(latest.value * quantity)} F`
        : "Indisponible";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 sm:px-6 lg:pb-16">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 overflow-hidden py-5 text-sm text-ink-2">
        <Link href="/" className="hover:text-ink">Boutique</Link>
        <span>/</span>
        <Link href={`/?categorie=${product.categoryId}#produits`} className="hover:text-ink">
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

          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-1 text-sm text-ink-2">{product.unitLabel}</p>

          {latest ? (
            <div className="mt-5 border-y border-line py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">
                Prix moyen du marché · le {product.unitLabel}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <p className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
                  {formatFCFA(latest.value)} <small className="text-lg font-semibold text-ink-2">F</small>
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

      <section className="mt-10 rounded-2xl border border-line bg-surface p-4 sm:p-6">
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
    </main>
  );
}

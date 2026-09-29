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
import { PriceChart } from "@/components/price-chart";
import { PriceTrend } from "@/components/price-trend";

const PERIODS = [
  { label: "7 j", days: 7 },
  { label: "30 j", days: 30 },
  { label: "90 j", days: 90 },
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 py-5 text-sm text-ink-2">
        <Link href="/" className="hover:text-ink">Boutique</Link>
        <span>/</span>
        <Link href={`/?categorie=${product.categoryId}`} className="hover:text-ink">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <ProductImage product={product} size="hero" photoIndex={photoIndex} />

      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${product.name} — photo ${i + 1}`}
              onClick={() => setPhotoIndex(i)}
              className={`size-16 flex-none cursor-pointer rounded-xl border-2 object-cover ${i === photoIndex ? "border-brand" : "border-transparent"}`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{product.name}</h1>
          <p className="text-sm text-ink-2">
            {product.unitLabel} · {product.category.name}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            product.isStockable ? "border-brand text-brand" : "border-accent text-accent"
          }`}
        >
          {product.isStockable ? "Stockable" : "Frais"}
        </span>
      </div>

      {latest ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-2">Prix moyen du marché · le {product.unitLabel}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-display text-4xl font-bold tabular-nums">
              {formatFCFA(latest.value)} <small className="text-base font-semibold text-ink-2">F</small>
            </p>
            <PriceTrend value={change7d(history)} size="md" />
          </div>
          <p className="mt-1 text-xs text-ink-2">
            {latest.marketsCount} marché{latest.marketsCount > 1 ? "s" : ""} · {latest.readingsCount} relevé
            {latest.readingsCount > 1 ? "s" : ""} · {formatRelativeTime(latest.computedAt)}
          </p>
          <p className="mt-2 text-xs text-ink-2">
            {product.stockQuantity} {product.unitLabel.split(" ")[0]}
            {product.stockQuantity > 1 ? "s" : ""} en stock au magasin
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm text-ink-2">
          Pas encore de prix publié pour ce produit.
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-2">Évolution du prix</p>
          <div className="flex rounded-full bg-surface-2 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  days === p.days ? "bg-surface text-ink shadow-sm" : "text-ink-2"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <PriceChart history={history} />
      </div>

      {product.isStockable && !product.isPerishable && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFulfillmentChoice("RETRAIT")}
            aria-pressed={fulfillment === "RETRAIT"}
            className={`rounded-xl border p-3 text-left text-sm ${fulfillment === "RETRAIT" ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <span className="block font-semibold">Je retire</span>
            <span className="text-xs text-ink-2">Au magasin, sous 7 jours.</span>
          </button>
          <button
            type="button"
            onClick={() => setFulfillmentChoice("DEPOT")}
            aria-pressed={fulfillment === "DEPOT"}
            className={`rounded-xl border p-3 text-left text-sm ${fulfillment === "DEPOT" ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <span className="block font-semibold">Je laisse en dépôt</span>
            <span className="text-xs text-ink-2">Stocké à mon nom, revente possible.</span>
          </button>
        </div>
      )}

      {related && related.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">
            Autres produits · {product.category.name}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map(({ product: r, price: rp }) => (
              <Link key={r.id} href={`/produits/${r.id}`} className="overflow-hidden rounded-xl border border-line bg-surface">
                <ProductImage product={r} size="card" />
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold">{r.name}</p>
                  {rp ? (
                    <p className="font-display text-sm font-bold tabular-nums">{formatFCFA(rp.value)} F</p>
                  ) : (
                    <p className="text-[11px] text-ink-2">Pas de prix</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface p-4 sm:sticky sm:mt-4 sm:rounded-2xl sm:border">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex items-center rounded-xl border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-lg font-bold"
              aria-label="Diminuer la quantité"
            >
              −
            </button>
            <span className="min-w-10 text-center font-mono text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
              className="px-3 py-2 text-lg font-bold"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={outOfStock || !latest}
            onClick={() => {
              addItem(product, quantity, fulfillment);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            className="flex-1 rounded-xl bg-brand py-3 text-center font-semibold text-on-brand disabled:opacity-50"
          >
            {outOfStock ? "Rupture de stock" : added ? "Ajouté ✓" : latest ? `Ajouter · ${formatFCFA(latest.value * quantity)} F` : "Indisponible"}
          </button>
        </div>
      </div>
    </main>
  );
}

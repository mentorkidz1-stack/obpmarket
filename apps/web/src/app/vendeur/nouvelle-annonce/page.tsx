"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { createVendorListing, getLatestReferencePrices, getProducts, type Product, type ReferencePrice } from "@/lib/api";
import { resizeImageFile } from "@/lib/image";
import { formatFCFA } from "@/lib/format";
import { PageHero } from "@/components/page-hero";

const PRICE_BAND = 0.1; // doit correspondre à VENDOR_PRICE_BAND côté API

export default function NewVendorListingPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [prices, setPrices] = useState<Map<string, ReferencePrice>>(new Map());
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceInput, setPriceInput] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    Promise.all([getProducts(), getLatestReferencePrices()]).then(([p, refs]) => {
      const stockable = p.filter((x) => x.isStockable && !x.isPerishable);
      setProducts(stockable);
      setPrices(new Map(refs.map((r) => [r.productId, r])));
      if (stockable[0]) {
        setProductId(stockable[0].id);
        const ref = refs.find((r) => r.productId === stockable[0].id);
        if (ref) setPriceInput(String(Math.round(ref.value)));
      }
    });
  }, [ready, token, router]);

  const reference = prices.get(productId);
  const product = products?.find((p) => p.id === productId);

  const deviation = useMemo(() => {
    const price = Number(priceInput);
    if (!reference || !price) return null;
    return (price - reference.value) / reference.value;
  }, [priceInput, reference]);
  const outOfBand = deviation != null && Math.abs(deviation) > PRICE_BAND;

  async function addPhotos(files: FileList | null) {
    if (!files || photos.length >= 6) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const room = 6 - photos.length;
      const picked = Array.from(files).slice(0, room);
      const resized = await Promise.all(picked.map((f) => resizeImageFile(f)));
      setPhotos((prev) => [...prev, ...resized]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement de la photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!token) return;
    if (photos.length < 2) {
      setError("Ajoutez au moins 2 photos.");
      return;
    }
    const price = Number(priceInput);
    if (!price || price <= 0) {
      setError("Entrez un prix valide.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createVendorListing(token, { productId, quantity, unitPrice: price, photos });
      router.push("/vendeur");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  if (!products) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
    <PageHero title="Nouvelle annonce" crumb="Vendeur / Nouvelle annonce" subtitle="Au moins 2 photos, jusqu'à 6. La première est la photo principale." />
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
            <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-accent">
                Principale
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label="Retirer la photo"
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < 6 && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2">
            {photoBusy ? "…" : "+"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addPhotos(e.target.files)}
              disabled={photoBusy}
            />
          </label>
        )}
      </div>

      <div className="mt-5 grid gap-1.5">
        <label htmlFor="product" className="text-xs font-semibold text-ink-2">Produit</label>
        <select
          id="product"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            const ref = prices.get(e.target.value);
            if (ref) setPriceInput(String(Math.round(ref.value)));
          }}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.unitLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-line">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 font-bold">−</button>
          <span className="min-w-10 text-center font-mono text-sm">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 font-bold">+</button>
        </div>
        <span className="text-xs text-ink-2">{product?.unitLabel}</span>
      </div>

      <div className="mt-4">
        <label htmlFor="price" className="text-xs font-semibold text-ink-2">Votre prix</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-brand px-3 py-2">
          <input
            id="price"
            inputMode="numeric"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-transparent font-display text-3xl font-bold tabular-nums outline-none"
          />
          <span className="text-sm font-semibold text-ink-2">F / {product?.unitLabel}</span>
        </div>
        {reference ? (
          <p className={`mt-1.5 text-xs ${outOfBand ? "font-semibold text-down" : "text-ink-2"}`}>
            Marché : {formatFCFA(reference.value)} F
            {deviation != null && ` · écart ${deviation >= 0 ? "+" : ""}${(deviation * 100).toFixed(1)} %`}
            {outOfBand && " · hors fourchette, sera signalé au modérateur"}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-ink-2">Pas encore de prix de référence pour ce produit.</p>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <button type="button" disabled={busy} onClick={submit} className="mt-5 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-on-brand disabled:opacity-60">
        {busy ? "Envoi…" : "Envoyer pour validation"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-2">
        Invisible sur le site tant qu&apos;OBP Market n&apos;a pas validé.
      </p>
    </main>
    </>
  );
}

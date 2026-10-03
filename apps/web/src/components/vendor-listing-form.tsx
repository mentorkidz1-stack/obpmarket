"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  createVendorListing,
  getLatestReferencePrices,
  getMyVendorListings,
  getMyVendorProfile,
  getProducts,
  updateVendorListing,
  type Product,
  type ReferencePrice,
  type VendorListingRecord,
} from "@/lib/api";
import { resizeImageFile } from "@/lib/image";
import { formatFCFA } from "@/lib/format";
import { PageHero } from "@/components/page-hero";

const PRICE_BAND = 0.1; // doit correspondre à VENDOR_PRICE_BAND côté API
const MAX_PHOTOS = 6;

/** Formulaire d'annonce vendeur : création, ou correction d'une annonce existante (en attente ou à corriger). */
export function VendorListingForm({ listingId }: { listingId?: string }) {
  const router = useRouter();
  const { token, ready } = useAuth();
  const editing = !!listingId;

  const [products, setProducts] = useState<Product[] | null>(null);
  const [prices, setPrices] = useState<Map<string, ReferencePrice>>(new Map());
  const [listing, setListing] = useState<VendorListingRecord | null>(null);
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
      router.replace(`/connexion?next=${encodeURIComponent(editing ? "/vendeur" : "/vendeur/nouvelle-annonce")}`);
      return;
    }
    Promise.all([getMyVendorProfile(token), getProducts(), getLatestReferencePrices(), editing ? getMyVendorListings(token) : Promise.resolve([])]).then(
      ([profile, all, refs, mine]) => {
        if (!profile || profile.status !== "ACTIF") {
          router.replace("/vendeur");
          return;
        }
        const stockable = all.filter((x) => x.isStockable && !x.isPerishable);
        setProducts(stockable);
        setPrices(new Map(refs.map((r) => [r.productId, r])));

        if (editing) {
          const current = mine.find((l) => l.id === listingId);
          if (!current || (current.status !== "A_CORRIGER" && current.status !== "EN_ATTENTE")) {
            router.replace("/vendeur");
            return;
          }
          setListing(current);
          setProductId(current.productId);
          setQuantity(current.quantity);
          setPriceInput(String(Math.round(current.unitPrice)));
          try {
            setPhotos(JSON.parse(current.photos || "[]"));
          } catch {
            setPhotos([]);
          }
        } else if (stockable[0]) {
          setProductId(stockable[0].id);
          const ref = refs.find((r) => r.productId === stockable[0].id);
          if (ref) setPriceInput(String(Math.round(ref.value)));
        }
      },
    );
  }, [ready, token, router, editing, listingId]);

  const reference = prices.get(productId);
  const product = products?.find((p) => p.id === productId) ?? listing?.product;

  const deviation = useMemo(() => {
    const price = Number(priceInput);
    if (!reference || !price) return null;
    return (price - reference.value) / reference.value;
  }, [priceInput, reference]);
  const outOfBand = deviation != null && Math.abs(deviation) > PRICE_BAND;

  async function addPhotos(files: FileList | null) {
    if (!files || photos.length >= MAX_PHOTOS) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const picked = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
      const resized = await Promise.all(picked.map((f) => resizeImageFile(f)));
      setPhotos((prev) => [...prev, ...resized]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement de la photo.");
    } finally {
      setPhotoBusy(false);
    }
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
      if (editing && listingId) await updateVendorListing(token, listingId, { quantity, unitPrice: price, photos });
      else await createVendorListing(token, { productId, quantity, unitPrice: price, photos });
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
      <PageHero
        title={editing ? "Corriger mon annonce" : "Nouvelle annonce"}
        crumb={editing ? "Vendeur / Corriger l'annonce" : "Vendeur / Nouvelle annonce"}
        subtitle="Au moins 2 photos, jusqu'à 6. La première est la photo principale."
      />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        {editing && listing?.status === "A_CORRIGER" && listing.rejectionReason && (
          <p className="mb-5 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
            <span className="font-bold">OBP Market vous demande de corriger : </span>
            {listing.rejectionReason}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
              {/* Aperçu local (data URI) : l'optimiseur d'images n'a pas lieu d'intervenir. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-accent">Principale</span>
              )}
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Retirer la photo"
                className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2">
              {photoBusy ? "…" : "+"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} disabled={photoBusy} />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-2">{photos.length}/{MAX_PHOTOS} photos · {photos.length < 2 ? "il en faut au moins 2" : "c'est bon"}</p>

        <div className="mt-5 grid gap-1.5">
          <label htmlFor="product" className="text-xs font-semibold text-ink-2">Produit</label>
          <select
            id="product"
            value={productId}
            disabled={editing}
            onChange={(e) => {
              setProductId(e.target.value);
              const ref = prices.get(e.target.value);
              if (ref) setPriceInput(String(Math.round(ref.value)));
            }}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-70"
          >
            {editing && listing && !products.some((p) => p.id === listing.productId) && (
              <option value={listing.productId}>{listing.product.name} · {listing.product.unitLabel}</option>
            )}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.unitLabel}
              </option>
            ))}
          </select>
          {!editing && (
            <p className="text-xs text-ink-2">
              Votre produit n&apos;est pas dans la liste ?{" "}
              <Link href="/contact" className="font-semibold text-brand underline">
                Écrivez-nous
              </Link>
              , nous l&apos;ajouterons au catalogue.
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 font-bold" aria-label="Diminuer la quantité">−</button>
            <span className="min-w-10 text-center font-mono text-sm">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 font-bold" aria-label="Augmenter la quantité">+</button>
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
              Prix du marché : {formatFCFA(reference.value)} F
              {deviation != null && ` · écart ${deviation >= 0 ? "+" : ""}${(deviation * 100).toFixed(1)} %`}
              {outOfBand && ` · en dehors de ±${PRICE_BAND * 100} % du marché, l'annonce sera examinée de plus près`}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-2">Pas encore de prix de référence pour ce produit.</p>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

        <button type="button" disabled={busy} onClick={submit} className="mt-5 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand disabled:opacity-60">
          {busy ? "Envoi…" : editing ? "Renvoyer pour validation" : "Envoyer pour validation"}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-2">Invisible sur le site tant qu&apos;OBP Market n&apos;a pas validé.</p>
      </main>
    </>
  );
}

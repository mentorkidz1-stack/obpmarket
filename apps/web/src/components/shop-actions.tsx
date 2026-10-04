"use client";

import { useEffect, useState } from "react";
import { Photo } from "@/components/photo";
import { Money } from "@/components/money";
import { useCart } from "@/components/cart-provider";
import { useUI } from "@/components/ui-provider";
import { recordShopEvent, type Product, type ShopListing } from "@/lib/api";
import { SITE } from "@/lib/site";

export const shopUrl = (slug: string) => `${SITE.url}/boutique-de/${slug}`;

/** Compte une visite par session de navigation (pas de donnée personnelle, juste un compteur). */
export function ShopTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `obp-shop-seen-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // stockage indisponible : on compte quand même
    }
    void recordShopEvent(slug, "VUE");
  }, [slug]);
  return null;
}

const iconCls = "size-4.5";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a14 14 0 0 1-5.3-3.3c-1.5-1.4-2.3-2.9-2.5-3.4-.2-.5-.4-1.2.4-2 .3-.3.6-.4.8-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6-.3.4c-.1.2-.2.3 0 .6.5.9 1.2 1.6 2 2.2.8.6 1.6.9 1.9 1 .3.1.5.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.4.1.2.1.8-.1 1.4z" />
    </svg>
  );
}

/** Partage de la vitrine (ou d'une annonce) : WhatsApp en premier, partage natif ou copie du lien ensuite. */
export function ShopShare({ slug, name, text, className = "" }: { slug: string; name: string; text?: string; className?: string }) {
  const { notify } = useUI();
  const url = shopUrl(slug);
  const message = text ?? `Découvrez ma boutique « ${name} » sur ${SITE.name} : produits au prix du marché.`;

  function count() {
    void recordShopEvent(slug, "PARTAGE");
  }

  async function other() {
    count();
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: message, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Lien de la boutique copié");
    } catch {
      // partage annulé
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={count}
        className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95"
      >
        <WhatsAppIcon />
        Partager sur WhatsApp
      </a>
      <button type="button" onClick={other} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2">
        Copier ou partager le lien
      </button>
    </div>
  );
}

/** Bouton « Poser une question sur WhatsApp » vers le numéro choisi par le vendeur. */
export function ShopContact({ slug, whatsapp, name }: { slug: string; whatsapp: string; name: string }) {
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je vous écris depuis votre boutique « ${name} » sur ${SITE.name}.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void recordShopEvent(slug, "CONTACT")}
      className="flex items-center gap-2 rounded-xl border border-[#25D366] px-4 py-2.5 text-sm font-bold text-[#128C7E] hover:bg-[#25D366]/10"
    >
      <WhatsAppIcon />
      Poser une question
    </a>
  );
}

/** Annonce d'un vendeur : photo, disponibilité, prix du jour, ajout au panier (son stock est servi en premier). */
export function ShopListingCard({ listing, product, slug, shopName }: { listing: ShopListing; product: Product | undefined; slug: string; shopName: string }) {
  const { addItem } = useCart();
  const { notify } = useUI();
  const [qty, setQty] = useState(1);

  function add() {
    if (!product) return;
    addItem(product, qty, "RETRAIT", { vendorListingId: listing.id, maxQuantity: listing.available });
    notify(`${qty} × ${listing.productName} ajouté au panier`, { label: "Voir le panier", href: "/panier" });
  }

  const shareText = `${listing.productName} chez « ${shopName} » : ${Math.round(listing.price).toLocaleString("fr-FR")} F / ${listing.unitLabel}, disponible sur ${SITE.name}.`;

  return (
    <article id={`a-${listing.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        {listing.photo ? (
          <Photo src={listing.photo} alt={`${listing.productName} — ${shopName}`} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-4xl" aria-hidden>
            🧺
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold shadow">{listing.category}</span>
      </div>
      <div className="grid flex-1 gap-2 p-4">
        <div>
          <h3 className="font-display text-base font-extrabold">{listing.productName}</h3>
          <p className="text-xs text-ink-2">
            {listing.available} {listing.unitLabel} disponible{listing.available > 1 ? "s" : ""}
            {listing.depot ? ` · ${listing.depot}` : ""}
          </p>
        </div>
        <p className="font-display text-xl font-extrabold tabular-nums">
          <Money value={listing.price} unitClassName="text-xs text-ink-2" /> <span className="text-xs font-semibold text-ink-2">/ {listing.unitLabel}</span>
        </p>
        <div className="mt-auto flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line">
            <button type="button" aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-base font-bold">
              −
            </button>
            <span className="min-w-7 text-center font-mono text-sm font-semibold">{qty}</span>
            <button type="button" aria-label="Augmenter la quantité" onClick={() => setQty((q) => Math.min(listing.available, q + 1))} className="px-3 py-2 text-base font-bold">
              +
            </button>
          </div>
          <button type="button" onClick={add} disabled={!product} className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
            Ajouter au panier
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shopUrl(slug)}#a-${listing.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void recordShopEvent(slug, "PARTAGE")}
            aria-label={`Partager ${listing.productName} sur WhatsApp`}
            className="grid size-10 flex-none place-items-center rounded-xl border border-line text-[#128C7E] hover:bg-[#25D366]/10"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>
    </article>
  );
}

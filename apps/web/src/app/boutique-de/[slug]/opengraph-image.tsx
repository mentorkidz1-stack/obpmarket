import { ImageResponse } from "next/og";
import { getShop } from "@/lib/api";

export const alt = "Boutique vendeur sur OBP Market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image d'aperçu affichée quand une boutique est partagée sur WhatsApp, Facebook ou LinkedIn. */
export default async function ShopOpengraphImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const shop = await getShop(slug).catch(() => null);
  const name = shop?.name ?? "Boutique vendeur";
  const lines = shop ? `${shop.listings.length} produit${shop.listings.length > 1 ? "s" : ""} en vente · ${shop.zone}` : "OBP Market";
  const initial = name.trim().charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#2b3fae 0%,#1b2670 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 800 }}>
          <div style={{ display: "flex", width: 84, height: 64, borderRadius: 16, background: "#fff", color: "#2b3fae", alignItems: "center", justifyContent: "center", fontSize: 30 }}>OBP</div>
          <div style={{ display: "flex" }}>OBP Market · Boutique vendeur</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", width: 200, height: 200, borderRadius: 100, background: "#f97316", alignItems: "center", justifyContent: "center", fontSize: 110, fontWeight: 800 }}>{initial}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 800 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 34, opacity: 0.88 }}>{lines}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>Produits au prix du marché · paiement sécurisé · retrait ou livraison</div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "OBP Market — produits du marché et immobilier au Bénin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image affichée quand le site est partagé (WhatsApp, Facebook, LinkedIn…). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#2b3fae 0%,#1b2670 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#ffffff" />
            <rect x="11" y="26" width="7" height="12" rx="2" fill="#2b3fae" />
            <rect x="20.5" y="19" width="7" height="19" rx="2" fill="#2b3fae" />
            <rect x="30" y="12" width="7" height="26" rx="2" fill="#2b3fae" />
            <path d="M14.5 8.5v8M10.5 12.5h8" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>OBP Market</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Le juste prix, du marché à l&apos;immobilier.</div>
          <div style={{ fontSize: 34, opacity: 0.85 }}>Produits au prix du marché · Parcelles · Maisons · Chambres — Bénin</div>
        </div>
      </div>
    ),
    size,
  );
}

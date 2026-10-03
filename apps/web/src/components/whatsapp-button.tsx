"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

/** Bouton WhatsApp flottant : un message pré-rempli vers OBP, adapté à la page consultée. */
export function WhatsAppButton() {
  const pathname = usePathname();
  if (!SITE.whatsapp) return null;
  if (pathname.startsWith("/backoffice") || pathname.startsWith("/agent") || pathname.startsWith("/connexion-interne")) return null;

  const about = pathname.startsWith("/immobilier/") ? "un bien immobilier" : pathname.startsWith("/produits/") ? "un produit" : "OBP Market";
  const text = `Bonjour OBP Market, je vous écris au sujet de ${about} : ${SITE.url}${pathname}`;

  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-6px_rgba(37,211,102,0.65)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="currentColor" aria-hidden>
        <path d="M16.04 3C9.4 3 4 8.38 4 15.02c0 2.12.55 4.19 1.6 6.01L4 29l8.15-1.57a12.03 12.03 0 0 0 3.89.64h.01C22.7 28.07 28 22.7 28 16.06 28 9.4 22.68 3 16.04 3zm0 22.04h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-3.78.73.77-3.68-.24-.38a9.97 9.97 0 0 1-1.53-5.3c0-5.52 4.5-10.02 10.04-10.02 5.52 0 10 4.5 10 10.04 0 5.53-4.5 10.03-10 10.03zm5.5-7.5c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.64-.93-2.25-.25-.58-.5-.5-.68-.5l-.58-.01c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.5.7.3 1.26.48 1.7.62.72.22 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z" />
      </svg>
    </a>
  );
}

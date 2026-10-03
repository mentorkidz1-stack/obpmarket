"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

/** Partage natif sur mobile (WhatsApp, SMS…), lien copié sur ordinateur. */
export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — ${SITE.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // partage annulé par le visiteur
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5.5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="18.5" r="2.5" />
        <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
      </svg>
      {copied ? "Lien copié ✓" : "Partager"}
    </button>
  );
}

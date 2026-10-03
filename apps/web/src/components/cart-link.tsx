"use client";

import { useCart } from "./cart-provider";
import { useUI } from "./ui-provider";

/** Icône du panier : ouvre le panier latéral. */
export function CartLink() {
  const { count } = useCart();
  const { setCartOpen } = useUI();

  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`}
      className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.1L19.5 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.2" />
        <circle cx="16.5" cy="19.5" r="1.2" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold leading-5 text-on-accent">
          {count}
        </span>
      )}
    </button>
  );
}

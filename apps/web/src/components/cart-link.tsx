"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/panier"
      className="relative flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.1L19.5 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.2" />
        <circle cx="16.5" cy="19.5" r="1.2" />
      </svg>
      <span className="hidden sm:inline">Panier</span>
      {count > 0 && (
        <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-on-accent">{count}</span>
      )}
    </Link>
  );
}

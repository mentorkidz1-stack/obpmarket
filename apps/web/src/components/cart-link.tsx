"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link href="/panier" className="relative rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold">
      Panier
      {count > 0 && (
        <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-on-accent">
          {count}
        </span>
      )}
    </Link>
  );
}

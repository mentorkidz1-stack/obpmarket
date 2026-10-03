"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/lib/api";

export type Fulfillment = "RETRAIT" | "DEPOT";

export interface CartLine {
  product: Product;
  quantity: number;
  fulfillment: Fulfillment;
}

interface CartState {
  lines: CartLine[];
  ready: boolean;
  addItem: (product: Product, quantity?: number, fulfillment?: Fulfillment) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setFulfillment: (productId: string, fulfillment: Fulfillment) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "obp-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation depuis localStorage, absent côté serveur
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // panier vide si le stockage est indisponible ou corrompu
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // rien à faire si le stockage est indisponible
    }
  }, [lines, ready]);

  function addItem(product: Product, quantity = 1, fulfillment: Fulfillment = "RETRAIT") {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      const max = product.stockQuantity;
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: Math.min(l.quantity + quantity, max), fulfillment }
            : l,
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, max), fulfillment }];
    });
  }

  function setFulfillment(productId: string, fulfillment: Fulfillment) {
    setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, fulfillment } : l)));
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.product.stockQuantity)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function clear() {
    setLines([]);
  }

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, ready, addItem, setQuantity, setFulfillment, removeItem, clear, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>.");
  return ctx;
}

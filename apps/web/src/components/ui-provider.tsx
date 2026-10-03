"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; href: string };
}

interface UIState {
  cartOpen: boolean;
  navOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setNavOpen: (open: boolean) => void;
  notify: (message: string, action?: Toast["action"]) => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((message: string, action?: Toast["action"]) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-2), { id, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  // Pas de défilement de la page derrière un panneau ouvert, et Échap le ferme.
  useEffect(() => {
    document.body.style.overflow = cartOpen || navOpen ? "hidden" : "";
    if (!cartOpen && !navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, navOpen]);

  const value = useMemo(() => ({ cartOpen, navOpen, setCartOpen, setNavOpen, notify }), [cartOpen, navOpen, notify]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-app shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]"
          >
            <svg viewBox="0 0 24 24" className="size-4.5 flex-none text-up" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <Link href={t.action.href} className="flex-none underline underline-offset-2">
                {t.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI doit être utilisé dans <UIProvider>.");
  return ctx;
}

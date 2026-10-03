"use client";

import { useEffect, useState } from "react";

/** Écran d'attente : après quelques secondes, explique que le serveur se réveille (hébergement gratuit). */
export function PageLoading({ label = "Chargement…" }: { label?: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center" aria-busy="true">
      <span className="size-9 animate-spin rounded-full border-[3px] border-line border-t-brand" />
      <p className="text-sm text-ink-2">{label}</p>
      {slow && <p className="max-w-xs text-xs text-ink-2">Le serveur se réveille, cela peut prendre quelques secondes…</p>}
    </main>
  );
}

/** Échec de chargement : message clair et bouton pour réessayer. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-down/10 text-down">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v5M12 17h.01" />
          <path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <div>
        <p className="font-display text-lg font-extrabold">Impossible de charger cette page</p>
        <p className="mt-1 max-w-sm text-sm text-ink-2">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
        Réessayer
      </button>
    </main>
  );
}

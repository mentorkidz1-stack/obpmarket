"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-down/10 text-down">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v5M12 17h.01" />
          <path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h1 className="mt-5 font-display text-2xl font-extrabold">Un souci est survenu</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">La page n&apos;a pas pu se charger. Réessayez dans un instant.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
          Réessayer
        </button>
        <Link href="/" className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-bold hover:bg-surface-2">
          Accueil
        </Link>
      </div>
    </main>
  );
}

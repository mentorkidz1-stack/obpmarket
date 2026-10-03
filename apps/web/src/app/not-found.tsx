import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-8xl font-extrabold leading-none text-brand/15 sm:text-9xl">404</p>
      <h1 className="-mt-4 font-display text-2xl font-extrabold sm:text-3xl">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">Cette page n&apos;existe pas ou a été déplacée. Reprenez depuis la boutique.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
          Retour à l&apos;accueil
        </Link>
        <Link href="/boutique" className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-bold hover:bg-surface-2">
          Voir la boutique
        </Link>
      </div>
    </main>
  );
}

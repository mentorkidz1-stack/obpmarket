import Link from "next/link";

/** Bandeau de titre des pages internes : fil d'Ariane + titre, comme les pages intérieures de Motta. */
export function PageHero({
  title,
  crumb,
  subtitle,
  children,
}: {
  title: string;
  crumb: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-brand-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-9">
        <div>
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
            <Link href="/" className="hover:text-ink">Accueil</Link>
            <span>/</span>
            <span className="text-ink">{crumb}</span>
          </nav>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-xl text-sm text-ink-2">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

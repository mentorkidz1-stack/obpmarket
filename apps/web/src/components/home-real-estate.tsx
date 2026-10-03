"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import type { Property, PropertyKind } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/property";

/** Section « Immobilier » de l'accueil : mise en avant au même niveau que la boutique. */
export function HomeRealEstate({ properties }: { properties: Property[] }) {
  const [kind, setKind] = useState<PropertyKind | "ALL">("ALL");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of properties) map.set(p.type, (map.get(p.type) ?? 0) + 1);
    return map;
  }, [properties]);

  const shown = useMemo(
    () =>
      properties
        .filter((p) => kind === "ALL" || p.kind === kind)
        // Les biens disponibles d'abord, puis la une, puis les plus récents (l'API les renvoie déjà dans cet ordre).
        .sort((a, b) => Number(a.status !== "DISPONIBLE") - Number(b.status !== "DISPONIBLE"))
        .slice(0, 6),
    [properties, kind],
  );

  const tab = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-surface-2"}`;

  return (
    <section id="immobilier" className="mt-10 scroll-mt-28 rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Parcelles et immobilier</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Trouvez votre bien avec OBP Market</h2>
          <p className="mt-1.5 max-w-xl text-sm text-ink-2">
            Parcelles, terrains agricoles, maisons, appartements, chambres et guest houses proposés directement par OBP Market, à vendre ou à louer.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
          {(
            [
              { v: "ALL", l: "Tous" },
              { v: "VENTE", l: "À vendre" },
              { v: "LOCATION", l: "À louer" },
            ] as const
          ).map((o) => (
            <button key={o.v} type="button" role="tab" aria-selected={kind === o.v} onClick={() => setKind(o.v)} className={tab(kind === o.v)}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROPERTY_TYPES.filter((t) => counts.has(t.value)).map((t) => (
          <Link
            key={t.value}
            href={`/immobilier?type=${t.value}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-bold hover:border-brand hover:text-brand"
          >
            {t.plural}
            <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] text-brand">{counts.get(t.value)}</span>
          </Link>
        ))}
      </div>

      {shown.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            // Sur mobile (une colonne), on s'arrête à 4 annonces : la liste complète est un clic plus loin.
            <div key={p.id} className={i >= 4 ? "max-sm:hidden" : undefined}>
              <PropertyCard property={p} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-surface-2 p-8 text-center text-sm text-ink-2">
          {properties.length === 0 ? "Nos annonces arrivent bientôt." : "Aucune annonce dans cette catégorie pour le moment."}
        </p>
      )}

      <div className="mt-7 text-center">
        <Link href="/immobilier" className="inline-block rounded-xl border-2 border-ink px-8 py-3 text-sm font-bold hover:bg-ink hover:text-app">
          {properties.length > 0 ? `Voir les ${properties.length} annonces` : "Découvrir l'immobilier"}
        </Link>
      </div>
    </section>
  );
}

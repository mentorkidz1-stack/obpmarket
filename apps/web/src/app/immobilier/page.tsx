import type { Metadata } from "next";
import Link from "next/link";
import { getProperties } from "@/lib/api";
import { PageHero } from "@/components/page-hero";
import { PropertyCatalog } from "@/components/property-catalog";

export const metadata: Metadata = {
  title: "Immobilier",
  description: "Parcelles, terrains, maisons, appartements, chambres et guest houses proposés par OBP Market au Bénin.",
};

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function RealEstatePage(props: PageProps<"/immobilier">) {
  const sp = await props.searchParams;

  let properties;
  try {
    properties = await getProperties();
  } catch {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-ink-2">Les annonces sont momentanément indisponibles. Réessayez dans un instant.</p>
      </main>
    );
  }

  const initial = { kind: first(sp.kind), type: first(sp.type), ville: first(sp.ville) };

  return (
    <>
      <PageHero
        title="Immobilier"
        crumb="Immobilier"
        subtitle="Parcelles, terrains, maisons, chambres et guest houses proposés directement par OBP Market."
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {properties.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-xl font-extrabold">Nos annonces arrivent bientôt</p>
            <p className="mt-2 text-sm text-ink-2">Aucun bien n&apos;est publié pour le moment. Dites-nous ce que vous cherchez, nous vous recontactons.</p>
            <Link href="/contact" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Nous contacter
            </Link>
          </div>
        ) : (
          <PropertyCatalog key={JSON.stringify(initial)} properties={properties} initial={initial} />
        )}
      </main>
    </>
  );
}

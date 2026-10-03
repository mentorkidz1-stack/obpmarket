import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperties, getProperty, parseProductPhotos, type Property } from "@/lib/api";
import { Money } from "@/components/money";
import { PropertyCard } from "@/components/property-card";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyInquiryForm } from "@/components/property-inquiry-form";
import { KIND_LABEL, areaEquivalent, formatArea, rentShort, statusLabel, typeLabel } from "@/lib/property";

async function load(id: string): Promise<Property | null> {
  try {
    return await getProperty(id);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: PageProps<"/immobilier/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const p = await load(id);
  if (!p) return { title: "Bien introuvable" };
  const photo = parseProductPhotos(p)[0];
  const where = [p.district, p.city].filter(Boolean).join(", ");
  return {
    title: p.title,
    description: `${typeLabel(p.type)} ${KIND_LABEL[p.kind].toLowerCase()} à ${where}. ${p.description.slice(0, 120)}`.trim(),
    openGraph: photo && !photo.startsWith("data:") ? { images: [photo] } : undefined,
  };
}

export default async function PropertyPage(props: PageProps<"/immobilier/[id]">) {
  const { id } = await props.params;
  const p = await load(id);
  if (!p) notFound();

  const all = await getProperties().catch(() => [] as Property[]);
  const similar = all.filter((x) => x.id !== p.id && (x.type === p.type || x.city === p.city)).slice(0, 3);

  const photos = parseProductPhotos(p);
  const area = formatArea(p.areaValue, p.areaUnit);
  const eq = areaEquivalent(p);
  const unavailable = p.status !== "DISPONIBLE";

  const facts: [string, string][] = [
    ["Type de bien", typeLabel(p.type)],
    ["Annonce", KIND_LABEL[p.kind]],
    ["Localisation", [p.district, p.city].filter(Boolean).join(", ")],
  ];
  if (area) facts.push(["Superficie", eq ? `${area} (${eq})` : area]);
  if (p.bedrooms != null) facts.push(["Chambres", String(p.bedrooms)]);
  if (p.bathrooms != null) facts.push(["Salles de bain", String(p.bathrooms)]);
  if (p.titleDeed) facts.push(["Documents", p.titleDeed]);
  facts.push(["Disponibilité", statusLabel(p.status, p.kind)]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 overflow-hidden py-5 text-sm text-ink-2">
        <Link href="/immobilier" className="hover:text-ink">Immobilier</Link>
        <span>/</span>
        <Link href={`/immobilier?type=${p.type}`} className="hover:text-ink">{typeLabel(p.type)}</Link>
        <span>/</span>
        <span className="truncate font-semibold text-ink">{p.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <PropertyGallery photos={photos} title={p.title} type={p.type} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold text-white ${p.kind === "VENTE" ? "bg-brand" : "bg-accent"}`}>{KIND_LABEL[p.kind]}</span>
            <span className="rounded-md bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">{typeLabel(p.type)}</span>
            {unavailable && <span className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-app">{statusLabel(p.status, p.kind)}</span>}
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-2">
            <svg viewBox="0 0 24 24" className="size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </svg>
            {[p.district, p.city].filter(Boolean).join(", ")}
          </p>

          <div className="mt-5 border-y border-line py-5">
            <p className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
              <Money value={p.price} unitClassName="text-lg font-semibold text-ink-2" />
              {p.kind === "LOCATION" && <span className="ml-2 text-lg font-semibold text-ink-2">{rentShort(p.rentPeriod)}</span>}
            </p>
            {p.negotiable && <p className="mt-1 text-sm font-semibold text-up">Prix négociable</p>}
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2.5 text-sm">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-right text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>

          {p.description && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-extrabold">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{p.description}</p>
            </section>
          )}

          <p className="mt-8 rounded-2xl bg-brand-soft p-4 text-sm text-ink-2">
            Ce bien est proposé directement par <span className="font-bold text-ink">OBP Market</span>. Une visite est organisée avec notre équipe, qui vous
            communique les documents disponibles.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {unavailable ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="font-display text-lg font-extrabold">Ce bien est {statusLabel(p.status, p.kind).toLowerCase()}</p>
              <p className="mt-1 text-sm text-ink-2">Découvrez nos autres annonces disponibles.</p>
              <Link href="/immobilier" className="mt-4 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
                Voir les annonces
              </Link>
            </div>
          ) : (
            <PropertyInquiryForm propertyId={p.id} title={p.title} />
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-extrabold">Biens similaires</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <PropertyCard key={s.id} property={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

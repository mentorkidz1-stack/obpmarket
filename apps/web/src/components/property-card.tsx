import Link from "next/link";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
import { parseProductPhotos, type Property } from "@/lib/api";
import { KIND_LABEL, areaEquivalent, formatArea, rentShort, statusLabel, typeLabel } from "@/lib/property";

export function PropertyPlaceholder({ type }: { type: Property["type"] }) {
  const land = type === "PARCELLE" || type === "TERRAIN_AGRICOLE";
  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-brand-soft to-surface-2 text-brand/50">
      <svg viewBox="0 0 24 24" className="size-16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {land ? (
          <>
            <path d="M3 18l4.5-9 4 6 3-4 6.5 7z" />
            <path d="M3 21h18" />
          </>
        ) : (
          <>
            <path d="M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5" />
            <path d="M10 20v-5.5h4V20" />
          </>
        )}
      </svg>
    </div>
  );
}

/** Carte d'un bien immobilier (liste, accueil, biens similaires). */
export function PropertyCard({ property: p }: { property: Property }) {
  const photo = parseProductPhotos(p)[0];
  const area = formatArea(p.areaValue, p.areaUnit);
  const eq = areaEquivalent(p);
  const unavailable = p.status !== "DISPONIBLE";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_14px_34px_-18px_rgba(21,23,43,0.4)]">
      <Link href={`/immobilier/${p.id}`} className="relative block aspect-[4/3] overflow-hidden">
        {photo ? (
          <Photo
            src={photo}
            alt={p.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`transition-transform duration-300 group-hover:scale-105 ${unavailable ? "grayscale-[0.5]" : ""}`}
          />
        ) : (
          <PropertyPlaceholder type={p.type} />
        )}
        <span className={`absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-[11px] font-bold text-white ${p.kind === "VENTE" ? "bg-brand" : "bg-accent"}`}>
          {KIND_LABEL[p.kind]}
        </span>
        {unavailable && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-app">{statusLabel(p.status, p.kind)}</span>
        )}
        {p.featured && !unavailable && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-[#15172b]">À la une</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{typeLabel(p.type)}</p>
        <Link href={`/immobilier/${p.id}`}>
          <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug">{p.title}</h3>
        </Link>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-2">
          <svg viewBox="0 0 24 24" className="size-3.5 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.4" />
          </svg>
          <span className="truncate">{[p.district, p.city].filter(Boolean).join(", ")}</span>
        </p>

        {(area || p.bedrooms != null || p.bathrooms != null) && (
          <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-ink-2">
            {area && (
              <span>
                {area}
                {eq && <span className="ml-1 font-normal">({eq})</span>}
              </span>
            )}
            {p.bedrooms != null && p.bedrooms > 0 && <span>{p.bedrooms} ch.</span>}
            {p.bathrooms != null && p.bathrooms > 0 && <span>{p.bathrooms} sdb</span>}
          </p>
        )}

        <div className="mt-auto pt-3">
          <p className="font-display text-xl font-extrabold tabular-nums leading-tight">
            <Money value={p.price} unitClassName="text-xs font-semibold text-ink-2" />
            {p.kind === "LOCATION" && <span className="ml-1 text-xs font-semibold text-ink-2">{rentShort(p.rentPeriod)}</span>}
          </p>
          {p.negotiable && <p className="text-[11px] font-semibold text-up">Prix négociable</p>}
        </div>
      </div>
    </article>
  );
}

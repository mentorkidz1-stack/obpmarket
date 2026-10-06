import Link from "next/link";
import { Photo } from "@/components/photo";
import type { GalleryTile } from "@/lib/home-feed";

/** Mosaïque de photos du catalogue : produits et biens mélangés, chaque image mène à sa fiche. */
export function HomeGallery({ tiles }: { tiles: GalleryTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section id="en-images" className="mt-12 scroll-mt-28" aria-label="Le catalogue en images">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">Le catalogue en images</h2>
          <p className="mt-0.5 text-sm text-ink-2">{tiles.length} photos de nos produits, parcelles, maisons et chambres. Touchez une image pour voir la fiche.</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-brand">
          <Link href="/boutique">La boutique →</Link>
          <Link href="/immobilier">L&apos;immobilier →</Link>
        </div>
      </div>

      <div className="mt-4 grid grid-flow-dense grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {tiles.map((t, i) => {
          // Une grande tuile de temps en temps (sur grand écran) pour casser la régularité de la grille.
          const big = i % 11 === 0;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`group relative block overflow-hidden rounded-2xl bg-surface-2 ${big ? "aspect-square sm:col-span-2 sm:row-span-2" : "aspect-square"}`}
            >
              <Photo
                src={t.src}
                alt={t.alt}
                sizes={big ? "(max-width: 640px) 50vw, 34vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 17vw"}
                quality={60}
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8 text-white">
                <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80">{t.tag}</span>
                <span className="line-clamp-1 block text-xs font-bold">{t.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

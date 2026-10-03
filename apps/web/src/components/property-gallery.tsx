"use client";

import { useState } from "react";
import { PropertyPlaceholder } from "@/components/property-card";
import type { Property } from "@/lib/api";

export function PropertyGallery({ photos, title, type }: { photos: string[]; title: string; type: Property["type"] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line">
        <PropertyPlaceholder type={type} />
      </div>
    );
  }

  const go = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[index]} alt={`${title} — photo ${index + 1}`} onClick={() => setZoom(true)} className="size-full cursor-zoom-in object-cover" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#15172b] shadow">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#15172b] shadow">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2.5 py-1 font-mono text-xs font-bold text-white">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${title} — miniature ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-16 w-24 flex-none cursor-pointer rounded-xl border-2 object-cover ${i === index ? "border-brand" : "border-line"}`}
            />
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4" onClick={() => setZoom(false)} role="dialog" aria-label="Photo en grand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[index]} alt={title} className="max-h-full max-w-full rounded-lg object-contain" />
          <button type="button" onClick={() => setZoom(false)} aria-label="Fermer" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

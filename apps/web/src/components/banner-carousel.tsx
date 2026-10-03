"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/api";
import { Photo } from "@/components/photo";

const ARROW = "grid size-9 place-items-center rounded-full bg-white/90 text-[#15172b] shadow transition-colors hover:bg-white";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6500);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index % banners.length];
  const go = (delta: number) => setIndex((i) => (i + delta + banners.length) % banners.length);

  return (
    <div className="relative min-h-72 overflow-hidden rounded-2xl bg-surface-2 sm:min-h-80 lg:min-h-[400px]">
      <Photo key={banner.id} src={banner.imageUrl} alt={banner.title} sizes="(max-width: 1024px) 100vw, 900px" priority={index === 0} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d20]/85 via-[#0b0d20]/45 to-transparent" />

      <div className="relative flex h-full min-h-72 flex-col justify-center p-6 text-white sm:min-h-80 sm:p-10 lg:min-h-[400px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">À la une</p>
        <p className="mt-3 max-w-md font-display text-3xl font-extrabold leading-[1.08] sm:text-5xl">{banner.title}</p>
        {banner.subtitle && <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">{banner.subtitle}</p>}
        {banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#15172b]"
          >
            Découvrir
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-10">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Bannière ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
          <div className="absolute bottom-3.5 right-4 flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Bannière précédente" className={ARROW}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Bannière suivante" className={ARROW}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/api";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index];

  const Content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <p className="font-display text-xl font-bold text-white sm:text-3xl">{banner.title}</p>
        {banner.subtitle && <p className="mt-1 max-w-md text-sm text-white/90 sm:text-base">{banner.subtitle}</p>}
      </div>
    </>
  );

  return (
    <div className="relative mt-6 aspect-[16/7] w-full overflow-hidden rounded-2xl bg-surface-2 sm:aspect-[21/7]">
      {banner.linkUrl ? (
        <Link href={banner.linkUrl} className="absolute inset-0 block">
          {Content}
        </Link>
      ) : (
        <div className="absolute inset-0">{Content}</div>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Bannière ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

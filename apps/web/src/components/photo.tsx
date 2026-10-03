import Image from "next/image";

/**
 * Image redimensionnée et mise en cache par Next (WebP/AVIF, taille adaptée à l'écran).
 * Le parent doit être `relative` et avoir une taille. Les data URI et les images locales de développement
 * ne passent pas par l'optimiseur.
 */
export function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  quality = 75,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  quality?: 60 | 75;
}) {
  const unoptimized = src.startsWith("data:") || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(src);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
      className={`object-cover ${className}`}
    />
  );
}

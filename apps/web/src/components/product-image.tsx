import { categoryGradient } from "@/lib/format";
import { productIconId } from "@/components/product-icons";
import { parseProductPhotos, type Product } from "@/lib/api";

const SIZE_CLASS = {
  sm: "size-11 rounded-xl",
  md: "size-14 rounded-xl",
  card: "aspect-square w-full rounded-t-2xl",
  hero: "aspect-[4/3] w-full rounded-2xl",
} as const;

export function ProductImage({
  product,
  size = "md",
  className = "",
  photoIndex = 0,
}: {
  product: Pick<Product, "name" | "category" | "photos">;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** Quelle photo afficher quand il y en a plusieurs (galerie) — ignoré au repli illustré. */
  photoIndex?: number;
}) {
  const photos = parseProductPhotos(product);
  const photo = photos[photoIndex] ?? photos[0];

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={product.name}
        className={`flex-none object-cover ${SIZE_CLASS[size]} ${className}`}
      />
    );
  }

  const [from, to] = categoryGradient(product.category.name);
  const iconId = productIconId(product.name, product.category.name);
  const iconSize = size === "sm" ? "46%" : size === "md" ? "42%" : "34%";

  return (
    <div
      className={`relative grid flex-none place-items-center overflow-hidden ${SIZE_CLASS[size]} ${className}`}
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 24%, #fff 0, transparent 45%), radial-gradient(circle at 78% 82%, #000 0, transparent 55%)",
        }}
      />
      <svg
        className="relative text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.28)]"
        style={{ width: iconSize, height: iconSize }}
        fill="none"
        stroke="currentColor"
        strokeWidth={size === "sm" || size === "md" ? 1.6 : 1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <use href={`#${iconId}`} />
      </svg>
    </div>
  );
}

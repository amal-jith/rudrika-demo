import Link from "next/link";
import Media from "./Media";
import { StarIcon } from "./Icons";
import { formatINR, parseImages } from "@/lib/utils";

type P = {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  images: string;
  preorder?: boolean;
  category?: { name: string } | null;
  /** Included wherever the caller fetches variants; absent means "don't know". */
  variants?: { stock: number }[];
  /** Approved reviews, when the caller fetched them. */
  reviews?: { rating: number }[];
};

export default function ProductCard({ product }: { product: P }) {
  const images = parseImages(product.images);
  const off = product.compareAt && product.compareAt > product.price ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const soldOut = !product.preorder && Array.isArray(product.variants) && product.variants.length > 0 && product.variants.every((v) => v.stock <= 0);
  const count = product.reviews?.length ?? 0;
  const avg = count ? product.reviews!.reduce((n, r) => n + r.rating, 0) / count : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative zoom-frame">
        <Media src={images[0]} alt={product.name} ratio="aspect-[4/5]" />
        {off > 0 && !soldOut && <span className="absolute top-3 left-3 z-10 bg-clay text-cream text-xs px-2 py-1 tracking-wide">{off}% off</span>}
        {product.preorder && <span className="absolute top-3 right-3 z-10 bg-ink/85 text-cream text-[10px] uppercase tracking-[0.18em] px-2 py-1">Pre-order</span>}
      </div>
      <div className="pt-3">
        {product.category && <div className="text-[11px] uppercase tracking-widest text-gold-dark">{product.category.name}</div>}
        <div className="font-display text-lg leading-snug group-hover:text-clay transition-colors line-clamp-2">
          {product.name}
          {soldOut && <span className="align-middle ml-2 whitespace-nowrap bg-ink/85 text-cream text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 font-sans">Sold out</span>}
        </div>
        <div className="text-sm mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-medium">{formatINR(product.price)}</span>
          {off > 0 && <span className="text-ink/40 line-through">{formatINR(product.compareAt!)}</span>}
          {count > 0 && <span className="inline-flex items-center gap-1 text-xs text-ink/55"><StarIcon className="w-3.5 h-3.5 text-gold" />{avg.toFixed(1)} ({count})</span>}
        </div>
      </div>
    </Link>
  );
}

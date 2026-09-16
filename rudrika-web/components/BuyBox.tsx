"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./CartContext";
import { formatINR } from "@/lib/utils";
import ProductGallery from "./ProductGallery";

export type Variant = {
  id: string;
  label: string;
  colour: string | null;
  stock: number;
  price: number | null;
};

/**
 * Colour + size picker, gallery, price and buy buttons.
 *
 * Stock lives on the (colour, size) pair, so picking a colour re-filters the
 * sizes: a size that's sold out in rust can still be available in green.
 * Colours with nothing left at all are shown struck through.
 *
 * The price is rendered here rather than on the server page because a size can
 * carry its own price. Previously the heading showed the product's base price
 * for ever while the button showed the real one, so a customer could read
 * Rs. 1,780 at the top and Rs. 1,930 on the button at the same time.
 */
export default function BuyBox({
  product,
  variants,
  images,
  videos,
  colourImages,
  header,
  footer,
  dispatchNote,
  preorder = false,
}: {
  product: { id: string; slug: string; name: string; price: number; compareAt: number | null };
  variants: Variant[];
  images: string[];
  videos: string[];
  colourImages: Record<string, string[]>;
  /** Category, title and rating, rendered above the price. */
  header?: React.ReactNode;
  /** Wishlist, description and accordions, rendered below the buttons. */
  footer?: React.ReactNode;
  /** e.g. "1 to 2 working days" */
  dispatchNote?: string;
  /** Made to order: the piece can be bought before it is in stock. */
  preorder?: boolean;
}) {
  const { add, put } = useCart();
  const router = useRouter();

  const colours = useMemo(
    () => Array.from(new Set(variants.map((v) => v.colour).filter((c): c is string => !!c))),
    [variants]
  );
  const hasColours = colours.length > 0;

  const colourStock = (c: string) =>
    variants.filter((v) => v.colour === c).reduce((n, v) => n + v.stock, 0);

  // Start on the first colour that actually has stock.
  const [colour, setColour] = useState<string | null>(
    hasColours ? colours.find((c) => colourStock(c) > 0) ?? colours[0] : null
  );

  const sizesForColour = useMemo(
    () => (hasColours ? variants.filter((v) => v.colour === colour) : variants),
    [variants, colour, hasColours]
  );

  const inStock = sizesForColour.filter((v) => v.stock > 0);
  const [selected, setSelected] = useState<Variant | null>(
    inStock.length === 1 ? inStock[0] : null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [fitBust, setFitBust] = useState("");
  const [fitHeight, setFitHeight] = useState("");

  // Each colour shows its own photos. A colour with none falls back to the
  // product's general photos so a piece is never left with a blank frame.
  const gallery = (colour && colourImages[colour]?.length ? colourImages[colour] : images) ?? [];

  const price = selected?.price ?? product.price;
  const totalStock = variants.reduce((n, v) => n + v.stock, 0);

  /**
   * True when sizes are priced differently from one another, in which case the
   * heading says "From Rs. x" until a size is chosen rather than quoting a number
   * the customer might not be able to get.
   */
  const priceVaries = useMemo(() => {
    const all = variants.map((v) => v.price ?? product.price);
    return all.length > 1 && new Set(all).size > 1;
  }, [variants, product.price]);

  const lowestPrice = useMemo(
    () => Math.min(product.price, ...variants.map((v) => v.price ?? product.price)),
    [variants, product.price]
  );

  const shownPrice = selected ? price : priceVaries ? lowestPrice : product.price;

  // Only worth showing a strikethrough when it's actually above what's charged.
  const compareAt =
    product.compareAt && product.compareAt > shownPrice ? product.compareAt : null;

  const pickColour = (c: string) => {
    setColour(c);
    // The old size may not exist in this colour, clear it rather than carry a
    // stale selection that would add the wrong variant to the cart.
    const rows = variants.filter((v) => v.colour === c && v.stock > 0);
    setSelected(rows.length === 1 ? rows[0] : null);
    setQty(1);
  };

  const line = (): CartItem | null =>
    selected && {
      productId: product.id,
      variantId: selected.id,
      slug: product.slug,
      name: colour ? `${product.name}, ${colour}` : product.name,
      variantLabel: selected.label,
      image: gallery[0] ?? "",
      price: selected.price ?? product.price,
      qty,
      maxStock: selected.stock,
      fitBust: fitBust.trim() || undefined,
      fitHeight: fitHeight.trim() || undefined,
    };

  const doAdd = () => {
    const item = line();
    if (!item) return;
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Buy Now replaces rather than adds, so Add to Cart followed by Buy Now
  // doesn't order the piece twice.
  const buyNow = () => {
    const item = line();
    if (!item) {
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    put(item);
    router.push("/checkout");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
      <div className="animate-fade-up">
        {/* No `key` here on purpose. It used to be keyed on the colour so the
            gallery reset to the first photo, but that made React discard and
            rebuild the whole thing on every colour change, photos the browser
            already had cached were thrown away and fetched again. The gallery
            now resets itself when its photo list changes. */}
        <ProductGallery images={gallery} videos={videos} name={product.name} />
      </div>

      <div className="animate-fade-up" id="size-picker">
        {header}

        <div className="mt-3 sm:mt-4 text-xl sm:text-2xl">
          {!selected && priceVaries && (
            <span className="text-ink/50 text-base mr-1.5">From</span>
          )}
          <span className="font-medium">{formatINR(shownPrice)}</span>
          {compareAt && (
            <>
              <span className="text-ink/40 line-through text-lg ml-3">{formatINR(compareAt)}</span>
              <span className="text-clay text-sm ml-3">
                {Math.round((1 - shownPrice / compareAt) * 100)}% off
              </span>
            </>
          )}
        </div>
        <div className="text-xs text-ink/50 mt-1 mb-6">
          Inclusive of all taxes{dispatchNote ? `, Dispatched in ${dispatchNote}` : ""}
        </div>

        {totalStock === 0 && (
          <div className="mb-5 border border-clay/40 bg-clay/5 px-4 py-3 text-sm text-clay">
            This piece is currently sold out. Message us on WhatsApp and we&apos;ll let you know
            the moment it&apos;s back.
          </div>
        )}

        {hasColours && (
          <div className="mb-6">
            <div className="label">
              Colour{colour && <span className="text-ink/45 font-normal">, {colour}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => {
                const out = colourStock(c) === 0;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => pickColour(c)}
                    disabled={out}
                    className={`px-4 py-2 border text-sm transition-colors ${
                      colour === c
                        ? "bg-ink text-cream border-ink"
                        : out
                        ? "border-ink/10 text-ink/30 line-through cursor-not-allowed"
                        : "border-ink/30 hover:border-ink"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="label">Select option</div>
        {sizesForColour.length === 0 ? (
          <p className="text-sm text-ink/50">No sizes listed for this colour.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sizesForColour.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={() => { setSelected(v); setQty(1); }}
                className={`px-4 py-2 border text-sm ${
                  selected?.id === v.id
                    ? "bg-ink text-cream border-ink"
                    : v.stock === 0
                    ? "border-ink/10 text-ink/30 line-through cursor-not-allowed"
                    : "border-ink/30 hover:border-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {selected && selected.stock <= 5 && selected.stock > 0 && (
          <p className="text-xs text-clay mt-2">
            Only {selected.stock} left in {colour ? `${colour} ` : ""}{selected.label}
          </p>
        )}


        <div className="flex items-center gap-3 sm:gap-4 mt-6">
          <div className="flex items-center border border-ink/30 shrink-0">
            <button type="button" aria-label="Decrease quantity" className="px-3 py-2.5 hover:bg-sand"
              onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="px-4 text-sm tabular-nums">{qty}</span>
            <button type="button" aria-label="Increase quantity" className="px-3 py-2.5 hover:bg-sand"
              onClick={() => setQty(Math.min(selected?.stock ?? 99, qty + 1))}>+</button>
          </div>
          <button onClick={doAdd} disabled={!selected} className="btn-primary flex-1 min-w-0 truncate">
            {added ? "Added" : selected ? `${preorder ? "Pre-order" : "Add to cart"}, ${formatINR(price * qty)}` : "Select an option"}
          </button>
        </div>

        {/* There is deliberately no floating bar on phones. Both buttons live
            here, in the flow of the page, so nothing can ever end up sitting on
            top of the size chart, the care notes or the reviews.
            The hiding of Buy Now on the smallest screens is gone too, one
            column of buttons reads fine and is one less thing to go wrong. */}
        <button onClick={buyNow} disabled={!selected} className="btn-outline w-full mt-3">
          {preorder ? "Pre-order now" : "Buy now"}
        </button>
        {preorder && <p className="text-xs text-ink/55 mt-3">Made to order. {dispatchNote ?? "Dispatch in 3 to 4 weeks."} Payment is taken now and the piece is woven for you.</p>}

        {footer}
      </div>
    </div>
  );
}

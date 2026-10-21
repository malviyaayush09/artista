"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { defaultMessages, getOccasion } from "@/config/occasions";
import type { Pairing } from "@/lib/pairing";
import { isPurchasable, type Product } from "@/lib/types";
import { useAddToCart } from "@/components/cart/useAddToCart";
import { buttonClasses } from "@/components/ui/Button";
import { formatPaise } from "@/components/ui/Price";
import { Glimpse } from "./Glimpse";
import { PhotoPending } from "./PhotoPending";

type Props = {
  product: Product;
  /** Above-the-fold cards: preload + high fetch priority (LCP on phones). */
  priority?: boolean;
  sizes?: string;
  /** Cake-message limit from store settings. */
  messageMax?: number;
  /** Occasion slug: message ideas and the product link follow it. */
  occasion?: string;
  /** Second-cake suggestion shown in the Glimpse. */
  pairing?: Pairing | null;
};

const dietLabel: Record<string, string> = { eggless: "Eggless", egg: "With egg" };

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Photo-led card. Tapping the photo (or the eye) opens a Glimpse quick view;
 * the photo is still a real link, so it works without JS and with
 * ctrl/cmd-click. Add goes straight to the cart for a single size, otherwise
 * opens the Glimpse to pick one.
 */
export function ProductCard({ product, priority = false, sizes = "(min-width: 1920px) 460px, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 49vw", messageMax = 30, occasion, pairing }: Props) {
  const [open, setOpen] = useState(false);
  const { add } = useAddToCart();
  const href = `/cakes/${product.slug}${occasion ? `?occasion=${occasion}` : ""}`;
  const diet = product.tags.find((t) => t === "eggless" || t === "egg");
  const image = product.images[0];
  const buyable = product.variants.filter((v) => isPurchasable(product, v));
  const priced = product.variants.filter((v) => v.pricePaise > 0);
  const from = priced.length ? Math.min(...priced.map((v) => v.pricePaise)) : 0;
  const messages = getOccasion(occasion)?.messages ?? defaultMessages;
  const cardImage = image ? { src: image.src, width: image.width, height: image.height } : null;

  function onAdd() {
    if (buyable.length === 1) {
      const v = buyable[0];
      add({ productId: product.id, variantId: v.id, slug: product.slug, name: product.name, weightGrams: v.weightGrams, unitPaise: v.pricePaise, cakeMessage: "", giftNote: "", image: cardImage });
    } else setOpen(true);
  }

  return (
    <article className="group flex w-full flex-col text-center">
      <div className="relative">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            setOpen(true);
          }}
          className="relative block aspect-square cursor-zoom-in overflow-hidden bg-paper-soft"
        >
          {image ? (
            <Image
              src={image.src}
              alt=""
              fill
              sizes={sizes}
              preload={priority}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              className="object-cover object-[50%_62%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <PhotoPending slug={product.slug} className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
          )}
          {product.isSoldOut ? (
            <span className="absolute top-2.5 left-2.5 bg-ink px-2.5 py-1 text-[0.75rem] tracking-[0.12em] text-paper uppercase">Sold out</span>
          ) : diet ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 bg-paper/92 px-2 py-1 text-[0.75rem] font-medium tracking-[0.06em] text-ink sm:text-[0.8125rem]">
              <span aria-hidden="true" className={`grid size-3 place-items-center border ${diet === "egg" ? "border-detail" : "border-ink"}`}>
                <span className={`size-1.5 ${diet === "egg" ? "bg-detail" : "bg-ink"}`} />
              </span>
              {dietLabel[diet]}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Quick look: ${product.name}`}
          className="absolute bottom-3 left-1/2 inline-flex size-11 -translate-x-1/2 items-center justify-center rounded-full bg-paper/95 text-ink shadow-[0_6px_18px_-6px_rgb(0_0_0/0.35)] transition-all duration-300 hover:bg-ink hover:text-paper sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          <EyeIcon />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4 sm:pt-5">
        <h3 className="text-[1.25rem] leading-snug sm:text-[1.5rem]">
          <Link href={href} className="inline-flex min-h-11 items-center justify-center hover:underline hover:decoration-accent hover:decoration-1 hover:underline-offset-4">
            {product.name}
            {diet ? <span className="sr-only">, {dietLabel[diet]}</span> : null}
          </Link>
        </h3>
        <div className="mt-auto">
          <p className="text-[1rem] sm:text-[1.0625rem]">
            {from > 0 ? (
              <>
                {priced.length > 1 ? <span className="text-body">From </span> : null}
                <span className="font-medium text-ink tabular-nums">{formatPaise(from)}</span>
              </>
            ) : (
              <span className="text-body">Price on request</span>
            )}
          </p>
          <button
            type="button"
            disabled={!buyable.length}
            onClick={onAdd}
            className={`${buttonClasses("outline", "sm", true)} mt-3 disabled:border-ink/30 disabled:text-body disabled:opacity-100`}
          >
            {product.isSoldOut ? "Sold out" : buyable.length ? "Add" : "Coming soon"}
            <span className="sr-only"> {product.name}</span>
          </button>
        </div>
      </div>

      <Glimpse
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          tags: product.tags,
          isSoldOut: product.isSoldOut,
          isActive: product.isActive,
          variants: product.variants,
          image: image ? { src: image.src, width: image.width, height: image.height, alt: image.alt } : null,
        }}
        open={open}
        onClose={() => setOpen(false)}
        messageMax={messageMax}
        messages={messages}
        occasion={occasion}
        pairing={pairing}
      />
    </article>
  );
}

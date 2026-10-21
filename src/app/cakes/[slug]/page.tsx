import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { env } from "@/lib/env";
import { getProductBySlug, getProducts, getSettings } from "@/lib/catalog";
import { PhotoPending } from "@/components/product/PhotoPending";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const description = `${p.name}, made to order in ${p.variants.map((v) => (v.weightGrams >= 1000 ? `${v.weightGrams / 1000} kg` : `${v.weightGrams} g`)).join(" and ")}. Delivered in ${deliveryAreaLabel}.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/cakes/${p.slug}` },
    openGraph: { title: `${p.name} · ${brand.name}`, description, images: p.images[0] ? [{ url: p.images[0].src, width: p.images[0].width, height: p.images[0].height }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const settings = await getSettings();
  const [main, ...rest] = product.images;
  const isPlaceholder = product.description.startsWith("[PLACEHOLDER");

  // Product JSON-LD. Offers only when a real price is set (never advertise ₹0).
  const priced = product.variants.filter((v) => v.pricePaise > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => (i.src.startsWith("http") ? i.src : `${env.siteUrl}${i.src}`)),
    brand: { "@type": "Brand", name: brand.name },
    ...(isPlaceholder ? {} : { description: product.description }),
    ...(priced.length
      ? {
          offers: priced.map((v) => ({
            "@type": "Offer",
            priceCurrency: "INR",
            price: (v.pricePaise / 100).toFixed(2),
            availability: product.isSoldOut || !v.isAvailable ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            url: `${env.siteUrl}/cakes/${product.slug}`,
          })),
        }
      : {}),
  };

  return (
    <div className="container-x container-wide pt-4 pb-32 md:pb-16 lg:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1.5 text-[0.9375rem] text-body">
          <li>
            <Link href="/" className="inline-flex min-h-11 min-w-11 items-center hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="inline-flex items-center">/</li>
          <li>
            <Link href="/collections" className="inline-flex min-h-11 items-center hover:underline">
              Collections
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-2 grid gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
        <div>
          <div className="relative -mx-3 aspect-[4/5] overflow-hidden bg-paper-soft sm:mx-0">
            {main ? (
              <Image src={main.src} alt={main.alt || product.name} fill preload fetchPriority="high" sizes="(min-width: 1920px) 940px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
            ) : (
              <PhotoPending slug={product.slug} className="absolute inset-0" />
            )}
          </div>
          {rest.length ? (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {rest.map((img) => (
                <li key={img.src} className="relative aspect-square overflow-hidden">
                  <Image src={img.src} alt={img.alt} fill sizes="120px" className="object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="md:pt-4 lg:pt-8">
          <div className="flex flex-wrap gap-1.5">
            {product.tags.filter((t) => t !== "gift-box").map((t) => (
              <Badge key={t} tag={t} label={t === "egg" ? "With egg" : undefined} />
            ))}
          </div>
          <h1 className="mt-4 text-[2.5rem] leading-[1.08] sm:text-[3rem] lg:text-[3.5rem]">{product.name}</h1>
          <ProductPurchase
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              isSoldOut: product.isSoldOut,
              isActive: product.isActive,
              variants: product.variants,
              image: main ? { src: main.src, width: main.width, height: main.height } : null,
            }}
            limits={{ message: settings.cakeMessageMaxChars, giftNote: settings.giftNoteMaxChars }}
          />
          <section className="mt-10 border-t border-line pt-7" aria-labelledby="about-cake">
            <h2 id="about-cake" className="text-[1.5rem]">
              About this cake
            </h2>
            <p className={`mt-3 text-[1.0625rem] ${isPlaceholder ? "text-body italic" : "text-ink"}`}>{product.description}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

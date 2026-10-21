import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { features } from "@/config/features";
import { getOccasion, inSeason, occasions, themeVars } from "@/config/occasions";
import { getProducts, getSettings } from "@/lib/catalog";
import { pairingFor } from "@/lib/pairing";
import { OccasionMotif } from "@/components/occasion/OccasionMotif";
import { OccasionTiles } from "@/components/occasion/OccasionTiles";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return occasions.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const o = getOccasion((await params).slug);
  if (!o) return {};
  return {
    title: `${o.name} cakes`,
    description: `${o.name} cakes from ${brand.name}: ${o.intro} Delivered in ${deliveryAreaLabel}.`,
    alternates: { canonical: `/occasions/${o.slug}` },
  };
}

/**
 * An occasion page wears its own theme: the wrapper overrides the --brand-*
 * colours, so every component inside (cards, buttons, the Glimpse) re-themes
 * itself. Cakes tagged with the occasion lead; the rest follow.
 */
export default async function OccasionPage({ params }: { params: Params }) {
  const o = getOccasion((await params).slug);
  if (!o || !features.occasions) notFound();
  const [all, settings] = await Promise.all([getProducts(), getSettings()]);
  const cakes = all
    .filter((p) => p.kind === "cake")
    .sort(
      (a, b) =>
        Number(b.tags.includes(o.slug)) - Number(a.tags.includes(o.slug)) ||
        Number(b.images.length > 0) - Number(a.images.length > 0) ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        a.sortOrder - b.sortOrder,
    );
  const others = occasions.filter((x) => x.slug !== o.slug && inSeason(x));

  return (
    <div style={themeVars(o)} className="occasion-theme bg-paper">
      <section className="on-ink relative overflow-hidden bg-ink text-paper">
        <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--brand-accent)_30%,transparent),transparent_65%)]" />
        <OccasionMotif motif={o.motif} />
        <div className="container-x relative py-16 text-center sm:py-24 lg:py-28">
          <nav aria-label="Breadcrumb">
            <ol className="flex justify-center gap-1.5 text-[0.9375rem] text-paper/75">
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center hover:text-paper hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="inline-flex items-center">
                /
              </li>
              <li>
                <Link href="/occasions" className="inline-flex min-h-11 items-center hover:text-paper hover:underline">
                  Occasions
                </Link>
              </li>
            </ol>
          </nav>
          <p className="eyebrow mt-4 text-accent">{o.eyebrow}</p>
          <h1 className="mx-auto mt-3 max-w-4xl font-display text-[2.75rem] leading-[1.04] text-paper sm:text-[4rem] lg:text-[5rem]">{o.title}</h1>
          <p className="mx-auto mt-5 max-w-xl font-display text-[1.375rem] text-paper/90 sm:text-[1.625rem]">{o.intro}</p>
          <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] text-paper/80">
            Message ideas:{" "}
            {o.messages.map((m, i) => (
              <span key={m}>
                <span className="font-script text-[1.375rem] text-accent">{m}</span>
                {i < o.messages.length - 1 ? <span aria-hidden="true"> · </span> : null}
              </span>
            ))}
          </p>
          <div className="mt-8">
            <Button href="#cakes" variant="accent" size="lg">
              Choose a cake
            </Button>
          </div>
        </div>
      </section>

      <section id="cakes" aria-labelledby="occasion-cakes" className="container-x container-wide py-14 lg:py-20">
        <h2 id="occasion-cakes" className="text-center text-[2.25rem] sm:text-[2.75rem]">
          Choose your cake
        </h2>
        <p className="mt-2 text-center text-[1.0625rem] text-body">Tap a cake for a quick look, and try your message on it.</p>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-14">
          {cakes.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} messageMax={settings.cakeMessageMaxChars} occasion={o.slug} pairing={pairingFor(p, all)} />
            </li>
          ))}
        </ul>
      </section>

      {others.length ? (
        <section aria-labelledby="more-occasions" className="border-t border-line bg-paper-soft py-14 lg:py-20">
          <div className="container-x">
            <h2 id="more-occasions" className="text-center text-[2rem] sm:text-[2.5rem]">
              More occasions
            </h2>
            <div className="mt-8">
              <OccasionTiles items={others} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { collectionFilters, sortOptions, type SortKey } from "@/config/navigation";
import { getProducts, getSettings } from "@/lib/catalog";
import { pairingFor } from "@/lib/pairing";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { SortSelect } from "@/components/product/SortSelect";

type Search = Promise<{ tag?: string; sort?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { tag } = await searchParams;
  const f = collectionFilters.find((x) => x.tag === tag);
  const title = f?.tag ? `${f.label} cakes` : "All cakes";
  return {
    title,
    description: `${title} from ${brand.name}. Made to order in 500 g and 1 kg, delivered in ${deliveryAreaLabel}.`,
    alternates: { canonical: f?.tag ? `/collections?tag=${f.tag}` : "/collections" },
  };
}

/** Price 0 means "on request": those sort last in price sorts. */
const minPrice = (p: Product) => Math.min(...p.variants.map((v) => (v.pricePaise > 0 ? v.pricePaise : Number.MAX_SAFE_INTEGER)));

function sortProducts(list: Product[], sort: SortKey) {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => minPrice(a) - minPrice(b));
  else if (sort === "price-desc") out.sort((a, b) => (minPrice(b) === Number.MAX_SAFE_INTEGER ? -1 : minPrice(a) === Number.MAX_SAFE_INTEGER ? 1 : minPrice(b) - minPrice(a)));
  else if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
  // Featured: photographed cakes first, so the page opens on real photos.
  else out.sort((a, b) => Number(b.images.length > 0) - Number(a.images.length > 0) || Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  return out;
}

export default async function CollectionsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const all = (await getProducts()).filter((p) => p.kind === "cake");
  const { cakeMessageMaxChars } = await getSettings();
  const active = collectionFilters.find((f) => f.tag === params.tag) ?? collectionFilters[0];
  const sort = (sortOptions.find((s) => s.value === params.sort)?.value ?? "featured") as SortKey;
  const list = sortProducts(active.tag ? all.filter((p) => p.tags.includes(active.tag!)) : all, sort);
  const count = (tag: string | null) => (tag ? all.filter((p) => p.tags.includes(tag)).length : all.length);
  const href = (tag: string | null) => {
    const q = new URLSearchParams();
    if (tag) q.set("tag", tag);
    if (sort !== "featured") q.set("sort", sort);
    const s = q.toString();
    return s ? `/collections?${s}` : "/collections";
  };

  return (
    <>
      <PageHeader crumb="Collections" title={active.tag ? `${active.label} cakes` : "Collections"} intro="Each cake made to order, in 500 g and 1 kg." />

      <div className="container-x container-wide py-5 lg:py-7">
        {/* Filters, count and sort share one row on desktop so the cakes start on the first screen. Plain links: work without JS. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <nav aria-label="Filter cakes">
          <ul className="scroll-row -mx-3 gap-2.5 px-3 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0 lg:justify-start">
            {collectionFilters.map((f) => {
              const on = f.tag === active.tag;
              return (
                <li key={f.label} className="shrink-0">
                  <Link
                    href={href(f.tag)}
                    aria-current={on ? "page" : undefined}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-[0.9375rem] transition-colors sm:text-[1rem] ${
                      on ? "border-ink bg-ink text-paper" : "border-ink/30 bg-paper text-ink hover:border-ink"
                    }`}
                  >
                    {f.label}
                    <span className={`text-[0.9375rem] tabular-nums ${on ? "text-paper/75" : "text-body"}`}>{count(f.tag)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-between gap-5 border-t border-line pt-4 lg:border-0 lg:pt-0">
          <p className="text-[1rem] text-body" role="status">
            {list.length} {list.length === 1 ? "cake" : "cakes"}
          </p>
          <SortSelect value={sort} tag={active.tag} />
        </div>
        </div>
        <h2 className="sr-only">{active.tag ? `${active.label} cakes` : "All cakes"}</h2>
        {list.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-7.5 lg:gap-y-14">
            {list.map((p, i) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} priority={i < 2} messageMax={cakeMessageMaxChars} pairing={pairingFor(p, all)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-center text-body">
            No cakes here yet.{" "}
            <Link href="/collections" className="text-ink underline decoration-accent underline-offset-4">
              See all cakes
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}

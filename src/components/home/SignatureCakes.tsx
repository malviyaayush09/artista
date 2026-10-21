import { getProducts, getSettings } from "@/lib/catalog";
import { pairingFor } from "@/lib/pairing";
import { ProductCard } from "@/components/product/ProductCard";
import { GinkgoMark } from "@/components/brand/GinkgoMark";
import { Button } from "@/components/ui/Button";

/** Photographed cakes lead, then featured ones, so the home grid always opens on real photos. */
export async function SignatureCakes() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const shown = [...products]
    .sort((a, b) => Number(b.images.length > 0) - Number(a.images.length > 0) || Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)
    .slice(0, 8);

  return (
    <section aria-labelledby="cakes-title" className="py-14 lg:py-24">
      <div className="container-x container-wide">
        <header className="mx-auto max-w-2xl text-center">
          <GinkgoMark className="mx-auto size-5 text-accent" />
          <h2 id="cakes-title" className="mt-3 text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem]">
            Our Cakes
          </h2>
          <p className="mt-2 text-[1.0625rem] text-body sm:text-[1.125rem]">Made to order, in 500 g and 1 kg.</p>
        </header>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-4 lg:mt-14 lg:grid-cols-4 lg:gap-x-7.5 lg:gap-y-14">
          {shown.map((p) => (
            <li key={p.slug} className="flex">
              <ProductCard product={p} messageMax={settings.cakeMessageMaxChars} pairing={pairingFor(p, products)} />
            </li>
          ))}
        </ul>
        <div className="mt-14 text-center">
          <Button href="/collections" variant="primary" size="lg">
            View all {products.length} cakes
          </Button>
        </div>
      </div>
    </section>
  );
}

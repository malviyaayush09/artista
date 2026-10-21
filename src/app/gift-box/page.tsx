import type { Metadata } from "next";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { getProducts, getSettings } from "@/lib/catalog";
import { Artwork } from "@/components/brand/Artwork";
import { GinkgoMark } from "@/components/brand/GinkgoMark";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gift Box",
  description: `Gift boxes and hampers from ${brand.name}, delivered in ${deliveryAreaLabel}.`,
  alternates: { canonical: "/gift-box" },
};

/** Lists products tagged "gift-box" (admin adds them). Until then, points to the gift note on any cake. */
export default async function GiftBoxPage() {
  const gifts = (await getProducts()).filter((p) => p.tags.includes("gift-box"));
  const { cakeMessageMaxChars } = await getSettings();

  return (
    <>
      <PageHeader crumb="Gift Box" title="The Gift Box" intro="What was made with intention is meant to be shared." />
      <div className="container-x container-wide py-8 lg:py-12">
        {gifts.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {gifts.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} messageMax={cakeMessageMaxChars} />
              </li>
            ))}
          </ul>
        ) : (
          <section className="grid items-center gap-8 border border-line bg-paper-soft p-5 sm:p-8 md:grid-cols-[1fr_18rem]">
            <div>
              <GinkgoMark className="size-5 text-accent" />
              <h2 className="mt-3 text-[1.875rem] leading-tight">Gift boxes and hampers are on their way.</h2>
              <p className="mt-3 max-w-lg text-body">
                In the meantime, any cake can be a gift: add a gift note card when you choose your cake, and we&apos;ll include it with your order.
              </p>
              <div className="mt-5">
                <Button href="/collections">Choose a cake</Button>
              </div>
            </div>
            <Artwork label="Photo · The signature gift box" shape="rect" className="aspect-square w-full" />
          </section>
        )}
      </div>
    </>
  );
}

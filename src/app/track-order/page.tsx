import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { features } from "@/config/features";
import { currentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrackOrderForm } from "@/components/account/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Order",
  description: `How ${brand.name} delivers your order in ${deliveryAreaLabel}, and who may contact you about it.`,
  alternates: { canonical: "/track-order" },
};
export const dynamic = "force-dynamic";

/**
 * Delivery note (same wording as the sister brand's page, minus its "on time"
 * promise: the brief rules out delivery-time promises). The guest lookup form
 * shows only when features.trackOrderLookup is on.
 */
export default async function TrackOrderPage() {
  if (!features.trackOrderPage) notFound();
  const user = await currentUser();
  return (
    <>
      <PageHeader crumb="Track Order" title="Track Order" />
      <div className="container-x max-w-3xl py-10 text-center lg:py-14">
        <p className="text-[1.0625rem] leading-relaxed text-body sm:text-[1.125rem]">
          We use both our own team and delivery partners to get your order to you. They may contact you in different ways, so you might get calls or messages from numbers you
          don&apos;t recognize. Don&apos;t worry, your order is on the way.
        </p>
        <p className="mt-6 text-[1rem] text-body">
          Your confirmation email has a link to your order page.{" "}
          {user ? (
            <Link href="/account" className="text-ink underline decoration-accent underline-offset-4">
              See all your orders
            </Link>
          ) : (
            <Link href="/login?next=/account" className="text-ink underline decoration-accent underline-offset-4">
              Sign in to see all your orders
            </Link>
          )}
          .
        </p>
        {features.trackOrderLookup ? (
          <div className="mx-auto mt-10 max-w-xl text-left">
            <TrackOrderForm />
          </div>
        ) : null}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { currentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/catalog";
import { getClosedDates } from "@/lib/closed-dates";
import { db } from "@/lib/db";
import { isDbConfigured, isRazorpayConfigured, isWhatsAppConfigured } from "@/lib/env";
import { bookableDates } from "@/lib/slots";
import { dbSupports } from "@/lib/capabilities";
import { CheckoutForm, type SavedAddress } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Guest checkout by default. Signing in is optional and never required before payment. */
export default async function CheckoutPage() {
  const settings = await getSettings();
  const closed = (await getClosedDates()).map((d) => d.date);
  const user = await currentUser();
  let addresses: SavedAddress[] = [];
  if (user) {
    const { data } = await db().from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
    addresses = (data ?? []).map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, landmark: a.landmark, pincode: a.pincode }));
  }

  return (
    <CheckoutForm
      brandName={brand.name}
      brandColor={brand.colors.ink}
      deliveryAreaLabel={deliveryAreaLabel}
      dates={bookableDates(settings.maxDaysAhead)}
      closedDates={closed}
      deliveryFeePaise={settings.deliveryFeePaise}
      minOrderPaise={settings.minOrderPaise}
      holdMinutes={settings.pendingHoldMinutes}
      configured={isDbConfigured()}
      liveCheckout={isRazorpayConfigured()}
      surpriseEnabled={await dbSupports("surprise")}
      whatsappUpdates={isWhatsAppConfigured()}
      user={user ? { name: user.name ?? "", phone: user.phone ?? "", email: user.email ?? "" } : null}
      addresses={addresses}
    />
  );
}

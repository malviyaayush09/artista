import { brand } from "@/config/brand";
import { env } from "@/lib/env";

/**
 * Bakery / LocalBusiness structured data. Only real, configured facts are
 * emitted: no address, phone or opening hours until they're set in brand.ts.
 */
export function BakeryJsonLd() {
  const { phone, email, address, hours } = brand.contact;
  const { legalName } = brand.legal;
  const data = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${env.siteUrl}/#bakery`,
    name: brand.name,
    ...(legalName ? { legalName } : {}),
    slogan: brand.tagline,
    url: env.siteUrl,
    image: `${env.siteUrl}/opengraph-image`,
    areaServed: { "@type": "Place", name: `${brand.delivery.area}, ${brand.delivery.city}` },
    paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking",
    currenciesAccepted: "INR",
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressLocality: brand.delivery.city, addressRegion: "Karnataka", addressCountry: "IN" } } : {}),
    ...(hours ? { openingHours: hours } : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${brand.name}. Luxury cakes delivered in ${deliveryAreaLabel}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { phone, email, whatsapp, address, hours } = brand.contact;
  const { legalName, registeredOffice, gstin, fssaiLicence } = brand.legal;
  const wa = whatsapp.replace(/\D/g, "");

  return (
    <>
      <PageHeader crumb="Contact" title="Get in touch" intro={`Questions about an order or a cake? We deliver in ${deliveryAreaLabel}.`} />
      <div className="container-x grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:py-14">
        {/* Only details we actually have are shown; nothing is left as a placeholder for customers. */}
        {wa ? (
          <Card title="WhatsApp">
            <Button href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
              <WhatsAppIcon className="size-5" /> Chat on WhatsApp
            </Button>
          </Card>
        ) : null}
        {phone ? (
          <Card title="Phone">
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center text-ink underline decoration-accent underline-offset-4">
              {phone}
            </a>
          </Card>
        ) : null}
        {email ? (
          <Card title="Email">
            <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center break-all text-ink underline decoration-accent underline-offset-4">
              {email}
            </a>
          </Card>
        ) : null}
        {address ? (
          <Card title="Kitchen">
            <address className="not-italic">{address}</address>
          </Card>
        ) : null}
        {hours ? (
          <Card title="Hours">
            <p>{hours}</p>
          </Card>
        ) : null}
        <Card title="Delivery area">
          <p>{deliveryAreaLabel} only, for now.</p>
        </Card>
        {legalName ? (
          <Card title="Registered office">
            <p>
              {brand.name} is a brand of {legalName}.
            </p>
            {registeredOffice ? <address className="mt-2 not-italic">{registeredOffice}</address> : null}
            <p className="mt-2 text-[0.9375rem] text-body">
              {gstin ? `GSTIN ${gstin}` : null}
              {gstin && fssaiLicence ? " · " : null}
              {fssaiLicence ? `FSSAI Lic. No. ${fssaiLicence}` : null}
            </p>
          </Card>
        ) : null}
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-paper-soft p-5">
      <h2 className="eyebrow text-body">{title}</h2>
      <div className="mt-3 text-[1rem] text-ink">{children}</div>
    </section>
  );
}

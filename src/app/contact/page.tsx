import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Placeholder } from "@/components/ui/Placeholder";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${brand.name}. Luxury cakes delivered in ${deliveryAreaLabel}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { phone, email, whatsapp, address, hours } = brand.contact;
  const wa = whatsapp.replace(/\D/g, "");

  return (
    <>
      <PageHeader crumb="Contact" title="Get in touch" intro={`Questions about an order or a cake? We deliver in ${deliveryAreaLabel}.`} />
      <div className="container-x grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:py-14">
        <Card title="WhatsApp">
          {wa ? (
            <Button href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
              <WhatsAppIcon className="size-5" /> Chat on WhatsApp
            </Button>
          ) : (
            <Placeholder>WhatsApp number</Placeholder>
          )}
        </Card>
        <Card title="Phone">
          {phone ? (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center text-ink underline decoration-accent underline-offset-4">
              {phone}
            </a>
          ) : (
            <Placeholder>phone number</Placeholder>
          )}
        </Card>
        <Card title="Email">
          {email ? (
            <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center break-all text-ink underline decoration-accent underline-offset-4">
              {email}
            </a>
          ) : (
            <Placeholder>email address</Placeholder>
          )}
        </Card>
        <Card title="Kitchen">{address ? <address className="not-italic">{address}</address> : <Placeholder>address</Placeholder>}</Card>
        <Card title="Hours">{hours ? <p>{hours}</p> : <Placeholder>opening hours</Placeholder>}</Card>
        <Card title="Delivery area">
          <p>{deliveryAreaLabel} only, for now.</p>
        </Card>
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

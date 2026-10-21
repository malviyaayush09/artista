import type { Metadata } from "next";
import Link from "next/link";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { faqGroups } from "@/content/faqs";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronDownIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "FAQs",
  description: `Answers about ordering, delivery in ${deliveryAreaLabel}, payment and changes at ${brand.name}.`,
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  return (
    <>
      <PageHeader crumb="FAQs" title="Frequently asked questions" intro="Ordering, delivery and payment, answered." />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[14rem_1fr] lg:gap-16 lg:py-14">
        <nav aria-label="FAQ sections" className="hidden lg:block">
          <ul className="sticky top-6 space-y-1 border-l border-line">
            {faqGroups.map((g) => (
              <li key={g.title}>
                <a href={`#${slug(g.title)}`} className="flex min-h-11 items-center pl-4 text-[0.9375rem] text-ink hover:text-body">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          {faqGroups.map((g) => (
            <section key={g.title} aria-labelledby={slug(g.title)}>
              <h2 id={slug(g.title)} className="text-[1.75rem]">
                {g.title}
              </h2>
              {/* Native <details>: accessible, works without JavaScript */}
              <div className="mt-4 divide-y divide-line border-y border-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[1rem] font-medium text-ink [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDownIcon className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-5 text-[0.9375rem] text-body">
                      <p>{f.a}</p>
                      {f.legalReview ? <p className="mt-2 text-[0.9375rem] font-medium text-detail">[LEGAL REVIEW NEEDED]</p> : null}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <p className="text-[0.9375rem] text-body">
            Still have a question?{" "}
            <Link href="/contact" className="text-ink underline decoration-accent underline-offset-4">
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

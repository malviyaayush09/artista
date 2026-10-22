import Link from "next/link";
import type { ReactNode } from "react";

type Props = { title: string; eyebrow?: string; intro?: ReactNode; crumb: string };

/** Compact inner-page header (breadcrumb + H1): kept short so the page's content shows on the first screen. */
export function PageHeader({ title, eyebrow, intro, crumb }: Props) {
  return (
    <div className="border-b border-line">
      <div className="container-x py-4 text-center lg:py-7">
        <nav aria-label="Breadcrumb">
          <ol className="flex justify-center gap-1.5 text-[0.9375rem] text-body">
            <li>
              <Link href="/" className="inline-flex min-h-9 min-w-11 items-center hover:text-ink hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="inline-flex items-center">
              /
            </li>
            <li aria-current="page" className="inline-flex items-center">
              {crumb}
            </li>
          </ol>
        </nav>
        {eyebrow ? <p className="eyebrow mt-2 text-body">{eyebrow}</p> : null}
        <h1 className="text-[2.25rem] sm:text-[2.75rem] lg:text-[3.25rem]">{title}</h1>
        {intro ? <div className="mx-auto mt-1.5 max-w-2xl text-[1.0625rem] text-body sm:text-[1.125rem]">{intro}</div> : null}
      </div>
    </div>
  );
}

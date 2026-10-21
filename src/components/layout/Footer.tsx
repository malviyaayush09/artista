import Link from "next/link";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { policyNav, primaryNav } from "@/config/navigation";
import { Logo } from "@/components/brand/Logo";
import { Placeholder } from "@/components/ui/Placeholder";
import { ConsentSettingsLink } from "./ConsentBanner";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-ink bg-ink pb-[max(1.5rem,env(safe-area-inset-bottom))] text-paper">
      <div className="container-x container-wide pt-12 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Logo tone="paper" size="lg" showSubline />
            <p className="mt-3 font-display text-[1.5rem] text-paper/90">{brand.tagline}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-6 sm:flex sm:flex-wrap sm:gap-x-7">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 min-w-11 items-center text-[1rem] text-paper/90 hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-accent/60 pt-6">
          <ul className="flex flex-wrap gap-x-6">
            {policyNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 min-w-11 items-center text-[0.9375rem] text-paper/80 hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentSettingsLink className="inline-flex min-h-11 items-center text-[0.9375rem] text-paper/80 hover:text-accent" />
            </li>
          </ul>
          <div className="mt-4 flex flex-col gap-2 text-[1rem] text-accent sm:flex-row sm:justify-between">
            <p>Now delivering in {deliveryAreaLabel}</p>
            <p>
              FSSAI Lic. No. {brand.legal.fssaiLicence || <Placeholder tone="ink">FSSAI licence number</Placeholder>}
            </p>
            <p>
              © {year} {brand.legal.legalName || brand.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

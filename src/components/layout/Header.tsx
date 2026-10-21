import Link from "next/link";
import { primaryNav } from "@/config/navigation";
import { Logo } from "@/components/brand/Logo";
import { CartCount } from "@/components/cart/CartCount";
import { BagIcon, UserIcon } from "@/components/ui/Icons";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

/** Boutique header: centred wordmark, icons right, the menu on its own row on desktop. Scrolls away with the page (Belagio-style) so the cakes get the whole screen. */
export function Header() {
  return (
    <header className="relative z-40 border-b border-line bg-paper">
      <div className="container-x container-wide grid h-20 grid-cols-[1fr_auto_1fr] items-center lg:h-28">
        <div className="flex items-center">
          <MobileMenu />
        </div>

        <span className="lg:hidden">
          <Logo size="sm" />
        </span>
        <span className="hidden lg:block">
          <Logo size="md" />
        </span>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <ThemeToggle />
          <Link href="/account" className="hidden size-11 items-center justify-center text-ink hover:text-detail sm:inline-flex" aria-label="My account">
            <UserIcon />
          </Link>
          <Link href="/cart" className="relative -mr-2 inline-flex size-11 items-center justify-center text-ink hover:text-detail">
            <BagIcon className="size-6" />
            <span className="sr-only">Cart,</span>
            <CartCount />
          </Link>
        </div>
      </div>

      <nav aria-label="Primary" className="hidden border-t border-line/70 lg:block">
        <ul className="container-x container-wide flex items-center justify-center gap-10 xl:gap-14">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-12 items-center text-[0.9375rem] tracking-[0.06em] text-ink underline-offset-[8px] hover:underline hover:decoration-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

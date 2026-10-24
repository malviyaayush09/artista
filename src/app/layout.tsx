import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { brand, deliveryAreaLabel } from "@/config/brand";
import { env } from "@/lib/env";
import { fontVariables } from "@/config/fonts";
import { CartToast } from "@/components/cart/CartToast";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { themeInitScript } from "@/components/layout/ThemeToggle";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: brand.name,
  openGraph: { siteName: brand.name, locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  title: {
    default: `${brand.name} · Luxury cakes delivered in ${deliveryAreaLabel}`,
    template: `%s · ${brand.name}`,
  },
  description: `${brand.tagline} Made-to-order luxury cakes, delivered in ${deliveryAreaLabel}.`,
  // Meta Business domain verification for artistacakes.in (public by design).
  verification: { other: { "facebook-domain-verification": "ltowbgy2ztai20zr0n9i9ha9t75ua8" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: brand.colors.ink,
};

/** Brand colours flow from brand.ts into CSS custom properties consumed by the Tailwind theme. */
const brandVars = {
  "--brand-ink": brand.colors.ink,
  "--brand-accent": brand.colors.accent,
  "--brand-paper": brand.colors.paper,
  "--brand-detail": brand.colors.detail,
  "--brand-body": brand.colors.body,
} as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} style={brandVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppButton />
        <CartToast />
        <ConsentBanner />
      </body>
    </html>
  );
}

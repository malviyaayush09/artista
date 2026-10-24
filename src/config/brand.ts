/**
 * Single source of truth for every brand string, logo and colour.
 * The name and logo WILL change — edit this file only. Nothing else in the
 * codebase may hardcode the brand name, tagline, colours or contact details.
 *
 * Empty strings are deliberate: they render as clearly labelled placeholders
 * (or hide the feature, e.g. WhatsApp) until real values are supplied.
 */

export type BrandColors = {
  /** Dominant dark. Actions, bands, headings on light. (Navy) */
  ink: string;
  /** Accent. Hairlines, CTAs on dark, display text. Never body text on paper. (Gold) */
  accent: string;
  /** Page background. (Cream) */
  paper: string;
  /** Secondary accent. Egg badge, engraving ink. (Bronze) */
  detail: string;
  /** Body copy and meta on paper. (Charcoal) */
  body: string;
};

type Contact = { whatsapp: string; phone: string; email: string; address: string; hours: string };
type Legal = { legalName: string; registeredOffice: string; gstin: string; fssaiLicence: string };

export const brand = {
  name: "Artista Cakes",
  /** Used where space is tight (browser tab suffix, order prefixes). */
  shortName: "Artista",
  tagline: "Crafted with intention. Savored forever.",
  heroLine: "Every cake, a canvas.",
  storyLine: "From sketch to centrepiece.",
  belief: "Born from the belief that a cake can be a work of art.",

  logo: {
    /** Script wordmark (Allura) and small-caps subline, used until a logo file exists. */
    wordmark: "Artista",
    subline: "Cakes",
    /** Set to e.g. { src: "/brand/logo.svg", width: 180, height: 48 } to switch to an image logo. */
    image: null as null | { src: string; width: number; height: number },
  },

  colors: {
    ink: "#0E1A33",
    accent: "#B29959",
    paper: "#EBDFD1",
    detail: "#A68455",
    body: "#4B4B4B",
  } satisfies BrandColors,

  /** Sister brand (same owner). Shown on About. Set to null to remove the section. */
  family: {
    name: "Marseli Café Patisserie",
    shortName: "Marseli",
    founder: "Chef Suresh Kumar M",
    storyUrl: "https://marselicafe.com/story",
  } as null | { name: string; shortName: string; founder: string; storyUrl: string },

  delivery: {
    area: "HSR Layout",
    city: "Bengaluru",
  },

  contact: {
    /** E.164 without "+", e.g. "9198xxxxxxxx". Empty hides the WhatsApp button. */
    whatsapp: "",
    phone: "",
    email: "artistacakes.official@gmail.com",
    /** The FSSAI-licensed premises where the cakes are made (GST additional place of business). */
    address: "No. 1020, 24th Main Road, 1st Sector, HSR Layout, Bengaluru, Karnataka 560102",
    hours: "",
  } as Contact,

  /** From the GST registration certificate (REG-06) and FSSAI licence. Artista Cakes is a brand of this LLP. */
  legal: {
    legalName: "Bread and Bean Studio LLP",
    /** GST principal place of business. */
    registeredOffice: "295, 7th Main, 15th Cross, 6th Sector, HSR Layout, Bengaluru, Karnataka 560102",
    /** Invoices still need a GST rate above 0 in Admin → Settings. */
    gstin: "29ABEFB5803H1ZI",
    fssaiLicence: "11225334000784",
  } as Legal,

  /** Prefix for human-readable order numbers, e.g. ART-001234. Orders placed before the rename keep ALC-. */
  orderPrefix: "ART",
} as const;

export const deliveryAreaLabel = `${brand.delivery.area}, ${brand.delivery.city}`;

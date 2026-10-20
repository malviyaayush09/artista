import { brand, deliveryAreaLabel } from "@/config/brand";

/**
 * PLACEHOLDER policy text. Every page is marked [LEGAL REVIEW NEEDED] and
 * must be replaced or approved by a lawyer before launch. Statements describe
 * how the site works today; they make no timing or refund promises.
 */
export type LegalDoc = { slug: string; title: string; summary: string; sections: { heading: string; body: string[] }[] };

const who = brand.legal.legalName || brand.name;

export const legalDocs: Record<string, LegalDoc> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: `How ${who} collects and uses personal data.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          "To fulfil an order we collect your name, mobile number, email address and delivery address, plus the cake details and any message or gift note you add.",
          "If you create an account, we store your phone number or email so you can sign in with a one-time code.",
          "If we send order updates or sign-in codes to your mobile number on WhatsApp, they go through Meta's WhatsApp Business Platform. Tell us if you'd rather not receive them.",
          "If you ask to be notified when we deliver to your area, we store your pincode and the phone or email you give us.",
          "If you send a cake as a surprise, we store the recipient's name and, if you give it, their mobile number, only to deliver that order.",
          "If you ask us to remind you next year, we store the occasion, the date and the name you give, and send one email a week before. Every reminder email has a link to cancel it.",
        ],
      },
      {
        heading: "Payments",
        body: ["Payments are processed by Razorpay. We do not receive or store your card, UPI or bank details."],
      },
      {
        heading: "Analytics",
        body: ["We use cookie-free analytics only if you accept them in the consent banner. You can change your choice at any time from “Analytics settings” in the footer."],
      },
      {
        heading: "How we use it",
        body: ["We use your details to make and deliver your order, to send order updates, and to answer your questions. [PLACEHOLDER: retention period, data-sharing with delivery partners, your rights and how to exercise them, grievance officer contact.]"],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    summary: `Terms for ordering from ${who}.`,
    sections: [
      { heading: "Orders", body: ["Cakes are made to order. An order is confirmed only after online payment is verified.", "[PLACEHOLDER: acceptance, pricing errors, product images being indicative, customisation limits.]"] },
      { heading: "Delivery area", body: [`We currently deliver only in ${deliveryAreaLabel}, to pincodes shown as serviceable at checkout.`] },
      { heading: "Payment", body: ["All orders are prepaid online via Razorpay. [PLACEHOLDER: taxes, invoices.]"] },
      { heading: "Liability and governing law", body: ["[PLACEHOLDER: limitation of liability, governing law and jurisdiction.]"] },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    summary: "When orders can be cancelled and how refunds work.",
    sections: [
      { heading: "Cancellations", body: ["[PLACEHOLDER: until when a customer may cancel (for example, before the cake is being crafted), and how to request a cancellation.]"] },
      { heading: "Refunds", body: ["Approved refunds are returned to the original payment method through Razorpay. [PLACEHOLDER: eligibility, partial refunds, expected processing time as stated by the payment provider.]"] },
      { heading: "Quality concerns", body: ["[PLACEHOLDER: how to report an issue on delivery, and what evidence is needed.]"] },
    ],
  },
  "delivery-policy": {
    slug: "delivery-policy",
    title: "Shipping & Delivery Policy",
    summary: `How delivery works in ${deliveryAreaLabel}.`,
    sections: [
      { heading: "Where we deliver", body: [`Only in ${deliveryAreaLabel}, to pincodes accepted at checkout.`] },
      {
        heading: "Dates and slots",
        body: [
          "You choose a delivery date and time slot at checkout. Each slot has limited capacity and a same-day order cutoff; full or closed slots can't be selected.",
          "Deliveries are made by a third-party rider booked for your order. Once your order is out for delivery, the rider's details appear on your order page.",
        ],
      },
      { heading: "Charges", body: ["Any delivery charge is shown in your order summary before you pay."] },
      { heading: "Missed deliveries", body: ["[PLACEHOLDER: what happens if nobody is available to receive the order, and re-delivery terms.]"] },
    ],
  },
};

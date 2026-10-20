import { brand, deliveryAreaLabel } from "@/config/brand";
import { env } from "@/lib/env";
import type { Order } from "@/lib/orders";
import { longDate } from "@/lib/time";
import { orderToken } from "@/lib/tokens";
import type { OrderStatus } from "@/lib/types";
import { weightLabel } from "@/lib/types";
import { waTemplates } from "@/lib/whatsapp";
import type { Message } from "./channels";

const inr = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(p / 100);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const orderLink = (o: Pick<Order, "orderNumber">) => `${env.siteUrl}/order/${encodeURIComponent(o.orderNumber)}?t=${orderToken(o.orderNumber)}`;

const copy: Partial<Record<OrderStatus, { subject: (o: Order) => string; lead: string }>> = {
  placed: { subject: (o) => `Order ${o.orderNumber} received`, lead: "Thank you. We've received your order and payment." },
  confirmed: { subject: (o) => `Order ${o.orderNumber} is confirmed`, lead: "Your order is confirmed." },
  being_crafted: { subject: (o) => `Your cake is being crafted · ${o.orderNumber}`, lead: "Your cake is being crafted in our kitchen." },
  out_for_delivery: { subject: (o) => `Out for delivery · ${o.orderNumber}`, lead: "Your order is on its way." },
  delivered: { subject: (o) => `Delivered · ${o.orderNumber}`, lead: "Your order has been delivered. We hope it's savoured." },
  cancelled: { subject: (o) => `Order ${o.orderNumber} cancelled`, lead: "Your order has been cancelled. If you have questions, please contact us." },
  refunded: { subject: (o) => `Refund initiated · ${o.orderNumber}`, lead: "A refund for your order has been initiated to your original payment method." },
};

export function orderMessage(o: Order, status: OrderStatus): Message | null {
  const c = copy[status];
  if (!c) return null;
  const link = orderLink(o);
  const { ink, accent, paper, body } = brand.colors;

  const rider =
    status === "out_for_delivery" && (o.riderName || o.riderPhone || o.trackingUrl)
      ? [o.riderName ? `Rider: ${o.riderName}` : null, o.riderPhone ? `Phone: ${o.riderPhone}` : null, o.trackingUrl ? `Live tracking: ${o.trackingUrl}` : null].filter(Boolean).join("\n")
      : "";

  const itemsText = o.items.map((i) => `${i.quantity} × ${i.productName} (${weightLabel(i.weightGrams)})${i.cakeMessage ? ` — "${i.cakeMessage}"` : ""}`).join("\n");

  const text = [
    `${c.lead}`,
    "",
    `Order ${o.orderNumber}`,
    `Delivery: ${longDate(o.deliveryDate)}, ${o.slotLabel}`,
    `To: ${o.addressLine1}${o.addressLine2 ? `, ${o.addressLine2}` : ""}, ${o.areaName} ${o.pincode}`,
    "",
    itemsText,
    "",
    `Total paid: ${inr(o.totalPaise)}`,
    rider ? `\n${rider}` : "",
    "",
    `View your order: ${link}`,
    "",
    `${brand.name} · ${brand.tagline}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:${paper};font-family:Montserrat,Arial,sans-serif;color:${body}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${accent}">
<tr><td style="background:${ink};padding:20px 24px;color:${paper};font-family:Georgia,serif;font-size:24px">${esc(brand.name)}</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:${ink}">${esc(c.lead)}</p>
<p style="margin:0 0 4px;font-size:14px"><b style="color:${ink}">Order ${esc(o.orderNumber)}</b></p>
<p style="margin:0 0 4px;font-size:14px">Delivery: ${esc(longDate(o.deliveryDate))}, ${esc(o.slotLabel)}</p>
<p style="margin:0 0 16px;font-size:14px">${esc(o.addressLine1)}${o.addressLine2 ? `, ${esc(o.addressLine2)}` : ""}, ${esc(o.areaName)} ${esc(o.pincode)}</p>
${rider ? `<p style="margin:0 0 16px;padding:12px;border:1px solid ${accent};font-size:14px;white-space:pre-line">${esc(rider)}</p>` : ""}
<table role="presentation" width="100%" style="font-size:14px;border-top:1px solid ${accent}">
${o.items
  .map(
    (i) =>
      `<tr><td style="padding:8px 0">${i.quantity} × ${esc(i.productName)} (${esc(weightLabel(i.weightGrams))})${i.cakeMessage ? `<br><span style="color:${body}">Message: “${esc(i.cakeMessage)}”</span>` : ""}</td><td align="right" style="padding:8px 0;white-space:nowrap">${inr(i.unitPaise * i.quantity)}</td></tr>`,
  )
  .join("")}
${o.discountPaise ? `<tr><td style="padding:4px 0">Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}</td><td align="right">−${inr(o.discountPaise)}</td></tr>` : ""}
${o.deliveryFeePaise ? `<tr><td style="padding:4px 0">Delivery</td><td align="right">${inr(o.deliveryFeePaise)}</td></tr>` : ""}
<tr><td style="padding:8px 0;border-top:1px solid ${accent}"><b style="color:${ink}">Total paid</b></td><td align="right" style="border-top:1px solid ${accent}"><b style="color:${ink}">${inr(o.totalPaise)}</b></td></tr>
</table>
<p style="margin:24px 0 0"><a href="${link}" style="display:inline-block;background:${ink};color:${paper};text-decoration:none;padding:14px 22px;font-size:13px;letter-spacing:.14em;text-transform:uppercase">View your order</a></p>
</td></tr>
<tr><td style="padding:16px 24px;font-size:12px;border-top:1px solid ${accent}">${esc(brand.tagline)} · Delivering in ${esc(deliveryAreaLabel)}</td></tr>
</table></td></tr></table></body></html>`;

  // Template wording lives in WhatsApp Manager (docs/whatsapp-setup.md); these fill its {{1}}, {{2}}… in order.
  const whatsapp =
    status === "placed"
      ? { template: waTemplates.orderReceived, params: [o.orderNumber, `${longDate(o.deliveryDate)}, ${o.slotLabel}`, inr(o.totalPaise), link] }
      : { template: waTemplates.orderUpdate, params: [o.orderNumber, [c.lead, rider.replaceAll("\n", " · ")].filter(Boolean).join(" "), link] };

  return { subject: c.subject(o), html, text, whatsapp };
}

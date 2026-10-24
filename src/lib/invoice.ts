import { brand } from "@/config/brand";
import { db } from "./db";
import type { Order } from "./orders";
import { PdfPage } from "./pdf";
import { gstBreakdown } from "./pricing";
import { financialYear, todayIST } from "./time";
import { weightLabel } from "./types";
import { displayPhone } from "./validate";

/** Invoices exist only when a GSTIN is configured and the order was paid with a GST rate set. */
export const invoiceAvailable = (o: Pick<Order, "paymentStatus" | "gstRateBps">) => Boolean(brand.legal.gstin) && o.paymentStatus === "paid" && o.gstRateBps > 0;

/** Assigns a sequential invoice number (per financial year) on first download. */
export async function ensureInvoiceNumber(o: Order): Promise<{ invoiceNo: string; invoiceDate: string }> {
  if (o.invoiceNo && o.invoiceDate) return { invoiceNo: o.invoiceNo, invoiceDate: o.invoiceDate };
  const date = o.paidAt ? todayIST(new Date(o.paidAt)) : todayIST();
  const fy = financialYear(date);
  const { data: n, error } = await db().rpc("next_invoice_no", { p_fy: fy });
  if (error) throw new Error(`next_invoice_no: ${error.message}`);
  const invoiceNo = `${brand.orderPrefix}/${fy}/${String(n).padStart(5, "0")}`;
  // Only set if still empty (two concurrent downloads keep the first number).
  await db().from("orders").update({ invoice_no: invoiceNo, invoice_date: date }).eq("id", o.id).is("invoice_no", null);
  const { data } = await db().from("orders").select("invoice_no, invoice_date").eq("id", o.id).single();
  return { invoiceNo: data!.invoice_no, invoiceDate: data!.invoice_date };
}

const rs = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/**
 * Tax invoice layout. [LEGAL REVIEW NEEDED]: format, HSN, place of supply and
 * the tax treatment of delivery charges must be confirmed by the bakery's CA.
 */
export function renderInvoice(o: Order, invoiceNo: string, invoiceDate: string): Buffer {
  const pg = new PdfPage();
  const ink = hex(brand.colors.ink);
  const gold = hex(brand.colors.accent);
  const L = 40;
  const R = pg.width - 40;

  pg.rect(0, 0, pg.width, 70, ink);
  pg.text(L, 42, brand.legal.legalName || brand.name, { size: 18, bold: true, rgb: [255, 255, 255] });
  pg.text(R, 42, "TAX INVOICE", { size: 12, bold: true, align: "right", rgb: gold });

  let y = 96;
  const seller = [brand.legal.registeredOffice || brand.contact.address, `GSTIN: ${brand.legal.gstin}`, brand.legal.fssaiLicence ? `FSSAI Lic. No.: ${brand.legal.fssaiLicence}` : "", brand.contact.email, brand.contact.phone].filter(Boolean);
  seller.forEach((s, i) => pg.text(L, y + i * 13, s, { size: 9 }));
  [`Invoice no: ${invoiceNo}`, `Invoice date: ${invoiceDate}`, `Order no: ${o.orderNumber}`, `Place of supply: Karnataka`].forEach((s, i) => pg.text(R, y + i * 13, s, { size: 9, align: "right" }));

  y += Math.max(seller.length, 4) * 13 + 14;
  pg.line(L, y, R, y, 0.6, gold);
  y += 18;
  pg.text(L, y, "Bill to / Ship to", { size: 9, bold: true });
  [o.customerName, [o.addressLine1, o.addressLine2].filter(Boolean).join(", "), `${o.areaName} ${o.pincode}${o.landmark ? ` (${/^near\b/i.test(o.landmark) ? o.landmark : `near ${o.landmark}`})` : ""}`, displayPhone(o.phone)].forEach((s, i) =>
    pg.text(L, y + 14 + i * 12, s, { size: 9 }),
  );

  y += 80;
  const cols = { no: L, item: L + 22, hsn: 330, qty: 385, rate: 460, amt: R };
  pg.rect(L, y - 11, R - L, 16, [240, 236, 228]);
  pg.text(cols.no, y, "#", { size: 8, bold: true });
  pg.text(cols.item, y, "Item", { size: 8, bold: true });
  pg.text(cols.hsn, y, "HSN", { size: 8, bold: true });
  pg.text(cols.qty, y, "Qty", { size: 8, bold: true, align: "right" });
  pg.text(cols.rate, y, "Rate", { size: 8, bold: true, align: "right" });
  pg.text(cols.amt, y, "Amount", { size: 8, bold: true, align: "right" });
  y += 18;
  o.items.forEach((it, i) => {
    pg.text(cols.no, y, String(i + 1), { size: 9 });
    pg.text(cols.item, y, `${it.productName} (${weightLabel(it.weightGrams)})`.slice(0, 55), { size: 9 });
    pg.text(cols.hsn, y, o.hsnCode || "-", { size: 9 });
    pg.text(cols.qty, y, String(it.quantity), { size: 9, align: "right" });
    pg.text(cols.rate, y, rs(it.unitPaise), { size: 9, align: "right" });
    pg.text(cols.amt, y, rs(it.unitPaise * it.quantity), { size: 9, align: "right" });
    y += 15;
  });
  pg.line(L, y - 6, R, y - 6, 0.4);

  const rows: [string, string, boolean?][] = [["Subtotal", rs(o.subtotalPaise)]];
  if (o.discountPaise) rows.push([`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `- ${rs(o.discountPaise)}`]);
  if (o.deliveryFeePaise) rows.push(["Delivery", rs(o.deliveryFeePaise)]);
  const taxBase = o.subtotalPaise - o.discountPaise + o.deliveryFeePaise;
  const g = gstBreakdown(taxBase, o.gstRateBps, o.pricesIncludeGst);
  const half = (o.gstRateBps / 200).toFixed(o.gstRateBps % 200 ? 1 : 0);
  rows.push(["Taxable value", rs(g.taxablePaise)], [`CGST @ ${half}%`, rs(g.cgstPaise)], [`SGST @ ${half}%`, rs(g.sgstPaise)]);
  rows.push([o.pricesIncludeGst ? "Total (incl. GST)" : "Total", rs(o.totalPaise), true]);

  y += 8;
  rows.forEach(([k, v, bold]) => {
    pg.text(cols.rate, y, k, { size: 9, bold, align: "right" });
    pg.text(cols.amt, y, v, { size: 9, bold, align: "right" });
    y += 14;
  });

  y += 20;
  pg.text(L, y, `Paid online via Razorpay${o.paidAt ? ` on ${todayIST(new Date(o.paidAt))}` : ""}.`, { size: 8 });
  pg.text(L, y + 12, "This is a computer-generated invoice and does not require a signature.", { size: 8 });
  pg.line(L, pg.height - 50, R, pg.height - 50, 0.6, gold);
  pg.text(L, pg.height - 36, `${brand.name} · ${brand.tagline}`, { size: 8, rgb: ink });
  return pg.toBuffer(`Invoice ${invoiceNo}`);
}

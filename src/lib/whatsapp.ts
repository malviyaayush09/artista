import { env } from "@/lib/env";

/**
 * WhatsApp Cloud API (Meta, direct). Business-initiated messages must use a
 * template approved in WhatsApp Manager; names and wording are listed in
 * docs/whatsapp-setup.md. Template language is English ("en").
 */
const GRAPH = "https://graph.facebook.com/v25.0";

export const waTemplates = {
  loginCode: "artista_login_code",
  orderReceived: "artista_order_received",
  orderUpdate: "artista_order_update",
} as const;

/** Meta rejects parameters with newlines, tabs or 4+ spaces in a row. */
const clean = (s: string) => s.replace(/\s+/g, " ").trim() || "-";

/** "+919876543210" or "9876543210" → "919876543210". */
const toWaNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

export async function sendWhatsAppTemplate(to: string, template: string, body: string[], buttons: object[] = []) {
  const res = await fetch(`${GRAPH}/${env.whatsappPhoneNumberId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.whatsappToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toWaNumber(to),
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [{ type: "body", parameters: body.map((t) => ({ type: "text", text: clean(t) })) }, ...buttons],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/** Authentication template with a "Copy code" button; the code goes in the body and the button. */
export const sendWhatsAppCode = (to: string, code: string) =>
  sendWhatsAppTemplate(to, waTemplates.loginCode, [code], [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] }]);

import { brand } from "@/config/brand";
import { env, isWhatsAppConfigured } from "@/lib/env";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

/** `whatsapp`: the approved template and its body values; without it the WhatsApp channel skips the message. */
export type Message = { subject: string; html: string; text: string; whatsapp?: { template: string; params: string[] } };
export type SendResult = { status: "sent" | "skipped" | "failed"; error?: string };

/**
 * A delivery channel. Email always; WhatsApp once its keys are set. An SMS
 * provider would implement this same interface and be added to `channels`.
 */
export interface NotificationChannel {
  readonly name: "email" | "sms" | "whatsapp";
  /** The recipient address for this channel, or null if the order has none. */
  recipient(order: { email: string; phone: string }): string | null;
  send(to: string, msg: Message): Promise<SendResult>;
}

export const emailChannel: NotificationChannel = {
  name: "email",
  recipient: (o) => o.email || null,
  async send(to, msg) {
    if (!env.resendApiKey) {
      // Local development: log instead of sending.
      console.info(`[email:skipped] to=${to} subject="${msg.subject}"\n${msg.text}`);
      return { status: "skipped", error: "RESEND_API_KEY not set" };
    }
    // Resend only sends from a verified domain, so the public contact address (a Gmail) is the reply-to, not the sender.
    const from = `${brand.name} <${env.emailFrom || "onboarding@resend.dev"}>`;
    const replyTo = brand.contact.email || undefined;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.resendApiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: msg.subject, html: msg.html, text: msg.text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      });
      if (!res.ok) return { status: "failed", error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
      return { status: "sent" };
    } catch (e) {
      return { status: "failed", error: e instanceof Error ? e.message : String(e) };
    }
  },
};

/** Customer's checkout number, on WhatsApp Cloud API. Off (no recipient) until WHATSAPP_* keys are set. */
export const whatsappChannel: NotificationChannel = {
  name: "whatsapp",
  recipient: (o) => (isWhatsAppConfigured() && o.phone ? o.phone : null),
  async send(to, msg) {
    if (!msg.whatsapp) return { status: "skipped", error: "no WhatsApp template for this message" };
    try {
      await sendWhatsAppTemplate(to, msg.whatsapp.template, msg.whatsapp.params);
      return { status: "sent" };
    } catch (e) {
      return { status: "failed", error: e instanceof Error ? e.message : String(e) };
    }
  },
};

/** Enabled channels. */
export const channels: NotificationChannel[] = [emailChannel, whatsappChannel];

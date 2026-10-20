import { brand } from "@/config/brand";
import { devToolsEnabled, isWhatsAppConfigured } from "@/lib/env";
import { emailChannel } from "@/lib/notify/channels";
import { ValidationError } from "@/lib/validate";
import { sendWhatsAppCode } from "@/lib/whatsapp";

/**
 * Swappable OTP delivery. Phone codes go by WhatsApp once its keys are set.
 * "sms" is the phone channel name (stored in otp_codes), whatever carries it.
 */
export interface OtpProvider {
  readonly channel: "sms" | "email";
  readonly isMock: boolean;
  /** Shown to the customer: where to look for the code. */
  readonly via?: "WhatsApp";
  send(destination: string, code: string): Promise<void>;
}

/** Development provider: logs the code. The UI also shows it (dev tools only). */
export const mockSmsProvider: OtpProvider = {
  channel: "sms",
  isMock: true,
  async send(destination, code) {
    console.info(`[otp:mock-sms] ${destination} → ${code}`);
  },
};

export const emailOtpProvider: OtpProvider = {
  channel: "email",
  isMock: false,
  async send(destination, code) {
    const text = `Your ${brand.name} sign-in code is ${code}. It expires in 10 minutes. If you didn't ask for this, you can ignore this email.`;
    const r = await emailChannel.send(destination, {
      subject: `${code} is your ${brand.name} sign-in code`,
      text,
      html: `<p style="font-family:Arial,sans-serif;font-size:16px">Your ${brand.name} sign-in code is</p><p style="font-family:Arial,sans-serif;font-size:32px;letter-spacing:6px"><b>${code}</b></p><p style="font-family:Arial,sans-serif;font-size:14px">It expires in 10 minutes. If you didn't ask for this, you can ignore this email.</p>`,
    });
    if (r.status === "failed") throw new Error(r.error);
    if (r.status === "skipped") console.info(`[otp:email-skipped] ${destination} → ${code}`);
  },
};

export const whatsappOtpProvider: OtpProvider = {
  channel: "sms",
  isMock: false,
  via: "WhatsApp",
  async send(destination, code) {
    try {
      await sendWhatsAppCode(destination, code);
    } catch (e) {
      // Most often the number isn't on WhatsApp; email still works.
      console.error("[otp:whatsapp]", destination, e);
      throw new ValidationError("destination", "We couldn't send a code to this number on WhatsApp. Check the number, or use email instead.");
    }
  },
};

/** The active phone provider: WhatsApp when configured, else the mock outside production; null means phone login is unavailable. */
export function smsProvider(): OtpProvider | null {
  if (isWhatsAppConfigured()) return whatsappOtpProvider;
  return devToolsEnabled() ? mockSmsProvider : null;
}

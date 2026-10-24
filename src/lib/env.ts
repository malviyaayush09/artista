/**
 * Server-side environment access. None of these are NEXT_PUBLIC_, so they are
 * never bundled into client code. Names match .env.example.
 */
export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  /** Sender address on a domain verified in Resend (e.g. orders@artistacakes.in). Empty uses Resend's test sender. */
  emailFrom: process.env.EMAIL_FROM ?? "",
  whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProd: process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview",
};

export const isDbConfigured = () => Boolean(env.supabaseUrl && env.supabaseServiceKey);
export const isWhatsAppConfigured = () => Boolean(env.whatsappToken && env.whatsappPhoneNumberId);
export const isRazorpayConfigured = () => Boolean(env.razorpayKeyId && env.razorpayKeySecret && env.razorpayWebhookSecret);

/**
 * Dev-only helpers (simulated payments, on-screen OTP).
 * HARD-BLOCKED on a live deployment, whatever ENABLE_DEV_TOOLS says: on Vercel
 * production, or whenever SITE_URL is a public https address. Otherwise on in
 * `next dev`, and on a local production build only with ENABLE_DEV_TOOLS=1.
 */
export function isLiveDeployment() {
  if (process.env.VERCEL_ENV === "production") return true;
  const site = process.env.SITE_URL ?? "";
  return /^https:\/\//i.test(site) && !/^https:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(site);
}

export const devToolsEnabled = () => !isLiveDeployment() && (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_TOOLS === "1");

/** Guard: Razorpay must stay in TEST mode for this build. */
export function assertRazorpayTestMode() {
  if (env.razorpayKeyId && !env.razorpayKeyId.startsWith("rzp_test_")) {
    throw new Error("Razorpay live keys detected. This build only runs in TEST mode.");
  }
}

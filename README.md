# Artista Cakes storefront

Made-to-order cake shop for HSR Layout, Bengaluru. Next.js (App Router) + TypeScript + Tailwind, Supabase Postgres + Storage, Razorpay (**test mode only**), Resend, Vercel.

**Testing:** see [TESTING.md](TESTING.md) for the full feature list and test checklist.

**Rebranding:** every brand string, colour, logo, contact detail, GSTIN and FSSAI number lives in [`src/config/brand.ts`](src/config/brand.ts). Page copy lives in `src/content/`. Nothing else hardcodes the brand.

## 1. Set up the database (once)

1. Create a Supabase project in the **Mumbai (ap-south-1)** region.
2. In **SQL Editor**, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then [`supabase/seed.sql`](supabase/seed.sql), then [`supabase/migrations/0002_operations.sql`](supabase/migrations/0002_operations.sql) (closed dates + alert emails). All are safe to re-run except 0001.
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). Set `SITE_URL=http://localhost:3000` locally.

All tables have row-level security on with **no policies**. Only the server, using the service-role key, can read or write.

## 2. Run

```bash
npm install
npm run dev          # development
npm run build && npm run start   # production build (use this for QA / Lighthouse)
```

Until `SUPABASE_*` is set, the storefront renders from the seed data in `src/data/catalog.ts`, and checkout is disabled.

## 3. Make yourself admin

1. Sign in at `/login`. In development the **mock SMS provider** shows the OTP on screen and in the server log.
2. In the SQL editor run: `update users set role = 'admin' where phone = '+91XXXXXXXXXX';`
3. Open `/admin`. Set prices (every cake starts at ₹0 = "Price on request"), photos, slots, pincodes and coupons.

## 4. Payments (Razorpay TEST mode)

- Add `RAZORPAY_KEY_ID` (must start with `rzp_test_`; live keys are refused), `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`.
- In the Razorpay dashboard (Test mode) → Webhooks, add `https://<your-public-url>/api/razorpay/webhook` with events `payment.captured`, `order.paid` and `payment.failed`. Razorpay can't reach `localhost`; use a Vercel preview or a tunnel.
- **An order becomes paid only when the signed webhook is verified** (`src/app/api/razorpay/webhook/route.ts`). The browser's payment success callback only redirects to the order page, which waits for the webhook.
- **No keys yet?** In development, checkout shows **Simulate successful payment**. It builds a Razorpay-shaped event, signs it and posts it to the real webhook, so signature verification and mark-as-paid run exactly as they will with Razorpay. This button and route return 404 in production.

## 5. Email

Set `RESEND_API_KEY`. Without it, emails are logged to the console and recorded as `skipped` in `notification_log`. Customers are emailed when an order is placed and on every status change. With `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` set, the same updates also go to the checkout mobile number on WhatsApp (approved templates; see [docs/whatsapp-setup.md](docs/whatsapp-setup.md)).

## 6. Sign-in (OTP)

Phone OTP is the primary method and email OTP the fallback. OTP delivery sits behind the `OtpProvider` interface in `src/lib/auth/otp-providers.ts`. When the WhatsApp keys are set, phone codes are sent on WhatsApp (an authentication template with a Copy code button). Otherwise the mock SMS provider is used, outside production only, and production offers email sign-in. Codes and session tokens are stored only as SHA-256 hashes; sessions use an httpOnly cookie.

## 7. Invoices

GST invoice PDFs (`/api/invoices/<order>`) appear only when `brand.legal.gstin` is set **and** a GST rate above 0 is set in Admin → Settings. **[LEGAL REVIEW NEEDED]**: the CA must confirm the rate, HSN, place of supply and how delivery charges are taxed.

## 8. Operations

- **Order alerts:** Admin → Settings → *Alert emails* (up to 5). Each address gets an email for every new paid order, with the cakes, messages, address and an admin link.
- **Error alerts:** the same addresses get an email when the server hits an error (`src/instrumentation.ts`), at most once per hour per distinct error. In local dev, signed in as staff, open `/api/dev/test-error` to send a test alert.
- **Closed dates:** Admin → Slots → *Closed dates*. Customers see those days as "Closed"; the database also refuses orders for them. Existing orders on that day are not cancelled.
- **Kitchen sheet:** Admin → Kitchen. One day at a time, grouped by slot, with a prep list and each cake's message in large type. *Print* gives a clean paper copy.
- **Backups:** `npm run db:backup` exports every table to `backups/<timestamp>/` (gitignored: it contains customer data). Schedule it nightly on Windows (run once in **Command Prompt**, not PowerShell, from this folder):
  ```
  schtasks /Create /SC DAILY /ST 02:00 /TN "Artista DB backup" /TR "cmd /c cd /d %CD% && npm run db:backup"
  ```
  Product photos in Supabase Storage aren't included. For production, Supabase Pro's daily backups are the safer option.
- **Dev tools are locked off in production.** The simulated payment, on-screen OTP and test-error route are refused on Vercel production and on any public `https` `SITE_URL`, even if `ENABLE_DEV_TOOLS=1` is set by mistake. Only orders created without Razorpay keys can ever be "simulated".

## Before launch checklist

- Replace the interim photos in `public/images/interim/`. Their rights and product mapping are unconfirmed, and one carries another bakery's branding.
- Fill in contact, legal and GST details in `brand.ts`.
- Have a lawyer review the policy pages (`src/content/legal.ts`), the FAQs marked `legalReview`, and the invoice format.
- Integrate a real SMS OTP provider, verify a Resend sending domain, and run Lighthouse on the production build.

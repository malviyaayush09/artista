# WhatsApp setup (Meta Cloud API)

What the site does once this is set up:

- **Sign-in codes on WhatsApp.** "Sign in with phone" sends the 6-digit code on WhatsApp, with a *Copy code* button. No SMS registration needed.
- **Order updates on WhatsApp.** The mobile number given at checkout gets a message when the order is placed, and at every status change (confirmed, being crafted, out for delivery with the rider's details, delivered, cancelled, refunded). Email still goes out as before.

Until the two keys below are set, nothing changes on the site.

Business number: **+91 91879 76641** · Phone number ID **1367123463155824** · WhatsApp account "Artista Cakes" (1429329902512902) · App "Artista Cakes Website"

---

## Step 0: Before you start

- [ ] **The number must not be on WhatsApp.** If WhatsApp or WhatsApp Business was ever installed on +91 91879 76641, open it and go to *Settings → Account → Delete account* first. A number used by the API can't be used in the WhatsApp app.
- [ ] The SIM must be with you. Meta sends a code to it by SMS or call.
- [ ] A personal Facebook account for the owner (Meta uses it to log in; nothing is posted).
- [ ] One business document showing the legal business name and address, for verification: GST certificate, Udyam certificate, shop & establishment licence, or a utility bill / bank statement in the business name.
- [ ] A credit or debit card for message charges.

## Step 1: Business portfolio

1. Go to **business.facebook.com** and log in.
2. Create a business portfolio: name **Artista Cakes**, the owner's name, a business email.
3. Fill in *Business info*: legal name (exactly as on the document), address, phone, website.

## Step 2: Developer app (this gives us the API)

1. Go to **developers.facebook.com → My Apps → Create app**.
2. Use case: **Other**, then type **Business**.
3. Name it *Artista Cakes Website*, link it to the **Artista Cakes** portfolio.
4. On the app dashboard, add the **WhatsApp** product.

Meta now gives a **test number** and a temporary token. That is enough for us to test end to end before the real number is approved; send me the *Phone number ID* from *WhatsApp → API Setup* (it's not secret) and add up to 5 phones as test recipients there.

## Step 3: Add the real number

The developer page's "Register your WhatsApp phone number" form refused with a policy error (#2494070) while the business profile was incomplete. Adding the number in **WhatsApp Manager** worked instead:

1. **business.facebook.com → Settings → WhatsApp accounts → Artista Cakes → WhatsApp Manager → Phone numbers → Add phone number.**
2. Display name **Artista Cakes**, category *Food and Grocery*, website `https://www.artistacakes.in`, India +91 `9187976641`, verify by SMS.
3. Note the **Phone number ID** (it's 1367123463155824). Don't create a second WhatsApp account if a form offers to.

The number then shows **Pending** until Step 7b switches it on. Its two-step PIN can't be set in WhatsApp Manager until then; the register script sets it.

**Business info must be complete** (Settings → Business info → Business details): legal name as on the GST certificate, country India, website, address, phone. Meta blocks the account until these are filled in.

## Step 4: Verify the business

*Business settings → Security Center → Start verification.* Upload the document from Step 0. Until this is done, Meta allows only a small number of new customers per day, so do it early.

## Step 5: Payment method

*WhatsApp Manager → Overview → Add payment method.* Meta charges per message for sign-in codes and order updates; current India rates are on Meta's pricing page (developers.facebook.com/docs/whatsapp/pricing).

## Step 6: Message templates

*WhatsApp Manager → Message templates → Create template.* Create these three, language **English**. Names and wording must match exactly; the website fills in the `{{1}}`, `{{2}}`… values.

### 1. `artista_login_code`

- Category: **Authentication**
- Code delivery: **Copy code**
- Tick *Add security recommendation* and *Add expiry time*: **10 minutes**

(Meta writes the text itself: "123456 is your verification code…")

### 2. `artista_order_received`

- Category: **Utility**
- Body:

```
Thank you for your order from Artista Cakes. We've received order {{1}} and your payment.

Delivery: {{2}}
Total paid: {{3}}

View your order: {{4}}

We'll send updates here as your cake is made and delivered.
```

- Sample values: `ART-001013` · `Saturday, 24 October 2026, 4 pm – 7 pm` · `₹1,450.00` · `https://example.com/order/ART-001013`

### 3. `artista_order_update`

- Category: **Utility**
- Body:

```
Update on your Artista Cakes order {{1}}:

{{2}}

View your order: {{3}}

Thank you for choosing Artista Cakes.
```

- Sample values: `ART-001013` · `Your cake is being crafted in our kitchen.` · `https://example.com/order/ART-001013`

Approval usually comes within minutes to a day. If one is rejected, send me the reason.

## Step 7: Permanent access token

The token on the API Setup page expires after 24 hours. For the website:

1. *Business settings → Users → System users → Add.* Name *website*, role **Admin**.
2. *Assign assets*: the **Artista Cakes Website** app and the **WhatsApp account**, both with full control.
3. *Generate new token* → app *Artista Cakes Website* → expiry **Never** → permissions `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Copy the token **once** and keep it somewhere safe.

**Never paste the token into chat, email or git.** It goes only in:

- `.env.local` on the laptop (local testing)
- Vercel → Project → Settings → Environment Variables (live site), **after** Step 7b and template approval

```
WHATSAPP_ACCESS_TOKEN=<the token>
WHATSAPP_PHONE_NUMBER_ID=<the phone number ID from Step 3>
```

Restart the site after adding them.

## Step 7b: Switch the number on

```
npm run whatsapp:status      # number, display name, and what Meta says is blocking messages
npm run whatsapp:register    # asks for a new 6-digit PIN (hidden), then registers the number
```

`whatsapp:status` lists Meta's blockers in plain words (payment method, business verification, incomplete profile, number not registered). Fix those first; `whatsapp:register` fails with "(#100) Invalid parameter" while they're open. After it succeeds, status shows **CONNECTED** and platform **CLOUD_API**. Keep the PIN private.

Only then add the two `WHATSAPP_*` keys to Vercel (the live site switches phone sign-in to WhatsApp as soon as they're there).

## Step 8: Test

1. `/login` → *Mobile number* should say "We'll send the code on WhatsApp". Enter your number; the code arrives on WhatsApp.
2. Place a test order with your number at checkout → "order received" message.
3. In Admin, move the order to *Being crafted* → update message.
4. Admin → order page → notification log shows `whatsapp · sent`. A `failed` row has Meta's reason in it.

## Good to know

- **Customer replies to this number aren't read anywhere yet.** The number lives on the API, not in a phone app. Keep the website's "Chat on WhatsApp" button on a number the bakery reads in the WhatsApp Business app, or later we add a small inbox (or forward replies to email) using Meta's webhook.
- **Using one number for both** (app chats + automatic messages) is called *coexistence*. Meta offers it through its partner providers (e.g. Interakt, AiSensy, Wati, Gupshup), which charge a monthly fee on top of Meta's rates. It isn't available for a direct setup like this one as far as we could confirm.
- If a message fails (customer not on WhatsApp, template paused), the email still goes out and the order is unaffected.

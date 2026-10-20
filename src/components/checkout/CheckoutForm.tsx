"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { weightLabel } from "@/lib/types";
import { cartSubtotal, useCart } from "@/components/cart/cart-store";
import { buttonClasses } from "@/components/ui/Button";
import { formatPaise } from "@/components/ui/Price";
import { stickyBarRef } from "@/components/ui/useStickyBar";
import { SlotPicker } from "./SlotPicker";

export type SavedAddress = { id: string; label: string | null; name: string; phone: string; line1: string; line2: string | null; landmark: string | null; pincode: string };

type Props = {
  brandName: string;
  brandColor: string;
  deliveryAreaLabel: string;
  dates: string[];
  closedDates: string[];
  deliveryFeePaise: number;
  minOrderPaise: number;
  holdMinutes: number;
  configured: boolean;
  liveCheckout: boolean;
  /** "Send as a surprise" (needs migration 0003). */
  surpriseEnabled: boolean;
  /** Order updates also go to the mobile number on WhatsApp (keys set). */
  whatsappUpdates: boolean;
  user: { name: string; phone: string; email: string } | null;
  addresses: SavedAddress[];
};

type Pending = { orderNumber: string; token: string; razorpay: { keyId: string; orderId: string; amount: number } | null; devPayment: boolean; totalPaise: number; cartSig: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

const input =
  "block w-full min-h-12 border border-ink/40 bg-paper-soft px-3.5 py-2.5 text-ink placeholder:text-body/70 focus:border-ink focus:outline-2 focus:outline-accent aria-[invalid=true]:border-danger";

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm(p: Props) {
  const router = useRouter();
  const state = useCart();
  const saved = p.addresses[0] ?? null;

  const [f, setF] = useState({
    name: p.user?.name || saved?.name || "",
    phone: (p.user?.phone || saved?.phone || "").replace(/^\+91/, ""),
    email: p.user?.email || "",
    line1: saved?.line1 ?? "",
    line2: saved?.line2 ?? "",
    landmark: saved?.landmark ?? "",
    pincode: saved?.pincode ?? "",
  });
  // Live serviceability for the typed pincode (the server re-checks at checkout).
  const [pin, setPin] = useState<{ for: string; area: string | null } | null>(null);
  const [slot, setSlot] = useState<{ date: string | null; slotId: string | null; slotLabel: string | null }>({ date: p.dates.find((d) => !p.closedDates.includes(d)) ?? null, slotId: null, slotLabel: null });
  const [coupon, setCoupon] = useState({ code: "", applied: "", discount: 0, error: "", checking: false });
  const [surprise, setSurprise] = useState({ on: false, name: "", phone: "" });
  const [saveAddress, setSaveAddress] = useState<boolean>(Boolean(p.user) && !saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const subtotal = cartSubtotal(state);
  const total = subtotal - coupon.discount + p.deliveryFeePaise;
  const cartSig = useMemo(() => state.lines.map((l) => `${l.key}x${l.quantity}`).join(";"), [state.lines]);

  useEffect(() => {
    if (!p.liveCheckout) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    (w.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500)))(() => void loadRazorpay());
  }, [p.liveCheckout]);

  useEffect(() => {
    const code = f.pincode.trim();
    if (!/^\d{6}$/.test(code) || pin?.for === code) return;
    let live = true;
    fetch("/api/serviceability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pincode: code }) })
      .then((r) => r.json())
      .then((d: { area?: string | null }) => live && setPin({ for: code, area: d.area ?? null }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [f.pincode, pin]);
  const pinChecked = pin && pin.for === f.pincode.trim() ? pin : null;

  // A changed cart invalidates a started payment (and re-validates the coupon).
  useEffect(() => {
    if (pending && pending.cartSig !== cartSig) setPending(null);
  }, [cartSig, pending]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  if (!state.lines.length && !busy) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-[2.25rem]">Your cart is empty</h1>
        <Link href="/collections" className={`${buttonClasses("primary")} mt-6`}>
          Shop all cakes
        </Link>
      </div>
    );
  }

  async function applyCoupon() {
    if (!coupon.code.trim()) return;
    setCoupon({ ...coupon, checking: true, error: "" });
    const res = await fetch("/api/coupons/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: coupon.code, subtotalPaise: subtotal }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) setCoupon({ code: d.code, applied: d.code, discount: d.discountPaise, error: "", checking: false });
    else setCoupon({ ...coupon, applied: "", discount: 0, error: d.error ?? "That coupon code isn't valid.", checking: false });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))) e.phone = "Enter a valid 10-digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid email for order updates.";
    if (f.line1.trim().length < 3) e.line1 = "Enter your house or flat number and building.";
    if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Enter your 6-digit pincode.";
    else if (pinChecked && !pinChecked.area) e.pincode = `We don't deliver to ${f.pincode.trim()} yet. For now we deliver only in ${p.deliveryAreaLabel}.`;
    if (surprise.on && surprise.name.trim().length < 2) e.recipientName = "Who is the surprise for? Enter their name.";
    if (surprise.on && surprise.phone.trim() && !/^[6-9]\d{9}$/.test(surprise.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))) e.recipientPhone = "Enter a valid 10-digit mobile number, or leave it empty.";
    if (!slot.date || !slot.slotId) e.slot = "Choose a delivery date and time slot.";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`co-${first}`)?.focus();
    return !first;
  }

  async function pay(result: Pending) {
    if (result.razorpay) {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setFormError("We couldn't load the payment window. Check your connection and try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: result.razorpay.keyId,
        order_id: result.razorpay.orderId,
        amount: result.razorpay.amount,
        currency: "INR",
        name: p.brandName,
        description: `Order ${result.orderNumber}`,
        prefill: { name: f.name, email: f.email, contact: `+91${f.phone.replace(/\D/g, "").slice(-10)}` },
        notes: { order_number: result.orderNumber },
        theme: { color: p.brandColor },
        timeout: Math.max(60, p.holdMinutes * 60 - 60),
        retry: { enabled: true, max_count: 3 },
        // Success here is NOT proof of payment: the confirmation page waits for the verified webhook.
        handler: () => router.push(`/order/${encodeURIComponent(result.orderNumber)}?t=${result.token}`),
        modal: {
          ondismiss: () => setFormError(`Payment not completed. Your slot is held for about ${p.holdMinutes} minutes. Tap Pay to try again.`),
        },
      });
      rzp.on("payment.failed", () => setFormError("That payment didn't go through. You can try again or use another method."));
      rzp.open();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    if (pending && pending.cartSig === cartSig) return pay(pending);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...f,
          date: slot.date,
          slotId: slot.slotId,
          couponCode: coupon.applied,
          saveAddress,
          surprise: surprise.on,
          recipientName: surprise.on ? surprise.name : "",
          recipientPhone: surprise.on ? surprise.phone : "",
          items: state.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, cakeMessage: l.cakeMessage, giftNote: l.giftNote })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.field && d.field !== "items") setErrors((x) => ({ ...x, [d.field === "coupon" ? "coupon" : d.field]: d.error }));
        if (d.field === "coupon") setCoupon((c) => ({ ...c, applied: "", discount: 0, error: d.error }));
        if (d.field === "slot") setSlot((s) => ({ ...s, slotId: null, slotLabel: null }));
        setFormError(d.error ?? "Something went wrong. Please try again.");
        return;
      }
      const result: Pending = { ...d, cartSig };
      setPending(result);
      if (result.razorpay) await pay(result);
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch("/api/dev/simulate-payment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderNumber: pending.orderNumber, token: pending.token }) });
    setBusy(false);
    if (res.ok) router.push(`/order/${encodeURIComponent(pending.orderNumber)}?t=${pending.token}`);
    else setFormError("Simulated payment failed. Check the server log.");
  }

  const payLabel = busy ? "Please wait…" : pending?.devPayment ? "Payment started" : `Pay ${formatPaise(pending?.totalPaise ?? total)}`;

  return (
    <div className="container-x pt-6 pb-40 md:pb-16 lg:pt-10">
      <h1 className="text-[2.25rem] lg:text-[2.75rem]">Checkout</h1>
      {!p.user ? (
        <p className="mt-1 text-[1rem] text-body">
          Checking out as a guest.{" "}
          <Link href="/login?next=/checkout" className="text-ink underline decoration-accent underline-offset-4">
            Sign in
          </Link>{" "}
          to use saved addresses (optional).
        </p>
      ) : null}
      {!p.configured ? (
        <p role="alert" className="mt-4 border border-danger px-3 py-2 text-[1rem] text-danger">
          The store database isn&apos;t connected yet, so orders can&apos;t be placed.
        </p>
      ) : null}

      <form id="checkout-form" ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <div className="min-w-0 space-y-8">
          <Section n={1} title="Your details">
            <Field id="co-name" label="Full name" error={errors.name}>
              <input id="co-name" className={input} value={f.name} onChange={set("name")} autoComplete="name" aria-invalid={Boolean(errors.name) || undefined} />
            </Field>
            <Field id="co-phone" label="Mobile number" hint={p.whatsappUpdates ? "We'll send order updates to this number on WhatsApp, and the rider may call." : "For delivery updates from the rider."} error={errors.phone}>
              <div className="flex">
                <span className="inline-flex min-h-12 items-center border border-r-0 border-ink/40 bg-paper-deep px-3 text-ink">+91</span>
                <input id="co-phone" type="tel" inputMode="tel" autoComplete="tel-national" className={input} value={f.phone} onChange={set("phone")} maxLength={14} aria-invalid={Boolean(errors.phone) || undefined} />
              </div>
            </Field>
            <Field id="co-email" label="Email" hint="We'll send your order confirmation and updates here." error={errors.email}>
              <input id="co-email" type="email" inputMode="email" autoComplete="email" className={input} value={f.email} onChange={set("email")} aria-invalid={Boolean(errors.email) || undefined} />
            </Field>
          </Section>

          <Section n={2} title="Delivery address">
            <p className="text-[1rem] text-body">We deliver in {p.deliveryAreaLabel}.</p>
            {p.surpriseEnabled ? (
              <div className={`border p-4 transition-colors ${surprise.on ? "border-ink bg-paper-soft" : "border-line"}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={surprise.on} onChange={(e) => setSurprise({ ...surprise, on: e.target.checked })} className="mt-1 size-5 shrink-0 accent-[var(--brand-ink)]" />
                  <span>
                    <span className="block text-[1.0625rem] font-medium text-ink">Send it as a surprise</span>
                    <span className="mt-0.5 block text-[0.9375rem] text-body">
                      For someone else at this address. If the rider needs directions they&apos;ll call you, not them, and your gift note goes in a sealed envelope.
                    </span>
                  </span>
                </label>
                {surprise.on ? (
                  <div className="mt-4 space-y-4">
                    <Field id="co-recipientName" label="Who is it for?" error={errors.recipientName}>
                      <input id="co-recipientName" className={input} value={surprise.name} onChange={(e) => { setSurprise({ ...surprise, name: e.target.value }); if (errors.recipientName) setErrors({ ...errors, recipientName: "" }); }} autoComplete="off" aria-invalid={Boolean(errors.recipientName) || undefined} />
                    </Field>
                    <Field id="co-recipientPhone" label="Their mobile (optional)" hint="Only used if we truly can't reach the door. We'll try you first." error={errors.recipientPhone}>
                      <div className="flex">
                        <span className="inline-flex min-h-12 items-center border border-r-0 border-ink/40 bg-paper-deep px-3 text-ink">+91</span>
                        <input id="co-recipientPhone" type="tel" inputMode="tel" className={input} value={surprise.phone} onChange={(e) => { setSurprise({ ...surprise, phone: e.target.value }); if (errors.recipientPhone) setErrors({ ...errors, recipientPhone: "" }); }} maxLength={14} aria-invalid={Boolean(errors.recipientPhone) || undefined} />
                      </div>
                    </Field>
                  </div>
                ) : null}
              </div>
            ) : null}
            {p.addresses.length ? (
              <div className="scroll-row">
                {p.addresses.map((a) => (
                  <button key={a.id} type="button" onClick={() => setF({ ...f, name: f.name || a.name, line1: a.line1, line2: a.line2 ?? "", landmark: a.landmark ?? "", pincode: a.pincode })} className="min-h-11 shrink-0 border border-line px-3 text-left text-[0.9375rem] text-ink hover:border-ink">
                    {a.label || a.line1.slice(0, 24)}
                  </button>
                ))}
              </div>
            ) : null}
            <Field id="co-line1" label="House / flat no., building" error={errors.line1}>
              <input id="co-line1" className={input} value={f.line1} onChange={set("line1")} autoComplete="address-line1" aria-invalid={Boolean(errors.line1) || undefined} />
            </Field>
            <Field id="co-line2" label="Street and sector (optional)">
              <input id="co-line2" className={input} value={f.line2} onChange={set("line2")} autoComplete="address-line2" />
            </Field>
            <Field id="co-landmark" label="Landmark (optional)">
              <input id="co-landmark" className={input} value={f.landmark} onChange={set("landmark")} />
            </Field>
            <Field
              id="co-pincode"
              label="Pincode"
              error={errors.pincode || (pinChecked && !pinChecked.area ? `We don't deliver to ${pinChecked.for} yet. For now we deliver only in ${p.deliveryAreaLabel}.` : undefined)}
              hint={pinChecked?.area ? `✓ We deliver to ${pinChecked.area}.` : undefined}
            >
              <input
                id="co-pincode"
                className={`${input} max-w-[12rem] tabular-nums`}
                value={f.pincode}
                onChange={(e) => {
                  setF({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) });
                  if (errors.pincode) setErrors({ ...errors, pincode: "" });
                }}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                aria-invalid={Boolean(errors.pincode) || Boolean(pinChecked && !pinChecked.area) || undefined}
              />
            </Field>
            {p.user ? (
              <label className="flex min-h-11 items-center gap-3 text-[0.9375rem] text-ink">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-5 accent-[var(--brand-ink)]" />
                Save this address to my account
              </label>
            ) : null}
          </Section>

          <Section n={3} title="Delivery date & time">
            <div id="co-slot" tabIndex={-1}>
              <SlotPicker dates={p.dates} closedDates={p.closedDates} date={slot.date} slotId={slot.slotId} onChange={(v) => { setSlot(v); setErrors((x) => ({ ...x, slot: "" })); }} error={errors.slot} />
            </div>
          </Section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <Section n={4} title="Order summary">
            <ul className="divide-y divide-line border-y border-line">
              {state.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3 py-3 text-[0.9375rem]">
                  <div className="min-w-0">
                    <p className="text-ink">
                      {l.quantity} × {l.name}
                    </p>
                    <p className="text-[0.9375rem] text-body">
                      {weightLabel(l.weightGrams)}
                      {l.cakeMessage ? ` · “${l.cakeMessage}”` : ""}
                      {l.giftNote ? " · Gift note" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-ink">{formatPaise(l.unitPaise * l.quantity)}</span>
                </li>
              ))}
            </ul>

            <div>
              <label htmlFor="co-coupon" className="mb-1.5 block text-[1rem] font-medium text-ink">
                Coupon code
              </label>
              <div className="flex gap-2">
                <input id="co-coupon" className={`${input} uppercase`} value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase(), error: "" })} autoCapitalize="characters" autoComplete="off" aria-invalid={Boolean(coupon.error) || undefined} aria-describedby="co-coupon-msg" />
                <button type="button" onClick={applyCoupon} disabled={coupon.checking || !coupon.code.trim()} className={buttonClasses("outline", "md")}>
                  Apply
                </button>
              </div>
              <p id="co-coupon-msg" className="mt-1.5 text-[0.9375rem]" role="status">
                {coupon.error ? <span className="text-danger">{coupon.error}</span> : coupon.applied ? <span className="text-ink">{coupon.applied} applied.</span> : null}
              </p>
            </div>

            <dl className="space-y-1.5 text-[0.9375rem]">
              <Row k="Subtotal" v={formatPaise(subtotal)} />
              {coupon.discount ? <Row k={`Discount (${coupon.applied})`} v={`−${formatPaise(coupon.discount)}`} /> : null}
              <Row k="Delivery" v={p.deliveryFeePaise ? formatPaise(p.deliveryFeePaise) : "Free"} />
              <div className="flex justify-between border-t border-line pt-2 text-[1.0625rem] font-medium text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPaise(total)}</dd>
              </div>
            </dl>
            {p.minOrderPaise > subtotal ? <p className="text-[1rem] text-danger">Minimum order is {formatPaise(p.minOrderPaise)}.</p> : null}

            {formError ? (
              <p role="alert" className="border border-danger px-3 py-2 text-[1rem] text-danger">
                {formError}
              </p>
            ) : null}

            {pending?.devPayment ? (
              <div className="border border-dashed border-detail p-4">
                <p className="text-[1rem] text-ink">
                  <b>Development mode:</b> Razorpay test keys aren&apos;t set. Order {pending.orderNumber} is waiting for payment.
                </p>
                <button type="button" onClick={simulate} disabled={busy} className={`${buttonClasses("outline", "md", true)} mt-3`}>
                  Simulate successful payment
                </button>
              </div>
            ) : null}

            <button type="submit" disabled={busy || !p.configured || p.minOrderPaise > subtotal || Boolean(pending?.devPayment)} className={`${buttonClasses("primary", "lg", true)} max-md:hidden`}>
              {payLabel}
            </button>
            <p className="text-[0.8125rem] text-body">Prepaid only · UPI, cards and netbanking via Razorpay. Your order is confirmed once payment is verified.</p>
          </Section>
        </aside>
      </form>

      {/* Thumb-zone pay bar (phones) */}
      <div ref={stickyBarRef} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] md:hidden">
        <button type="submit" form="checkout-form" disabled={busy || !p.configured || p.minOrderPaise > subtotal || Boolean(pending?.devPayment)} className={buttonClasses("primary", "lg", true)}>
          {payLabel}
        </button>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${n}`} className="space-y-4">
      <h2 id={`sec-${n}`} className="flex items-baseline gap-3 text-[1.5rem]">
        <span className="font-display text-[1.25rem] text-accent" aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[1rem] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[0.9375rem] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.9375rem] text-body">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-ink">
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}


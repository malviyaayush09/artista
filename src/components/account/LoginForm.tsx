"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";

const input = "block w-full min-h-12 border border-ink/40 bg-paper-soft px-3.5 py-2.5 text-ink focus:border-ink focus:outline-2 focus:outline-accent aria-[invalid=true]:border-danger";

/** Phone OTP first; email as fallback. */
export function LoginForm({ next, phoneAvailable, phoneVia }: { next: string; phoneAvailable: boolean; phoneVia?: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<"sms" | "email">(phoneAvailable ? "sms" : "email");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<"ask" | "code">("ask");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object) {
    setBusy(true);
    setError("");
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(d.error ?? "Something went wrong.");
    return res.ok ? d : null;
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const d = await post("/api/auth/otp/request", { channel, destination });
    if (d) {
      setStep("code");
      setDevCode(d.devCode);
      setCode("");
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const d = await post("/api/auth/otp/verify", { channel, destination, code });
    if (d) {
      router.replace(next);
      router.refresh();
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className="space-y-5">
        <p className="text-[0.9375rem] text-ink">
          Enter the 6-digit code sent to <b className="font-medium">{channel === "sms" ? `+91 ${destination.replace(/\D/g, "").slice(-10)}` : destination}</b>
          {channel === "sms" && phoneVia ? ` on ${phoneVia}` : ""}.
        </p>
        {devCode ? (
          <p className="border border-dashed border-detail px-3 py-2 text-[0.9375rem] text-ink">
            Development mode (mock SMS): your code is <b className="tracking-[0.2em]">{devCode}</b>
          </p>
        ) : null}
        <div className="space-y-1.5">
          <label htmlFor="otp" className="block text-[1rem] font-medium text-ink">
            One-time code
          </label>
          <input
            id="otp"
            className={`${input} text-center text-[1.375rem] tracking-[0.5em]`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-invalid={Boolean(error) || undefined}
            autoFocus
            required
          />
        </div>
        {error ? (
          <p role="alert" className="text-[1rem] text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy || code.length !== 6} className={buttonClasses("primary", "lg", true)}>
          {busy ? "Checking…" : "Sign in"}
        </button>
        <div className="flex justify-between text-[1rem]">
          <button type="button" className="min-h-11 text-ink underline decoration-accent underline-offset-4" onClick={() => setStep("ask")}>
            Change {channel === "sms" ? "number" : "email"}
          </button>
          <button type="button" className="min-h-11 text-ink underline decoration-accent underline-offset-4" onClick={() => send()} disabled={busy}>
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={send} className="space-y-5">
      {channel === "sms" ? (
        <div className="space-y-1.5">
          <label htmlFor="dest" className="block text-[1rem] font-medium text-ink">
            Mobile number
          </label>
          {phoneVia ? <p className="text-[0.9375rem] text-body">We&apos;ll send the code on {phoneVia}.</p> : null}
          <div className="flex">
            <span className="inline-flex min-h-12 items-center border border-r-0 border-ink/40 bg-paper-deep px-3 text-ink">+91</span>
            <input id="dest" type="tel" inputMode="tel" autoComplete="tel-national" className={input} value={destination} onChange={(e) => setDestination(e.target.value)} aria-invalid={Boolean(error) || undefined} required />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="dest" className="block text-[1rem] font-medium text-ink">
            Email
          </label>
          <input id="dest" type="email" inputMode="email" autoComplete="email" className={input} value={destination} onChange={(e) => setDestination(e.target.value)} aria-invalid={Boolean(error) || undefined} required />
        </div>
      )}
      {error ? (
        <p role="alert" className="text-[1rem] text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", true)}>
        {busy ? "Sending…" : "Send code"}
      </button>
      {phoneAvailable ? (
        <button
          type="button"
          className="min-h-11 text-[1rem] text-ink underline decoration-accent underline-offset-4"
          onClick={() => {
            setChannel(channel === "sms" ? "email" : "sms");
            setDestination("");
            setError("");
          }}
        >
          {channel === "sms" ? "Use email instead" : "Use phone instead"}
        </button>
      ) : (
        <p className="text-[0.9375rem] text-body">Phone sign-in is coming soon.</p>
      )}
    </form>
  );
}

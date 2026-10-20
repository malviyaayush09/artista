import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { smsProvider } from "@/lib/auth/otp-providers";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Only same-site relative paths are allowed as a post-login destination. */
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/account");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await currentUser()) redirect(next);
  const phone = smsProvider();
  return (
    <div className="container-x max-w-md py-12 lg:py-20">
      <h1 className="text-[2.25rem]">Sign in</h1>
      <p className="mt-2 text-body">No password needed. We&apos;ll send you a one-time code. You never need an account to order.</p>
      <div className="mt-8">
        <LoginForm next={next} phoneAvailable={Boolean(phone)} phoneVia={phone?.via} />
      </div>
    </div>
  );
}

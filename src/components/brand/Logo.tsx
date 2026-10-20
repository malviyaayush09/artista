import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";
import { GinkgoMark } from "./GinkgoMark";

type Props = {
  tone?: "ink" | "paper";
  size?: "sm" | "md" | "lg";
  showSubline?: boolean;
  /** Wrap in a link to home (header/footer). */
  asLink?: boolean;
  className?: string;
};

const wordmarkSize = { sm: "text-[3rem]", md: "text-[4.75rem]", lg: "text-[2.75rem] md:text-[3.25rem]" };
const markSize = { sm: "size-6", md: "size-8", lg: "size-6" };

export function Logo({ tone = "ink", size = "md", showSubline = false, asLink = true, className = "" }: Props) {
  const color = tone === "ink" ? "text-ink" : "text-paper";

  const content = brand.logo.image ? (
    <Image src={brand.logo.image.src} width={brand.logo.image.width} height={brand.logo.image.height} alt={brand.name} preload />
  ) : (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <GinkgoMark className={`${markSize[size]} shrink-0 text-accent`} />
      <span className="flex flex-col leading-none">
        {/* Allura has one weight; a same-colour stroke thickens it cleanly (no faux bold). */}
        <span className={`font-script ${wordmarkSize[size]} leading-[1.1] [-webkit-text-stroke:0.018em_currentColor]`}>
          {brand.logo.wordmark}
          {!showSubline ? <span className="sr-only"> {brand.logo.subline}</span> : null}
        </span>
        {showSubline ? (
          <span className="eyebrow mt-0.5 !text-[0.625rem] !tracking-[0.42em] text-accent">{brand.logo.subline}</span>
        ) : null}
      </span>
    </span>
  );

  if (!asLink) return <span className={className}>{content}</span>;
  return (
    <Link href="/" className={`inline-flex min-h-11 items-center ${className}`}>
      {content}
      <span className="sr-only">, home</span>
    </Link>
  );
}

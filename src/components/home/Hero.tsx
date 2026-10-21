"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroSlides } from "@/content/home";
import { Button } from "@/components/ui/Button";

const INTERVAL_MS = 4000;

const ArrowIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
  </svg>
);

/**
 * Hero slideshow (Belagio-style): slides cross-fade every few seconds.
 * Accessibility per the WAI carousel pattern: a pause button, rotation stops
 * while hovered or focused, never auto-plays with reduced motion, hidden slides
 * are inert. All slides share one grid cell, so the height never jumps (no CLS).
 * Slide 1's photo is server-rendered and preloaded: it is the LCP image.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false); // hover / keyboard focus inside
  const startX = useRef<number | null>(null);
  const count = heroSlides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || held) return;
    const t = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [index, playing, held, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured cakes"
      className="on-ink relative overflow-hidden bg-ink text-paper"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="grid" aria-live={playing && !held ? "off" : "polite"}>
        {heroSlides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`[grid-area:1/1] transition-[opacity,visibility] duration-1000 ease-out ${active ? "visible opacity-100" : "invisible opacity-0"}`}
            >
              {/* Desktop: text on the left, photo filling the right side edge to edge (no frame, no gaps). */}
              <div className="lg:grid lg:min-h-[42rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:min-h-[46rem]">
                <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[16/9] lg:order-2 lg:aspect-auto">
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={s.image.src}
                      alt={s.image.alt}
                      fill
                      preload={i === 0}
                      fetchPriority={i === 0 ? "high" : "low"}
                      loading={i === 0 ? "eager" : "lazy"}
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className={`object-cover object-[50%_55%] transition-transform duration-[7000ms] ease-out ${active ? "scale-[1.06]" : "scale-100"}`}
                    />
                  </div>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent lg:hidden" />
                </div>

                <div
                  className={`container-x relative -mt-10 pb-24 ease-out sm:-mt-14 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:flex-col lg:justify-center lg:py-24 lg:pr-12 lg:pl-[max(var(--gutter),calc((100vw-120rem)/2+var(--gutter)))] ${
                    // Outgoing text goes at once (no half-faded text over the cross-fading photos); incoming text eases in.
                    active ? "translate-y-0 opacity-100 transition-[transform,opacity] delay-100 duration-500" : "translate-y-3 opacity-0"
                  }`}
                >
                  <p className="eyebrow text-accent">{s.eyebrow}</p>
                  {i === 0 ? (
                    <h1 className="mt-3 font-script text-[3.75rem] leading-[0.98] font-normal text-paper sm:text-[5rem] lg:text-[5.5rem] xl:text-[6.5rem]">{s.title}</h1>
                  ) : (
                    <h2 className="mt-3 font-display text-[3rem] leading-[1.02] text-paper sm:text-[4rem] lg:text-[4.25rem] xl:text-[5rem]">{s.title}</h2>
                  )}
                  <p className="mt-5 max-w-md font-display text-[1.5rem] leading-snug text-paper/90 sm:text-[1.75rem]">{s.body}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <Button href={s.cta.href} variant="accent" size="lg">
                      {s.cta.label}
                    </Button>
                    {i === 0 ? (
                      <Button href="/gift-box" variant="link-light">
                        Gift box
                      </Button>
                    ) : (
                      <Button href="/collections" variant="link-light">
                        All cakes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="flex items-center gap-1 px-3 pb-5 sm:px-5 lg:pr-6 lg:pb-8 lg:pl-[max(var(--gutter),calc((100vw-120rem)/2+var(--gutter)))]">
          <div className="pointer-events-auto flex items-center">
            {heroSlides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                aria-current={i === index ? "true" : undefined}
                className="group inline-flex h-11 items-center px-1.5"
              >
                <span className={`block h-0.5 transition-all duration-500 ${i === index ? "w-10 bg-accent" : "w-6 bg-paper/40 group-hover:bg-paper/70"}`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="pointer-events-auto ml-2 inline-flex size-11 items-center justify-center text-paper/80 hover:text-paper"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>
          <div className="pointer-events-auto ml-auto hidden items-center gap-2 lg:flex">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="inline-flex size-11 items-center justify-center border border-accent/60 text-paper hover:bg-accent hover:text-ink">
              <ArrowIcon dir="left" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="inline-flex size-11 items-center justify-center border border-accent/60 text-paper hover:bg-accent hover:text-ink">
              <ArrowIcon dir="right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

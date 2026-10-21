import { deliveryAreaLabel } from "@/config/brand";

/** Three plain facts about how we work. No counts, ratings or timing promises. */
const promises = [
  { title: "Made to order", body: "Each cake is made for your order" },
  { title: "500 g & 1 kg", body: "Every cake in two sizes" },
  { title: "Local delivery", body: `To your door in ${deliveryAreaLabel}` },
];

export function PromiseBand() {
  return (
    <section aria-label="How we work" className="on-ink bg-accent text-ink">
      <ul className="container-x container-wide grid grid-cols-3 divide-x divide-ink/20">
        {promises.map((p) => (
          <li key={p.title} className="px-1.5 py-4 text-center sm:px-3 sm:py-8">
            <p className="font-display text-[1.1875rem] leading-tight font-medium text-ink sm:text-[1.625rem] lg:text-[2.125rem]">{p.title}</p>
            <p className="mt-1 hidden text-[0.9375rem] text-ink/85 sm:block lg:text-[1rem]">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

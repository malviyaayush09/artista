import { deliveryAreaLabel } from "@/config/brand";
import { GinkgoMark } from "@/components/brand/GinkgoMark";

/** Plain facts only: no delivery-time or popularity claims. */
const messages = ["Made to order", `Delivered in ${deliveryAreaLabel}`, "Every cake in 500 g & 1 kg"];

export function AnnouncementBar() {
  return (
    <div className="on-ink bg-ink pt-[env(safe-area-inset-top)] text-paper">
      <ul className="container-x container-wide flex min-h-12 items-center justify-center text-center sm:min-h-14 lg:justify-around">
        {messages.map((m, i) => (
          <li key={m} className={`items-center gap-2.5 text-[0.9375rem] tracking-[0.04em] sm:text-[1rem] ${i === 1 ? "flex" : "hidden lg:flex"}`}>
            <GinkgoMark className="size-3.5 shrink-0 text-accent" />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

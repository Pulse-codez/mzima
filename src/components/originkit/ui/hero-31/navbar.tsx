/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { STAGE } from "@/components/originkit/ui/hero-31/stage";

function asset(file: string) {
  return `/originkit/hero-31/${file}`;
}

/**
 * Top Nav — Figma 2391:4828 (mobile) / 2391:4862 (tablet) / 2391:4904 (desktop).
 *
 * A 59px white bar across the top of an otherwise full-bleed hero. It is the one
 * opaque thing in the section, and it is what hides the top of the two vertical
 * rails, so it paints last (z-30) rather than being clipped.
 *
 * The bar and its bottom edge are full width; the row inside it is capped, so on
 * an ultrawide screen the wordmark and the CTA stay with the rest of the content
 * rather than drifting to the corners of the screen.
 *
 * The two layouts are genuinely different structures — a hamburger below 1280, a
 * link row plus a flush-right CTA block above it — so this is one of the cases
 * that earns a `hidden` pair rather than breakpoint classes on one tree.
 */

const NAV_LINKS = [
  { label: "Overview", href: "#workflow" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "How it works", href: "#how" },
  { label: "Safety", href: "#safety" },
] as const;

/** Shared pressable / focus stack — the house Button contract on a light bar. */
const CONTROL =
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] transition-[opacity,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1432] active:scale-[0.97] motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-70";

const WORDMARK =
  "font-helvetica text-[22px] leading-[1.14] tracking-[-0.03em] text-[#0E2419]";

export const Navbar = () => {
  return (
  <nav
    aria-label="Primary"
    className="relative z-30 h-[59px] w-full shrink-0 bg-white"
  >
    <div
      className={`${STAGE} flex min-h-[59px] flex-wrap items-center justify-between gap-x-[18px] gap-y-[4px] px-[16px] py-[8px]`}
    >
      <a
        href="/"
        aria-label="Mzima home"
        className={`${WORDMARK} ${CONTROL}`}
      >
        Mzima
      </a>
      <div className="flex min-h-11 items-center gap-[16px]">
        <ul className="flex flex-wrap items-center gap-x-[14px] gap-y-[2px] ipad:gap-x-[20px]">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={`flex min-h-11 items-center font-tight text-[13px] leading-[1.2] text-[#0E2419] ipad:text-[15px] ${CONTROL}`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/login"
          className={`hidden min-h-11 items-center bg-[#29AB87] px-[16px] font-tight text-[15px] font-medium text-[#081510] ${CONTROL} ipad:inline-flex [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3DDC97] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100`}
        >
          Prototype
        </a>
      </div>
    </div>
  </nav>
  );
};

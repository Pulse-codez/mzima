/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { useState } from "react";

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
  { label: "Workflow", href: "#workflow" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "How it works", href: "#how" },
  { label: "Safety", href: "#safety" },
  { label: "Questions", href: "#questions" },
] as const;

/** Shared pressable / focus stack — the house Button contract on a light bar. */
const CONTROL =
  "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] transition-[opacity,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1432] active:scale-[0.97] motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-70";

const WORDMARK =
  "font-helvetica text-[22px] leading-[1.14] tracking-[-0.03em] text-[#0E2419]";

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
  <nav
    aria-label="Primary"
    className="relative z-30 h-[59px] w-full shrink-0 bg-white"
  >
    <div
      className={`${STAGE} flex h-full items-center justify-between px-[16px] desktop-sm:hidden`}
    >
      <a
        href="/"
        aria-label="Mzima home"
        className={`${WORDMARK} ${CONTROL}`}
      >
        Mzima
      </a>
      {/* The icon is 24px sitting 16px off the edge; the negative margin lets the
          44px target grow around it without moving it. */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`-mr-[10px] flex size-11 items-center justify-center ${CONTROL}`}
      >
        <img
          src={asset("menu.svg")}
          alt=""
          aria-hidden
          className="block size-6 max-w-none"
        />
      </button>
    </div>

    {open ? (
      <div className="absolute inset-x-0 top-full z-30 border-b border-[#1B4332] bg-white px-[20px] py-[12px] desktop-sm:hidden">
        <ul className="flex flex-col">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center font-tight text-[16px] leading-[1.2] text-[#0E2419] ${CONTROL}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/login"
          className={`mt-[8px] flex min-h-11 items-center justify-center bg-[#29AB87] px-[20px] font-tight text-[16px] leading-[1.2] font-medium text-[#081510] ${CONTROL} [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3DDC97] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100`}
        >
          Sign in
        </a>
      </div>
    ) : null}

    <div
      className={`${STAGE} hidden h-full items-center justify-between desktop-sm:flex`}
    >
      <a
        href="/"
        aria-label="Mzima home"
        className={`px-[48px] ${WORDMARK} ${CONTROL}`}
      >
        Mzima
      </a>

      <div className="flex h-full items-center gap-[24px]">
        <ul className="flex items-center gap-[24px]">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`flex min-h-11 items-center font-tight text-[16px] leading-[1.2] text-[#0E2419] ${CONTROL}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Full-bleed to the right edge and full nav height — the only element in
            the design that touches a corner of the frame. */}
        <a
          href="/login"
          className={`flex h-full items-center bg-[#29AB87] px-[20px] font-tight text-[16px] leading-[1.2] font-medium text-[#081510] ${CONTROL} [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3DDC97] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100`}
        >
          Sign in
        </a>
      </div>
    </div>
  </nav>
  );
};

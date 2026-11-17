import React from 'react';
import Hero19 from '@/components/originkit/hero-19';

/**
 * Mzima hero — wraps the Originkit Hero-19 section.
 *
 * The Hero-19 canvas is deep black by default; a CSS override below shifts
 * it to Mzima's deep navy (#0B2478 → #051248) so the brand reads immediately.
 * Everything else — particle sphere, backdrop, logo marquee — stays exactly as
 * the CLI delivered it.
 */
export function Hero() {
  return (
    <>
      {/*
        Thin style block scoped to this mount-point.
        It targets `main` (the root element Section26Hero renders) and the
        backdrop images that are screen-blended against the base colour, so
        switching bg-black → navy automatically pulls the whole composition.
      */}
      <style>{`
        .mzima-hero-wrap > main {
          background: #071541 !important;
        }
        /* Pull the bottom bloom from burnt-orange → navy-cobalt */
        .mzima-hero-wrap [style*="rgba(180,52,26"] {
          background: rgba(16, 52, 166, 0.18) !important;
        }
        /* Soft Mzima-brand tint over the entire hero — sits above backdrop,
           below nav / copy, so it doesn't wash out text */
        .mzima-hero-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 60% at 50% 0%,
            rgba(16, 52, 166, 0.55) 0%,
            rgba(5, 18, 72, 0.25) 60%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
        }
        /* The orb and nav/copy sit at z-10+ in the original, so they clear z-1 */
      `}</style>
      <div className="mzima-hero-wrap relative">
        <Hero19 />
      </div>
    </>
  );
}

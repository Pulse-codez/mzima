import React from 'react';

/**
 * Hero backdrop: a deep Egyptian-blue scene with layered radial glows and a
 * subtle network diagram. Purely decorative — screen readers skip it. It stays
 * behind the hero content and never animates layout or hides text.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base deep Egyptian-blue wash */}
      <div className="absolute inset-0 bg-egyptian-deep" />

      {/* Soft off-centre spotlight so the headline reads cleanly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 22% 28%, rgba(16, 52, 166, 0.65) 0%, rgba(11, 36, 120, 0) 70%)',
        }}
      />

      {/* Stone-blue highlight on the far side */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(45% 55% at 92% 20%, rgba(125, 155, 184, 0.28) 0%, rgba(11, 36, 120, 0) 70%)',
        }}
      />

      {/* A single warm scarlet glint — accent only, never a wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(18% 25% at 85% 78%, rgba(255, 36, 0, 0.22) 0%, rgba(11, 36, 120, 0) 70%)',
        }}
      />

      {/* Network / interoperability line-art, sitting behind copy */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.22]"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A9BCD0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7D9BB8" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="hero-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#A9BCD0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7D9BB8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Facility nodes */}
        <g stroke="url(#hero-line)" strokeWidth="1.5" fill="none">
          <line x1="200" y1="760" x2="900" y2="340" />
          <line x1="420" y1="840" x2="900" y2="340" />
          <line x1="900" y1="340" x2="1360" y2="180" />
          <line x1="900" y1="340" x2="1420" y2="620" />
          <line x1="900" y1="340" x2="1220" y2="780" />
          <line x1="900" y1="340" x2="520" y2="140" />
          <line x1="900" y1="340" x2="140" y2="260" />
          <line x1="900" y1="340" x2="760" y2="60" />
        </g>

        <g>
          {[
            { cx: 900, cy: 340, r: 10 },
            { cx: 200, cy: 760, r: 5 },
            { cx: 420, cy: 840, r: 5 },
            { cx: 1360, cy: 180, r: 5 },
            { cx: 1420, cy: 620, r: 5 },
            { cx: 1220, cy: 780, r: 5 },
            { cx: 520, cy: 140, r: 5 },
            { cx: 140, cy: 260, r: 5 },
            { cx: 760, cy: 60, r: 5 },
          ].map((n) => (
            <circle key={`${n.cx}-${n.cy}`} cx={n.cx} cy={n.cy} r={n.r} fill="url(#hero-node)" />
          ))}
        </g>
      </svg>

      {/* Final darken toward the bottom so the CTAs always have a clean floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'linear-gradient(to bottom, rgba(11, 36, 120, 0) 0%, rgba(11, 36, 120, 0.75) 60%, rgba(5, 18, 72, 0.95) 100%)',
        }}
      />
    </div>
  );
}

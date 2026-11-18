import React from 'react';
import { Check } from 'lucide-react';

const checklist = [
  'Standardized MCP interface',
  'Controlled resource access',
  'Audit-ready interactions',
  'Works with existing systems',
  'Designed for Level 6 hospitals',
];

const blocks = [
  { x: 40, y: 60 },
  { x: 40, y: 210 },
  { x: 310, y: 60 },
  { x: 310, y: 210 },
];

export function About() {
  return (
    <section
      id="platform"
      className="py-24 lg:py-32"
      style={{ background: 'linear-gradient(to bottom, #0B2478 0%, #0B2478 100%)' }}
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-light">About Mzima</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-[42px]">
            A controlled connection layer for hospital workflows.
          </h2>
          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-semibold text-white">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone/25">
                  <Check className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <svg viewBox="0 0 480 360" role="img" aria-label="Facility blocks connected to a central controlled hub" className="w-full">
          <g fill="none" stroke="#7D9BB8" strokeWidth="2" strokeLinecap="round">
            {blocks.map((b) => (
              <rect key={`${b.x}-${b.y}`} x={b.x} y={b.y} width="130" height="90" rx="12" />
            ))}
            <path d="M170 105 C200 105 212 140 216 160" />
            <path d="M170 255 C200 255 212 220 216 200" />
            <path d="M310 105 C280 105 268 140 264 160" />
            <path d="M310 255 C280 255 268 220 264 200" />
          </g>
          <g fill="none" stroke="#A9BCD0" strokeWidth="1.5">
            {blocks.flatMap((b) =>
              [0, 1].flatMap((col) =>
                [0, 1].map((row) => (
                  <rect key={`${b.x}-${b.y}-${col}-${row}`} x={b.x + 18 + col * 38} y={b.y + 18 + row * 30} width="24" height="18" rx="3" />
                )),
              ),
            )}
          </g>
          <circle cx="240" cy="180" r="44" fill="#0B2478" stroke="#7D9BB8" strokeWidth="2" />
          <circle cx="240" cy="180" r="12" fill="#FF2400" />
        </svg>
      </div>
    </section>
  );
}

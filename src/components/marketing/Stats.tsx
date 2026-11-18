import React from 'react';

const proofPoints = [
  { value: 'Level 6', caption: 'Designed for Level 6 hospitals in Kenya' },
  { value: 'MCP', caption: 'A controlled connection layer for hospital systems' },
  { value: '24/7', caption: 'Built for continuous facility operations' },
  { value: 'Open Standards', caption: 'Shared, documented interfaces' },
];

export function Stats() {
  return (
    <section
      className="py-20 lg:py-28"
      style={{ background: 'linear-gradient(to bottom, #2d6a9f 0%, #D4E2EF 100%)' }}
    >
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        {proofPoints.map((point) => (
          <div key={point.value}>
            <p className="font-heading text-3xl font-extrabold text-white lg:text-[34px]">{point.value}</p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/80">{point.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

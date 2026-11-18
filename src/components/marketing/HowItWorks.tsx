import React from 'react';

const steps = [
  { num: '01', title: 'Connect', desc: 'Link existing hospital applications and operational services.' },
  { num: '02', title: 'Standardize', desc: 'Use MCP to provide a consistent, controlled interface.' },
  { num: '03', title: 'Coordinate', desc: 'Support accountable workflows across facility resources.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32" style={{ background: 'linear-gradient(to bottom, #1034A6 0%, #1a4f80 100%)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-light">How it works</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-[42px]">
            Connect, standardize, coordinate.
          </h2>
        </div>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-[30px] hidden h-px bg-stone/50 md:block" />
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <p className="font-heading text-5xl font-extrabold text-stone-light">{step.num}</p>
              <h3 className="mt-6 font-heading text-2xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-white/80">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

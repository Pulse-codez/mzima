import React from 'react';
import { Users, Microscope, Pill, FileText, Bed, Bell } from 'lucide-react';

const capabilities = [
  { title: 'Patient Flow', desc: 'Track arrivals, queue status, and movement across the facility.', Icon: Users, tone: 'text-white' },
  { title: 'Lab and Diagnostics', desc: 'Route test requests and results between systems.', Icon: Microscope, tone: 'text-white' },
  { title: 'Pharmacy', desc: 'Coordinate medication orders and supply updates.', Icon: Pill, tone: 'text-white' },
  { title: 'Records', desc: 'Share patient records across authorized systems.', Icon: FileText, tone: 'text-white' },
  { title: 'Bed Management', desc: 'View bed availability and coordinate admissions.', Icon: Bed, tone: 'text-white' },
  { title: 'Alerts', desc: 'Route urgent alerts to the right team.', Icon: Bell, tone: 'text-scarlet' },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="bg-egyptian py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-light">Capabilities</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-[42px]">
            Coordinate essential facility operations.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ title, desc, Icon, tone }) => (
            <article key={title} className="lift-hover rounded-2xl border border-stone/35 bg-egyptian-deep/70 p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-stone/20">
                <Icon className={`h-6 w-6 ${tone}`} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{desc}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-stone-light">
          Mzima coordinates workflows between systems. Clinicians remain responsible for all care decisions.
        </p>
      </div>
    </section>
  );
}

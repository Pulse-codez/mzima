import React from 'react';
import { Link as LinkIcon, Shield, Activity, Monitor } from 'lucide-react';

const features = [
  { title: 'Interoperable Systems', desc: 'Connect existing applications through shared interfaces.', Icon: LinkIcon },
  { title: 'Secure Access', desc: 'Control how services reach facility resources.', Icon: Shield },
  { title: 'Workflow Automation', desc: 'Coordinate operational tasks across systems.', Icon: Activity },
  { title: 'Intelligent Systems', desc: 'Enable bounded, accountable system interactions.', Icon: Monitor },
];

export function FeatureCards() {
  return (
    <div className="relative z-10 mx-auto -mt-20 max-w-[1200px] px-5 lg:-mt-24 lg:px-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {features.map(({ title, desc, Icon }) => (
          <article
            key={title}
            className="lift-hover rounded-2xl border border-stone/40 bg-egyptian-deep p-6 shadow-2xl shadow-black/25"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-stone/20">
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-heading text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

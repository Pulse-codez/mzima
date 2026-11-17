import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useNavigate } from '../router';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const roles = [
  { title: 'Front desk', desc: 'Register arrivals and manage the queue.' },
  { title: 'Nurse', desc: 'Complete triage and coordinate care.' },
  { title: 'Shift lead', desc: 'Review proposals and record decisions.' },
];

export default function Simulation() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-egyptian text-white">
      <Header activeIndex={4} />
      <main id="main" tabIndex={-1} className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full text-sm font-semibold text-stone-light hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </button>

          <div className="mt-8 max-w-3xl">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-stone/50 bg-egyptian-deep px-4 py-2 text-sm font-semibold">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-scarlet" />
              Prototype
            </p>
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-tight md:text-[52px]">Platform simulation</h1>
            <p className="mt-6 text-lg leading-relaxed text-white/85">
              This page is a placeholder for the simulation. The interactive workflow is not connected here yet. It will show how
              each role works through the Mzima layer using synthetic data.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {roles.map((role) => (
              <article key={role.title} className="rounded-2xl border border-stone/35 bg-egyptian-deep p-6">
                <h2 className="font-heading text-lg font-bold text-white">{role.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{role.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 max-w-3xl border-l-4 border-scarlet bg-egyptian-deep p-6">
            <p className="font-semibold text-white">Synthetic-data prototype</p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Not for live care, not diagnostic, and not for deployment in clinical settings. Every decision requires human review.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button variant="solid" size="lg" onClick={() => navigate('/sign-up')}>
              Request access
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/#capabilities')}>
              Explore platform
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

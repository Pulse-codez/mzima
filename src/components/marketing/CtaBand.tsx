import React from 'react';
import { useNavigate } from '../../router';
import { Button } from '../ui/Button';

export function CtaBand() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32" style={{ background: '#EEF3F8' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div
          className="rounded-3xl px-6 py-14 text-center sm:px-12 lg:py-20"
          style={{
            background: 'linear-gradient(135deg, #0B2478 0%, #1034A6 60%, #1a4f80 100%)',
            boxShadow: '0 32px 64px rgba(11, 36, 120, 0.22)',
          }}
        >
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-extrabold leading-tight text-white md:text-[46px]">
            Ready to connect your hospital?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            Walk through the workflow in the simulation. This is a synthetic-data prototype and is not for live care.
          </p>
          <div className="mt-10">
            <Button variant="scarlet" size="lg" onClick={() => navigate('/simulation')}>
              View simulation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

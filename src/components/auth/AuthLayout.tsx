import React from 'react';
import { Link, useNavigate } from '../../router';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'signup';
}

const copy = {
  login: {
    eyebrow: 'Staff access',
    title: 'Sign in to the clinic queue.',
    body: 'Use the account your shift lead provided. This prototype uses synthetic data only.',
  },
  signup: {
    eyebrow: 'Request access',
    title: 'A shift lead reviews every request.',
    body: 'Choose your role and site. Do not enter real patient information in this prototype.',
  },
};

/** Same dotted texture as the landing hero's wave field, drawn statically. */
const DOTS = {
  backgroundImage: 'radial-gradient(rgba(41, 171, 135, 0.45) 1.2px, transparent 1.4px)',
  backgroundSize: '16px 16px',
  maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
} as const;

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const navigate = useNavigate();
  const text = copy[variant];

  return (
    <div className="grid min-h-screen bg-forest-deep text-white lg:grid-cols-[5fr_6fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-jungle focus:px-4 focus:py-2 focus:font-tight focus:font-medium focus:text-forest-deep"
      >
        Skip to form
      </a>

      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/20 bg-forest p-12 lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={DOTS} />
        <Link to="/" aria-label="Mzima home" className="relative w-fit">
          <Logo />
        </Link>
        <div className="relative max-w-md">
          <p className="font-tight text-sm font-medium uppercase tracking-[0.14em] text-jungle-hot">{text.eyebrow}</p>
          <h2 className="mt-4 font-helvetica text-[44px] leading-[1.08] tracking-[-0.05em]">{text.title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-mist">{text.body}</p>
        </div>
        <p className="relative font-tight text-sm text-mist">Level 6 Hospitals, Kenya · Prototype</p>
      </aside>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/20 p-4 lg:border-b-0 lg:p-8">
          <Link to="/" aria-label="Mzima home" className="lg:hidden">
            <Logo />
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden font-tight text-sm text-mist sm:inline">
              {variant === 'login' ? 'No access yet?' : 'Already have access?'}
            </span>
            <Button variant="secondary" onClick={() => navigate(variant === 'login' ? '/sign-up' : '/login')}>
              {variant === 'login' ? 'Sign up' : 'Log in'}
            </Button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="auth-legacy w-full max-w-md">{children}</div>
        </main>

        <footer className="border-t border-white/20 p-4 text-center font-tight text-xs text-mist">
          Synthetic-data prototype · Not for live clinical care
        </footer>
      </section>
    </div>
  );
}
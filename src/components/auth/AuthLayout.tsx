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
    title: 'A shift lead reviews every request before anything is enabled.',
    body: 'Choose your role and site. Do not enter real patient information in this prototype.',
  },
};

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const navigate = useNavigate();
  const text = copy[variant];

  return (
    <div className="grid min-h-screen bg-egyptian text-white lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between bg-egyptian-deep p-12 lg:flex">
        <Link to="/" aria-label="Mzima home">
          <Logo />
        </Link>
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-light">{text.eyebrow}</p>
          <h2 className="mt-4 font-heading text-4xl font-extrabold leading-tight">{text.title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/85">{text.body}</p>
        </div>
        <p className="text-sm text-stone-light">Level 6 Hospitals, Kenya · Prototype</p>
      </aside>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 p-6 lg:p-8">
          <Link to="/" aria-label="Mzima home" className="lg:hidden">
            <Logo />
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/85 sm:inline">
              {variant === 'login' ? 'No access yet?' : 'Already have access?'}
            </span>
            <Button variant="outline" onClick={() => navigate(variant === 'login' ? '/sign-up' : '/login')}>
              {variant === 'login' ? 'Sign up' : 'Log in'}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="auth-legacy w-full max-w-md">{children}</div>
        </div>

        <footer className="p-6 text-center text-xs text-stone-light">
          Synthetic-data prototype · Not for live clinical care
        </footer>
      </section>
    </div>
  );
}

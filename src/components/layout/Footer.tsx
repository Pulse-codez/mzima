import React from 'react';
import { Link } from '../../router';
import { Logo } from '../ui/Logo';

const pageLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'Platform', href: '/#platform' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Simulation', href: '/simulation' },
];

const accessLinks = [
  { label: 'Log in', href: '/login' },
  { label: 'Sign up', href: '/sign-up' },
];

export function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: 'linear-gradient(to bottom, #0B2478 0%, #071541 100%)',
        borderTop: '1px solid rgba(125,155,184,0.15)',
      }}
    >
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-3 lg:px-10">
        <div>
          <Link to="/" aria-label="Mzima home">
            <Logo />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-stone-light">
            A controlled connection layer for hospital workflows.
          </p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-stone-light">
            Synthetic-data prototype. Not for live care and not diagnostic.
          </p>
        </div>

        <nav aria-label="Pages">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-white">Pages</h2>
          <ul className="mt-4 grid gap-3">
            {pageLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className="text-sm text-stone-light hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Access">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-white">Access</h2>
          <ul className="mt-4 grid gap-3">
            {accessLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className="text-sm text-stone-light hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xs text-xs leading-relaxed text-stone-light">
            Access is issued after a shift lead reviews the request.
          </p>
        </nav>
      </div>

      <div className="border-t border-stone/15">
        <p className="mx-auto max-w-[1200px] px-5 py-6 text-xs text-stone-light lg:px-10">
          © {new Date().getFullYear()} Mzima · Synthetic data only · Not for live care
        </p>
      </div>
    </footer>
  );
}

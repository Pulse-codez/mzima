import { useState } from 'react';

const LINKS = [
  { label: 'Workflow', href: '#workflow' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'How it works', href: '#how' },
  { label: 'Safety', href: '#safety' },
  { label: 'Questions', href: '#questions' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className={open ? 'landing-nav is-open' : 'landing-nav'}>
      <div className="landing-nav-inner">
        <a className="landing-wordmark" href="#top">
          Mzima
        </a>
        <button
          type="button"
          className="landing-menu"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav className="landing-nav-links" aria-label="Page">
          {LINKS.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="landing-signin" href="/login" onClick={() => setOpen(false)}>
          Sign in
        </a>
      </div>
    </header>
  );
}

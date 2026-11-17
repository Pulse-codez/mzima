import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '../../router';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { SpotlightNavbar, NavItem } from '../ui/SpotlightNavbar';
import { cn } from '../../lib/utils';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Simulation', href: '/simulation' },
];

interface HeaderProps {
  activeIndex?: number;
  /** When true, the header floats transparently over the hero and adds a backdrop as the user scrolls. */
  floating?: boolean;
}

export function Header({ activeIndex = 0, floating = false }: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!floating) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [floating]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (item: NavItem) => {
    setOpen(false);
    if (item.href.startsWith('/')) {
      navigate(item.href);
      return;
    }
    const el = document.querySelector(item.href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(`/${item.href}`);
  };

  const transparent = floating && !scrolled && !open;

  return (
    <div className={cn('sticky top-0 z-50 transition-colors duration-300', transparent ? 'bg-transparent' : 'bg-egyptian-deep/95 backdrop-blur border-b border-stone/20')}>
      {!floating && (
        <div className="border-b border-stone/15 bg-egyptian-deep">
          <div className="mx-auto flex max-w-[1200px] items-center gap-2.5 px-5 py-2 text-[13px] font-medium text-stone-light lg:px-10">
            <span role="img" aria-label="Prototype information" className="h-2 w-2 rounded-full bg-scarlet" />
            Level 6 Hospitals, Kenya
          </div>
        </div>
      )}

      <header>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-10">
          <Link to="/" aria-label="Mzima home" className="justify-self-start">
            <Logo />
          </Link>

          <div className="hidden lg:block">
            <SpotlightNavbar items={NAV_ITEMS} defaultActiveIndex={activeIndex} onItemClick={go} />
          </div>

          <div className="hidden justify-self-end gap-3 lg:flex">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Log in
            </Button>
            <Button variant="solid" onClick={() => navigate('/sign-up')}>
              Sign up
            </Button>
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-stone/40 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <nav id="mobile-menu" aria-label="Mobile navigation" className="border-t border-stone/20 bg-egyptian-deep lg:hidden">
            <ul className="mx-auto grid max-w-[1200px] gap-1 px-5 py-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => go(item)}
                    className="flex min-h-[44px] w-full items-center rounded-xl px-4 text-left text-base font-semibold text-white hover:bg-white/10"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-5 pb-5">
              <Button variant="outline" onClick={() => { setOpen(false); navigate('/login'); }}>
                Log in
              </Button>
              <Button variant="solid" onClick={() => { setOpen(false); navigate('/sign-up'); }}>
                Sign up
              </Button>
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}

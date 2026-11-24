import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface NavItem {
  label: string;
  href: string;
}

export interface SpotlightNavbarProps {
  items?: NavItem[];
  className?: string;
  onItemClick?: (item: NavItem, index: number) => void;
  defaultActiveIndex?: number;
}

export function SpotlightNavbar({
  items = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#platform' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Simulation', href: '/simulation' },
  ],
  className,
  onItemClick,
  defaultActiveIndex = 0,
}: SpotlightNavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Refs for the "light" positions so we can animate them imperatively
  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty('--spotlight-x', `${x}px`);
    };

    const handleMouseLeave = () => {
      setHoverX(null);
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
      if (activeItem) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;

        animate(spotlightX.current, targetX, {
          type: 'spring',
          stiffness: 200,
          damping: 20,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty('--spotlight-x', `${v}px`);
          },
        });
      }
    };

    nav.addEventListener('mousemove', handleMouseMove);
    nav.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      nav.removeEventListener('mousemove', handleMouseMove);
      nav.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [activeIndex]);

  // Active item ambience follows the selected link
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);

    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;

      animate(ambienceX.current, targetX, {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty('--ambience-x', `${v}px`);
        },
      });
    }
  }, [activeIndex]);

  const handleItemClick = (item: NavItem, index: number) => {
    setActiveIndex(index);
    onItemClick?.(item, index);
  };

  return (
    <div className={cn('relative flex justify-center', className)}>
      <nav
        ref={navRef}
        className={cn(
          'spotlight-nav spotlight-nav-bg glass-border spotlight-nav-shadow',
          'relative h-11 overflow-hidden rounded-full transition-all duration-300',
        )}
      >
        <ul className="relative z-[10] flex h-full items-center gap-0 px-2">
          {items.map((item, idx) => (
            <li key={item.href} className="relative flex h-full items-center justify-center">
              <a
                href={item.href}
                data-index={idx}
                aria-current={activeIndex === idx ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item, idx);
                }}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  activeIndex === idx ? 'text-white' : 'text-white/70 hover:text-white',
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* 1. Spotlight that follows the pointer */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-[1] h-full w-full transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(120px circle at var(--spotlight-x) 100%, var(--spotlight-color) 0%, transparent 50%)`,
          }}
        />

        {/* 2. Active-state ambience that rests under the current item */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-[2] h-[2px] w-full"
          style={{
            background: `radial-gradient(60px circle at var(--ambience-x) 0%, var(--ambience-color) 0%, transparent 100%)`,
          }}
        />
      </nav>

      <style>{`
        .spotlight-nav {
          --spotlight-color: rgba(125, 155, 184, 0.35);
          --ambience-color: #ff2400;
        }
      `}</style>
    </div>
  );
}

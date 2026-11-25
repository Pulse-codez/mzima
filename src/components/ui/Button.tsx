import React from 'react';

type Variant = 'primary' | 'secondary' | 'scarlet' | 'solid' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 transition-[background-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  // Forest-green system (landing hero, auth, dashboards): square, hairline, no pills.
  primary:
    'bg-jungle font-tight text-base font-medium text-forest-deep focus-visible:ring-offset-forest-deep [@media(hover:hover)_and_(pointer:fine)]:hover:bg-jungle-hot',
  secondary:
    'border border-white/40 font-tight text-base font-medium text-white focus-visible:ring-offset-forest-deep [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/10',
  // Legacy Egyptian-blue pills, still used by the header and /simulation.
  scarlet:
    'rounded-full bg-scarlet text-[19px] font-bold text-white focus-visible:ring-offset-egyptian hover:bg-[#E21F00]',
  solid:
    'rounded-full bg-stone text-[15px] font-semibold text-egyptian-deep focus-visible:ring-offset-egyptian hover:bg-stone-light',
  outline:
    'rounded-full border-2 border-stone text-[15px] font-semibold text-white focus-visible:ring-offset-egyptian hover:bg-stone/15',
  ghost:
    'rounded-full text-[15px] font-semibold text-white focus-visible:ring-offset-egyptian hover:bg-white/10',
};

const sizes: Record<Size, string> = {
  md: 'min-h-[44px] px-5',
  lg: 'min-h-[52px] px-7',
};

export function Button({ variant = 'solid', size = 'md', className = '', type = 'button', children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}
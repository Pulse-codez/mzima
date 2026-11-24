import React from 'react';

type Variant = 'scarlet' | 'solid' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-egyptian disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  scarlet: 'bg-scarlet text-[19px] font-bold text-white hover:bg-[#E21F00]',
  solid: 'bg-stone text-[15px] font-semibold text-egyptian-deep hover:bg-stone-light',
  outline: 'border-2 border-stone text-[15px] font-semibold text-white hover:bg-stone/15',
  ghost: 'text-[15px] font-semibold text-white hover:bg-white/10',
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

import React from 'react';

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-stone font-heading text-lg font-extrabold text-egyptian-deep">
        m
      </span>
      <span className="font-heading text-xl font-extrabold text-white">Mzima</span>
    </span>
  );
}

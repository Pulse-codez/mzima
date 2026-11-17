import { useNavigate } from '../router';
import React from 'react';
import { Hero } from '../sections/Hero';
import { ProblemStrip } from '../sections/ProblemStrip';
import { SolutionRows } from '../sections/SolutionRows';
import { RolesStrip } from '../sections/RolesStrip';
import { SafetyBlock } from '../sections/SafetyBlock';
import { ComparisonTable } from '../sections/ComparisonTable';
import { Faq } from '../sections/Faq';
import { ClosingCta } from '../sections/ClosingCta';

export default function Home() {
  const navigate = useNavigate();
  return (
    <main id="main">
      <Hero onNavigate={navigate} />
      <ProblemStrip />
      <SolutionRows />
      <RolesStrip />
      <SafetyBlock />
      <ComparisonTable />
      <Faq />
      <ClosingCta onNavigate={navigate} />
    </main>
  );
}

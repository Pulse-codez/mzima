import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/marketing/Hero';
import { About } from '../components/marketing/About';
import { Capabilities } from '../components/marketing/Capabilities';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { McpDiagram } from '../components/marketing/McpDiagram';
import { Stats } from '../components/marketing/Stats';
import { CtaBand } from '../components/marketing/CtaBand';

export default function Home() {
  return (
    /*
      Page palette progression — deep navy hero fades through stone-blue to white:
        Hero (deep navy #071541)
        ↓  gradient bridge
        About (#0B2478 deep navy)
        ↓
        Capabilities (#1034A6 egyptian blue)
        ↓
        HowItWorks (#1a4a7a mid-navy/stone)
        ↓
        McpDiagram (#2d6a9f stone-navy)
        ↓
        Stats (#E8EEF4 light stone-blue)
        ↓
        CtaBand (white with navy accent)
        ↓
        Footer (#0B2478)
    */
    <div className="min-h-screen text-white" style={{ background: '#071541' }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-stone focus:px-4 focus:py-2 focus:font-semibold focus:text-egyptian-deep"
      >
        Skip to main content
      </a>

      {/* Header floats transparently over the hero */}
      <Header activeIndex={0} floating />

      <main id="main" tabIndex={-1}>
        {/* ── Hero (deep navy, Originkit Hero-19) ── */}
        <Hero />

        {/* ── Gradient bridge: deep navy → section navy ── */}
        <div
          aria-hidden
          style={{
            height: 80,
            background: 'linear-gradient(to bottom, #071541 0%, #0B2478 100%)',
            marginTop: -2,
          }}
        />

        {/* ── About — deep navy ── */}
        <About />

        {/* ── Capabilities — egyptian blue (lighter than deep navy) ── */}
        <Capabilities />

        {/* ── How it works — transitioning into stone-navy ── */}
        <HowItWorks />

        {/* ── MCP Diagram — stone-navy mid-tone ── */}
        <McpDiagram />

        {/* ── Stats — light stone-blue, starts the light half ── */}
        <Stats />

        {/* ── CTA Band — crisp white with navy accents ── */}
        <CtaBand />
      </main>

      <Footer />
    </div>
  );
}

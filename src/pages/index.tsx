import React from 'react';
import Hero31 from '@/components/originkit/hero-31';
import { LandingNav } from '../components/marketing/LandingNav';
import { Idea } from '../components/marketing/Idea';
import { Capabilities } from '../components/marketing/Capabilities';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { Safety } from '../components/marketing/Safety';
import { Questions } from '../components/marketing/Questions';
import { Close } from '../components/marketing/Close';
import '../components/marketing/landing.css';

export default function Home() {
  return (
    <div className="mzima-landing" id="top">
      <a className="landing-skip" href="#workflow">
        Skip to content
      </a>
      <Hero31 />
      <LandingNav />
      <Idea />
      <Capabilities />
      <HowItWorks />
      <Safety />
      <Questions />
      <Close />
    </div>
  );
}

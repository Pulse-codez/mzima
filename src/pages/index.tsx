import React, { useEffect } from 'react';
import Hero31 from '@/components/originkit/hero-31';
import { Idea } from '../components/marketing/Idea';
import { Capabilities } from '../components/marketing/Capabilities';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { Safety } from '../components/marketing/Safety';
import { Close } from '../components/marketing/Close';
import '../components/marketing/landing.css';

export default function Home() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = document.querySelectorAll<HTMLElement>('.mzima-landing .landing-section .landing-wrap');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    sections.forEach((section) => {
      section.classList.add('landing-reveal');
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mzima-landing" id="top">
      <a className="landing-skip" href="#workflow">
        Skip to content
      </a>
      <Hero31 />
      <Idea />
      <Capabilities />
      <HowItWorks />
      <Safety />
      <Close />
    </div>
  );
}

export const SITE = {
  name: 'Mzima',
  url: 'https://mzima-pulse.vercel.app',
  description:
    'Mzima is a synthetic-data prototype for outpatient queue management, appointment coordination, and clinic scheduling in Level 6 public hospitals. It connects hospital applications to facility resources through a controlled MCP layer, with deterministic triage rules, clinician approval gates, and full audit trails.',
  titleTemplate: (title?: string) =>
    title ? `${title} | Mzima` : 'Mzima | Connecting Healthcare Systems',
  ogImage: '/originkit/hero-31/menu.svg',
  twitterHandle: '',
} as const;

export const HEALTHCARE_FACTS = [
  {
    label: 'Triage origin',
    text:
      'Triage comes from the French word trier — to sort. In busy outpatient departments, sorting by urgency can cut wait times for critical cases by more than half.',
  },
  {
    label: 'Walk-in volume',
    text:
      'The World Health Organization estimates that nearly half of all outpatient visits in Level 6 hospitals begin with walk-in registration.',
  },
  {
    label: '120-minute wait cap',
    text:
      'Mzima flags patients who have waited 120 minutes or more, promoting them in the queue before their risk of deterioration rises.',
  },
  {
    label: 'Red-flag fast track',
    text:
      'Chest pain, breathing difficulty, severe bleeding, and altered consciousness trigger red-flag fast-tracking — seen first by a clinician.',
  },
  {
    label: 'Age-weighted scoring',
    text:
      'Children under 5 and adults over 65 receive a 1.5× wait-weighting score, so their time in queue counts more toward priority.',
  },
  {
    label: 'Human validation',
    text:
      'Mzima does not auto-triage. Every priority, referral, booking, and queue change is validated by a named, authenticated clinician.',
  },
  {
    label: 'Audit trail',
    text:
      'Every queue adjustment, patient call, and booking decision is audit-logged with clinician identity, reason, and timestamp.',
  },
] as const;

function setMeta(name: string, value: string, attribute = 'name') {
  let el = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel: string, href: string, attribute = 'rel') {
  let el = document.head.querySelector(`link[${attribute}="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute(attribute, rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data: Record<string, unknown>) {
  let el = document.head.querySelector('script[type="application/ld+json"]#mzima-seo');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'mzima-seo';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function updateSEO({
  title,
  description = SITE.description,
  pathname = '/',
  type = 'website',
}: {
  title?: string;
  description?: string;
  pathname?: string;
  type?: 'website' | 'webpage';
} = {}) {
  const fullTitle = SITE.titleTemplate(title);
  const url = `${SITE.url}${pathname === '/' ? '' : pathname}`;

  document.title = fullTitle;

  setMeta('description', description);
  setMeta('robots', 'index, follow');

  setMeta('og:title', fullTitle, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:type', type, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:site_name', SITE.name, 'property');
  setMeta('og:locale', 'en_KE', 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', description);

  setLink('canonical', url);

  // JSON-LD: Organization + WebApplication for AEO / rich results
  setJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.url}#organization`,
        name: SITE.name,
        url: SITE.url,
        description:
          'Synthetic-data prototype for outpatient queue management, appointment coordination, and clinic scheduling in Kenyan Level 6 public hospitals.',
        sameAs: [],
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE.url}#app`,
        name: SITE.name,
        applicationCategory: 'MedicalApplication',
        applicationSubCategory: 'HealthcareOperations',
        url: SITE.url,
        description,
        audience: {
          '@type': 'Audience',
          audienceType:
            'Healthcare professionals and hospital administrators',
        },
        usesPlatform: 'Web',
        isFamilyFriendly: true,
      },
    ],
  });
}

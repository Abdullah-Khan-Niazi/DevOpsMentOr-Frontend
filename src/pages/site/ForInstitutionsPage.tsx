import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { SiteSpineList, type SiteSpineItem } from './components/SiteSpineList';
import './ForInstitutionsPage.css';

// ─── Verbatim Operational Pillars Copy (§5.7.3) ──────────────────────────────
const OPERATIONAL_PILLARS: SiteSpineItem[] = [
  {
    label: 'Tenant isolation',
    description: 'Dedicated namespace, database schema segmentation, independent resource caps',
  },
  {
    label: 'Instructor tooling',
    description: 'Progress dashboards, assertion pass rates, common error trend analytics',
  },
  {
    label: 'Curriculum control',
    description: 'Shared module repository with institution-specific assignment tracking',
  },
];

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '-8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

// ─── Bespoke Multi-Tenancy Connected SVG Visual (§5.7.2) ─────────────────────
// Shows 3 top namespace boxes converging via thin stroke lines into 1 shared cluster box.
function MultiTenancyConnectedVisual() {
  return (
    <div className="inst-visual-wrapper">
      <svg
        viewBox="0 0 720 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inst-visual-svg"
        role="img"
        aria-label="Multi-tenancy cluster architecture diagram showing 3 isolated namespaces connected to a single Kubernetes cluster"
      >
        {/* Connecting Lines (converging from top 3 namespaces down to bottom cluster) */}
        <path
          d="M 120 70 L 360 150"
          stroke="var(--node-stroke-dim)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path d="M 360 70 L 360 150" stroke="var(--node-stroke-dim)" strokeWidth="1.5" />
        <path
          d="M 600 70 L 360 150"
          stroke="var(--node-stroke-dim)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* TOP ROW: 3 Namespace Shapes */}
        {/* Namespace 1: University A */}
        <g transform="translate(40, 20)">
          <rect
            width="160"
            height="50"
            rx="8"
            fill="var(--color-bg-raised)"
            stroke="var(--color-border-default)"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="25" r="4" fill="var(--color-accent-500)" />
          <text
            x="32"
            y="29"
            fill="var(--color-text-primary)"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            University A
          </text>
        </g>

        {/* Namespace 2: University B */}
        <g transform="translate(280, 20)">
          <rect
            width="160"
            height="50"
            rx="8"
            fill="var(--color-bg-raised)"
            stroke="var(--color-border-default)"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="25" r="4" fill="var(--color-accent-500)" />
          <text
            x="32"
            y="29"
            fill="var(--color-text-primary)"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            University B
          </text>
        </g>

        {/* Namespace 3: Individual Users */}
        <g transform="translate(520, 20)">
          <rect
            width="160"
            height="50"
            rx="8"
            fill="var(--color-bg-raised)"
            stroke="var(--color-border-default)"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="25" r="4" fill="var(--color-text-tertiary)" />
          <text
            x="32"
            y="29"
            fill="var(--color-text-secondary)"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            Individual Users
          </text>
        </g>

        {/* BOTTOM ROW: Single Shared Kubernetes Multi-Tenant Cluster */}
        <g transform="translate(180, 150)">
          <rect
            width="360"
            height="54"
            rx="10"
            fill="var(--color-bg-sunken)"
            stroke="var(--color-accent-500)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <circle cx="24" cy="27" r="5" fill="var(--color-accent-500)" />
          <text
            x="38"
            y="31"
            fill="var(--color-text-primary)"
            fontSize="13"
            fontFamily="var(--font-mono)"
            letterSpacing="0.02em"
          >
            Kubernetes Multi-Tenant Cluster
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function ForInstitutionsPage() {
  const headerRevealRef = useScrollReveal();
  const visualRevealRef = useScrollReveal();
  const pillarsRevealRef = useScrollReveal();
  const ctaRevealRef = useScrollReveal();

  return (
    <SiteLayout>
      <div className="inst-page">
        {/* ── Block 1: Intro Conceptual Block (--color-bg-void) ───────────── */}
        <div className="inst-intro-block site-section--void">
          {/* §5.7.1 Header */}
          <section className="inst-header-section" aria-labelledby="inst-headline">
            <div className="site-container">
              <div className="site-reveal" ref={headerRevealRef}>
                <p className="inst-eyebrow">FOR UNIVERSITY PROGRAMS</p>
                <h1 id="inst-headline" className="inst-headline">
                  Standardized DevOps labs, without the infrastructure overhead.
                </h1>
              </div>
            </div>
          </section>

          {/* §5.7.2 Multi-Tenancy Visual */}
          <section className="inst-visual-section" aria-label="Multi-tenancy cluster architecture">
            <div className="site-container">
              <div className="site-reveal" ref={visualRevealRef}>
                <MultiTenancyConnectedVisual />
              </div>
            </div>
          </section>
        </div>

        {/* ── §5.7.3 Three Operational Pillars (--color-bg-base) ──────────── */}
        <section
          className="inst-pillars-section site-section--base"
          aria-label="Operational pillars"
        >
          <div className="site-container">
            <div className="site-reveal" ref={pillarsRevealRef}>
              <SiteSpineList items={OPERATIONAL_PILLARS} />
            </div>
          </div>
        </section>

        {/* ── §5.7.4 Closing CTA Section (--color-bg-void) ────────────────── */}
        <section
          className="inst-cta-section site-section--void"
          aria-label="Discuss institutional access"
        >
          <div className="site-container inst-cta-inner">
            <div className="site-reveal" ref={ctaRevealRef}>
              {/* Standalone CTA per correction #1 — restraint suits the decision-maker audience */}
              <Link
                to={`${ROUTES.CONTACT}?inquiry=institution`}
                className="inst-cta-link"
                aria-label="Discuss institutional access — opens contact form pre-filled for institutions"
              >
                <SiteButton variant="primary" withArrow size="lg">
                  Discuss institutional access
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

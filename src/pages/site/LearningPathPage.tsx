import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { CURRICULUM_PHASES, modulesForPhase } from './siteData';
import './styles/SiteSubPage.css';
import './LearningPathPage.css';

// Learning Path — the fixed 01→15 sequence (§5.2) drawn as a vertical spine
// (§5.8.2 visual language): one accent rule, tick per phase, modules beside.
// Every cohort follows this exact order; no branching, no skipping.

export default function LearningPathPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const pathRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="lp-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="lp-header site-section--void" aria-labelledby="lp-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="lp-headline" className="ssp-headline">
                One path. Fifteen checkpoints.
              </h1>
              <p className="ssp-subhead">
                From process basics to observability — every cohort runs the same modules in the
                same order. Progress is tracked, graded, and always picks up where you left off.
              </p>
            </div>
          </div>
        </section>

        {/* ── Path — vertical spine sequence ─────────────────────────────── */}
        <section className="lp-path site-section--base" aria-label="Learning path sequence">
          <div className="site-container">
            <div className="site-reveal" ref={pathRevealRef}>
              <div className="lp-track">
                <div className="lp-track__line" aria-hidden="true" />
                {CURRICULUM_PHASES.map((phase) => (
                  <div key={phase.id} className="lp-phase">
                    <div className="lp-phase__tick" aria-hidden="true" />
                    <div className="lp-phase__content">
                      <div className="lp-phase__head">
                        <div className="lp-phase__head-row">
                          <span className="lp-phase__range">{phase.range}</span>
                          <h2 className="lp-phase__label">{phase.label}</h2>
                        </div>
                        <p className="lp-phase__desc">{phase.description}</p>
                      </div>
                      <ul className="lp-modules" role="list">
                        {modulesForPhase(phase.moduleNums).map((module) => (
                          <li key={module.num} className="lp-module">
                            <span className="lp-module__num">{module.num}</span>
                            <span className="lp-module__title">{module.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Order note + links ─────────────────────────────────────────── */}
        <section className="lp-note site-section--void" aria-label="Why a fixed order">
          <div className="site-container">
            <div className="site-reveal">
              <p className="lp-note__text">
                Labs build on each other — Kubernetes assumes Docker, Docker assumes Linux. That is
                why there is exactly one path. Browse the{' '}
                <Link to={ROUTES.MODULE_CATALOG} className="ssp-text-link">
                  module catalog
                </Link>{' '}
                for the full index, or see the modules in context on the{' '}
                <Link to={ROUTES.CURRICULUM} className="ssp-text-link">
                  curriculum page
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────── */}
        <section className="ssp-cta-section site-section--base" aria-label="Start the path">
          <div className="site-container">
            <div className="site-reveal ssp-cta-inner" ref={ctaRevealRef}>
              <h2 className="ssp-cta-headline">Checkpoint 01 is waiting.</h2>
              <p className="ssp-cta-body">
                Free during the initial release — your first lab provisions in under 90 seconds.
              </p>
              <Link to={ROUTES.SIGNUP} aria-label="Start with Module 01 — create a free account">
                <SiteButton variant="primary" withArrow size="md">
                  Start with Module 01
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { Button } from '@/shared/components';
import { CURRICULUM_PHASES, modulesForPhase } from './siteData';
import './styles/SiteSubPage.css';
import './ModuleCatalogPage.css';

// Module Catalog — the canonical 15 modules from siteData, grouped by phase,
// using the same card pattern as the Curriculum page (§5.2) and homepage
// teasers (§5.1.5). Cross-linked to the Learning Path so no page is an orphan.

export default function ModuleCatalogPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const catalogRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="mc-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="mc-header site-section--void" aria-labelledby="mc-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="mc-headline" className="ssp-headline">
                Fifteen modules, indexed.
              </h1>
              <p className="ssp-subhead">
                Every module, its phase, and its focus. The same data powers the homepage teasers
                and the curriculum page —{' '}
                <Link to={ROUTES.LEARNING_PATH} className="ssp-text-link">
                  see the path
                </Link>{' '}
                or{' '}
                <Link to={ROUTES.CURRICULUM} className="ssp-text-link">
                  the full curriculum
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ── Catalog — phase groups of module cards ─────────────────────── */}
        <section className="mc-catalog site-section--base" aria-label="Module catalog">
          <div className="site-container">
            <div className="site-reveal" ref={catalogRevealRef}>
              {CURRICULUM_PHASES.map((phase) => (
                <div key={phase.id} className="mc-phase">
                  <div className="mc-phase__head">
                    <span className="mc-phase__range">{phase.range}</span>
                    <h2 className="mc-phase__label">{phase.label}</h2>
                    <p className="mc-phase__desc">{phase.description}</p>
                  </div>
                  <div className="mc-phase__grid">
                    {modulesForPhase(phase.moduleNums).map((module) => (
                      <article
                        key={module.num}
                        className="mc-module-card"
                        aria-label={`Module ${module.num}: ${module.title}`}
                      >
                        <span className="mc-module-card__num">{module.num}</span>
                        <h3 className="mc-module-card__title">{module.title}</h3>
                        <p className="mc-module-card__focus">{module.focus}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────── */}
        <section className="ssp-cta-section site-section--void" aria-label="Start the curriculum">
          <div className="site-container">
            <div className="site-reveal ssp-cta-inner" ref={ctaRevealRef}>
              <h2 className="ssp-cta-headline">Start with Module 01.</h2>
              <p className="ssp-cta-body">
                Free during the initial release — your first lab provisions in under 90 seconds.
              </p>
              <Link to={ROUTES.SIGNUP} aria-label="Start with Module 01 — create a free account">
                <Button variant="primary" withArrow size="md">
                  Start with Module 01
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

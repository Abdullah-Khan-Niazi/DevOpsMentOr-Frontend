import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { Button } from '@/shared/components';
import { ProductFrame } from './components/ProductFrame';
import './styles/SiteSubPage.css';
import './DocumentationPage.css';

// Documentation — §3.6 browser-frame grading report (fully realized mock, §2.6),
// §3.4 guide cards, and a hairline reference index (§2.3 flat list rows).

const GUIDES = [
  {
    title: 'Getting started',
    body: 'The 15-module curriculum, your first lab, and how grading works end to end.',
    to: ROUTES.CURRICULUM,
    label: 'Read the curriculum',
  },
  {
    title: 'Student labs',
    body: 'Sessions, environments, and the live assertion pipeline that grades every lab.',
    to: ROUTES.HOW_IT_WORKS,
    label: 'How labs work',
  },
  {
    title: 'Instructor console',
    body: 'Cohorts, grading, and lab authoring for university programs.',
    to: ROUTES.INSTRUCTOR_TOOLS,
    label: 'Instructor tools',
  },
  {
    title: 'Security & compliance',
    body: 'Architecture, environment isolation, and data handling.',
    to: ROUTES.SECURITY_TRUST,
    label: 'Security details',
  },
];

const REFERENCE = [
  {
    title: 'Module catalog',
    meta: 'All 15 modules, indexed',
    to: ROUTES.MODULE_CATALOG,
    label: 'Browse',
  },
  {
    title: 'Learning path',
    meta: 'The recommended order',
    to: ROUTES.LEARNING_PATH,
    label: 'View path',
  },
  { title: 'Pricing', meta: 'Tiers and limits', to: ROUTES.PRICING, label: 'See pricing' },
  { title: 'FAQ', meta: 'Access, sessions, institutions', to: ROUTES.FAQ, label: 'Open FAQ' },
];

const ASSERTIONS = [
  { pass: true, text: 'pod has required node affinity' },
  { pass: true, text: 'toleration matches taint' },
  { pass: false, text: 'topology spread constraint' },
  { pass: true, text: 'resources.requests.cpu set' },
  { pass: true, text: 'container image digest pinned' },
];

function GradingReportMock() {
  return (
    <div className="dc-report">
      <p className="dc-report__title">POD AFFINITY RULES · MODULE 07 · RUN 2</p>
      {ASSERTIONS.map((assertion) => (
        <div key={assertion.text} className="dc-report__row">
          <span
            className={`dc-report__mark ${assertion.pass ? 'dc-report__mark--pass' : 'dc-report__mark--fail'}`}
            aria-hidden="true"
          >
            {assertion.pass ? '✓' : '✗'}
          </span>
          <span className="dc-report__text">{assertion.text}</span>
          <span className={`dc-report__status ${assertion.pass ? '' : 'dc-report__status--fail'}`}>
            {assertion.pass ? 'passed' : 'failed'}
          </span>
        </div>
      ))}
      <p className="dc-report__score">4/5 assertions passed · 1 retry remaining</p>
    </div>
  );
}

export default function DocumentationPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const mockRevealRef = useScrollReveal<HTMLDivElement>();
  const guidesRevealRef = useScrollReveal<HTMLDivElement>();
  const refRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="dc-page">
        {/* ── Header + grading report ─────────────────────────────────────── */}
        <section className="dc-header site-section--void" aria-labelledby="dc-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="dc-headline" className="ssp-headline">
                Run DevOpsMentOr in an afternoon.
              </h1>
              <p className="ssp-subhead">
                The platform is small on purpose — one curriculum, one grading pipeline, one
                console. These guides cover everything there is to know.
              </p>
            </div>
          </div>
          <div className="site-container dc-mock-wrap">
            <div className="site-reveal" ref={mockRevealRef}>
              <ProductFrame
                variant="browser"
                url="app.devopsmentor.io/labs/07/report"
                className="dc-frame"
              >
                <GradingReportMock />
              </ProductFrame>
            </div>
          </div>
        </section>

        {/* ── Guides — plain cards ───────────────────────────────────────── */}
        <section className="dc-guides site-section--base" aria-labelledby="dc-guides-title">
          <div className="site-container">
            <div className="site-reveal" ref={guidesRevealRef}>
              <h2 id="dc-guides-title" className="ssp-title">
                Guides
              </h2>
              <div className="ssp-card-grid">
                {GUIDES.map((guide) => (
                  <article key={guide.title} className="ssp-card">
                    <h3 className="ssp-card__title">{guide.title}</h3>
                    <p className="ssp-card__body">{guide.body}</p>
                    <div className="ssp-card__link">
                      <Link to={guide.to} className="ssp-text-link">
                        {guide.label} →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Reference — hairline index rows ────────────────────────────── */}
        <section className="dc-ref site-section--void" aria-labelledby="dc-ref-title">
          <div className="site-container">
            <div className="site-reveal" ref={refRevealRef}>
              <h2 id="dc-ref-title" className="ssp-title">
                Reference index
              </h2>
              <div className="dc-ref-list">
                {REFERENCE.map((item) => (
                  <div key={item.title} className="dc-ref-row">
                    <h3 className="dc-ref-row__title">{item.title}</h3>
                    <div className="dc-ref-row__actions">
                      <p className="dc-ref-row__meta">{item.meta}</p>
                      <Link to={item.to} className="ssp-text-link">
                        {item.label}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────── */}
        <section className="ssp-cta-section site-section--base" aria-label="Start the curriculum">
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

import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { SiteSpineList, type SiteSpineItem } from './components/SiteSpineList';
import { ProductFrame } from './components/ProductFrame';
import './styles/SiteSubPage.css';
import './InstructorToolsPage.css';

// Instructor Tools — §3.6 browser-frame console mock (real cohort data, §2.6)
// + §5.7.3-style operational spine list. Statuses are plain text (§2.3).

const CAPABILITIES: SiteSpineItem[] = [
  {
    label: 'Live cohort grading',
    description: 'Assertions run against live cluster state — see who is stuck and where, as it happens',
  },
  {
    label: 'Lab authoring',
    description: 'The curriculum engine with versioned exercises, reference solutions, and per-module grading rules',
  },
  {
    label: 'Environment control',
    description: 'Cohort-wide spin-up, pause, and teardown of student environments — no per-student plumbing',
  },
  {
    label: 'Cohort analytics',
    description: 'Completion, error hotspots, and time-to-completion per module for next lecture planning',
  },
];

const COHORT = [
  { name: 'S. Ahmed', module: '09', progress: 73, status: 'On module 09' },
  { name: 'A. Khan', module: '11', progress: 100, status: 'Module 11 complete' },
  { name: 'M. Qureshi', module: '06', progress: 41, status: 'Stuck on Docker' },
  { name: 'H. Zafar', module: '13', progress: 85, status: 'On module 13' },
  { name: 'N. Ali', module: '14', progress: 22, status: 'On module 14' },
];

function InstructorConsoleMock() {
  return (
    <div className="it-console">
      <p className="it-console__title">COHORT CS-3A · SPRING 2026 · 42/48 ACTIVE</p>
      <div className="it-console__row it-console__row--head" aria-hidden="true">
        <span>STUDENT</span>
        <span>MODULE</span>
        <span>PROGRESS</span>
        <span>STATUS</span>
      </div>
      {COHORT.map((student) => (
        <div key={student.name} className="it-console__row">
          <span className="it-console__name">{student.name}</span>
          <span className="it-console__module">{student.module}</span>
          <span className="it-console__bar-cell">
            <span className="it-console__bar">
              <span
                className="it-console__bar-fill"
                style={{ width: `${student.progress}%` }}
              />
            </span>
            <span className="it-console__pct">{student.progress}%</span>
          </span>
          <span className="it-console__status">{student.status}</span>
        </div>
      ))}
    </div>
  );
}

export default function InstructorToolsPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const mockRevealRef = useScrollReveal<HTMLDivElement>();
  const capsRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="it-page">
        {/* ── Header + console mock ──────────────────────────────────────── */}
        <section className="it-header site-section--void" aria-labelledby="it-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="it-headline" className="ssp-headline">
                Run the lab. Watch the class.
              </h1>
              <p className="ssp-subhead">
                The instructor console turns the cluster that runs student labs into a live view of
                your cohort — who has finished, who is stuck, and where to spend lecture time.
              </p>
            </div>
          </div>
          <div className="site-container it-mock-wrap">
            <div className="site-reveal" ref={mockRevealRef}>
              <ProductFrame
                variant="browser"
                url="console.devopsmentor.io/cohorts/cs-3a"
                className="it-frame"
              >
                <InstructorConsoleMock />
              </ProductFrame>
            </div>
          </div>
        </section>

        {/* ── Capabilities — spine list (§5.7.3 pattern) ─────────────────── */}
        <section className="it-caps site-section--base" aria-label="Instructor capabilities">
          <div className="site-container">
            <div className="site-reveal" ref={capsRevealRef}>
              <SiteSpineList items={CAPABILITIES} />
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────── */}
        <section className="ssp-cta-section site-section--void" aria-label="Request instructor access">
          <div className="site-container">
            <div className="site-reveal ssp-cta-inner" ref={ctaRevealRef}>
              <h2 className="ssp-cta-headline">Bring the console to your department.</h2>
              <p className="ssp-cta-body">
                Instructor access is part of institutional deployment —{' '}
                <Link to={ROUTES.FOR_INSTITUTIONS} className="ssp-text-link">
                  see how institutions run DevOpsMentOr
                </Link>
                , or tell us about your program and we will walk through provisioning together.
              </p>
              <Link to={ROUTES.CONTACT} aria-label="Request instructor access — contact us">
                <SiteButton variant="primary" withArrow size="md">
                  Request access
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

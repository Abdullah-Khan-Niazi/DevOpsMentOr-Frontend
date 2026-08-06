import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import './styles/SiteSubPage.css';
import './CareersPage.css';

// Careers — culture as a numbered card grid (§3.4, plain mono numerals per
// §2.3), open roles as cards with precise apply actions (§2.4).

const CULTURE = [
  {
    num: '01',
    title: 'Real infrastructure',
    body: 'You will not mock Kubernetes. You will run it — clusters, pipelines, and production debugging with real consequences.',
  },
  {
    num: '02',
    title: 'Labs are the product',
    body: 'No feature-flag theater. The grader runs live assertions against real cluster state, and every change lands where students can see it.',
  },
  {
    num: '03',
    title: 'Small team, whole problems',
    body: 'Three engineers, one platform. You own the surface you touch from design to deployment.',
  },
  {
    num: '04',
    title: 'Teaching as craft',
    body: 'We write for people who are stuck: clear instructions, honest error messages, and labs that fail safely.',
  },
];

const ROLES = [
  {
    title: 'Platform Engineer',
    meta: 'Infrastructure · Remote',
    body: 'Cluster provisioning, lab runtime isolation, and the grading pipeline that asserts against live state.',
  },
  {
    title: 'Lab Author',
    meta: 'Curriculum · Remote',
    body: 'Exercise design for the 15-module curriculum — versioned labs with reference solutions and safe failure paths.',
  },
  {
    title: 'Student Success Engineer',
    meta: 'Support · Remote',
    body: 'The first line for stuck students and instructors — reproduce, fix, and turn every support case into a better lab.',
  },
];

export default function CareersPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const cultureRevealRef = useScrollReveal<HTMLDivElement>();
  const rolesRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="cr-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="cr-header site-section--void" aria-labelledby="cr-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="cr-headline" className="ssp-headline">
                Build the labs that train the next generation of engineers.
              </h1>
              <p className="ssp-subhead">
                DevOpsMentOr runs real infrastructure in the browser. We are a three-person team
                looking for people who would rather debug a cluster than argue about a roadmap.
              </p>
            </div>
          </div>
        </section>

        {/* ── Culture — numbered card grid ───────────────────────────────── */}
        <section className="cr-culture site-section--base" aria-labelledby="cr-culture-title">
          <div className="site-container">
            <div className="site-reveal" ref={cultureRevealRef}>
              <h2 id="cr-culture-title" className="ssp-title">
                How we work
              </h2>
              <div className="ssp-card-grid">
                {CULTURE.map((item) => (
                  <article key={item.num} className="ssp-card">
                    <span className="cr-card__num" aria-hidden="true">
                      {item.num}
                    </span>
                    <h3 className="ssp-card__title">{item.title}</h3>
                    <p className="ssp-card__body">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Open roles — role cards with apply actions ─────────────────── */}
        <section className="cr-roles site-section--void" aria-labelledby="cr-roles-title">
          <div className="site-container">
            <div className="site-reveal" ref={rolesRevealRef}>
              <h2 id="cr-roles-title" className="ssp-title">
                Open roles
              </h2>
              <div className="cr-roles__grid">
                {ROLES.map((role) => (
                  <article key={role.title} className="cr-role">
                    <p className="cr-role__meta">{role.meta}</p>
                    <h3 className="cr-role__title">{role.title}</h3>
                    <p className="cr-role__body">{role.body}</p>
                    <div className="cr-role__apply">
                      <Link
                        to={ROUTES.CONTACT}
                        aria-label={`Apply for ${role.title} — opens contact form`}
                      >
                        <SiteButton variant="secondary" size="sm">
                          Apply
                        </SiteButton>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────── */}
        <section className="ssp-cta-section site-section--base" aria-label="Open application">
          <div className="site-container">
            <div className="site-reveal ssp-cta-inner" ref={ctaRevealRef}>
              <h2 className="ssp-cta-headline">Do not see your role?</h2>
              <p className="ssp-cta-body">
                We hire for problems, not headcount. If you want to build labs, tell us what you
                would build first.
              </p>
              <Link to={ROUTES.CONTACT} aria-label="Get in touch about an open application">
                <SiteButton variant="primary" withArrow size="md">
                  Get in touch
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

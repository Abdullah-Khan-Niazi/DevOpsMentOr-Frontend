import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import './styles/SiteSubPage.css';
import './styles/LegalPage.css';

// Terms of Service — plain prose, token typography, §6.5 links only.

const SECTIONS = [
  {
    title: 'Acceptance',
    body: [
      'By creating an account or running a lab, you accept these terms. DevOpsMentOr is a final-year project at FAST-NUCES and is provided for educational use.',
    ],
  },
  {
    title: 'Accounts',
    body: [
      'You are responsible for the accuracy of your account information and for everything done under your credentials. Do not share accounts or credentials.',
    ],
  },
  {
    title: 'Academic integrity',
    body: [
      'Labs exist to build skill. Copying solutions defeats the grading pipeline for everyone in your cohort and may result in suspension of access.',
      'Where your institution has its own integrity policy, it applies to work completed on this platform.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'The shared cluster is for lab workloads only. Do not run production services, mining workloads, or scans of other environments.',
      'Deliberate interference with other users\u2019 environments or the grading pipeline is grounds for immediate termination.',
    ],
  },
  {
    title: 'Availability',
    body: [
      'Access during the initial release is free and provided on a best-effort basis. There is no service-level agreement, and scheduled maintenance may interrupt sessions.',
      'Lab environments are ephemeral. Save your work; assertions and progress are saved automatically to your account.',
    ],
  },
  {
    title: 'Intellectual property',
    body: [
      'The curriculum, lab content, and platform are the project\u2019s own work. You may use them for learning, not for resale or commercial redistribution.',
    ],
  },
  {
    title: 'Liability',
    body: [
      'The platform is provided as-is, without warranty of any kind. To the extent permitted by law, the project team is not liable for damages arising from use of the platform.',
      'Nothing in these terms limits liability that cannot be limited by applicable law.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'These terms may be updated as the platform evolves. Continued use after changes are published constitutes acceptance.',
    ],
  },
];

export default function TermsPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const mainRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="tm-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="lg-header site-section--void" aria-labelledby="tm-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <span className="ssp-eyebrow">Terms of Service</span>
              <h1 id="tm-headline" className="ssp-headline">
                The rules of the lab.
              </h1>
              <p className="ssp-subhead">
                Short enough to read before your first lab. The short version: be honest, break
                things in your own sandbox, and do not harm the shared cluster.
              </p>
              <p className="lg-updated">Last updated · August 2026</p>
            </div>
          </div>
        </section>

        {/* ── Sections ───────────────────────────────────────────────────── */}
        <section className="lg-main site-section--base" aria-label="Terms sections">
          <div className="site-container">
            <div className="site-reveal" ref={mainRevealRef}>
              <div className="lg-sections">
                {SECTIONS.map((section) => (
                  <div key={section.title} className="lg-section">
                    <h2 className="lg-section__title">{section.title}</h2>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="lg-section__body">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact ────────────────────────────────────────────────────── */}
        <section className="lg-cta site-section--void" aria-label="Terms contact">
          <div className="site-container">
            <div className="site-reveal" ref={ctaRevealRef}>
              <p className="lg-cta__text">
                Questions about these terms?{' '}
                <Link to={ROUTES.CONTACT} className="ssp-text-link">
                  Contact us.
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

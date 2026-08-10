import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { useScrollReveal } from './hooks';
import './AboutPage.css';

// ─── §5.4 team data ──────────────────────────────────────────────────────────
// Photos are fetched dynamically at runtime from the team profile CDN.
// If a link fails (e.g. expired signed URL), the monogram fallback renders.
interface TeamMember {
  name: string;
  initials: string;
  role: string;
  contribution: string;
  photo: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Abdullah Khan Niazi',
    initials: 'AN',
    role: 'Lead, Architecture & Frontend',
    contribution:
      'Owns the platform architecture and the public site design system — every token, component, and pattern in this interface.',
    photo:
      'https://media.licdn.com/dms/image/v2/D5603AQH-wcTNuacPqQ/profile-displayphoto-scale_400_400/B56Z4YCBrbJIAg-/0/1778519646180?e=1787788800&v=beta&t=y6tREMSWiSCQGQ9cIUonYoJNfR4QAyU438rIhhWGDSM',
  },
  {
    name: 'Muhammad Ahmed',
    initials: 'MA',
    role: 'Quality Assurance & Backend & Testing',
    contribution:
      'Runs quality assurance across the stack and owns the backend services and lab assertion pipeline that grades every exercise.',
    photo:
      'https://media.licdn.com/dms/image/v2/D4D03AQFS7-N-aCeJEg/profile-displayphoto-scale_400_400/B4DZyj6qG2GUAg-/0/1772276593885?e=1787788800&v=beta&t=CNpnwXcbgVZ9CmQggyTD4s1zHeXjcvtwhcLpi5x4Ano',
  },
  {
    name: 'Raza Sherazi',
    initials: 'RS',
    role: 'Frontend, Security & DevOps',
    contribution:
      'Owns the frontend and the security posture — session handling, secrets hygiene, and the deployment hardening of the platform.',
    photo:
      'https://media.licdn.com/dms/image/v2/D4E03AQFhBv-rR66NHw/profile-displayphoto-scale_400_400/B4EZ4OJnIHKAAg-/0/1778353866590?e=1787788800&v=beta&t=soziGR1CyHt6RU7-ssNLssEh_Gk7XIrrP3KGA_Al3kQ',
  },
];

// ─── §5.4 team photo with monogram fallback ─────────────────────────────────
// Photo frame: --radius-md, 1px --color-border-default, no card background,
// no drop shadow, no Product Frame chrome. Falls back to a monogram tile
// (initials, --font-display, --color-bg-raised bg, --color-accent-500 text)
// when the photo cannot be fetched.
function TeamPhoto({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="abt-row__monogram" aria-label={`${member.name} — no photo available`}>
        <span aria-hidden="true">{member.initials}</span>
      </div>
    );
  }

  return (
    <img
      className="abt-row__photo"
      src={member.photo}
      alt={`Photo of ${member.name}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

// ─── §5.4.2 full-width zig-zag row ───────────────────────────────────────────
function TeamRow({ member, flipped }: { member: TeamMember; flipped: boolean }) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className={`abt-row ${flipped ? 'abt-row--flip' : ''}`}>
      <div className="abt-row__text">
        <p className="abt-row__role">{member.role}</p>
        <h3 className="abt-row__name">{member.name}</h3>
        <p className="abt-row__contribution">{member.contribution}</p>
      </div>
      <div className="abt-row__visual">
        <TeamPhoto member={member} />
      </div>
    </div>
  );
}

export default function AboutPage() {
  const openingRevealRef = useScrollReveal<HTMLDivElement>();
  const contextRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="abt-page">
        {/* ── §5.4.1 Opening — editorial pull-quote, no hero banner ─────── */}
        <section className="abt-opening site-section--void" aria-labelledby="abt-quote">
          <div className="site-container">
            <div className="site-reveal" ref={openingRevealRef}>
              <h1 id="abt-quote" className="abt-opening__quote">
                We built the lab we wished we had: real infrastructure, real mistakes, and an AI
                mentor that hints instead of answers.
              </h1>
              <p className="abt-opening__body">
                DevOpsMentOr is a final-year project at FAST-NUCES — a platform where students run
                real Kubernetes labs in the browser, graded against live cluster state in seconds.
              </p>
              <p className="abt-opening__body">
                The platform is designed, built, tested, and operated by the three of us. This page
                is about who did what.
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.4.2 Team — 3 full-width zig-zag rows ─────────────────── */}
        <section className="abt-team site-section--base" aria-labelledby="abt-team-title">
          <div className="site-container">
            <h2 id="abt-team-title" className="abt-team__title">
              The team
            </h2>
            <div className="abt-team__rows">
              {TEAM.map((member, i) => (
                <TeamRow key={member.name} member={member} flipped={i % 2 === 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── §5.4.3 Institutional context strip — plain centered text ── */}
        <section className="abt-context site-section--void" aria-label="Institutional context">
          <div className="site-container">
            <div className="site-reveal" ref={contextRevealRef}>
              <p className="abt-context__text">
                A final year project at FAST-NUCES, Department of Data Science &amp; Artificial
                Intelligence, supervised by Dr. Anwar Shah.
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.4.4 Closing — soft CTA to How It Works ───────────────── */}
        <section className="abt-cta site-section--void" aria-label="Next step">
          <div className="site-container abt-cta-inner">
            <div className="site-reveal" ref={ctaRevealRef}>
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="abt-cta-link"
                aria-label="See what we built — opens how it works page"
              >
                <SiteButton variant="primary" withArrow size="lg">
                  See what we built
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

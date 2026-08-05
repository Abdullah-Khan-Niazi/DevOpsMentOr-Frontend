import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLogo } from './Logo';
import './SiteFooter.css';

// §3.2 — Grounded Footer
// Background: --color-bg-sunken, top border only, columns separated by whitespace not rules.
// No newsletter form, no app store badges.

const footerColumns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Student Labs', to: ROUTES.HOW_IT_WORKS },
      { label: 'Instructor Tools', to: ROUTES.FOR_INSTITUTIONS },
      { label: 'Institutions', to: ROUTES.FOR_INSTITUTIONS },
    ],
  },
  {
    heading: 'Curriculum',
    links: [
      { label: '15 Modules', to: ROUTES.CURRICULUM },
      { label: 'Module Catalog', to: ROUTES.CURRICULUM },
      { label: 'Learning Path', to: ROUTES.CURRICULUM },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: ROUTES.ABOUT },
      { label: 'Contact', to: ROUTES.CONTACT },
      { label: 'Careers', to: ROUTES.CONTACT },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', to: ROUTES.HOW_IT_WORKS },
      { label: 'API Reference', to: ROUTES.HOW_IT_WORKS },
      { label: 'Status', to: ROUTES.SECURITY_TRUST },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner site-container site-container--wide">
        {/* Brand block */}
        <div className="site-footer__brand">
          <Link to={ROUTES.HOME} className="site-footer__logo" aria-label="DevOpsMentOr home">
            <SiteLogo />
          </Link>
          <p className="site-footer__tagline">
            Cloud-native DevOps laboratories for university programs.
          </p>
        </div>

        {/* Link columns */}
        <nav className="site-footer__columns" aria-label="Footer navigation">
          {footerColumns.map((col) => (
            <div key={col.heading} className="site-footer__col">
              <p className="site-footer__col-heading">{col.heading}</p>
              <ul className="site-footer__col-list" role="list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="site-footer__col-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="site-footer__bottom site-container site-container--wide">
        <p className="site-footer__legal">© 2026 DevOpsMentOr · FAST-NUCES CFD</p>
        <div className="site-footer__legal-links">
          <Link to={ROUTES.SECURITY_TRUST} className="site-footer__legal-link">
            Privacy
          </Link>
          <Link to={ROUTES.SECURITY_TRUST} className="site-footer__legal-link">
            Terms
          </Link>
          <Link to={ROUTES.SECURITY_TRUST} className="site-footer__legal-link">
            Security
          </Link>
        </div>
        <div className="site-footer__social" aria-label="External links">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__social-link"
            aria-label="GitHub"
          >
            GH
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__social-link"
            aria-label="LinkedIn"
          >
            LI
          </a>
        </div>
      </div>
    </footer>
  );
}

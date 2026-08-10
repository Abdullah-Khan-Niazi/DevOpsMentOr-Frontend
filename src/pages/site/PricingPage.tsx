import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { Card } from '@/shared/components';
import { Button } from '@/shared/components';
import { SiteAccordion } from './components/SiteAccordion';
import { FAQ_CATEGORIES } from './siteData';
import './PricingPage.css';

export default function PricingPage() {
  const headerRevealRef = useScrollReveal();
  const comparisonRevealRef = useScrollReveal();
  const faqRevealRef = useScrollReveal();

  return (
    <SiteLayout>
      <div className="prc-page">
        {/* ── §5.5.1 Header Section ───────────────────────────────────────── */}
        <section className="prc-header-section site-section--void" aria-labelledby="prc-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="prc-headline" className="prc-headline">
                Pricing
              </h1>
              {/* Exact verbatim subhead per contract §5.5.1 */}
              <p className="prc-subhead">
                Individual access is free during the platform’s initial release. Institutional
                deployment is arranged directly.
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.5.2 Two-Column Comparison (Equal Visual Weight) ───────────── */}
        <section
          className="prc-comparison-section site-section--base"
          aria-label="Pricing tiers comparison"
        >
          <div className="site-container">
            <div className="site-reveal" ref={comparisonRevealRef}>
              <div className="prc-comparison-grid">
                {/* Tier 1: Individual (Free) */}
                <Card className="prc-tier-card">
                  <div className="prc-tier-header">
                    <p className="prc-tier-eyebrow">INDIVIDUAL</p>
                    <h2 className="prc-tier-price">Free</h2>
                    <p className="prc-tier-audience">For self-directed learners</p>
                  </div>

                  <ul className="prc-feature-list" aria-label="Individual features">
                    <li className="prc-feature-item">
                      <span>All 15 modules</span>
                    </li>
                    <li className="prc-feature-item">
                      <span>Personal lab sessions</span>
                    </li>
                    <li className="prc-feature-item">
                      <span>AI Mentor hints</span>
                    </li>
                  </ul>

                  <div className="prc-tier-cta">
                    <Link to={ROUTES.SIGNUP} className="prc-btn-link">
                      <Button variant="primary" size="md">
                        Start free
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Tier 2: Institution (Contact) */}
                <Card className="prc-tier-card">
                  <div className="prc-tier-header">
                    <p className="prc-tier-eyebrow">INSTITUTION</p>
                    <h2 className="prc-tier-price">Contact</h2>
                    <p className="prc-tier-audience">For university DevOps programs</p>
                  </div>

                  <ul className="prc-feature-list" aria-label="Institution features">
                    <li className="prc-feature-item">
                      <span>Everything in Individual</span>
                    </li>
                    <li className="prc-feature-item">
                      <span>Multi-tenant namespace</span>
                    </li>
                    <li className="prc-feature-item">
                      <span>Instructor dashboards</span>
                    </li>
                    <li className="prc-feature-item">
                      <span>Cohort analytics</span>
                    </li>
                  </ul>

                  <div className="prc-tier-cta">
                    <Link to={`${ROUTES.CONTACT}?inquiry=institution`} className="prc-btn-link">
                      <Button variant="secondary" size="md">
                        Contact us
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── §5.5.3 FAQ Full Accordion ───────────────────────────────────── */}
        <section className="prc-faq-section site-section--void" aria-labelledby="prc-faq-headline">
          <div className="site-container prc-faq-container">
            <div className="site-reveal" ref={faqRevealRef}>
              <h2 id="prc-faq-headline" className="prc-faq-headline">
                Frequently Asked Questions
              </h2>

              <div className="prc-faq-categories">
                {FAQ_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="prc-faq-category-block">
                    <h3 className="prc-faq-category-label">{cat.label}</h3>
                    <SiteAccordion items={cat.items} allowMultiple />
                  </div>
                ))}
              </div>

              {/* Closing line beneath accordion per §5.5.3 contract */}
              <div className="prc-faq-footer">
                <p className="prc-faq-footer-text">
                  Still have questions?{' '}
                  <Link
                    to={ROUTES.CONTACT}
                    className="prc-faq-contact-link"
                    aria-label="Contact us for further questions"
                  >
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

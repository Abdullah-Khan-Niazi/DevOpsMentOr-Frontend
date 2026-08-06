import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteCard } from './components/SiteCard';
import { SiteButton } from './components/SiteButton';
import { SiteAccordion, type AccordionItemData } from './components/SiteAccordion';
import './PricingPage.css';

// ─── §5.5.3 FAQ Accordion Data Grouped by Category ───────────────────────────

interface FaqCategory {
  id: string;
  label: string;
  items: AccordionItemData[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'access',
    label: 'ACCESS',
    items: [
      {
        id: 'access-1',
        question: 'How are lab environments provisioned?',
        answer:
          'Lab environments are provisioned automatically as ephemeral containers when you initiate a module session.',
      },
      {
        id: 'access-2',
        question: 'Do I need a credit card to get started with individual access?',
        answer:
          'No. Individual access during the platform’s initial release is completely free and requires no credit card.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'TECHNICAL',
    items: [
      {
        id: 'tech-1',
        question: 'Are environments persistent across sessions?',
        answer:
          'No. Lab environments are ephemeral by design to ensure consistent starting states and resource safety. Progress and assertions are saved to your account.',
      },
      {
        id: 'tech-2',
        question: 'What are the session limits for lab environments?',
        answer:
          'Active lab container sessions have a 2-hour continuous runtime limit before automatic teardown to preserve shared cluster resources. Assertion progress is automatically saved to your account.',
      },
      {
        id: 'tech-3',
        question: 'What prerequisites or tools do I need to install locally?',
        answer:
          'All lab tools, terminal sessions, and automated assertions run directly in your browser. No local tool installation is required.',
      },
    ],
  },
  {
    id: 'institutions',
    label: 'INSTITUTIONS',
    items: [
      {
        id: 'inst-1',
        question: 'How is institutional deployment arranged?',
        answer: 'Institutional onboarding is currently manual — contact us to arrange access.',
      },
      {
        id: 'inst-2',
        question: 'Can custom curriculum modules be integrated for university cohorts?',
        answer:
          'Custom module configuration and cohort dashboard integration are evaluated during institutional onboarding.',
      },
    ],
  },
];

export default function PricingPage() {
  const headerRevealRef = useScrollReveal();
  const comparisonRevealRef = useScrollReveal();
  const faqRevealRef = useScrollReveal();

  return (
    <SiteLayout>
      <div className="prc-page">
        {/* ── §5.5.1 Header Section ───────────────────────────────────────── */}
        <section
          className="prc-header-section site-section--void"
          aria-labelledby="prc-headline"
        >
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
                <SiteCard className="prc-tier-card">
                  <div className="prc-tier-header">
                    <p className="prc-tier-eyebrow">INDIVIDUAL</p>
                    <h2 className="prc-tier-price">Free</h2>
                    <p className="prc-tier-audience">For self-directed learners</p>
                  </div>

                  <ul className="prc-feature-list" aria-label="Individual features">
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>All 15 modules</span>
                    </li>
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>Personal lab sessions</span>
                    </li>
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>AI Mentor hints</span>
                    </li>
                  </ul>

                  <div className="prc-tier-cta">
                    <Link to={ROUTES.SIGNUP} className="prc-btn-link">
                      <SiteButton variant="primary" size="md">
                        Start free
                      </SiteButton>
                    </Link>
                  </div>
                </SiteCard>

                {/* Tier 2: Institution (Contact) */}
                <SiteCard className="prc-tier-card">
                  <div className="prc-tier-header">
                    <p className="prc-tier-eyebrow">INSTITUTION</p>
                    <h2 className="prc-tier-price">Contact</h2>
                    <p className="prc-tier-audience">For university DevOps programs</p>
                  </div>

                  <ul className="prc-feature-list" aria-label="Institution features">
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>Everything in Individual</span>
                    </li>
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>Multi-tenant namespace</span>
                    </li>
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>Instructor dashboards</span>
                    </li>
                    <li className="prc-feature-item">
                      <span className="prc-feature-check" aria-hidden="true">
                        ✓
                      </span>
                      <span>Cohort analytics</span>
                    </li>
                  </ul>

                  <div className="prc-tier-cta">
                    <Link
                      to={`${ROUTES.CONTACT}?inquiry=institution`}
                      className="prc-btn-link"
                    >
                      <SiteButton variant="secondary" size="md">
                        Contact us
                      </SiteButton>
                    </Link>
                  </div>
                </SiteCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── §5.5.3 FAQ Full Accordion ───────────────────────────────────── */}
        <section
          className="prc-faq-section site-section--void"
          aria-labelledby="prc-faq-headline"
        >
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
                    Contact us →
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

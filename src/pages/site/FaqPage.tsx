import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteAccordion } from './components/SiteAccordion';
import { FAQ_CATEGORIES } from './siteData';
import './FaqPage.css';

export default function FaqPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const faqRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="faq-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="faq-header-section site-section--void" aria-labelledby="faq-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="faq-headline" className="faq-headline">
                Frequently Asked Questions
              </h1>
              <p className="faq-subhead">
                Access, lab sessions, and institutional deployment —{' '}
                <Link to={ROUTES.PRICING} className="faq-crosslink">
                  pricing details
                </Link>{' '}
                live on the Pricing page.
              </p>
            </div>
          </div>
        </section>

        {/* ── Full accordion, grouped by category ────────────────────────── */}
        <section className="faq-main-section site-section--base" aria-label="FAQ categories">
          <div className="site-container faq-container">
            <div className="site-reveal" ref={faqRevealRef}>
              <div className="faq-categories">
                {FAQ_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="faq-category-block">
                    <h2 className="faq-category-label">{cat.label}</h2>
                    <SiteAccordion items={cat.items} allowMultiple />
                  </div>
                ))}
              </div>

              <div className="faq-footer">
                <p className="faq-footer-text">
                  Still have questions?{' '}
                  <Link to={ROUTES.CONTACT} className="faq-contact-link">
                    Contact us.
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

import { ProductFrame } from './components/ProductFrame';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import './styles/SiteSubPage.css';
import './PrivacyPage.css';

// Privacy Policy — the sudoers MOTD lecture, in a §3.6 app-window terminal
// frame. The classic lecture covers the whole policy: privacy, care, power.

export default function PrivacyPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const frameRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="pr-page">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="lg-header site-section--void" aria-labelledby="pr-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <span className="ssp-eyebrow">Privacy Policy</span>
              <h1 id="pr-headline" className="ssp-headline">
                The usual lecture.
              </h1>
            </div>
          </div>
        </section>

        {/* ── The lecture ────────────────────────────────────────────────── */}
        <section className="pr-main site-section--base" aria-label="Privacy principles">
          <div className="site-container">
            <div className="site-reveal" ref={frameRevealRef}>
              <ProductFrame variant="app" label="sudo — devopsmentor" className="pr-frame">
                <p className="pr-line">
                  We trust you have received the usual lecture from the local System Administrator.
                  It usually boils down to these three things:
                </p>
                <p className="pr-line pr-line--rule">- Respect the privacy of others.</p>
                <p className="pr-line pr-line--rule">- Think before you type.</p>
                <p className="pr-line pr-line--rule">
                  - With great power comes great responsibility.
                </p>
              </ProductFrame>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

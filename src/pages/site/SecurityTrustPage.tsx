import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteSpineList, type SiteSpineItem } from './components/SiteSpineList';
import './SecurityTrustPage.css';

// ─── Verbatim Non-Functional Requirements Copy (§5.8.2) ──────────────────────
// Pulled directly from real NFRs per contract §5.8.2 — not rewritten into marketing copy.
const SECURITY_NFR_ITEMS: SiteSpineItem[] = [
  {
    label: 'TRANSPORT SECURITY',
    description: 'TLS 1.2+ enforced on all connections',
  },
  {
    label: 'CONTAINER ISOLATION',
    description: 'Non-root privileges, ephemeral pods, automatic teardown',
  },
  {
    label: 'TENANT BOUNDARIES',
    description: 'Kubernetes namespace-level isolation',
  },
  {
    label: 'INPUT VALIDATION',
    description: 'Schema validation (Zod) on all API payloads',
  },
  {
    label: 'SESSION MGMT',
    description: 'JWT-based auth, Redis-backed revocation',
  },
];

export default function SecurityTrustPage() {
  const headerRevealRef = useScrollReveal();
  const spineRevealRef = useScrollReveal();
  const closingRevealRef = useScrollReveal();

  return (
    <SiteLayout atmosphere="sober">
      <div className="sec-page">
        {/* ── §5.8.1 Header Section ───────────────────────────────────────── */}
        <section
          className="sec-header-section site-section--void atm-section"
          aria-labelledby="sec-headline"
        >
          {/* Sober atmosphere layer per §5.8/§8 — gradient visible in both themes */}
          <div className="site-atmosphere-layer site-atmosphere-layer--sober" aria-hidden="true" />

          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="sec-headline" className="sec-headline">
                Security & Trust
              </h1>
              {/* Precise 2-sentence framing (placeholder copy marked clearly per plan) */}
              <p className="sec-subhead">
                DevOpsMentOr implements defense-in-depth across container isolation, network
                transport, and session control. Our platform is built on enterprise security
                standards to ensure safe institutional deployment.
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.8.2 Definition List With Visual Spine ───────────────────── */}
        <section
          className="sec-spine-section site-section--base"
          aria-label="Security non-functional requirements"
        >
          <div className="site-container">
            <div className="site-reveal" ref={spineRevealRef}>
              <SiteSpineList items={SECURITY_NFR_ITEMS} />
            </div>
          </div>
        </section>

        {/* ── §5.8.4 Closing Section (Plain Text Link Only — NO CTA Button) ── */}
        <section
          className="sec-closing-section site-section--void atm-section"
          aria-label="Security questions"
        >
          {/* Sober atmosphere layer — mirrors homepage final band treatment */}
          <div className="site-atmosphere-layer site-atmosphere-layer--sober" aria-hidden="true" />

          <div className="site-container sec-closing-inner">
            <div className="site-reveal" ref={closingRevealRef}>
              <p className="sec-closing-text">
                Questions about deployment security?{' '}
                <Link
                  to={ROUTES.CONTACT}
                  className="sec-contact-link"
                  aria-label="Contact us — opens contact page"
                >
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

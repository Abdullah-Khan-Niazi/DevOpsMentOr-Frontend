import { useId, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useInViewOnce, useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import {
  CURRICULUM_PHASES,
  modulesForPhase,
  type CurriculumModule,
} from './siteData';
import './CurriculumPage.css';

// §5.2 — 15 modules, phase-grouped (Foundations 01–04 / Build & Ship 05–08 /
// Orchestrate 09–11 / Automate & Observe 12–15), 4-column grids per phase,
// background hex-node texture, no corner icons/badges, scheduled-entrance
// animation per phase group (independent triggers), closing CTA.

// ─── Background hex-node texture (§5.2) ─────────────────────────────────────
// Subtle pointy-top hexagon tessellation in the node token color, theme-aware,
// inert. Hexes cannot tile on a square grid — rows are offset by half the
// in-row spacing. With circumradius R=26: hex width √3·R ≈ 45.03, height 2R,
// rows spaced 1.5·R apart and shifted √3·R/2 ≈ 22.52. The pattern tile
// therefore spans two rows: 45.03 × 78.
function HexTexture() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const patternId = `${uid}-hex`;

  const hex = (cx: number, cy: number) => {
    const p = (i: number) => {
      const angle = (-90 + i * 60) * (Math.PI / 180);
      return `${(cx + 26 * Math.cos(angle)).toFixed(2)},${(cy + 26 * Math.sin(angle)).toFixed(2)}`;
    };
    return [0, 1, 2, 3, 4, 5].map(p).join(' ');
  };

  return (
    <div className="cur-hex" aria-hidden="true">
      <svg className="cur-hex__svg" focusable="false">
        <defs>
          <pattern
            id={patternId}
            width="45.03"
            height="78"
            patternUnits="userSpaceOnUse"
          >
            <polygon points={hex(22.52, 26)} fill="none" stroke="var(--node-stroke-dim)" strokeWidth="1" />
            <polygon points={hex(45.03, 65)} fill="none" stroke="var(--node-stroke-dim)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

// ─── Module card — visually identical to the homepage teaser cards (§5.1.5) ─
function ModuleCard({ module, index }: { module: CurriculumModule; index: number }) {
  return (
    <article
      className="cur-module-card"
      style={{ '--i': index } as CSSProperties}
      aria-label={`Module ${module.num}: ${module.title}`}
    >
      <span className="cur-module-card__num">{module.num}</span>
      <h3 className="cur-module-card__title">{module.title}</h3>
      <p className="cur-module-card__focus">{module.focus}</p>
    </article>
  );
}

// ─── One phase group — own scheduled-entrance trigger (§5.2) ────────────────
function PhaseGroup({
  phaseId,
  index,
}: {
  phaseId: string;
  index: number;
}) {
  const phase = CURRICULUM_PHASES.find((p) => p.id === phaseId)!;
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.15);
  const modules = modulesForPhase(phase.moduleNums);
  // Header is void, closing CTA is base — phases alternate so no two adjacent
  // sections share a theme: base → void → base → void.
  const theme = index % 2 === 0 ? 'site-section--base' : 'site-section--void';

  return (
    <section
      className={`cur-phase site-section ${theme}`}
      aria-labelledby={`cur-phase-${phase.id}`}
    >
      <HexTexture />
      <div className="site-container">
        <div className="cur-phase__head">
          <div className="cur-phase__head-left">
            <span className="cur-phase__range">{phase.range}</span>
            <h2 id={`cur-phase-${phase.id}`} className="cur-phase__title">
              {phase.label}
            </h2>
          </div>
          <p className="cur-phase__desc">{phase.description}</p>
        </div>

        <div
          ref={ref}
          className={`cur-phase__grid ${inView ? 'cur-phase__grid--visible' : ''}`}
        >
          {modules.map((m, i) => (
            <ModuleCard key={m.num} module={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CurriculumPage() {
  const headerRevealRef = useScrollReveal<HTMLDivElement>();
  const ctaRevealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="cur-page">
        {/* ── §5.2 Header ─────────────────────────────────────────────────── */}
        <section className="cur-header-section site-section--void" aria-labelledby="cur-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="cur-headline" className="cur-headline">
                Curriculum
              </h1>
              <p className="cur-subhead">
                Fifteen modules in one fixed sequence — Foundations through Automate &amp; Observe.
                The same labs, in the same order, for every cohort.
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.2 Four phase groups ─────────────────────────────────────── */}
        {CURRICULUM_PHASES.map((phase, i) => (
          <PhaseGroup key={phase.id} phaseId={phase.id} index={i} />
        ))}

        {/* ── §5.2 Closing CTA ───────────────────────────────────────────── */}
        <section className="cur-cta-section site-section--base" aria-label="Start the curriculum">
          <div className="site-container">
            <div className="site-reveal cur-cta-inner" ref={ctaRevealRef}>
              <h2 className="cur-cta-headline">Fifteen modules, one path through.</h2>
              <p className="cur-cta-body">
                Free during the initial release — your first lab provisions in under 90 seconds.
              </p>
              <Link to={ROUTES.SIGNUP} aria-label="Start with Module 01 — create a free account">
                <SiteButton variant="primary" withArrow size="md">
                  Start with Module 01
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

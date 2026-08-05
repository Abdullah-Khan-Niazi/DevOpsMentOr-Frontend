import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { ProductFrame } from './components/ProductFrame';
import {
  useInView,
  useMediaQuery,
  useParallaxPlane,
  useReducedMotion,
  useScrollReveal,
} from './hooks';
import './HomePage.css';

// ─── Data ──────────────────────────────────────────────────────────────────────
// Canonical 15-module curriculum (phase-grouped: Foundations 01–04 / Build & Ship
// 05–08 / Orchestrate 09–11 / Automate & Observe 12–15).
const MODULES = [
  {
    num: '01',
    title: 'Operating Systems & Linux Fundamentals',
    focus: 'Processes, filesystems, shell',
  },
  { num: '02', title: 'Version Control & Git', focus: 'Branching, remotes, workflows' },
  { num: '03', title: 'Build Tools & Package Managers', focus: 'npm, pip, Makefiles' },
  {
    num: '04',
    title: 'Artifact Repository Management',
    focus: 'Storage, tagging, security scanning',
  },
  {
    num: '05',
    title: 'Cloud Computing & IaaS',
    focus: 'Instances, virtual networking, cloud storage',
  },
  { num: '06', title: 'Docker', focus: 'Images, containers, registries' },
  { num: '07', title: 'Jenkins Pipelines', focus: 'Declarative CI/CD pipelines' },
  { num: '08', title: 'AWS Services', focus: 'Core managed services' },
  { num: '09', title: 'Kubernetes', focus: 'Pods, services, scheduling' },
  { num: '10', title: 'Kubernetes on Amazon EKS', focus: 'Managed control planes' },
  { num: '11', title: 'Terraform', focus: 'Infrastructure as code' },
  { num: '12', title: 'Python Programming', focus: 'Language fundamentals' },
  { num: '13', title: 'Python Automation', focus: 'Scripting operations' },
  { num: '14', title: 'Ansible', focus: 'Configuration management' },
  { num: '15', title: 'Prometheus & Grafana', focus: 'Metrics, alerts, dashboards' },
] as const;

const HERO_LABS = ['Pod Affinity Rules', 'ConfigMap Injection', 'Ingress Rules'] as const;

// ─── §5.1.1 live lab loop ─────────────────────────────────────────────────────
// 9-second seamless loop: running lab's assertion ticks 2/5 → 4/5 → 5/5, flips to
// Complete with a 600ms accent underline sweep, then cross-fades (400ms) to the
// next queued lab becoming running. Pauses on prefers-reduced-motion → static
// final state (everything Complete except the last queued lab).
const LOOP_TOTAL_MS = 9000;
type LoopPhase = 'count-2' | 'count-4' | 'count-5' | 'sweep' | 'hold' | 'crossfade' | 'settle';
type LabStatus = 'running' | 'complete' | 'queued';

function phaseAt(t: number): LoopPhase {
  if (t < 2000) return 'count-2';
  if (t < 4000) return 'count-4';
  if (t < 5500) return 'count-5';
  if (t < 6100) return 'sweep';
  if (t < 7600) return 'hold';
  if (t < 8000) return 'crossfade';
  return 'settle';
}

interface LabLoopState {
  phase: LoopPhase;
  statuses: LabStatus[];
  hints: number;
}

function useLabLoop(labCount: number, enabled: boolean, startDelay = 0): LabLoopState {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<LoopPhase>(() => (reduced ? 'hold' : 'count-2'));
  const [statuses, setStatuses] = useState<LabStatus[]>(() =>
    Array.from({ length: labCount }, (_, i) => {
      if (reduced) return i < labCount - 1 ? 'complete' : 'queued';
      if (i === 0) return 'running';
      if (i === 1) return 'complete';
      return 'queued';
    }),
  );
  const [hints, setHints] = useState(2);
  const runningRef = useRef(0);
  // Phase applied on the last tick — guards one-shot transitions so they fire
  // exactly once per loop cycle (updaters must stay pure: React dev-mode
  // StrictMode double-invokes them).
  const lastPhaseRef = useRef<LoopPhase>('count-2');

  useEffect(() => {
    if (reduced || !enabled) return;

    const intervalId: { current: number | null } = { current: null };
    const delayId = window.setTimeout(() => {
      const start = performance.now();
      intervalId.current = window.setInterval(() => {
        const t = (performance.now() - start) % LOOP_TOTAL_MS;
        const next = phaseAt(t);

        if (lastPhaseRef.current !== next) {
          if (next === 'sweep') {
            const idx = runningRef.current;
            setStatuses((s) => s.map((st, i) => (i === idx ? 'complete' : st)));
            setHints((h) => h + 1);
          } else if (next === 'crossfade') {
            const nxt = (runningRef.current + 1) % labCount;
            runningRef.current = nxt;
            setStatuses((s) => s.map((st, i) => (i === nxt ? 'running' : st)));
          }
          lastPhaseRef.current = next;
        }

        setPhase((prev) => (prev === next ? prev : next));
      }, 150);
    }, startDelay);

    return () => {
      window.clearTimeout(delayId);
      if (intervalId.current !== null) window.clearInterval(intervalId.current);
    };
  }, [reduced, enabled, labCount, startDelay]);

  return { phase, statuses, hints };
}

function assertionFor(phase: LoopPhase): number {
  if (phase === 'count-4') return 4;
  if (phase === 'count-5' || phase === 'sweep' || phase === 'hold') return 5;
  return 2;
}

// ─── Dashboard building blocks ─────────────────────────────────────────────────

function DashboardRow({
  name,
  status,
  subline,
  sweeping,
  entering,
}: {
  name: string;
  status: LabStatus;
  subline?: string;
  sweeping?: boolean;
  entering?: boolean;
}) {
  return (
    <div
      className={[
        'hp-dash-row',
        `hp-dash-row--${status}`,
        sweeping ? 'hp-dash-row--sweeping' : '',
        entering ? 'hp-dash-row--entering' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="hp-dash-row__name">{name}</span>
      <span className="hp-dash-row__status">{status}</span>
      {subline && <span className="hp-dash-row__sub">{subline}</span>}
      {sweeping && <span className="hp-dash-row__sweep" key={name} />}
    </div>
  );
}

function ModuleProgressHeader() {
  return (
    <div className="hp-dash__header">
      <div className="hp-dash__title-row">
        <span className="hp-dash__module">Module 09 — Kubernetes</span>
        <span className="hp-dash__pct">73%</span>
      </div>
      <div className="hp-dash__bar" aria-hidden="true">
        <span className="hp-dash__bar-fill" />
      </div>
    </div>
  );
}

// The live lab queue — hero (3 rows) and Product Showcase (with rail + footer).
function LabQueue({
  loop,
  staticRows = [],
  showFooter = false,
  showRail = false,
}: {
  loop: LabLoopState;
  staticRows?: Array<{ name: string; status: LabStatus }>;
  showFooter?: boolean;
  showRail?: boolean;
}) {
  const { phase, statuses } = loop;
  const runningAssertion = assertionFor(phase);
  const completing = phase === 'sweep' || phase === 'hold';

  return (
    <div className="hp-dash">
      {showRail && <ModuleRail />}
      <div className="hp-dash__main">
        <ModuleProgressHeader />
        <div className="hp-dash__rows">
          {HERO_LABS.map((lab, i) => {
            const status = statuses[i];
            const isRunning = status === 'running';
            const isCompleting = completing && status === 'complete' && runningAssertion === 5;
            return (
              <DashboardRow
                key={lab}
                name={lab}
                status={status}
                subline={
                  isRunning
                    ? `assertion ${runningAssertion}/5 passed · retrying…`
                    : isCompleting
                      ? 'assertion 5/5 passed'
                      : undefined
                }
                sweeping={isCompleting && phase === 'sweep'}
                entering={phase === 'crossfade' && isRunning}
              />
            );
          })}
          {staticRows.map((row) => (
            <DashboardRow key={row.name} name={row.name} status={row.status} />
          ))}
        </div>
        {showFooter && (
          <div className="hp-dash__footer">
            <span className="hp-dash__rate">Assertion pass rate — 93% this week</span>
            <Link to={ROUTES.CURRICULUM} className="hp-dash__continue">
              Continue Module 09
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleRail() {
  return (
    <div className="hp-rail" aria-hidden="true">
      {MODULES.map((m) => (
        <span
          key={m.num}
          className={`hp-rail__item ${m.num === '09' ? 'hp-rail__item--current' : ''}`}
        >
          {m.num}
        </span>
      ))}
    </div>
  );
}

// ─── Section 2: Hero — Dominant Product Canvas ────────────────────────────────
function HeroSection() {
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const loop = useLabLoop(HERO_LABS.length, true, reduced ? 0 : 1300);
  const atmoRef = useParallaxPlane<HTMLDivElement>(0.4, isDesktop && !reduced);
  const frameRef = useParallaxPlane<HTMLDivElement>(1.15, isDesktop && !reduced);

  return (
    <section className="hp-hero site-section--void" aria-labelledby="hp-hero-title">
      {/* Atmosphere — fixed feel, slow 12s breathing pulse (homepage only) */}
      <div className="hp-hero__atmosphere" aria-hidden="true" ref={atmoRef} />

      <div className="site-container">
        <div className="hp-hero__text">
          <p className="hp-hero__eyebrow">FOR UNIVERSITY DEVOPS PROGRAMS</p>
          <h1 id="hp-hero-title" className="hp-hero__title">
            Real containers. Real clusters.
            <br />
            Zero local setup.
          </h1>
          <p className="hp-hero__sub">
            Launch isolated Docker and Kubernetes labs in your browser, graded automatically,
            debugged with guardrailed AI hints.
          </p>
          <div className="hp-hero__ctas">
            <Link to={ROUTES.SIGNUP} className="hp-hero__cta-link">
              <SiteButton variant="primary" size="lg" withArrow>
                Start free
              </SiteButton>
            </Link>
            <Link to={ROUTES.HOW_IT_WORKS} className="hp-hero__cta-link">
              <SiteButton variant="ghost" size="lg">
                See how it works
              </SiteButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Dominant product canvas — wider than the text above it */}
      <div className="hp-hero__frame-wrap" ref={frameRef}>
        <div className="hp-hero__frame-enter">
          <ProductFrame variant="browser" url="app.devopsmentor.io/dashboard">
            <LabQueue loop={loop} />
          </ProductFrame>
          <div className="hp-hero__capsule" aria-live="polite">
            <span className="hp-hero__capsule-label">AI Mentor:</span> {loop.hints} hints given this
            session
          </div>
          <div className="hp-hero__glow" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Trust Bar ──────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className="hp-trust">
      <p className="hp-trust__line">
        Built on the same infrastructure primitives used in production:{' '}
        <span className="hp-trust__tech">Docker · Kubernetes · MySQL · Redis</span>
      </p>
    </div>
  );
}

// ─── Section 4: Product Showcase — "One dashboard. Three views." ──────────────
type ShowcaseTab = 'dashboard' | 'terminal' | 'analytics';
const SHOWCASE_TABS: Array<{ id: ShowcaseTab; label: string }> = [
  { id: 'dashboard', label: 'Student Dashboard' },
  { id: 'terminal', label: 'Lab Terminal' },
  { id: 'analytics', label: 'Instructor Analytics' },
];

const ANALYTICS_DATA = [
  { module: '05', pct: 87 },
  { module: '06', pct: 81 },
  { module: '07', pct: 74 },
  { module: '08', pct: 68 },
  { module: '09', pct: 61 },
] as const;

function ShowcaseAnalyticsChart({ active }: { active: boolean }) {
  return (
    <div className="hp-analytics">
      <svg
        viewBox="0 0 360 150"
        className="hp-analytics__chart"
        role="img"
        aria-label="Cohort completion by module — 5 module window"
      >
        <line className="hp-analytics__baseline" x1="24" y1="130" x2="336" y2="130" />
        {ANALYTICS_DATA.map((d, i) => {
          const x = 36 + i * 66;
          const h = (d.pct / 100) * 104;
          return (
            <g key={d.module}>
              <rect
                className={`hp-analytics__bar ${active ? 'hp-analytics__bar--active' : ''}`}
                x={x}
                y={130 - h}
                width="34"
                height={h}
                rx="2"
              />
              <text className="hp-analytics__label" x={x + 17} y="146">
                {d.module}
              </text>
              <text className="hp-analytics__pct" x={x + 17} y={130 - h - 6}>
                {d.pct}%
              </text>
            </g>
          );
        })}
      </svg>
      <p className="hp-analytics__error">
        common error —{' '}
        <span className="hp-analytics__error-code">
          23% of students fail on `kubectl apply` namespace mismatch
        </span>
      </p>
    </div>
  );
}

function ShowcaseTerminalPane() {
  return (
    <div className="hp-terminal">
      <p className="hp-terminal__line">
        <span className="hp-terminal__prompt">$</span> kubectl apply -f pod-affinity.yaml
      </p>
      <p className="hp-terminal__line hp-terminal__output">
        deployment.apps/pod-affinity-demo created
      </p>
      <p className="hp-terminal__line">
        <span className="hp-terminal__prompt">$</span> kubectl rollout status
        deploy/pod-affinity-demo
      </p>
      <p className="hp-terminal__line hp-terminal__output">
        deployment &quot;pod-affinity-demo&quot; successfully rolled out
      </p>
      <p className="hp-terminal__line hp-terminal__pass">✓ assertion 5/5 passed</p>
      <p className="hp-terminal__line">
        <span className="hp-terminal__prompt">$</span> devopsmentor hint
      </p>
      <p className="hp-terminal__line hp-terminal__hint">
        hint — check spec.scheduling.podAffinity: the demo pod must be co-located with the gateway.
      </p>
    </div>
  );
}

function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('dashboard');
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const revealRef = useScrollReveal<HTMLDivElement>();
  const loop = useLabLoop(HERO_LABS.length, inView && activeTab === 'dashboard');

  // §5.1.3: Student Dashboard is default-active on every scroll-into-view.
  // Adjusted during render (React's documented pattern), not via an effect.
  const [wasInView, setWasInView] = useState(inView);
  if (wasInView !== inView) {
    setWasInView(inView);
    if (inView) setActiveTab('dashboard');
  }

  const activeIndex = SHOWCASE_TABS.findIndex((t) => t.id === activeTab);
  const frameVariant = activeTab === 'terminal' ? 'app' : 'browser';
  const frameUrl =
    activeTab === 'analytics' ? 'app.devopsmentor.io/analytics' : 'app.devopsmentor.io/dashboard';

  return (
    <section
      className="hp-showcase site-section--base"
      aria-labelledby="hp-showcase-title"
      ref={ref}
    >
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-showcase-title" className="hp-showcase__title">
            One dashboard. Three views.
          </h2>
          <p className="hp-showcase__sub">
            What students, instructors, and the mentor pipeline each see from the same lab session.
          </p>

          <div className="hp-tabs" role="tablist" aria-label="Product surfaces">
            {SHOWCASE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`hp-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`hp-pane-${tab.id}`}
                className={`hp-tabs__item ${activeTab === tab.id ? 'hp-tabs__item--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <span
              className="hp-tabs__underline"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
          </div>
        </div>
      </div>

      {/* Full-bleed frame, chrome switches with the tab */}
      <div className="hp-showcase__frame-wrap">
        <ProductFrame variant={frameVariant} url={frameUrl} label="bash — devopsmentor">
          <div className="hp-showcase__panes">
            <div
              id="hp-pane-dashboard"
              role="tabpanel"
              aria-labelledby="hp-tab-dashboard"
              className={`hp-showcase__pane ${activeTab === 'dashboard' ? 'hp-showcase__pane--active' : ''}`}
            >
              <LabQueue
                loop={loop}
                showRail
                showFooter
                staticRows={[
                  { name: 'Resource Quotas', status: 'complete' },
                  { name: 'Horizontal Pod Autoscaling', status: 'complete' },
                  { name: 'Network Policies', status: 'queued' },
                ]}
              />
            </div>
            <div
              id="hp-pane-terminal"
              role="tabpanel"
              aria-labelledby="hp-tab-terminal"
              className={`hp-showcase__pane ${activeTab === 'terminal' ? 'hp-showcase__pane--active' : ''}`}
            >
              <ShowcaseTerminalPane />
            </div>
            <div
              id="hp-pane-analytics"
              role="tabpanel"
              aria-labelledby="hp-tab-analytics"
              className={`hp-showcase__pane ${activeTab === 'analytics' ? 'hp-showcase__pane--active' : ''}`}
            >
              <ShowcaseAnalyticsChart active={activeTab === 'analytics'} />
            </div>
          </div>
        </ProductFrame>
      </div>
    </section>
  );
}

// ─── Sections 5–6: Feature Modules (zig-zag) ─────────────────────────────────
function FeatureGradingSection() {
  const textRef = useScrollReveal<HTMLDivElement>();
  const visualRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hp-fm site-section--void" aria-labelledby="hp-fm1-title">
      <div className="site-container hp-fm__grid">
        <div className="site-reveal hp-fm__text hp-fm__text--left" ref={textRef}>
          <h2 id="hp-fm1-title" className="hp-fm__title">
            Every lab is graded, not just run.
          </h2>
          <p className="hp-fm__body">
            Each lab ships with a grading sidecar that watches the real container — not a review
            queue. Assertions evaluate live cluster state as you work, so a lab passes or fails
            within seconds of your action. Nothing waits for a round of manual checks.
          </p>
        </div>
        <div className="site-reveal hp-fm__visual hp-fm__visual--right" ref={visualRef}>
          <ProductFrame variant="app" label="bash — devopsmentor">
            <div className="hp-terminal">
              <p className="hp-terminal__line">
                <span className="hp-terminal__prompt">$</span> kubectl apply -f pod-affinity.yaml
              </p>
              <p className="hp-terminal__line hp-terminal__output">
                deployment.apps/pod-affinity-demo created
              </p>
              <p className="hp-terminal__line">
                <span className="hp-terminal__prompt">$</span> kubectl rollout status
                deploy/pod-affinity-demo
              </p>
              <p className="hp-terminal__line hp-terminal__output">
                deployment &quot;pod-affinity-demo&quot; successfully rolled out
              </p>
              <p className="hp-terminal__line hp-terminal__pass">✓ assertion 5/5 passed</p>
            </div>
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}

function FeatureCurriculumSection() {
  const textRef = useScrollReveal<HTMLDivElement>();
  const visualRef = useScrollReveal<HTMLDivElement>();
  const preview = MODULES.slice(0, 4);

  return (
    <section className="hp-fm site-section--base" aria-labelledby="hp-fm2-title">
      <div className="site-container hp-fm__grid hp-fm__grid--flip">
        <div className="site-reveal hp-fm__text hp-fm__text--right" ref={textRef}>
          <h2 id="hp-fm2-title" className="hp-fm__title">
            Built from a fixed curriculum, not ad-hoc content.
          </h2>
          <p className="hp-fm__body">
            Fifteen modules run the same sequence for every student — Foundations through Automate
            &amp; Observe. A Module 09 lab can assume everything from Modules 01–08, because every
            cohort worked the same path. Instructors configure cohorts, not course content.
          </p>
        </div>
        <div className="site-reveal hp-fm__visual hp-fm__visual--left" ref={visualRef}>
          <div className="hp-fm__grid-wrap">
            <div className="hp-module-grid">
              {preview.map((m) => (
                <ModuleCard key={m.num} num={m.num} title={m.title} focus={m.focus} />
              ))}
            </div>
            <Link
              to={ROUTES.CURRICULUM}
              className="hp-fm__nav-arrow"
              aria-label="View the full curriculum"
            >
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Stat Strip ────────────────────────────────────────────────────
const STATS = [
  { value: '90 sec', label: 'Pod provisioning' },
  { value: '15', label: 'DevOps modules' },
  { value: '3', label: 'Isolated tenant roles' },
] as const;

function StatStripSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-stats site-section--void" aria-label="Platform statistics">
      <div className="site-container">
        <div className="site-reveal hp-stats__row" ref={revealRef}>
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`hp-stats__item ${i > 0 ? 'hp-stats__item--divided' : ''}`}
            >
              <span className="hp-stats__value">{stat.value}</span>
              <span className="hp-stats__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 8: Services Bento Grid ───────────────────────────────────────────
function DockerfileFragment() {
  return (
    <div className="hp-bento__code" aria-hidden="true">
      <span className="hp-bento__code-line">
        <span className="hp-bento__code-kw">FROM</span> node:20-alpine
      </span>
      <span className="hp-bento__code-line">
        <span className="hp-bento__code-kw">COPY</span> . /app
      </span>
      <span className="hp-bento__code-line">
        <span className="hp-bento__code-kw">RUN</span> npm ci --omit=dev
      </span>
      <span className="hp-bento__code-line">
        <span className="hp-bento__code-kw">CMD</span> [&quot;node&quot;, &quot;serve.js&quot;]
      </span>
    </div>
  );
}

const BENTO_TILES = [
  {
    title: 'Container Labs',
    body: 'Isolated Docker and Kubernetes environments on demand.',
  },
  {
    title: 'AI Mentor',
    body: 'Guardrailed hints generated from real terminal output.',
  },
  {
    title: 'Automated Assessment',
    body: 'Assertions verify the state of your live containers.',
  },
  {
    title: 'Multi-Tenancy',
    body: 'A namespace isolates every tenant on one shared cluster.',
  },
  {
    title: 'Instructor Analytics',
    body: 'Cohort completion trends and common-error signals.',
  },
  {
    title: 'Institution & Admin',
    body: 'Cohort, course, and access administration in one place.',
  },
] as const;

function BentoSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const [large, ...small] = BENTO_TILES;

  return (
    <section className="hp-bento site-section--void" aria-labelledby="hp-bento-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-bento-title" className="hp-bento__title">
            Architectural Toolkit
          </h2>
          <div className="hp-bento__grid">
            <div className="hp-bento__tile hp-bento__tile--large">
              <h3 className="hp-bento__tile-title">{large.title}</h3>
              <p className="hp-bento__tile-body">{large.body}</p>
              <DockerfileFragment />
            </div>
            {small.map((tile) => (
              <div key={tile.title} className="hp-bento__tile">
                <h3 className="hp-bento__tile-title">{tile.title}</h3>
                <p className="hp-bento__tile-body">{tile.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Curriculum Teaser ─────────────────────────────────────────────
function CurriculumTeaserSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const preview = MODULES.slice(0, 5);

  return (
    <section className="hp-teaser site-section--base" aria-labelledby="hp-teaser-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-teaser-title" className="hp-teaser__title">
            The curriculum, in order.
          </h2>
          <p className="hp-teaser__sub">
            Fifteen modules, the same sequence for every cohort — Foundations through Automate &amp;
            Observe.
          </p>
          <div className="hp-teaser__row">
            {preview.map((m) => (
              <ModuleCard key={m.num} num={m.num} title={m.title} focus={m.focus} />
            ))}
            <Link to={ROUTES.CURRICULUM} className="hp-teaser__all">
              <span className="hp-teaser__all-label">View all 15 modules</span>
              <span className="hp-teaser__all-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 10: How It Works (compressed) ────────────────────────────────────
const HIW_STEPS = [
  {
    num: '01',
    title: 'Launch a lab in your browser',
    body: 'No local Docker, no port conflicts — provisioned in under 90 seconds.',
  },
  {
    num: '02',
    title: 'Work in a real terminal environment',
    body: 'Every command runs against actual containers and cluster APIs.',
  },
  {
    num: '03',
    title: 'Get instant, guardrailed feedback',
    body: 'Assertions grade your work live; the AI Mentor hints, never answers.',
  },
] as const;

function HowItWorksSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hp-hiw site-section--void" aria-labelledby="hp-hiw-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <div className="hp-hiw__flow-wrap" aria-hidden="true">
            <svg className="hp-hiw__flow" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line className="hp-hiw__flow-track" x1="0" y1="1" x2="100" y2="1" />
              <line className="hp-hiw__flow-line" x1="0" y1="1" x2="100" y2="1" />
            </svg>
          </div>
          <div className="hp-hiw__steps">
            {HIW_STEPS.map((step) => (
              <div key={step.num} className="hp-hiw__step">
                <span className="hp-hiw__num">{step.num}</span>
                <h3 className="hp-hiw__title">{step.title}</h3>
                <p className="hp-hiw__body">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="hp-hiw__link">
            <Link to={ROUTES.HOW_IT_WORKS} className="hp-hiw__ghost-link">
              See the full 7-step lifecycle
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 11: Mechanism block ──────────────────────────────────────────────
const MECHANISMS = [
  {
    title: 'No local setup',
    body: 'Every lab runs in the cloud. No dependency conflicts.',
  },
  {
    title: 'Real infrastructure',
    body: 'Docker and Kubernetes, not simulations. What you learn transfers to production tooling.',
  },
  {
    title: 'Instant feedback',
    body: 'Assertions run the moment you act — no waiting for manual grading.',
  },
] as const;

function MechanismSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-mech site-section--void" aria-labelledby="hp-mech-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-mech-title" className="hp-mech__title">
            Why we built this
          </h2>
          <div className="hp-mech__grid">
            {MECHANISMS.map((m) => (
              <div key={m.title} className="hp-mech__item">
                <h3 className="hp-mech__item-title">{m.title}</h3>
                <p className="hp-mech__item-body">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 12: For Institutions teaser ──────────────────────────────────────
function InstitutionsTeaserSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-inst site-section--base" aria-labelledby="hp-inst-title">
      <div className="site-container">
        <div className="site-reveal hp-inst__inner" ref={revealRef}>
          <h2 id="hp-inst-title" className="hp-inst__title">
            Every cohort in its own namespace.
          </h2>
          <p className="hp-inst__body">
            Cohorts run on one shared cluster, isolated by Kubernetes namespaces — no duplicated
            infrastructure. Course teams manage students, labs, and access from a single admin
            surface.
          </p>
          <Link to={ROUTES.FOR_INSTITUTIONS} className="hp-inst__link">
            Explore institutional access
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section 13: Final CTA band ───────────────────────────────────────────────
function FinalCtaSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-final site-section--raised" aria-labelledby="hp-final-title">
      <div className="hp-final__atmosphere" aria-hidden="true" />
      <div className="site-container">
        <div className="site-reveal hp-final__inner" ref={revealRef}>
          <h2 id="hp-final-title" className="hp-final__title">
            Run your first container lab in the next 90 seconds.
          </h2>
          <Link to={ROUTES.SIGNUP} className="hp-final__cta-link">
            <SiteButton variant="primary" size="lg">
              Start free
            </SiteButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Module card (Curriculum styling — reused in FM2 + teaser) ────────────────
function ModuleCard({ num, title, focus }: { num: string; title: string; focus: string }) {
  return (
    <article className="hp-module-card">
      <span className="hp-module-card__num">{num}</span>
      <h3 className="hp-module-card__title">{title}</h3>
      <p className="hp-module-card__focus">{focus}</p>
    </article>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />
      <TrustBar />
      <ProductShowcaseSection />
      <FeatureGradingSection />
      <FeatureCurriculumSection />
      <StatStripSection />
      <BentoSection />
      <CurriculumTeaserSection />
      <HowItWorksSection />
      <MechanismSection />
      <InstitutionsTeaserSection />
      <FinalCtaSection />
    </SiteLayout>
  );
}

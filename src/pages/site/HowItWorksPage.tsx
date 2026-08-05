import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMediaQuery, useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteButton } from './components/SiteButton';
import { ProductFrame } from './components/ProductFrame';
import './HowItWorksPage.css';

// ─── §6.2 useScrollSpy ────────────────────────────────────────────────────────
// Custom IntersectionObserver hook — no library.
// Returns the 0-based index of the step currently most visible in the viewport.
// Fires once per crossing threshold; does not replay on re-entry of the same element.
function useScrollSpy(stepRefs: React.RefObject<HTMLElement | null>[]): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intersecting = new Map<Element, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          intersecting.set(entry.target, entry.isIntersecting);
        });
        // Find the topmost currently-intersecting step
        let found = -1;
        stepRefs.forEach((ref, i) => {
          if (ref.current && intersecting.get(ref.current) && found === -1) {
            found = i;
          }
        });
        if (found !== -1) setActiveIndex(found);
      },
      // rootMargin: top 10% and bottom 40% dead zones — active step tracks
      // what's in the readable center of the viewport, not just any intersection.
      { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' },
    );

    stepRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return activeIndex;
}

// ─── Step data ────────────────────────────────────────────────────────────────
// Mechanism-focused copy per §2.3 — each headline states a mechanism; each body
// adds one fact. No filler.
const STEPS = [
  {
    id: 'step-01',
    num: '01',
    eyebrow: 'AUTHENTICATE',
    heading: 'Your session is verified before any lab resource is allocated.',
    body: 'JWT tokens are validated by the API Gateway before a request reaches the lab provisioner, ensuring isolated billing and audit trails per user.',
  },
  {
    id: 'step-02',
    num: '02',
    eyebrow: 'PROVISION',
    heading: 'A dedicated namespace is created on the shared cluster in under 90 seconds.',
    body: 'The Lab Provisioner Service applies a tenant-scoped Kubernetes manifest, spinning up ephemeral pods with non-root privileges and resource caps.',
  },
  {
    id: 'step-03',
    num: '03',
    eyebrow: 'CONNECT',
    heading: 'A terminal session is opened directly in your browser.',
    body: 'WebSocket tunnels your input to the running container — no local Docker installation, no port forwarding, no dependency conflicts.',
  },
  {
    id: 'step-04',
    num: '04',
    eyebrow: 'PERSIST',
    heading: 'Lab state is backed by a dedicated database schema and Redis session cache.',
    body: 'Each tenant writes to an isolated schema; Redis holds active session state so reconnections resume without data loss.',
  },
  {
    id: 'step-05',
    num: '05',
    eyebrow: 'EXECUTE',
    heading: 'Your commands run against real Kubernetes primitives, not a simulator.',
    body: 'Deployments, services, config maps, and RBAC policies behave exactly as they do in production clusters — the same APIs, the same error messages.',
  },
  {
    id: 'step-06',
    num: '06',
    eyebrow: 'EVALUATE',
    heading: 'Assertions run the moment you act — no waiting for manual grading.',
    body: 'The Grading Service subscribes to lab events and evaluates assertions against the live cluster state, returning pass/fail within seconds.',
  },
  {
    id: 'step-07',
    num: '07',
    eyebrow: 'GUIDE',
    heading: 'If an assertion fails, the AI Mentor pipeline produces a guardrailed hint.',
    body: 'Telemetry, context, and guardrails feed a constrained LLM prompt that returns directional guidance — never the answer itself.',
  },
] as const;

// ─── Step SVG Visuals ─────────────────────────────────────────────────────────
// Each visual is an inline SVG component, varied per step per §3.5 parameters.

// Steps 1–2: auth/API two-node exchange with animated dashed pulse.
// prefers-reduced-motion: freezes dashoffset via .node-pulse-anim class (see site.css).
function AuthApiVisual() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hiw-step-svg"
      role="img"
      aria-label="Client to API Gateway authentication exchange diagram"
    >
      {/* Client node */}
      <circle
        cx="72"
        cy="80"
        r="24"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
      />
      <circle cx="72" cy="80" r="5" fill="var(--node-fill-dot)" />
      <text
        x="72"
        y="120"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        Client
      </text>

      {/* API Gateway node */}
      <circle
        cx="248"
        cy="80"
        r="24"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
      />
      <circle cx="248" cy="80" r="5" fill="var(--node-fill-dot)" />
      <text
        x="248"
        y="120"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        API Gateway
      </text>

      {/* Dashed animated pulse line */}
      <line
        x1="96"
        y1="76"
        x2="224"
        y2="76"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        className="node-pulse-anim"
      />
      {/* Return line */}
      <line
        x1="224"
        y1="84"
        x2="96"
        y2="84"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1"
        strokeDasharray="6 8"
        className="node-pulse-anim"
        style={{ animationDelay: '-0.4s' }}
      />
      {/* Arrow tips */}
      <polygon points="218,71 228,76 218,81" fill="var(--node-stroke)" />
      <polygon points="102,79 92,84 102,89" fill="var(--node-stroke-dim)" />
    </svg>
  );
}

// Step 3: Browser → WebSocket relay → Container node diagram.
// RULING (v6 §8 checklist): the app-window Product Frame (terminal) is
// restricted to exactly two canonical locations sitewide — the Product
// Showcase Lab Terminal tab (§5.1.3) and the AI Mentor callout (§5.3.3).
// Step 3 therefore renders in the §3.5 node-graph language, NOT Product
// Frame chrome. Mirrors the auth visual (source accent, dimmed destinations,
// animated dashed request pulses + dimmed return lines) with a WS relay.
function ConnectVisual() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hiw-step-svg"
      role="img"
      aria-label="Browser to container WebSocket connection diagram"
    >
      {/* Browser node — source, accent */}
      <circle
        cx="56"
        cy="80"
        r="20"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
      />
      <circle cx="56" cy="80" r="4" fill="var(--node-fill-dot)" />
      <text
        x="56"
        y="114"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        Browser
      </text>

      {/* WS relay node — centre, dimmed */}
      <circle
        cx="160"
        cy="80"
        r="16"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1.5"
      />
      <circle cx="160" cy="80" r="4" fill="var(--node-stroke-dim)" />
      <text
        x="160"
        y="110"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        WS
      </text>

      {/* Container node — destination, dimmed */}
      <circle
        cx="264"
        cy="80"
        r="20"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1.5"
      />
      <circle cx="264" cy="80" r="4" fill="var(--node-stroke-dim)" />
      <text
        x="264"
        y="114"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        Container
      </text>

      {/* Browser → WS forward pulse + dimmed return */}
      <line
        x1="76"
        y1="76"
        x2="144"
        y2="76"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        className="node-pulse-anim"
      />
      <line
        x1="144"
        y1="84"
        x2="76"
        y2="84"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1"
        strokeDasharray="6 8"
        className="node-pulse-anim"
        style={{ animationDelay: '-0.4s' }}
      />

      {/* WS → Container forward pulse + dimmed return */}
      <line
        x1="176"
        y1="76"
        x2="244"
        y2="76"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        className="node-pulse-anim"
        style={{ animationDelay: '-0.2s' }}
      />
      <line
        x1="244"
        y1="84"
        x2="176"
        y2="84"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1"
        strokeDasharray="6 8"
        className="node-pulse-anim"
        style={{ animationDelay: '-0.6s' }}
      />

      {/* Arrow tips */}
      <polygon points="138,71 148,76 138,81" fill="var(--node-stroke)" />
      <polygon points="238,71 248,76 238,81" fill="var(--node-stroke)" />
      <polygon points="82,79 72,84 82,89" fill="var(--node-stroke-dim)" />
      <polygon points="182,79 172,84 182,89" fill="var(--node-stroke-dim)" />
    </svg>
  );
}

// Step 4: DB/cache node pair — rect-style nodes to differentiate from auth circles.
function DbCacheVisual() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hiw-step-svg"
      role="img"
      aria-label="Database and Redis cache node pair diagram"
    >
      {/* DB node (rect) */}
      <rect
        x="48"
        y="56"
        width="88"
        height="48"
        rx="4"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
      />
      <circle cx="92" cy="80" r="5" fill="var(--node-fill-dot)" />
      <text
        x="92"
        y="120"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        MySQL
      </text>

      {/* Cache node (rect) */}
      <rect
        x="184"
        y="56"
        width="88"
        height="48"
        rx="4"
        fill="var(--node-canvas-bg)"
        stroke="var(--node-stroke-dim)"
        strokeWidth="1.5"
      />
      <circle cx="228" cy="80" r="5" fill="var(--node-stroke-dim)" />
      <text
        x="228"
        y="120"
        textAnchor="middle"
        fill="var(--color-text-tertiary)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        Redis
      </text>

      {/* Connector */}
      <line
        x1="136"
        y1="80"
        x2="184"
        y2="80"
        stroke="var(--color-border-default)"
        strokeWidth="1.5"
      />
      <circle cx="160" cy="80" r="3" fill="var(--color-border-strong)" />
    </svg>
  );
}

// Step 5: Hexagon cluster motif — static, one node highlighted, others dimmed.
// Shared visual language with Curriculum page hexagon cluster (§5.2.2 background texture).
function HexClusterVisual() {
  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const nodes = [
    { cx: 160, cy: 75, r: 22, active: true },
    { cx: 100, cy: 55, r: 16, active: false },
    { cx: 220, cy: 55, r: 16, active: false },
    { cx: 90, cy: 105, r: 14, active: false },
    { cx: 230, cy: 105, r: 14, active: false },
    { cx: 160, cy: 125, r: 12, active: false },
  ];

  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hiw-step-svg"
      role="img"
      aria-label="Kubernetes cluster hexagon motif diagram"
    >
      {/* Edges (behind nodes) */}
      {[
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [1, 2],
        [3, 5],
        [4, 5],
      ].map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="var(--node-stroke-dim)"
          strokeWidth="1"
        />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <polygon
          key={i}
          points={hexPoints(n.cx, n.cy, n.r)}
          fill="var(--node-canvas-bg)"
          stroke={n.active ? 'var(--node-stroke)' : 'var(--node-stroke-dim)'}
          strokeWidth={n.active ? 1.5 : 1}
        />
      ))}
      {/* Active dot */}
      <circle cx={nodes[0].cx} cy={nodes[0].cy} r="5" fill="var(--node-fill-dot)" />
    </svg>
  );
}

// Steps 6–7: 5-node horizontal AI Mentor flow.
// ASSUMPTION: step 6 highlights 'guardrails', step 7 highlights 'response' — not explicitly
// specified in contract. Chosen to show the guardrail check (step 6 = evaluation) then
// the final response delivery (step 7 = guide). Revise if team lead specifies otherwise.
const AI_FLOW_NODES = ['Telemetry', 'Context', 'Guardrails', 'LLM', 'Response'] as const;
type AiNode = (typeof AI_FLOW_NODES)[number];

function AiMentorFlowVisual({ activeNode }: { activeNode: AiNode }) {
  const nodeCount = AI_FLOW_NODES.length;
  const nodeSpacing = 280 / (nodeCount - 1);

  return (
    <svg
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hiw-step-svg"
      role="img"
      aria-label={`AI Mentor pipeline flow — active node: ${activeNode}`}
    >
      {AI_FLOW_NODES.map((node, i) => {
        const cx = 20 + i * nodeSpacing;
        const cy = 55;
        const isActive = node === activeNode;

        return (
          <g key={node}>
            {/* Connector line (except after last) */}
            {i < nodeCount - 1 && (
              <line
                x1={cx + 18}
                y1={cy}
                x2={cx + nodeSpacing - 18}
                y2={cy}
                stroke={isActive ? 'var(--node-stroke)' : 'var(--node-stroke-dim)'}
                strokeWidth="1"
              />
            )}
            {/* Node circle */}
            <circle
              cx={cx}
              cy={cy}
              r={18}
              fill="var(--node-canvas-bg)"
              stroke={isActive ? 'var(--node-stroke)' : 'var(--node-stroke-dim)'}
              strokeWidth={isActive ? 1.5 : 1}
            />
            {/* Active fill dot */}
            {isActive && <circle cx={cx} cy={cy} r="5" fill="var(--node-fill-dot)" />}
            {/* Label */}
            <text
              x={cx}
              y={cy + 34}
              textAnchor="middle"
              fill={isActive ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)'}
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {node}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Step visual selector ─────────────────────────────────────────────────────
function StepVisual({ stepIndex }: { stepIndex: number }) {
  switch (stepIndex) {
    case 0:
    case 1:
      return <AuthApiVisual />;
    case 2:
      return <ConnectVisual />;
    case 3:
      return <DbCacheVisual />;
    case 4:
      return <HexClusterVisual />;
    case 5:
      // ASSUMPTION: step 6 highlights 'guardrails' — see AiMentorFlowVisual comment above.
      return <AiMentorFlowVisual activeNode="Guardrails" />;
    case 6:
      // ASSUMPTION: step 7 highlights 'response' — see AiMentorFlowVisual comment above.
      return <AiMentorFlowVisual activeNode="Response" />;
    default:
      return null;
  }
}

// ─── Terminal content for §5.3.3 ─────────────────────────────────────────────
// Error state (shown by default)
function TerminalError() {
  return (
    <div className="hiw-terminal-content">
      <p className="hiw-terminal-line">
        <span className="hiw-terminal-prompt">$</span> kubectl apply -f lab-manifest.yaml
      </p>
      <p className="hiw-terminal-line hiw-terminal-error">
        error: pods &quot;student-lab-7f4b9&quot; is forbidden: unable to validate against
      </p>
      <p className="hiw-terminal-line hiw-terminal-error">any security policy: []</p>
    </div>
  );
}

// Hint state (shown on hover)
function TerminalHint() {
  return (
    <div className="hiw-terminal-content">
      <p className="hiw-terminal-line">
        <span className="hiw-terminal-prompt">$</span> kubectl apply -f lab-manifest.yaml
      </p>
      <p className="hiw-terminal-line hiw-terminal-error">
        error: pods &quot;student-lab-7f4b9&quot; is forbidden: unable to validate against
      </p>
      <p className="hiw-terminal-line hiw-terminal-error">any security policy: []</p>
      <p className="hiw-terminal-line hiw-terminal-spacer" aria-hidden="true">
        &nbsp;
      </p>
      <p className="hiw-terminal-line hiw-terminal-hint">
        [AI Mentor] The pod spec is missing a securityContext.
      </p>
      <p className="hiw-terminal-line hiw-terminal-hint">
        {'             '}Try adding:{' '}
        <span className="hiw-terminal-hint-code">runAsNonRoot: true</span>
      </p>
      <p className="hiw-terminal-line hiw-terminal-hint">
        {'             '}This is required by the cluster&apos;s admission controller.
      </p>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // 7 step refs declared individually — hooks must not be called inside loops.
  // One ref per step, collected into an array for useScrollSpy.
  const stepRef0 = useRef<HTMLElement | null>(null);
  const stepRef1 = useRef<HTMLElement | null>(null);
  const stepRef2 = useRef<HTMLElement | null>(null);
  const stepRef3 = useRef<HTMLElement | null>(null);
  const stepRef4 = useRef<HTMLElement | null>(null);
  const stepRef5 = useRef<HTMLElement | null>(null);
  const stepRef6 = useRef<HTMLElement | null>(null);
  const stepRefs = [stepRef0, stepRef1, stepRef2, stepRef3, stepRef4, stepRef5, stepRef6];
  const activeStep = useScrollSpy(stepRefs);

  // Flow-line: stroke-dashoffset driven by activeStep
  const flowLineProgress = STEPS.length > 1 ? activeStep / (STEPS.length - 1) : 0;

  // Scroll reveal refs
  const headerRevealRef = useScrollReveal();
  const guardRailsRevealRef = useScrollReveal();
  const ctaRevealRef = useScrollReveal();

  // Track hover state for §5.3.3 ProductFrame cross-fade
  const [guardHovered, setGuardHovered] = useState(false);

  return (
    <SiteLayout>
      <div className="hiw-page">
        {/* ── §5.3.1 Header ─────────────────────────────────────────────── */}
        <section className="hiw-header-section site-section--void" aria-labelledby="hiw-headline">
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="hiw-headline" className="hiw-headline">
                How a lab session works
              </h1>
            </div>
          </div>
        </section>

        {/* ── §5.3.2 7-Step Scroll-Linked Sequence ──────────────────────── */}
        <section
          className="hiw-scrollytelling-section site-section--base"
          aria-label="Lab session lifecycle steps"
        >
          <div
            className={`site-container hiw-scrollytelling-wrapper ${
              isDesktop ? 'hiw-scrollytelling-wrapper--desktop' : ''
            }`}
          >
            {/* LEFT: Scrollable step list */}
            <div className="hiw-step-list" role="list">
              {/* Vertical flow line — drawn progressively per activeStep */}
              {isDesktop && (
                <div className="hiw-flow-line" aria-hidden="true">
                  <div className="hiw-flow-line__track" />
                  <div
                    className="hiw-flow-line__fill"
                    style={{ height: `${flowLineProgress * 100}%` }}
                  />
                </div>
              )}

              {STEPS.map((step, i) => (
                <article
                  key={step.id}
                  id={step.id}
                  ref={stepRefs[i] as React.RefObject<HTMLElement>}
                  className={`hiw-step ${activeStep === i && isDesktop ? 'hiw-step--active' : ''}`}
                  role="listitem"
                >
                  <p className="hiw-step__eyebrow">
                    <span className="hiw-step__num">{step.num}</span>
                    {' — '}
                    {step.eyebrow}
                  </p>
                  <h2 className="hiw-step__heading">{step.heading}</h2>
                  <p className="hiw-step__body">{step.body}</p>

                  {/* Mobile: inline visual beneath each step */}
                  {!isDesktop && (
                    <div className="hiw-step__inline-visual" aria-hidden="true">
                      <StepVisual stepIndex={i} />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* RIGHT: Sticky visual panel (desktop only) */}
            {isDesktop && (
              <div className="hiw-visual-panel" aria-hidden="true" style={{ top: '88px' }}>
                <div className="hiw-visual-panel__inner">
                  {STEPS.map((step, i) => (
                    <div
                      key={step.id}
                      className={`hiw-visual-crossfade ${
                        activeStep === i ? 'hiw-visual-crossfade--active' : ''
                      }`}
                    >
                      <StepVisual stepIndex={i} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── §5.3.3 AI Mentor Guardrails Callout ───────────────────────── */}
        <section
          className="hiw-guardrails-section site-section--raised"
          aria-labelledby="hiw-guardrails-headline"
        >
          <div className="site-container">
            <div className="site-reveal" ref={guardRailsRevealRef}>
              <p className="hiw-guardrails-eyebrow">GUARDRAILS</p>
              <h2 id="hiw-guardrails-headline" className="hiw-guardrails-headline">
                Hints, not answers.
              </h2>
              <p className="hiw-guardrails-body">
                When an assertion fails, the AI Mentor pipeline receives your terminal output, lab
                context, and a guardrail ruleset that prohibits direct solutions. The resulting hint
                is directional — it names the mechanism, not the fix — so understanding transfers to
                production work, not just this exercise.
              </p>

              {/* ProductFrame — error state → hint state on hover */}
              <div
                className="hiw-guardrails-frame-wrapper"
                onMouseEnter={() => setGuardHovered(true)}
                onMouseLeave={() => setGuardHovered(false)}
                aria-label="AI Mentor terminal demo — hover to see guardrailed hint"
              >
                {/* Error state */}
                <div
                  className={`hiw-guardrails-frame-state ${
                    guardHovered ? 'hiw-guardrails-frame-state--hidden' : ''
                  }`}
                >
                  <ProductFrame label="bash — devopsmentor">
                    <TerminalError />
                  </ProductFrame>
                </div>

                {/* Hint state */}
                <div
                  className={`hiw-guardrails-frame-state ${
                    guardHovered ? '' : 'hiw-guardrails-frame-state--hidden'
                  }`}
                  aria-live="polite"
                >
                  <ProductFrame label="bash — devopsmentor">
                    <TerminalHint />
                  </ProductFrame>
                </div>
              </div>
              <p className="hiw-guardrails-hover-label" aria-hidden="true">
                Hover to see the guardrailed hint
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.3.4 Closing CTA ────────────────────────────────────────── */}
        <section className="hiw-cta-section site-section--void" aria-label="Next step">
          <div className="site-container hiw-cta-inner">
            <div className="site-reveal" ref={ctaRevealRef}>
              <Link
                to="/curriculum"
                className="hiw-cta-link"
                aria-label="Explore the curriculum — opens curriculum page"
              >
                <SiteButton variant="primary" withArrow size="lg">
                  Explore the curriculum
                </SiteButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

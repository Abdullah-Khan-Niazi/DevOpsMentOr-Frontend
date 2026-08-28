import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLayout } from './components/SiteLayout';
import { Button } from '@/shared/components';
import { ProductFrame } from './components/ProductFrame';
import { useReducedMotion } from './hooks';
import './NotFoundPage.css';

// §5.9 — 404: terminal-styled error output (app-window Product Frame),
// typed-diagnostic reveal on load, single primary CTA "Return home", no search bar.

interface TermLine {
  prompt?: string;
  text: string;
  kind: 'cmd' | 'err';
}

const TERMINAL_LINES: TermLine[] = [
  { prompt: '$', text: 'open lab --module 08', kind: 'cmd' },
  { text: 'error: module "08" not found in this namespace', kind: 'err' },
  { text: 'exit code 404', kind: 'err' },
];

const CHAR_MS = 16;
const LINE_HOLD = 20; // ticks of pause after each line (~320ms)

const TOTAL_TICKS = TERMINAL_LINES.reduce((sum, line) => sum + line.text.length + LINE_HOLD, 0);

// Map an absolute tick counter to (lineIndex, charIndex) so the interval is a
// single monotonic count — no cascading timers.
function progressAt(tick: number): { line: number; char: number } {
  let remaining = tick;
  for (let i = 0; i < TERMINAL_LINES.length; i++) {
    const lineTicks = TERMINAL_LINES[i].text.length + LINE_HOLD;
    if (remaining < lineTicks) return { line: i, char: Math.max(0, remaining) };
    remaining -= lineTicks;
  }
  return {
    line: TERMINAL_LINES.length - 1,
    char: TERMINAL_LINES[TERMINAL_LINES.length - 1].text.length,
  };
}

export default function NotFoundPage() {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(() => (reduced ? TOTAL_TICKS : 0));
  const done = tick >= TOTAL_TICKS;
  const { line: activeLine, char: activeChar } = progressAt(tick);

  useEffect(() => {
    if (reduced) return;
    // rAF-driven and self-correcting: each frame derives the tick count from
    // elapsed time, so timer throttling can't stall the diagnostic partway.
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      setTick(Math.min(TOTAL_TICKS, Math.floor((now - start) / CHAR_MS)));
      if (now - start < TOTAL_TICKS * CHAR_MS) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <SiteLayout>
      <div className="notfound-page">
        <h1 className="notfound-sr-heading">Page not found</h1>
        <div className="site-container notfound-inner">
          <ProductFrame label="bash — devopsmentor" className="notfound-frame">
            {TERMINAL_LINES.map((line, i) => {
              const visible = reduced
                ? line.text
                : i < activeLine
                  ? line.text
                  : i === activeLine
                    ? line.text.slice(0, activeChar)
                    : '';
              return (
                <p key={i} className={`notfound-line notfound-line--${line.kind}`}>
                  {line.prompt && <span className="notfound-prompt">{line.prompt} </span>}
                  <span>{visible}</span>
                  {!reduced && i === activeLine && !done && (
                    <span className="notfound-cursor" aria-hidden="true" />
                  )}
                </p>
              );
            })}
          </ProductFrame>

          <div className={`notfound-cta-wrap ${done ? 'notfound-cta-wrap--visible' : ''}`}>
            <Link to={ROUTES.HOME}>
              <Button variant="primary" size="md">
                Return home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

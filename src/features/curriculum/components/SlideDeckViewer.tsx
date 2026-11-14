import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components';

interface SlideDeckViewerProps {
  slides: string[];
  lessonTitle: string;
}

/** Minimal, dependency-free markdown rendering for slide bodies. */
function SlideBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return (
    <div className="space-y-4 text-card-foreground/90">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (
          lines.length > 0 &&
          lines.every((line) => line.startsWith('- ') || line.startsWith('* '))
        ) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 leading-relaxed">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          );
        }

        const [first, ...rest] = lines;
        if (lines.length > 0 && first.startsWith('### ')) {
          return (
            <div key={blockIndex} className="space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">{first.slice(4)}</h3>
              {rest.length > 0 && (
                <p className="leading-relaxed whitespace-pre-line">{rest.join('\n')}</p>
              )}
            </div>
          );
        }
        if (lines.length > 0 && first.startsWith('## ')) {
          return (
            <div key={blockIndex} className="space-y-2">
              <h2 className="text-xl font-semibold text-card-foreground">{first.slice(3)}</h2>
              {rest.length > 0 && (
                <p className="leading-relaxed whitespace-pre-line">{rest.join('\n')}</p>
              )}
            </div>
          );
        }
        if (lines.length > 0 && first.startsWith('# ')) {
          return (
            <div key={blockIndex} className="space-y-2">
              <h1 className="text-2xl font-bold text-card-foreground">{first.slice(2)}</h1>
              {rest.length > 0 && (
                <p className="leading-relaxed whitespace-pre-line">{rest.join('\n')}</p>
              )}
            </div>
          );
        }

        return (
          <p key={blockIndex} className="leading-relaxed whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

/**
 * W11/W12: slide deck for `interactive` lessons whose content is authored with
 * `<!-- slide -->`. Supports prev/next buttons, a live counter, and arrow-key
 * navigation; the paragraph view remains the fallback when no delimiter exists.
 */
export function SlideDeckViewer({ slides, lessonTitle }: SlideDeckViewerProps) {
  const [current, setCurrent] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrent((index) => Math.max(0, index - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrent((index) => Math.min(slides.length - 1, index + 1));
  }, [slides.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (slides.length === 0) return null;

  const safeIndex = Math.min(current, slides.length - 1);
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === slides.length - 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`Slide deck: ${lessonTitle}`}
      className="rounded-sm border border-border bg-card shadow-sm overflow-hidden"
      data-testid="slide-deck-viewer"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-paper/50 px-5 py-3">
        <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
          Slide Deck
        </span>
        <span
          className="text-xs font-mono text-muted tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          Slide {safeIndex + 1} / {slides.length}
        </span>
      </header>

      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${safeIndex + 1} of ${slides.length}`}
        className="min-h-72 px-6 py-8 sm:px-10 sm:py-12"
      >
        <SlideBody body={slides[safeIndex]} />
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border bg-paper/50 px-5 py-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={goToPrevious}
          disabled={isFirst}
          aria-label="Previous slide"
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === safeIndex ? 'w-6 bg-brand-600' : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={goToNext}
          disabled={isLast}
          aria-label="Next slide"
        >
          Next →
        </Button>
      </footer>

      <p className="sr-only">Use the left and right arrow keys to change slides.</p>
    </section>
  );
}

export default SlideDeckViewer;

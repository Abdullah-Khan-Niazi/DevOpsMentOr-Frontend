import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconButton, Markdown, ProgressBar } from '@/shared/components';
import { cn } from '@/shared/utils';

const SLIDE_DELIMITER = '<!-- slide -->';

interface SlideDeckProps {
  /** Lesson markdown; slides are separated by `<!-- slide -->`. */
  markdown: string;
}

/** Interactive lesson deck: one slide at a time with arrow keys, buttons, a counter and progress. */
export function SlideDeck({ markdown }: SlideDeckProps) {
  const slides = useMemo(
    () =>
      markdown
        .split(SLIDE_DELIMITER)
        .map((slide) => slide.trim())
        .filter((slide) => slide.length > 0),
    [markdown],
  );
  const count = slides.length;
  const [current, setCurrent] = useState(0);
  const index = Math.min(current, Math.max(count - 1, 0));

  const goPrevious = useCallback(() => {
    setCurrent((value) => Math.max(0, Math.min(value, count - 1) - 1));
  }, [count]);

  const goNext = useCallback(() => {
    setCurrent((value) => Math.min(count - 1, Math.min(value, count - 1) + 1));
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          // Widgets that own their arrow keys (tab switchers, trees, menus, sliders, overlays).
          target.closest(
            '[role="tablist"], [role="tree"], [role="menu"], [role="listbox"], [role="radiogroup"], [role="slider"], [role="separator"], .overlay-root',
          ))
      ) {
        return;
      }
      event.preventDefault();
      if (event.key === 'ArrowLeft') {
        goPrevious();
      } else {
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, goNext, goPrevious]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Slide deck"
      className="flex flex-col gap-4"
    >
      {/* Slides share one grid cell; the active slide fades and slides in on the Apple easing. */}
      <div className="grid min-h-72 overflow-hidden">
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={slideIndex}
              aria-roledescription="slide"
              aria-label={`Slide ${slideIndex + 1} of ${count}`}
              className={cn(
                'col-start-1 row-start-1 px-1 transition-[opacity,transform,visibility] duration-(--duration-page) ease-(--ease-apple) motion-reduce:transition-none',
                active ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-4 opacity-0',
              )}
            >
              <Markdown variant="prose">{slide}</Markdown>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <IconButton
          icon="chevron-left"
          label="Previous slide"
          onClick={goPrevious}
          disabled={index === 0}
        />
        <IconButton
          icon="chevron-right"
          label="Next slide"
          onClick={goNext}
          disabled={index === count - 1}
        />
        <ProgressBar
          value={index + 1}
          max={count}
          label="Slide progress"
          size="sm"
          className="flex-1"
        />
        <span
          className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {index + 1} / {count}
        </span>
      </div>
    </section>
  );
}

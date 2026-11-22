import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { cn, isSameOrigin, safeHttpUrl, safeLinkUrl } from '@/shared/utils';
import { CodeBlock } from './CodeBlock';
import './Markdown.css';

export interface MarkdownProps {
  /** Markdown source from the database. Raw HTML is ignored. */
  children: string | null | undefined;
  variant?: 'prose' | 'compact' | 'inverse';
  /** Heading levels to demote (default 1: `#` renders as h2 under the page title). */
  headingOffset?: number;
  className?: string;
}

const REMARK_PLUGINS = [remarkGfm];

/** Allowlist for every URL in markdown (links and images); anything else becomes ''. */
function urlTransform(url: string, key: string): string {
  if (key === 'src') return safeHttpUrl(url)?.startsWith('https:') ? url : '';
  return safeLinkUrl(url) ?? '';
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return textOf(child.props.children);
      return '';
    })
    .join('');
}

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function heading(level: number, offset: number) {
  const tag = `h${Math.min(6, Math.max(1, level + offset))}` as HeadingTag;
  function Heading({ children }: { children?: ReactNode }) {
    const Tag = tag;
    return <Tag>{children}</Tag>;
  }
  return Heading;
}

function MarkdownLink({ href, children }: ComponentPropsWithoutRef<'a'>) {
  const safe = href ? safeLinkUrl(href) : null;
  if (!safe) return <span>{children}</span>;
  if (safe.startsWith('/')) return <Link to={safe}>{children}</Link>;
  if (safe.startsWith('#') || safe.startsWith('mailto:') || isSameOrigin(safe)) {
    return <a href={safe}>{children}</a>;
  }
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

function MarkdownImage({ src, alt }: ComponentPropsWithoutRef<'img'>) {
  const safe = typeof src === 'string' ? safeHttpUrl(src) : null;
  if (!safe || !safe.startsWith('https:')) return alt ? <span>{alt}</span> : null;
  return <img src={safe} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" />;
}

function MarkdownPre({ children }: ComponentPropsWithoutRef<'pre'>) {
  const code = Children.toArray(children).find(isValidElement) as
    ReactElement<{ className?: string; children?: ReactNode }> | undefined;
  const language = code?.props.className?.match(/language-([\w-]+)/)?.[1];
  const text = textOf(code ? code.props.children : children).replace(/\n$/, '');
  return <CodeBlock code={text} language={language} />;
}

function MarkdownTable({ children }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="md-table">
      <table>{children}</table>
    </div>
  );
}

function buildComponents(offset: number): Components {
  return {
    h1: heading(1, offset),
    h2: heading(2, offset),
    h3: heading(3, offset),
    h4: heading(4, offset),
    h5: heading(5, offset),
    h6: heading(6, offset),
    a: MarkdownLink,
    img: MarkdownImage,
    pre: MarkdownPre,
    table: MarkdownTable,
    hr: () => null,
  };
}

const COMPONENTS_BY_OFFSET = new Map<number, Components>();

function componentsFor(offset: number): Components {
  let components = COMPONENTS_BY_OFFSET.get(offset);
  if (!components) {
    components = buildComponents(offset);
    COMPONENTS_BY_OFFSET.set(offset, components);
  }
  return components;
}

/**
 * The only renderer for database markdown (lessons, slides, step instructions,
 * scenario intros, hints, explanations, descriptions). GFM enabled, raw HTML
 * skipped, URLs allowlisted, external links open in a new tab without referrer.
 */
export function Markdown({
  children,
  variant = 'prose',
  headingOffset = 1,
  className,
}: MarkdownProps) {
  if (!children || !children.trim()) return null;
  return (
    <div className={cn('md', `md--${variant}`, className)}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        skipHtml
        urlTransform={urlTransform}
        components={componentsFor(headingOffset)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

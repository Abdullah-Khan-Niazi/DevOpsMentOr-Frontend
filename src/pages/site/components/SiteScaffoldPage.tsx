import { SiteLayout } from './SiteLayout';
import { useScrollReveal } from '../hooks';
import './SiteScaffoldPage.css';

// Out-of-scope page scaffold: keeps the site map complete (every header/footer/
// homepage link resolves to a real route) without implementing content. Honest
// one-liner — no stub mockups.

interface SiteScaffoldPageProps {
  title: string;
  description: string;
}

export function SiteScaffoldPage({ title, description }: SiteScaffoldPageProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <SiteLayout>
      <div className="scaffold-page">
        <div className="site-container" ref={revealRef}>
          <div className="site-reveal">
            <h1 className="scaffold-page__title">{title}</h1>
            <p className="scaffold-page__desc">{description}</p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

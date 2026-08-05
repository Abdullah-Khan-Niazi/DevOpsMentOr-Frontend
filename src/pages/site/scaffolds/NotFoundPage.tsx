import { Link } from 'react-router-dom';
import { SiteLayout } from '../components/SiteLayout';
import { ProductFrame } from '../components/ProductFrame';
import '../scaffolds/NotFoundPage.css';

// §5.9 404 — terminal-styled diagnostic. Out-of-scope polish; keeps the
// dead-end on-brand with the site's terminal language.

export default function NotFoundPage() {
  return (
    <SiteLayout>
      <div className="notfound-page">
        <div className="site-container">
          <ProductFrame label="bash — devopsmentor" className="notfound-frame">
            <p className="notfound-line">
              <span className="notfound-prompt">$</span> open lab --module 08
            </p>
            <p className="notfound-line notfound-error">
              error: module &quot;08&quot; not found in this namespace
            </p>
            <p className="notfound-line notfound-error">exit code 404</p>
          </ProductFrame>
          <Link to="/" className="notfound-cta">
            Return home
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}

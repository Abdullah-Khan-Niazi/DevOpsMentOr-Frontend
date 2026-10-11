import { Link } from 'react-router-dom';
import { SiteLogo } from '@/shared/components';
import { ROUTES } from '@/shared/constants';

const FACTS = [
  '15 modules: Containers to GitOps',
  'Kubernetes labs in under 90 seconds',
  'Graded against live cluster state',
] as const;

export function AuthContextPanel() {
  return (
    <aside className="auth-context">
      <div className="auth-context__inner">
        <Link
          to={ROUTES.HOME}
          className="auth-context__logo-link block hover:opacity-80 transition-opacity"
          title="Return to DevOpsMentOr Homepage"
        >
          <SiteLogo />
        </Link>
        <div className="auth-context__statement">
          <p className="auth-context__headline">
            Practice where it counts: on real infrastructure.
          </p>
          <p className="auth-context__body">
            DevOpsMentOr runs Kubernetes labs in your browser, grades them against live cluster
            state, and lets the AI Mentor guide you with hints, never answers.
          </p>
        </div>
        <ul className="auth-facts">
          {FACTS.map((fact) => (
            <li key={fact} className="auth-facts__item">
              <span className="auth-facts__tick" aria-hidden="true">
                →
              </span>
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

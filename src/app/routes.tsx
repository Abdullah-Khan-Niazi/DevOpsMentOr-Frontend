import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth';
import { AppShell, LoadingState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
// ─── Public site pages (public, no auth) — add one per session ─────────────────
const HomePage = lazy(() => import('@/pages/site/HomePage'));
const HowItWorksPage = lazy(() => import('@/pages/site/HowItWorksPage'));
const CurriculumPage = lazy(() => import('@/pages/site/scaffolds/CurriculumPage'));
const PricingPage = lazy(() => import('@/pages/site/scaffolds/PricingPage'));
const AboutPage = lazy(() => import('@/pages/site/AboutPage'));
const ContactPage = lazy(() => import('@/pages/site/scaffolds/ContactPage'));
const ForInstitutionsPage = lazy(() => import('@/pages/site/scaffolds/ForInstitutionsPage'));
const SecurityTrustPage = lazy(() => import('@/pages/site/scaffolds/SecurityTrustPage'));
const NotFoundPage = lazy(() => import('@/pages/site/scaffolds/NotFoundPage'));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <LazyPage>
            <LoginPage />
          </LazyPage>
        }
      />

      <Route
        path={ROUTES.SIGNUP}
        element={
          <LazyPage>
            <SignupPage />
          </LazyPage>
        }
      />

      <Route
        path={ROUTES.OAUTH_CALLBACK}
        element={
          <LazyPage>
            <OAuthCallbackPage />
          </LazyPage>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.USERS}
            element={
              <LazyPage>
                <UsersPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.ROLES}
            element={
              <LazyPage>
                <RolesPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.REPORTS}
            element={
              <LazyPage>
                <ReportsPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>

      <Route
        path={ROUTES.HOME}
        element={
          <LazyPage>
            <HomePage />
          </LazyPage>
        }
      />
      {/* ─── Public site routes — one added per session ──────────────── */}
      <Route
        path={ROUTES.HOW_IT_WORKS}
        element={
          <LazyPage>
            <HowItWorksPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.CURRICULUM}
        element={
          <LazyPage>
            <CurriculumPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.PRICING}
        element={
          <LazyPage>
            <PricingPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.ABOUT}
        element={
          <LazyPage>
            <AboutPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.CONTACT}
        element={
          <LazyPage>
            <ContactPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.FOR_INSTITUTIONS}
        element={
          <LazyPage>
            <ForInstitutionsPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.SECURITY_TRUST}
        element={
          <LazyPage>
            <SecurityTrustPage />
          </LazyPage>
        }
      />
      <Route
        path="*"
        element={
          <LazyPage>
            <NotFoundPage />
          </LazyPage>
        }
      />
    </Routes>
  );
}

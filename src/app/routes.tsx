import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth';
import { AdminShell, AppShell, LoadingState } from '@/shared/components';
import { PermissionRouteGuard } from '@/shared/guards';
import { ROUTES } from '@/shared/constants';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage'));
const AdminLoginPage = lazy(() => import('@/features/admin/pages/AdminLoginPage'));
const AdminAcceptInvitePage = lazy(() => import('@/features/admin/pages/AdminAcceptInvitePage'));
const AdminPlatformAdminsPage = lazy(
  () => import('@/features/admin/pages/AdminPlatformAdminsPage'),
);
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const SecurityPage = lazy(() => import('@/features/settings/pages/SecurityPage'));
const LoginHistoryPage = lazy(() => import('@/features/settings/pages/LoginHistoryPage'));
const ApiTokensPage = lazy(() => import('@/features/settings/pages/ApiTokensPage'));
const PreferencesPage = lazy(() => import('@/features/settings/pages/PreferencesPage'));
const EditProfilePage = lazy(() => import('@/features/profile/pages/EditProfilePage'));
const PublicProfilePage = lazy(() => import('@/features/profile/pages/PublicProfilePage'));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@/features/admin/pages/AdminUserDetailPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminAuditLogsPage = lazy(() => import('@/features/admin/pages/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('@/features/admin/pages/AdminSettingsPage'));
const AdminOrganizationsPage = lazy(
  () => import('@/features/admin/organizations/pages/AdminOrganizationsPage'),
);
const AdminOrganizationDetailPage = lazy(
  () => import('@/features/admin/organizations/pages/AdminOrganizationDetailPage'),
);
// ─── F3 organization workspace + enrollment ─────────────────────────────────
const OrgAdminShell = lazy(() => import('@/features/org/components/OrgAdminShell'));
const OrgDashboardPage = lazy(() => import('@/features/org/pages/OrgDashboardPage'));
const OrgClassesPage = lazy(() => import('@/features/org/pages/OrgClassesPage'));
const OrgClassCreatePage = lazy(() => import('@/features/org/pages/OrgClassCreatePage'));
const OrgClassDetailPage = lazy(() => import('@/features/org/pages/OrgClassDetailPage'));
const OrgClassRosterPage = lazy(() => import('@/features/org/pages/OrgClassRosterPage'));
const OrgClassInvitePage = lazy(() => import('@/features/org/pages/OrgClassInvitePage'));
const OrgProfessorsPage = lazy(() => import('@/features/org/pages/OrgProfessorsPage'));
const OrgSettingsPage = lazy(() => import('@/features/org/pages/OrgSettingsPage'));
const EnrollAcceptPage = lazy(() => import('@/features/enrollment/pages/EnrollAcceptPage'));
const StudentMyClassPage = lazy(() => import('@/features/enrollment/pages/StudentMyClassPage'));
// ─── Public site pages (public, no auth) — add one per session ─────────────────
const HomePage = lazy(() => import('@/pages/site/HomePage'));
const HowItWorksPage = lazy(() => import('@/pages/site/HowItWorksPage'));
const CurriculumPage = lazy(() => import('@/pages/site/CurriculumPage'));
const PricingPage = lazy(() => import('@/pages/site/PricingPage'));
const AboutPage = lazy(() => import('@/pages/site/AboutPage'));
const ContactPage = lazy(() => import('@/pages/site/ContactPage'));
const ForInstitutionsPage = lazy(() => import('@/pages/site/ForInstitutionsPage'));
const SecurityTrustPage = lazy(() => import('@/pages/site/SecurityTrustPage'));
const FaqPage = lazy(() => import('@/pages/site/FaqPage'));
const NotFoundPage = lazy(() => import('@/pages/site/NotFoundPage'));
// ─── Secondary site pages (footer destinations) ──────────────────────────────
const CareersPage = lazy(() => import('@/pages/site/CareersPage'));
const DocumentationPage = lazy(() => import('@/pages/site/DocumentationPage'));
const ModuleCatalogPage = lazy(() => import('@/pages/site/ModuleCatalogPage'));
const LearningPathPage = lazy(() => import('@/pages/site/LearningPathPage'));
const InstructorToolsPage = lazy(() => import('@/pages/site/InstructorToolsPage'));
const PrivacyPage = lazy(() => import('@/pages/site/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/site/TermsPage'));

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
        path={ROUTES.VERIFY_EMAIL}
        element={
          <LazyPage>
            <VerifyEmailPage />
          </LazyPage>
        }
      />

      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={
          <LazyPage>
            <ForgotPasswordPage />
          </LazyPage>
        }
      />

      <Route
        path={ROUTES.RESET_PASSWORD}
        element={
          <LazyPage>
            <ResetPasswordPage />
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

      <Route
        path={ROUTES.ADMIN_LOGIN}
        element={
          <LazyPage>
            <AdminLoginPage />
          </LazyPage>
        }
      />

      <Route
        path={ROUTES.ADMIN_ACCEPT_INVITE}
        element={
          <LazyPage>
            <AdminAcceptInvitePage />
          </LazyPage>
        }
      />

      {/* ─── F2 public: any visitor, respects is_public server-side ─────── */}
      <Route element={<AppShell />}>
        <Route
          path={ROUTES.PROFILE_VIEW}
          element={
            <LazyPage>
              <PublicProfilePage />
            </LazyPage>
          }
        />
      </Route>

      {/* ─── F3 enrollment: public invitation accept (optional auth) ─── */}
      <Route
        path={ROUTES.ENROLL_ACCEPT}
        element={
          <LazyPage>
            <EnrollAcceptPage />
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
          <Route
            path={ROUTES.PREFERENCES}
            element={
              <LazyPage>
                <PreferencesPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.SECURITY}
            element={
              <LazyPage>
                <SecurityPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.LOGIN_HISTORY}
            element={
              <LazyPage>
                <LoginHistoryPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.API_TOKENS}
            element={
              <LazyPage>
                <ApiTokensPage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.PROFILE_EDIT}
            element={
              <LazyPage>
                <EditProfilePage />
              </LazyPage>
            }
          />
          <Route
            path={ROUTES.STUDENT_MY_CLASS}
            element={
              <PermissionRouteGuard permission="enrollment:read">
                <LazyPage>
                  <StudentMyClassPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
        </Route>
      </Route>

      {/* ─── F2 admin console (AdminShell layout, permission-gated) ─────── */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <PermissionRouteGuard permission="platform.admin.access">
            <AdminShell>
              <LazyPage>
                <AdminDashboardPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_USERS}
        element={
          <PermissionRouteGuard permission="platform.users.read">
            <AdminShell>
              <LazyPage>
                <AdminUsersPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_USER_DETAIL}
        element={
          <PermissionRouteGuard permission="platform.users.read">
            <AdminShell>
              <LazyPage>
                <AdminUserDetailPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_SETTINGS}
        element={
          <PermissionRouteGuard permission="platform.settings.manage">
            <AdminShell>
              <LazyPage>
                <AdminSettingsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_AUDIT_LOGS}
        element={
          <PermissionRouteGuard permission="platform.admin.access">
            <AdminShell>
              <LazyPage>
                <AdminAuditLogsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_PLATFORM_ADMINS}
        element={
          <PermissionRouteGuard permission="platform.admin.invite">
            <AdminShell>
              <LazyPage>
                <AdminPlatformAdminsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />

      {/* ─── F3 platform-admin organization management (AdminShell) ─────── */}
      <Route
        path={ROUTES.ADMIN_ORGANIZATIONS}
        element={
          <PermissionRouteGuard permission="platform.organizations.read">
            <AdminShell>
              <LazyPage>
                <AdminOrganizationsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_ORGANIZATION_DETAIL}
        element={
          <PermissionRouteGuard permission="platform.organizations.read">
            <AdminShell>
              <LazyPage>
                <AdminOrganizationDetailPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />

      {/* ─── F3 org workspace (OrgAdminShell, permission-gated) ─────────── */}
      <Route
        path={ROUTES.ORG_DASHBOARD}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgDashboardPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_CLASSES}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgClassesPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_CLASS_NEW}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgClassCreatePage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_CLASS_DETAIL}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgClassDetailPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_CLASS_ROSTER}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgClassRosterPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_CLASS_INVITE}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgClassInvitePage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_PROFESSORS}
        element={
          <PermissionRouteGuard permission="org:professors:invite">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgProfessorsPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ORG_SETTINGS}
        element={
          <PermissionRouteGuard permission="org:read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgSettingsPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />

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
        path={ROUTES.FAQ}
        element={
          <LazyPage>
            <FaqPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.CAREERS}
        element={
          <LazyPage>
            <CareersPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.DOCUMENTATION}
        element={
          <LazyPage>
            <DocumentationPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.MODULE_CATALOG}
        element={
          <LazyPage>
            <ModuleCatalogPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.LEARNING_PATH}
        element={
          <LazyPage>
            <LearningPathPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.INSTRUCTOR_TOOLS}
        element={
          <LazyPage>
            <InstructorToolsPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.PRIVACY}
        element={
          <LazyPage>
            <PrivacyPage />
          </LazyPage>
        }
      />
      <Route
        path={ROUTES.TERMS}
        element={
          <LazyPage>
            <TermsPage />
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

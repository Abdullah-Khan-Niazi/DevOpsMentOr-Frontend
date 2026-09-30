import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth';
import { AdminShell, AppShell, LoadingState } from '@/shared/components';
import { PermissionRouteGuard } from '@/shared/guards';
import { ROUTES } from '@/shared/constants';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('@/features/auth/pages/OnboardingPage'));
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
// ─── F4 canonical curriculum (admin + learner) ─────────────────────────────
const AdminCurriculumPage = lazy(() => import('@/features/curriculum/pages/AdminCurriculumPage'));
const AdminModuleEditorPage = lazy(
  () => import('@/features/curriculum/pages/AdminModuleEditorPage'),
);
const AdminLessonEditorPage = lazy(
  () => import('@/features/curriculum/pages/AdminLessonEditorPage'),
);
const AdminQuizBuilderPage = lazy(() => import('@/features/curriculum/pages/AdminQuizBuilderPage'));
const LearnCurriculumPage = lazy(() => import('@/features/curriculum/pages/LearnCurriculumPage'));
const LearnLessonPage = lazy(() => import('@/features/curriculum/pages/LearnLessonPage'));
// ─── F5 learning experience & progress tracking ─────────────────────────────
const QuizAttemptPage = lazy(() => import('@/features/progress/pages/QuizAttemptPage'));
const ProfessorClassProgressPage = lazy(
  () => import('@/features/progress/pages/ProfessorClassProgressPage'),
);
const OrgStudentsProgressPage = lazy(
  () => import('@/features/progress/pages/OrgStudentsProgressPage'),
);
const AdminUserProgressPage = lazy(() => import('@/features/progress/pages/AdminUserProgressPage'));
// ─── F6 labs, execution engine & AI Mentor ────────────────────────────────
const LabsPage = lazy(() => import('@/features/labs/pages/LabsPage'));
const LabDetailPage = lazy(() => import('@/features/labs/pages/LabDetailPage'));
const LabSessionPage = lazy(() => import('@/features/labs/pages/LabSessionPage'));
const SherlockLabPage = lazy(() => import('@/features/labs/pages/SherlockLabPage'));
const TracksPage = lazy(() => import('@/features/labs/pages/TracksPage'));
const TrackDetailPage = lazy(() => import('@/features/labs/pages/TrackDetailPage'));
const VpnSettingsPage = lazy(() => import('@/features/labs/pages/VpnSettingsPage'));
// ─── F9 billing (learner portal) and pricing checkout ─────────────────
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage'));
const PaymentMethodsPage = lazy(() => import('@/features/billing/pages/PaymentMethodsPage'));
const BillingHistoryPage = lazy(() => import('@/features/billing/pages/BillingHistoryPage'));
const AdminBillingPage = lazy(() => import('@/features/admin/billing/pages/AdminBillingPage'));
const AdminLabsPage = lazy(() => import('@/features/labs/pages/AdminLabsPage'));
const AdminTracksPage = lazy(() => import('@/features/labs/pages/AdminTracksPage'));
const AdminLabInstancesPage = lazy(() => import('@/features/labs/pages/AdminLabInstancesPage'));
// ─── F7 achievements, gamification & certification ─────────────────────────
const AchievementsPage = lazy(() => import('@/features/achievements/pages/AchievementsPage'));
const LeaderboardPage = lazy(() => import('@/features/leaderboard/pages/LeaderboardPage'));
const SeasonLeaderboardPage = lazy(
  () => import('@/features/leaderboard/pages/SeasonLeaderboardPage'),
);
const CohortLeaderboardPage = lazy(
  () => import('@/features/leaderboard/pages/CohortLeaderboardPage'),
);
const VerifyCertificatePage = lazy(
  () => import('@/features/certificates/pages/VerifyCertificatePage'),
);
const AdminGamificationPage = lazy(
  () => import('@/features/admin/gamification/pages/AdminGamificationPage'),
);
const AdminBadgesPage = lazy(() => import('@/features/admin/gamification/pages/AdminBadgesPage'));
const AdminAchievementsPage = lazy(
  () => import('@/features/admin/gamification/pages/AdminAchievementsPage'),
);
const AdminSeasonsPage = lazy(() => import('@/features/admin/gamification/pages/AdminSeasonsPage'));
// ─── F8 analytics, notifications & platform operations ─────────────────────
const NotificationInboxPage = lazy(
  () => import('@/features/notifications/pages/NotificationInboxPage'),
);
const NotificationPreferencesPage = lazy(
  () => import('@/features/notifications/pages/NotificationPreferencesPage'),
);
const AnnouncementsPage = lazy(() => import('@/features/notifications/pages/AnnouncementsPage'));
const EventsPage = lazy(() => import('@/features/operations/pages/EventsPage'));
const AdminAnnouncementsPage = lazy(
  () => import('@/features/admin/announcements/pages/AdminAnnouncementsPage'),
);
const AdminEventsPage = lazy(() => import('@/features/admin/events/pages/AdminEventsPage'));
const AdminModerationPage = lazy(
  () => import('@/features/admin/moderation/pages/AdminModerationPage'),
);
const AdminReportsPage = lazy(() => import('@/features/admin/moderation/pages/AdminReportsPage'));
const AdminEmailTemplatesPage = lazy(
  () => import('@/features/admin/email-templates/pages/AdminEmailTemplatesPage'),
);
const AdminAnalyticsPage = lazy(
  () => import('@/features/admin/analytics/pages/AdminAnalyticsPage'),
);
const AdminFilesPage = lazy(() => import('@/features/admin/files/pages/AdminFilesPage'));
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
        path={ROUTES.ONBOARDING}
        element={
          <LazyPage>
            <OnboardingPage />
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
        {/* ─── F7 global + season leaderboards: public (§09 guard = Public,
             unauthenticated visitors may view; own row simply unhighlighted) ── */}
        <Route
          path={ROUTES.LEADERBOARD}
          element={
            <LazyPage>
              <LeaderboardPage />
            </LazyPage>
          }
        />
        <Route
          path={ROUTES.LEADERBOARD_SEASON}
          element={
            <LazyPage>
              <SeasonLeaderboardPage />
            </LazyPage>
          }
        />
        {/* ─── F8 announcements + events: public (§09 guard = Public,
             register/report actions require a session) ────────────── */}
        <Route
          path={ROUTES.ANNOUNCEMENTS}
          element={
            <LazyPage>
              <AnnouncementsPage />
            </LazyPage>
          }
        />
        <Route
          path={ROUTES.EVENTS}
          element={
            <LazyPage>
              <EventsPage />
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

      {/* ─── F7 certificate verification: public, no shell (SCR-F7-05) ── */}
      <Route
        path={ROUTES.VERIFY_CERTIFICATE}
        element={
          <LazyPage>
            <VerifyCertificatePage />
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
          {/* ─── F4 learner curriculum (AppShell, permission-gated) ─────── */}
          <Route
            path={ROUTES.LEARN}
            element={
              <PermissionRouteGuard permission="curriculum:read">
                <LazyPage>
                  <LearnCurriculumPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.LEARN_LESSON}
            element={
              <PermissionRouteGuard permission="curriculum:read">
                <LazyPage>
                  <LearnLessonPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F5 quiz attempt (AppShell, permission-gated) ──────────── */}
          <Route
            path={ROUTES.LEARN_QUIZ}
            element={
              <PermissionRouteGuard permission="progress.self.read">
                <LazyPage>
                  <QuizAttemptPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F5 professor class analytics (AppShell, permission-gated) ─ */}
          <Route
            path={ROUTES.PROFESSOR_CLASS_PROGRESS}
            element={
              <PermissionRouteGuard permission="progress.class.read">
                <LazyPage>
                  <ProfessorClassProgressPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F6 labs catalog & session (AppShell, permission-gated) ── */}
          <Route
            path={ROUTES.LABS}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <LabsPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.LAB_DETAIL}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <LabDetailPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.SHERLOCK_DIAGNOSTIC}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <SherlockLabPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.TRACKS}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <TracksPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.TRACK_DETAIL}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <TrackDetailPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.VPN_SETTINGS}
            element={
              <PermissionRouteGuard permission="labs:instance:read">
                <LazyPage>
                  <VpnSettingsPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F7 learner achievements (AppShell, permission-gated) ──── */}
          <Route
            path={ROUTES.ACHIEVEMENTS}
            element={
              <PermissionRouteGuard permission="gamification:profile:read">
                <LazyPage>
                  <AchievementsPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F7 cohort leaderboard (AppShell, any-of permission-gated) ── */}
          <Route
            path={ROUTES.LEADERBOARD_COHORT}
            element={
              <PermissionRouteGuard
                permission={[
                  'gamification:class:read',
                  'gamification:org:read',
                  'platform.gamification.manage',
                ]}
              >
                <LazyPage>
                  <CohortLeaderboardPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F8 notification inbox (AppShell, permission-gated) ───── */}
          <Route
            path={ROUTES.NOTIFICATIONS}
            element={
              <PermissionRouteGuard permission="notifications:inbox:read">
                <LazyPage>
                  <NotificationInboxPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F8 notification preferences (AppShell, permission-gated) ── */}
          <Route
            path={ROUTES.NOTIFICATION_PREFERENCES}
            element={
              <PermissionRouteGuard permission="notifications:preferences:write">
                <LazyPage>
                  <NotificationPreferencesPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          {/* ─── F9 billing hub (AppShell, permission-gated) ────────────── */}
          <Route
            path={ROUTES.BILLING}
            element={
              <PermissionRouteGuard permission="billing:subscription:read">
                <LazyPage>
                  <BillingPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.BILLING_PAYMENT_METHODS}
            element={
              <PermissionRouteGuard permission="billing:paymentmethod:manage">
                <LazyPage>
                  <PaymentMethodsPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
          <Route
            path={ROUTES.BILLING_HISTORY}
            element={
              <PermissionRouteGuard permission="billing:order:read">
                <LazyPage>
                  <BillingHistoryPage />
                </LazyPage>
              </PermissionRouteGuard>
            }
          />
        </Route>
        {/* ─── F6 lab session: full-viewport LabShell, no AppShell sidebar ─── */}
        <Route
          path={ROUTES.LAB_SESSION}
          element={
            <PermissionRouteGuard permission="labs:instance:read">
              <LazyPage>
                <LabSessionPage />
              </LazyPage>
            </PermissionRouteGuard>
          }
        />
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
      {/* ─── F5 admin user progress detail (AdminShell, permission-gated) ── */}
      <Route
        path={ROUTES.ADMIN_USER_PROGRESS}
        element={
          <PermissionRouteGuard permission="platform.progress.read">
            <AdminShell>
              <LazyPage>
                <AdminUserProgressPage />
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
      {/* ─── F8 admin announcements (AdminShell, permission-gated) ─── */}
      <Route
        path={ROUTES.ADMIN_ANNOUNCEMENTS}
        element={
          <PermissionRouteGuard permission="platform.content.moderate">
            <AdminShell>
              <LazyPage>
                <AdminAnnouncementsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin events (AdminShell, permission-gated) ─────────── */}
      <Route
        path={ROUTES.ADMIN_EVENTS}
        element={
          <PermissionRouteGuard permission="platform.admin.access">
            <AdminShell>
              <LazyPage>
                <AdminEventsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin moderation (AdminShell, permission-gated) ─────── */}
      <Route
        path={ROUTES.ADMIN_MODERATION}
        element={
          <PermissionRouteGuard permission="platform.content.moderate">
            <AdminShell>
              <LazyPage>
                <AdminModerationPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin report queue (AdminShell, permission-gated) ───── */}
      <Route
        path={ROUTES.ADMIN_REPORTS}
        element={
          <PermissionRouteGuard permission="platform.content.moderate">
            <AdminShell>
              <LazyPage>
                <AdminReportsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin email templates (AdminShell, permission-gated) ── */}
      <Route
        path={ROUTES.ADMIN_EMAIL_TEMPLATES}
        element={
          <PermissionRouteGuard permission="platform.admin.access">
            <AdminShell>
              <LazyPage>
                <AdminEmailTemplatesPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin analytics (AdminShell, permission-gated) ──────── */}
      <Route
        path={ROUTES.ADMIN_ANALYTICS}
        element={
          <PermissionRouteGuard permission="platform.analytics.read">
            <AdminShell>
              <LazyPage>
                <AdminAnalyticsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F8 admin file library (AdminShell, permission-gated) ───── */}
      <Route
        path={ROUTES.ADMIN_FILES}
        element={
          <PermissionRouteGuard permission="platform.admin.access">
            <AdminShell>
              <LazyPage>
                <AdminFilesPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      {/* ─── F9 admin billing (AdminShell, permission-gated) ─────────── */}
      <Route
        path={ROUTES.ADMIN_BILLING}
        element={
          <PermissionRouteGuard permission="platform.billing.manage">
            <AdminShell>
              <LazyPage>
                <AdminBillingPage />
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
      {/* ─── F6 labs admin (AdminShell, permission-gated) ──────────────── */}
      <Route
        path={ROUTES.ADMIN_LABS}
        element={
          <PermissionRouteGuard permission="platform.labs.manage">
            <AdminShell>
              <LazyPage>
                <AdminLabsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_TRACKS}
        element={
          <PermissionRouteGuard permission="platform.labs.manage">
            <AdminShell>
              <LazyPage>
                <AdminTracksPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_LAB_INSTANCES}
        element={
          <PermissionRouteGuard permission="platform.labs.admin">
            <AdminShell>
              <LazyPage>
                <AdminLabInstancesPage />
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

      {/* ─── F4 curriculum management (AdminShell, permission-gated) ─────── */}
      <Route
        path={ROUTES.ADMIN_CURRICULUM}
        element={
          <PermissionRouteGuard permission="platform.curriculum.manage">
            <AdminShell>
              <LazyPage>
                <AdminCurriculumPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_CURRICULUM_MODULE}
        element={
          <PermissionRouteGuard permission="platform.curriculum.manage">
            <AdminShell>
              <LazyPage>
                <AdminModuleEditorPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_CURRICULUM_LESSON}
        element={
          <PermissionRouteGuard permission="platform.curriculum.manage">
            <AdminShell>
              <LazyPage>
                <AdminLessonEditorPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_CURRICULUM_QUIZ}
        element={
          <PermissionRouteGuard permission="platform.curriculum.manage">
            <AdminShell>
              <LazyPage>
                <AdminQuizBuilderPage />
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
      {/* ─── F5 org-admin student analytics (OrgAdminShell, permission-gated) ─ */}
      <Route
        path={ROUTES.ORG_STUDENTS_PROGRESS}
        element={
          <PermissionRouteGuard permission="progress.org.read">
            <Suspense fallback={<LoadingState />}>
              <OrgAdminShell>
                <LazyPage>
                  <OrgStudentsProgressPage />
                </LazyPage>
              </OrgAdminShell>
            </Suspense>
          </PermissionRouteGuard>
        }
      />

      {/* ─── F7 gamification management (AdminShell, permission-gated) ─── */}
      <Route
        path={ROUTES.ADMIN_GAMIFICATION}
        element={
          <PermissionRouteGuard permission="platform.gamification.manage">
            <AdminShell>
              <LazyPage>
                <AdminGamificationPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_BADGES}
        element={
          <PermissionRouteGuard permission="platform.gamification.manage">
            <AdminShell>
              <LazyPage>
                <AdminBadgesPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_ACHIEVEMENTS}
        element={
          <PermissionRouteGuard permission="platform.gamification.manage">
            <AdminShell>
              <LazyPage>
                <AdminAchievementsPage />
              </LazyPage>
            </AdminShell>
          </PermissionRouteGuard>
        }
      />
      <Route
        path={ROUTES.ADMIN_SEASONS}
        element={
          <PermissionRouteGuard permission="platform.gamification.manage">
            <AdminShell>
              <LazyPage>
                <AdminSeasonsPage />
              </LazyPage>
            </AdminShell>
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
        element={<Navigate to={ROUTES.CURRICULUM} replace />}
      />
      <Route
        path={ROUTES.LEARNING_PATH}
        element={<Navigate to={ROUTES.CURRICULUM} replace />}
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

import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SignupForm } from '../components/SignupForm';
import { useAuthStore } from '../stores/authStore';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex h-full">
      <div className="flex w-full flex-col justify-center bg-chalk-white px-6 md:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-xl font-semibold text-deep-onyx">Create your account</h1>
          <p className="mt-1 text-sm text-deep-onyx-600">Begin your journey in security mastery</p>
          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/2 flex-col justify-center bg-deep-onyx px-12 lg:px-16">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-spring-green text-sm font-bold text-deep-onyx">
              DM
            </div>
            <span className="text-lg font-semibold text-chalk-white">DevOps Mentor</span>
          </div>

          <div className="mt-10 space-y-4">
            <p className="text-2xl font-light leading-snug text-chalk-white">
              Placeholder marketing headline.
            </p>
            <p className="text-sm leading-relaxed text-chalk-white-400">
              Placeholder supporting copy that communicates platform value proposition and key benefits for security professionals.
            </p>
          </div>

          <div className="mt-12 flex gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-spring-green" />
            <div className="h-1.5 w-1.5 rounded-full bg-deep-onyx-600" />
            <div className="h-1.5 w-1.5 rounded-full bg-deep-onyx-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

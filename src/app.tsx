import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from './config/api-client.ts';
import { useSessionQuery } from './hooks/auth/use-session-query.ts';
import { ROUTES } from './constants/routes.ts';
const LandingPage = lazy(() =>
  import('./pages/landing/index.tsx').then((module) => ({ default: module.LandingPage })),
);
const LoginPage = lazy(() =>
  import('./pages/auth/login/index.tsx').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/register/index.tsx').then((module) => ({ default: module.RegisterPage })),
);
const ContactPage = lazy(() =>
  import('./pages/contact/index.tsx').then((module) => ({ default: module.ContactPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/dashboard/index.tsx').then((module) => ({ default: module.DashboardPage })),
);
const FaqPage = lazy(() =>
  import('./pages/faq/index.tsx').then((module) => ({ default: module.FaqPage })),
);
const MissionPage = lazy(() =>
  import('./pages/mission/index.tsx').then((module) => ({ default: module.MissionPage })),
);
const OnboardingPage = lazy(() =>
  import('./pages/onboarding/index.tsx').then((module) => ({ default: module.OnboardingPage })),
);

function AuthTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      animate={{ opacity: 1, x: 0 }}
      className="min-h-dvh"
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -48 }}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 48 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

function OnboardingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSessionQuery();

  useEffect(() => {
    if (
      session.error instanceof ApiError &&
      session.error.code === 'institution_onboarding_required' &&
      location.pathname !== ROUTES.onboarding
    ) {
      navigate(ROUTES.onboarding, { replace: true });
    }
  }, [location.pathname, navigate, session.error]);

  return null;
}

function PageFallback() {
  return (
    <main aria-busy="true" className="grid min-h-dvh place-items-center bg-white px-5">
      <p className="text-lg font-bold text-muted" role="status">
        Membuka halaman…
      </p>
    </main>
  );
}

export function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true }),
    );
  }, [location.pathname]);

  return (
    <LazyMotion features={domAnimation} strict>
      <OnboardingRedirect />
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence initial={false} mode="wait">
          <Routes key={location.pathname} location={location}>
            <Route element={<LandingPage />} path={ROUTES.landing} />
            <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            <Route element={<MissionPage />} path={ROUTES.mission} />
            <Route element={<FaqPage />} path={ROUTES.faq} />
            <Route element={<ContactPage />} path={ROUTES.contact} />
            <Route element={<OnboardingPage />} path={ROUTES.onboarding} />
            <Route
              element={
                <AuthTransition>
                  <LoginPage />
                </AuthTransition>
              }
              path={ROUTES.login}
            />
            <Route
              element={
                <AuthTransition>
                  <RegisterPage />
                </AuthTransition>
              }
              path={ROUTES.register}
            />
            <Route element={<Navigate replace to={ROUTES.landing} />} path="*" />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </LazyMotion>
  );
}

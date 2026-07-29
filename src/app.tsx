import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from './constants/routes.ts';
import { LoginPage } from './pages/auth/login/index.tsx';
import { RegisterPage } from './pages/auth/register/index.tsx';
import { LandingPage } from './pages/landing/index.tsx';

const ContactPage = lazy(() =>
  import('./pages/contact/index.tsx').then((module) => ({ default: module.ContactPage })),
);
const FaqPage = lazy(() =>
  import('./pages/faq/index.tsx').then((module) => ({ default: module.FaqPage })),
);
const MissionPage = lazy(() =>
  import('./pages/mission/index.tsx').then((module) => ({ default: module.MissionPage })),
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
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence initial={false} mode="wait">
          <Routes key={location.pathname} location={location}>
            <Route element={<LandingPage />} path={ROUTES.landing} />
            <Route element={<MissionPage />} path={ROUTES.mission} />
            <Route element={<FaqPage />} path={ROUTES.faq} />
            <Route element={<ContactPage />} path={ROUTES.contact} />
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

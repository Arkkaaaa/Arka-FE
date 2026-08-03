import { useEffect } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from './config/api-client.ts';
import { useSessionQuery } from './hooks/auth/use-session-query.ts';
import { ROUTES, ROUTE_PATTERNS } from './constants/routes.ts';
import { LoginPage } from './pages/auth/login/index.tsx';
import { RegisterPage } from './pages/auth/register/index.tsx';
import { ContactPage } from './pages/contact/index.tsx';
import { DashboardPage } from './pages/dashboard/index.tsx';
import { FaqPage } from './pages/faq/index.tsx';
import { GameModePage } from './pages/game-mode/index.tsx';
import { LandingPage } from './pages/landing/index.tsx';
import { LeaderboardPage } from './pages/leaderboard/index.tsx';
import { MissionPage } from './pages/mission/index.tsx';
import { OnboardingPage } from './pages/onboarding/index.tsx';
import { ProfilePage } from './pages/profile/index.tsx';
import { ParticipantDetailPage } from './pages/participants/detail/index.tsx';
import { ParticipantHistoryPage } from './pages/participants/history/index.tsx';
import { RankingsPage } from './pages/rankings/index.tsx';
import { SessionDetailPage } from './pages/sessions/detail/index.tsx';

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
      <AnimatePresence initial={false} mode="wait">
        <Routes key={location.pathname} location={location}>
            <Route element={<LandingPage />} path={ROUTES.landing} />
            <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            <Route element={<LeaderboardPage />} path={ROUTES.progressBoard} />
            <Route element={<RankingsPage />} path={ROUTES.rankings} />
            <Route element={<ParticipantDetailPage />} path={ROUTE_PATTERNS.participant} />
            <Route element={<ParticipantHistoryPage />} path={ROUTE_PATTERNS.participantHistory} />
            <Route element={<SessionDetailPage />} path={ROUTE_PATTERNS.session} />
            <Route element={<ProfilePage />} path={ROUTES.profile} />
            <Route element={<GameModePage />} path={ROUTE_PATTERNS.participantEntry} />
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
    </LazyMotion>
  );
}

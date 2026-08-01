export const API_ENDPOINTS = {
  auth: {
    me: '/api/v1/me',
    capabilities: '/api/v1/auth/capabilities',
    signIn: '/api/auth/sign-in/email',
    signUp: '/api/auth/sign-up/email',
    socialSignIn: '/api/auth/sign-in/social',
    signOut: '/api/auth/sign-out',
    changePassword: '/api/auth/change-password',
    onboarding: '/api/v1/auth/onboarding',
    profile: '/api/v1/profile',
  },
  dashboard: {
    summary: '/api/v1/dashboard/summary',
    activity: '/api/v1/dashboard/activity',
    leaderboard: '/api/v1/dashboard/leaderboard',
    progress: '/api/v1/dashboard/progress',
  },
  games: {
    preparations: '/api/v1/game-preparations',
    sessions: '/api/v1/game-sessions',
    session: (sessionId: string) => `/api/v1/game-sessions/${encodeURIComponent(sessionId)}`,
  },
  participants: {
    list: '/api/v1/participants',
    resolve: '/api/v1/participants/resolve',
    detail: (participantId: string) => `/api/v1/participants/${encodeURIComponent(participantId)}`,
    sessions: (participantId: string) =>
      `/api/v1/participants/${encodeURIComponent(participantId)}/sessions`,
    leaderboard: (participantId: string) =>
      `/api/v1/participants/${encodeURIComponent(participantId)}/leaderboard`,
  },
  devices: {
    list: '/api/v1/devices',
  },
} as const;

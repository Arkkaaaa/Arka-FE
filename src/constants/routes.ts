import type { GameMode } from '@/schemas';

export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  mission: '/mission',
  faq: '/faq',
  contact: '/contact',
  history: '/history',
  devices: '/devices',
  participant: (participantId: string) => `/participants/${encodeURIComponent(participantId)}`,
  participantHistory: (participantId: string) =>
    `/participants/${encodeURIComponent(participantId)}/history`,
  participantEntry: (mode: GameMode) => `/play/${mode}/participant`,
  tutorial: (mode: GameMode) => `/play/${mode}/tutorial`,
  setup: (mode: GameMode) => `/play/${mode}/setup`,
  session: (sessionId: string) => `/sessions/${encodeURIComponent(sessionId)}`,
  result: (sessionId: string) => `/results/${encodeURIComponent(sessionId)}`,
} as const;

export const ROUTE_PATTERNS = {
  participantEntry: '/play/:mode/participant',
  tutorial: '/play/:mode/tutorial',
  setup: '/play/:mode/setup',
  session: '/sessions/:sessionId',
  result: '/results/:sessionId',
  participantHistory: '/participants/:participantId/history',
  participant: '/participants/:participantId',
} as const;

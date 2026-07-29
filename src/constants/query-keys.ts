import type { GameMode } from '@/schemas';

export const QUERY_KEYS = {
  session: ['me'] as const,
  authCapabilities: ['auth', 'capabilities'] as const,
  dashboard: {
    all: ['dashboard'] as const,
    summary: ['dashboard', 'summary'] as const,
  },
  gameSessions: {
    all: ['game-sessions'] as const,
    detail: (sessionId: string | undefined) => ['game-sessions', 'detail', sessionId] as const,
  },
  participants: {
    all: ['participants'] as const,
    detail: (participantId: string | undefined) =>
      ['participants', 'detail', participantId] as const,
    history: (participantId: string | undefined, mode: GameMode | '') =>
      ['participants', 'history', participantId, mode] as const,
    historyPreview: (participantId: string | undefined) =>
      ['participants', 'history-preview', participantId] as const,
    leaderboard: (
      participantId: string | undefined,
      mode: GameMode | undefined,
      gameRuleVersion: string | undefined,
    ) => ['participants', 'leaderboard', participantId, mode, gameRuleVersion] as const,
  },
  devices: {
    all: ['devices'] as const,
  },
} as const;

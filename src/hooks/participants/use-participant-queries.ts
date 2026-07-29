import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { GameMode } from '@/schemas';
import {
  getParticipant,
  getParticipantLeaderboard,
  getParticipantSessions,
} from '../../api/participants.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useParticipantQuery(participantId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.participants.detail(participantId),
    queryFn: () => getParticipant(participantId ?? ''),
    enabled: Boolean(participantId),
  });
}

export function useParticipantHistoryQuery(participantId: string | undefined, mode: GameMode | '') {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.participants.history(participantId, mode),
    queryFn: ({ pageParam }) =>
      getParticipantSessions(participantId ?? '', {
        ...(mode ? { mode } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(participantId),
  });
}

export function useParticipantHistoryPreviewQuery(participantId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.participants.historyPreview(participantId),
    queryFn: () => getParticipantSessions(participantId ?? ''),
    enabled: Boolean(participantId),
  });
}

export function useParticipantLeaderboardQuery(
  participantId: string | undefined,
  mode: GameMode | undefined,
  gameRuleVersion: string | undefined,
) {
  return useQuery({
    queryKey: QUERY_KEYS.participants.leaderboard(participantId, mode, gameRuleVersion),
    queryFn: () =>
      getParticipantLeaderboard(participantId ?? '', mode ?? 'MOTOR_GRIP', gameRuleVersion ?? ''),
    enabled: Boolean(participantId && mode && gameRuleVersion),
  });
}

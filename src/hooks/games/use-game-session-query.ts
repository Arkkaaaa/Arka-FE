import { useQuery } from '@tanstack/react-query';
import type { GameSessionDto } from '@/schemas';
import { getGameSession } from '../../api/games.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useGameSessionQuery(
  sessionId: string | undefined,
  options: { pollWhileSaving?: boolean; retry?: boolean } = {},
) {
  return useQuery<GameSessionDto>({
    queryKey: QUERY_KEYS.gameSessions.detail(sessionId),
    queryFn: () => getGameSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
    ...(options.retry === undefined ? {} : { retry: options.retry }),
    refetchInterval: options.pollWhileSaving
      ? (query) => (['COMPLETED', 'SAVING'].includes(query.state.data?.status ?? '') ? 3000 : false)
      : false,
  });
}

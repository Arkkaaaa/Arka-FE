import { useQuery } from '@tanstack/react-query';
import type { GameSessionDto } from '@/schemas';
import { getGameSession } from '../../api/games.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useGameSessionQuery(
  sessionId: string | undefined,
  options: { pollWhileActive?: boolean; pollWhileSaving?: boolean; retry?: boolean } = {},
) {
  return useQuery<GameSessionDto>({
    queryKey: QUERY_KEYS.gameSessions.detail(sessionId),
    queryFn: () => getGameSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
    ...(options.retry === undefined ? {} : { retry: options.retry }),
    refetchInterval: (query) => {
      const status = query.state.data?.status ?? '';
      if (options.pollWhileActive && ['BINDING', 'COUNTDOWN', 'PLAYING', 'PAUSED'].includes(status))
        return 1_000;
      if (options.pollWhileSaving && ['COMPLETED', 'SAVING'].includes(status)) return 3_000;
      return false;
    },
  });
}

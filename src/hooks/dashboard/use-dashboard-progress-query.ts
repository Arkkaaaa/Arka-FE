import { useQuery } from '@tanstack/react-query';
import { getDashboardProgress } from '../../api/dashboard.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useDashboardProgressQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.progress,
    queryFn: getDashboardProgress,
    enabled,
  });
}

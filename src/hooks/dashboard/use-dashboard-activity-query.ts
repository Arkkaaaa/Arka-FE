import { useQuery } from '@tanstack/react-query';
import { getDashboardActivity } from '../../api/dashboard.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useDashboardActivityQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.activity,
    queryFn: getDashboardActivity,
    enabled,
  });
}

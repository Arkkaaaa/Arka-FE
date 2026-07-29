import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../../api/dashboard.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: getDashboardSummary,
  });
}

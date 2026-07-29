import { useQuery } from '@tanstack/react-query';
import { getAuthCapabilities } from '../../api/auth.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useAuthCapabilitiesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.authCapabilities,
    queryFn: getAuthCapabilities,
    staleTime: 5 * 60_000,
  });
}

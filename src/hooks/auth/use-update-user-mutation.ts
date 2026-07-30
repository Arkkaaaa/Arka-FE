import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../../api/auth.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useUpdateProfileMutation(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateProfile>[0]) => updateProfile(input, csrfToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session }),
  });
}

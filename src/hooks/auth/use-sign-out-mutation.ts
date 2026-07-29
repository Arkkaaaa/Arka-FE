import type { MeDto } from '@/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '../../api/auth.ts';

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (me: MeDto) => signOut(me),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

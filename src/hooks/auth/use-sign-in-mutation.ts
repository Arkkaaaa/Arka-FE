import { useMutation } from '@tanstack/react-query';
import { signIn } from '../../api/auth.ts';

export function useSignInMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
  });
}

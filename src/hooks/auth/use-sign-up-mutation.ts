import type { EmailRegistrationRequest } from '@/schemas';
import { useMutation } from '@tanstack/react-query';
import { signUp } from '../../api/auth.ts';

export function useSignUpMutation() {
  return useMutation({
    mutationFn: (input: EmailRegistrationRequest) => signUp(input),
  });
}

import type { EmailVerificationRequest } from '@/schemas';
import { useMutation } from '@tanstack/react-query';
import { verifyRegistrationEmail } from '../../api/auth.ts';

export function useVerifyRegistrationEmailMutation() {
  return useMutation({
    mutationFn: (input: EmailVerificationRequest) => verifyRegistrationEmail(input),
  });
}

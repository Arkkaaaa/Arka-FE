import { useMutation } from '@tanstack/react-query';
import { resendRegistrationOtp } from '../../api/auth.ts';

export function useResendRegistrationOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => resendRegistrationOtp(email),
  });
}

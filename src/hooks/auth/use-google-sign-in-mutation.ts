import { useMutation } from '@tanstack/react-query';
import { beginGoogleSignIn } from '../../api/auth.ts';
export function useGoogleSignInMutation() {
  return useMutation({
    mutationFn: (intent: 'login' | 'register') => beginGoogleSignIn(intent),
  });
}

import { useMutation } from '@tanstack/react-query';
import { beginGoogleSignIn } from '../../api/auth.ts';
import { ROUTES } from '../../constants/routes.ts';

export function useGoogleSignInMutation() {
  return useMutation({
    mutationFn: () => beginGoogleSignIn(new URL(ROUTES.landing, window.location.origin).toString()),
  });
}

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../../api/auth.ts';

export function useChangePasswordMutation() {
  return useMutation({ mutationFn: changePassword });
}

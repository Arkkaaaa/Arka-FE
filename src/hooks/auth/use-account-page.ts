import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../config/api-client.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useSessionQuery } from './use-session-query.ts';
import { useSignOutMutation } from './use-sign-out-mutation.ts';

export function useAccountPage() {
  const navigate = useNavigate();
  const session = useSessionQuery();
  const signOut = useSignOutMutation();

  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401) {
      navigate(ROUTES.login, { replace: true });
    }
  }, [navigate, session.error]);

  useEffect(() => {
    if (signOut.isSuccess) navigate(ROUTES.landing, { replace: true });
  }, [navigate, signOut.isSuccess]);

  return { navigate, session, signOut };
}

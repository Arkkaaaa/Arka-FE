import { LandingContent } from '../../components/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { useSessionQuery } from '../../hooks/auth/use-session-query.ts';
import { useSignOutMutation } from '../../hooks/auth/use-sign-out-mutation.ts';

export function LandingPage() {
  const session = useSessionQuery();
  const signOut = useSignOutMutation();
  const me = session.data;

  return (
    <LandingContent
      institutionName={me?.institution.name ?? ''}
      isSessionLoading={session.isPending}
      isSignedIn={Boolean(me)}
      isSigningOut={signOut.isPending}
      onSignOut={() => {
        if (me) signOut.mutate(me);
      }}
      signOutError={signOut.isError ? messageOf(signOut.error) : ''}
    />
  );
}

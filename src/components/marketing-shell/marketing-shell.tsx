import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { arkaLogo } from '../../assets/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useSessionQuery } from '../../hooks/auth/use-session-query.ts';
import { useSignOutMutation } from '../../hooks/auth/use-sign-out-mutation.ts';
import { cn } from '../../lib/utils.ts';
import { Brand } from '../brand/brand.tsx';
import { Button, buttonClassName } from '../ui/button/button.tsx';

const NAVIGATION = [
  { label: 'Home', to: ROUTES.landing },
  { label: 'Misi', to: ROUTES.mission },
  { label: 'FAQ', to: ROUTES.faq },
  { label: 'Kontak', to: ROUTES.contact },
] as const;

interface MarketingHeaderProps {
  institutionName?: string;
  isSessionLoading?: boolean;
  isSignedIn?: boolean;
  isSigningOut?: boolean;
  onSignOut?: () => void;
}

export function MarketingHeader({
  institutionName = '',
  isSessionLoading = false,
  isSignedIn = false,
  isSigningOut = false,
  onSignOut,
}: MarketingHeaderProps) {
  return (
    <header className="relative z-20 border-b-2 border-divider bg-white shadow-[0_3px_0_#d9d4c5]">
      <div className="mx-auto grid min-h-18 w-full max-w-[72rem] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 justify-self-start">
          <Brand compact />
        </div>

        <nav
          aria-label="Navigasi utama"
          className="order-3 col-span-2 grid w-full grid-cols-4 gap-1 md:order-none md:col-span-1 md:flex md:w-auto md:gap-3"
        >
          {NAVIGATION.map(({ label, to }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-12 items-center justify-center border-b-[3px] px-1 text-base font-bold no-underline transition-colors duration-150 sm:px-3',
                  isActive
                    ? 'border-brand text-ink'
                    : 'border-transparent text-muted hover:border-brand hover:text-ink',
                )
              }
              end={to === ROUTES.landing}
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="justify-self-end">
          {isSessionLoading ? (
            <span aria-hidden className="block h-12 w-28 rounded-sm bg-divider" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-44 truncate text-base font-bold text-muted lg:inline">
                {institutionName}
              </span>
              <Button disabled={isSigningOut} onClick={onSignOut} variant="secondary">
                {isSigningOut ? 'Keluar…' : 'Keluar'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link className={buttonClassName('quiet', 'hidden lg:inline-flex')} to={ROUTES.login}>
                Masuk
              </Link>
              <Link className={buttonClassName('primary')} to={ROUTES.register}>
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-auto bg-ink px-5 py-10 text-white sm:px-8">
      <div className="mx-auto grid w-full max-w-[72rem] gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Link
            aria-label="Arka, kembali ke halaman utama"
            className="inline-flex min-h-12 items-center no-underline"
            to={ROUTES.landing}
          >
            <img alt="Arka" className="h-12 w-auto object-contain" src={arkaLogo} />
          </Link>
          <p className="mt-4 mb-0 max-w-md text-base leading-7 text-white/80">
            Latihan motorik dan kognitif yang didampingi, jelas, dan mudah diikuti.
          </p>
        </div>
        <div>
          <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {NAVIGATION.map(({ label, to }) => (
              <Link
                className="inline-flex min-h-12 items-center text-base font-bold text-white underline-offset-4 hover:text-brand hover:underline"
                key={to}
                to={to}
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-3 mb-0 text-base font-semibold text-white/70 sm:text-right">© 2026 Arka</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  const session = useSessionQuery();
  const signOut = useSignOutMutation();
  const user = session.data;

  return (
    <div className="flex min-h-dvh flex-col bg-white text-ink">
      <a className="skip-link" href="#konten-utama">
        Lewati ke konten utama
      </a>
      <MarketingHeader
        institutionName={user?.institution.name ?? ''}
        isSessionLoading={session.isPending}
        isSignedIn={Boolean(user)}
        isSigningOut={signOut.isPending}
        onSignOut={() => {
          if (user) signOut.mutate(user);
        }}
      />
      {signOut.isError && (
        <p className="mx-auto w-full max-w-[72rem] px-5 pt-3 text-base font-bold leading-6 text-danger sm:px-8" role="alert">
          {messageOf(signOut.error)}
        </p>
      )}
      <main className="flex-1 outline-none" id="konten-utama" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

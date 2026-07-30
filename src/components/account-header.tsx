import type { MeDto } from '@/schemas';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes.ts';
import { cn } from '../lib/utils.ts';
import { Brand } from './brand/brand.tsx';
import { AccountMenu } from './account-menu/account-menu.tsx';

const NAVIGATION = [
  { label: 'Home', to: ROUTES.landing },
  { label: 'Misi', to: ROUTES.mission },
  { label: 'FAQ', to: ROUTES.faq },
  { label: 'Kontak', to: ROUTES.contact },
] as const;

interface AccountHeaderProps {
  user: MeDto | undefined;
  isSigningOut: boolean;
  onSignOut: () => void;
}

export function AccountHeader({ user, isSigningOut, onSignOut }: AccountHeaderProps) {
  return (
    <header className="border-b-2 border-divider bg-white">
      <div className="mx-auto flex min-h-20 w-full max-w-[78rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Brand compact transparentMark />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-3 md:flex">
          {NAVIGATION.map(({ label, to }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-12 items-center border-b-[3px] px-3 text-base font-bold no-underline transition-colors',
                  isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:border-brand hover:text-ink',
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
        {user ? (
          <AccountMenu
            email={user.user.email}
            image={user.user.image}
            institutionName={user.institution.name}
            isSigningOut={isSigningOut}
            onSignOut={onSignOut}
            userName={user.user.name}
          />
        ) : (
          <span aria-hidden className="block size-12" />
        )}
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.ts';
import { Button } from '../ui/button/button.tsx';

interface AccountMenuProps {
  email: string;
  image: string | null;
  institutionName: string;
  isSigningOut: boolean;
  onSignOut: () => void;
}

function initials(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || 'A';
  const parts = source.split(/\s+/u).filter(Boolean);
  return (parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}` : source.slice(0, 2)).toUpperCase();
}

export function AccountMenu({
  email,
  image,
  institutionName,
  isSigningOut,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof PointerEvent && event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
      if (event instanceof KeyboardEvent) triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeMenu);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeMenu);
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const closeDialog = () => {
    setConfirmOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const confirmSignOut = () => {
    onSignOut();
    setConfirmOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Buka menu akun ${institutionName}`}
        className="inline-flex min-h-12 items-center gap-2 rounded-sm border-2 border-divider bg-white px-2 text-ink shadow-[0_3px_0_#d9d4c5] transition-colors hover:border-brand-ink focus-visible:outline-4"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        {image ? (
          <img
            alt=""
            className="size-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
            src={image}
          />
        ) : (
          <span aria-hidden className="grid size-10 place-items-center rounded-full bg-brand text-base font-black text-ink">
            {initials(institutionName, email)}
          </span>
        )}
        <ChevronDown aria-hidden className="mr-1 hidden size-5 sm:block" />
      </button>

      {open && (
        <div
          aria-label="Menu akun"
          className="absolute top-[calc(100%+0.75rem)] right-0 z-50 w-72 rounded-md border-2 border-divider bg-white p-3 shadow-[0_8px_20px_rgb(23_23_17_/_18%)]"
        >
          <div className="border-b-2 border-divider px-3 pb-3">
            <p className="m-0 truncate text-lg font-black">{institutionName}</p>
            <p className="mt-1 mb-0 truncate text-base text-muted">{email}</p>
          </div>
          <div className="mt-2 grid gap-1">
            <Link
              className="inline-flex min-h-12 items-center gap-3 rounded-sm px-3 text-lg font-bold text-ink no-underline hover:bg-brand-soft"
              onClick={() => setOpen(false)}
              to={ROUTES.dashboard}
            >
              <LayoutDashboard aria-hidden className="size-5" />
              Ke dashboard
            </Link>
            <button
              className="inline-flex min-h-12 items-center gap-3 rounded-sm px-3 text-lg font-bold text-danger hover:bg-danger-soft"
              onClick={() => {
                setOpen(false);
                setConfirmOpen(true);
              }}
              type="button"
            >
              <LogOut aria-hidden className="size-5" />
              Keluar
            </button>
          </div>
        </div>
      )}

      <dialog
        aria-describedby="logout-description"
        aria-labelledby="logout-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border-2 border-divider bg-white p-0 text-ink shadow-[0_10px_30px_rgb(23_23_17_/_24%)] backdrop:bg-ink/60"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        ref={dialogRef}
        role="alertdialog"
      >
        <div className="p-6 sm:p-8">
          <h2 className="m-0 text-3xl font-black tracking-[-0.04em]" id="logout-title">Keluar dari Arka?</h2>
          <p className="mt-4 mb-0 text-lg leading-8 text-muted" id="logout-description">
            Sesi Anda akan ditutup di perangkat ini. Anda dapat masuk lagi kapan saja.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button disabled={isSigningOut} onClick={closeDialog} variant="secondary">
              Tetap masuk
            </Button>
            <Button disabled={isSigningOut} onClick={confirmSignOut} variant="danger">
              {isSigningOut ? 'Keluar…' : 'Ya, keluar'}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

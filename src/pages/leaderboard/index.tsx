import { ArrowLeft, CalendarDays, CircleCheck, Sparkles, TrendingUp, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardProgressDto } from '../../schemas/index.ts';
import { AccountHeader } from '../../components/index.ts';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useAccountPage } from '../../hooks/auth/use-account-page.ts';
import { useDashboardProgressQuery } from '../../hooks/dashboard/use-dashboard-progress-query.ts';

type ParticipantProgress = DashboardProgressDto['participants'][number];

const ACHIEVEMENTS = {
  NOT_STARTED: 'Siap memulai',
  FIRST_SESSION: 'Langkah pertama',
  IMPROVED: 'Terus berkembang',
  CONSISTENT: 'Konsisten berlatih',
  CONTINUING: 'Terus berlatih',
} as const;

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function progressLabel(progress: ParticipantProgress['progress']): string {
  if (progress.status === 'IMPROVED') return 'Meningkat dari sesi pembanding';
  if (progress.status === 'MAINTAINED') return 'Stabil dari sesi pembanding';
  if (progress.status === 'LOWER') return 'Perlu pendampingan pada sesi berikutnya';
  return 'Belum ada sesi pembanding';
}

function ProgressCardSkeleton() {
  return (
    <article aria-hidden className="animate-pulse rounded-md border-2 border-divider bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="size-12 shrink-0 rounded-full bg-brand-soft" />
          <div className="min-w-0">
            <span className="block h-7 w-44 max-w-full rounded-sm bg-divider" />
            <span className="mt-2 block h-5 w-32 rounded-sm bg-divider/70" />
          </div>
        </div>
        <span className="h-9 w-36 rounded-full bg-brand-soft" />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-32 rounded-sm bg-divider/70" />
            <span className="h-5 w-20 rounded-sm bg-divider" />
          </div>
          <span className="mt-2 block h-3 w-full rounded-full bg-divider" />
        </div>
        <div className="flex items-start gap-3">
          <span className="size-5 shrink-0 rounded-full bg-divider" />
          <div className="w-full">
            <span className="block h-4 w-32 rounded-sm bg-divider/70" />
            <span className="mt-2 block h-5 w-52 max-w-full rounded-sm bg-divider" />
          </div>
        </div>
        <div className="flex items-start gap-3 lg:min-w-48">
          <span className="size-5 shrink-0 rounded-full bg-divider" />
          <div className="w-full">
            <span className="block h-4 w-24 rounded-sm bg-divider/70" />
            <span className="mt-2 block h-5 w-40 rounded-sm bg-divider" />
          </div>
        </div>
      </div>
      <div className="mt-5 border-t-2 border-divider pt-4">
        <span className="block h-5 w-56 max-w-full rounded-sm bg-divider/70" />
      </div>
    </article>
  );
}

function ProgressCard({ participant }: { participant: ParticipantProgress }) {
  const latestMode = participant.lastSession
    ? GAME_MODES.find((mode) => mode.mode === participant.lastSession?.mode)
    : null;
  const consistency = (participant.activeWeeksLast4 / 4) * 100;

  return (
    <article className="rounded-md border-2 border-divider bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 truncate text-2xl font-black">{participant.displayName}</h2>
            <p className="mt-1 mb-0 text-base font-bold text-muted">
              {participant.sessionsLast7Days} sesi dalam 7 hari
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-2 text-sm font-black">
          <Sparkles aria-hidden className="size-4" />
          {ACHIEVEMENTS[participant.achievementStatus]}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-muted">Konsistensi 4 pekan</span>
            <span className="text-base font-black">{participant.activeWeeksLast4}/4 pekan</span>
          </div>
          <div aria-hidden className="mt-2 h-3 overflow-hidden rounded-full bg-divider">
            <div className="h-full rounded-full bg-brand" style={{ width: `${consistency}%` }} />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrendingUp aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
          <div>
            <p className="m-0 text-sm font-bold text-muted">Perkembangan pribadi</p>
            <p className="mt-1 mb-0 text-base font-black">{progressLabel(participant.progress)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 lg:min-w-48">
          <CalendarDays aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
          <div>
            <p className="m-0 text-sm font-bold text-muted">Sesi terakhir</p>
            <p className="mt-1 mb-0 text-base font-black">
              {participant.lastSession
                ? `${latestMode?.title ?? participant.lastSession.mode}, ${dateLabel(participant.lastSession.completedAt)}`
                : 'Belum ada sesi'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t-2 border-divider pt-4 text-base font-bold text-muted">
        <CircleCheck aria-hidden className="size-5" />
        {participant.savedSessionsTotal} sesi rehabilitasi tersimpan
      </div>
    </article>
  );
}

export function LeaderboardPage() {
  const { session, signOut } = useAccountPage();
  const progress = useDashboardProgressQuery(Boolean(session.data));

  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-ink">
      <div aria-hidden className="landing-glow landing-glow-soft -top-40 -left-44 size-[34rem]" />
      <a className="skip-link" href="#progress-main">Lewati ke konten utama</a>
      <AccountHeader
        isSigningOut={signOut.isPending}
        onSignOut={() => {
          if (session.data) signOut.mutate(session.data);
        }}
        user={session.data}
      />
      <main className="relative mx-auto w-full max-w-[70rem] px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-12" id="progress-main" tabIndex={-1}>
        <Link className="group inline-flex min-h-11 items-center gap-2 font-black no-underline" to={ROUTES.dashboard}>
          <ArrowLeft aria-hidden className="size-5" />
          <span className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-ink after:transition-transform group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">Kembali ke dashboard</span>
        </Link>

        <section className="mt-8">
          <p className="landing-eyebrow">Pemantauan rehabilitasi</p>
          <h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Progress Board</h1>
          <p className="mt-4 mb-0 max-w-3xl text-lg leading-8 text-muted">Pantau konsistensi, perkembangan pribadi, dan pencapaian peserta tanpa membandingkan kemampuan antarpeserta.</p>

          {progress.isPending && !progress.data ? (
            <div aria-label="Memuat perkembangan peserta" className="mt-8 grid gap-4" role="status">
              {Array.from({ length: 3 }, (_, index) => <ProgressCardSkeleton key={index} />)}
            </div>
          ) : progress.isError ? (
            <div className="mt-8 flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center text-muted" role="status">
              <TrendingUp aria-hidden className="size-9" strokeWidth={1.75} />
              <p className="m-0 text-base font-semibold">Data perkembangan belum tersedia.</p>
            </div>
          ) : progress.data && progress.data.participants.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {progress.data.participants.map((participant) => (
                <ProgressCard key={participant.participantId} participant={participant} />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center text-muted" role="status">
              <UserRound aria-hidden className="size-9" strokeWidth={1.75} />
              <p className="m-0 text-base font-semibold">Belum ada peserta aktif untuk ditampilkan.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

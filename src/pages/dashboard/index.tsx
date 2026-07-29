import { useEffect, useRef, useState, type FormEvent } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { GameMetrics, GameMode } from '../../schemas/index.ts';
import {
  athletesTrainingIllustration,
  eyesEmoji,
  mindfulnessIllustration,
  musicalNotesEmoji,
  retroVideoGameIllustration,
  tangerineEmoji,
} from '../../assets/index.ts';
import { AccountMenu, Brand, Button, Field } from '../../components/index.ts';
import { ApiError, messageOf } from '../../config/api-client.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useDashboardActivityQuery } from '../../hooks/dashboard/use-dashboard-activity-query.ts';
import { useDashboardSummaryQuery } from '../../hooks/dashboard/use-dashboard-summary-query.ts';
import { useResolveParticipantMutation } from '../../hooks/participants/use-participant-mutations.ts';
import {
  useParticipantLeaderboardQuery,
  useParticipantQuery,
} from '../../hooks/participants/use-participant-queries.ts';
import { useSessionQuery } from '../../hooks/auth/use-session-query.ts';
import { useSignOutMutation } from '../../hooks/auth/use-sign-out-mutation.ts';

const MODES = [
  {
    mode: 'MOTOR_GRIP',
    title: 'Peras Jeruk',
    detail: 'Latihan menggenggam dan mempertahankan genggaman yang nyaman.',
    device: 'Genggam alat',
    illustration: athletesTrainingIllustration,
    emoji: tangerineEmoji,
  },
  {
    mode: 'GO_NO_GO',
    title: 'Tangkap Wayang',
    detail: 'Latihan perhatian dengan menggenggam hanya saat Wayang muncul.',
    device: 'Genggam alat',
    illustration: mindfulnessIllustration,
    emoji: eyesEmoji,
  },
  {
    mode: 'SEQUENCE_MEMORY',
    title: 'Ding Dong Dong',
    detail: 'Latihan mengingat urutan melalui empat tombol fisik.',
    device: 'Empat tombol fisik',
    illustration: retroVideoGameIllustration,
    emoji: musicalNotesEmoji,
  },
] as const;

function modeFrom(value: string | null): GameMode {
  return value === 'GO_NO_GO' || value === 'SEQUENCE_MEMORY' ? value : 'MOTOR_GRIP';
}

function dateLabel(value: string | null): string {
  if (!value) return 'Belum ada sesi tersimpan';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function metricLabel(metrics: GameMetrics): string {
  if (metrics.mode === 'MOTOR_GRIP') {
    return `${metrics.peakGripPercent}% genggaman puncak · ${(metrics.continuousHoldMs / 1000).toFixed(1)} detik tahanan`;
  }
  if (metrics.mode === 'GO_NO_GO') {
    return `${metrics.accuracyPercent}% akurasi · ${metrics.falsePositives} respons non-target`;
  }
  return `${metrics.maxSequenceLength} urutan terpanjang · ${metrics.completedLevels} level selesai`;
}

function DashboardSummarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat kesiapan perangkat" className="rounded-md border-2 border-divider p-5">
      <span className="sr-only" role="status">Memuat kesiapan perangkat…</span>
      <div aria-hidden className="grid gap-3 motion-safe:animate-pulse">
        <div className="h-6 w-44 rounded-sm bg-divider" />
        <div className="h-8 w-64 max-w-full rounded-sm bg-divider" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat aktivitas institusi" className="grid gap-4 sm:grid-cols-3">
      <span className="sr-only" role="status">Memuat aktivitas institusi…</span>
      {[0, 1, 2].map((slot) => (
        <div aria-hidden className="h-28 rounded-md border-2 border-divider bg-canvas motion-safe:animate-pulse" key={slot} />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const codeRef = useRef<HTMLInputElement>(null);
  const session = useSessionQuery();
  const signOut = useSignOutMutation();
  const summary = useDashboardSummaryQuery(Boolean(session.data));
  const activity = useDashboardActivityQuery(Boolean(session.data));
  const selectedMode = modeFrom(searchParams.get('mode'));
  const selectedActivity = activity.data?.modes.find((entry) => entry.mode === selectedMode);
  const [participantReference, setParticipantReference] = useState('');
  const [participantId, setParticipantId] = useState<string>();
  const [participantError, setParticipantError] = useState('');
  const resolveParticipant = useResolveParticipantMutation(session.data?.csrfToken ?? '');
  const participant = useParticipantQuery(participantId);
  const leaderboard = useParticipantLeaderboardQuery(
    participantId,
    selectedMode,
    selectedActivity?.latestRuleVersion ?? undefined,
  );

  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401) {
      navigate(ROUTES.login, { replace: true });
    }
  }, [navigate, session.error]);

  useEffect(() => {
    if (signOut.isSuccess) navigate(ROUTES.landing, { replace: true });
  }, [navigate, signOut.isSuccess]);

  async function handleParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = participantReference.trim();
    if (reference.length < 2) {
      setParticipantError('Masukkan kode peserta fasilitas.');
      requestAnimationFrame(() => codeRef.current?.focus());
      return;
    }
    setParticipantError('');
    try {
      const result = await resolveParticipant.mutateAsync({ participantReference: reference });
      setParticipantId(result.participantId);
    } catch (error) {
      setParticipantId(undefined);
      setParticipantError(messageOf(error));
      requestAnimationFrame(() => codeRef.current?.focus());
    }
  }

  const institution = session.data?.institution.name ?? 'Institusi Arka';
  const selected = MODES.find((item) => item.mode === selectedMode) ?? MODES[0];

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a className="skip-link" href="#dashboard-main">Lewati ke konten utama</a>
      <header className="border-b-2 border-divider bg-white">
        <div className="mx-auto flex min-h-20 w-full max-w-[78rem] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Brand compact />
          {session.data ? (
            <AccountMenu
              email={session.data.user.email}
              image={session.data.user.image}
              institutionName={session.data.institution.name}
              isSigningOut={signOut.isPending}
              onSignOut={() => signOut.mutate(session.data!)}
            />
          ) : (
            <span aria-hidden className="block size-12 rounded-full bg-divider" />
          )}
        </div>
      </header>
      {signOut.isError && (
        <p className="mx-auto w-full max-w-[78rem] px-4 pt-4 text-base font-bold text-danger sm:px-6 lg:px-8" role="alert">
          {messageOf(signOut.error)}
        </p>
      )}

      <main className="mx-auto w-full max-w-[78rem] px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-12" id="dashboard-main" tabIndex={-1}>
        <m.section
          animate={{ opacity: 1, y: 0 }}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.4 }}
        >
          <p className="landing-eyebrow">Beranda institusi</p>
          <h1 className="m-0 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Selamat datang, {institution}</h1>
          <p className="mt-4 mb-0 max-w-2xl text-lg leading-8 text-muted">Pilih latihan, periksa kesiapan alat, atau tinjau aktivitas permainan yang sudah tersimpan.</p>
        </m.section>

        <section className="mt-10" aria-labelledby="mode-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="m-0 text-3xl font-black tracking-[-0.04em]" id="mode-title">Pilih latihan</h2>
              <p className="mt-2 mb-0 text-lg text-muted">Satu mode dipilih untuk analisis dan papan skor peserta.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode) => {
              const active = mode.mode === selectedMode;
              return (
                <article className={`overflow-hidden rounded-md border-2 bg-white shadow-[0_5px_0_#d9d4c5] ${active ? 'border-brand-ink' : 'border-divider'}`} key={mode.mode}>
                  <div className="grid h-44 place-items-center bg-brand-soft p-4">
                    <img alt="" aria-hidden className="max-h-36 w-full object-contain" src={mode.illustration} />
                  </div>
                  <div className="p-5">
                    <img alt="" aria-hidden className="size-14" src={mode.emoji} />
                    <h3 className="mt-4 mb-0 text-2xl font-black">{mode.title}</h3>
                    <p className="mt-2 mb-0 min-h-14 text-lg leading-7 text-muted">{mode.detail}</p>
                    <p className="mt-4 mb-0 text-base font-bold text-ink">Perangkat: {mode.device}</p>
                    <Button
                      aria-pressed={active}
                      className="mt-5 w-full"
                      onClick={() => {
                        setSearchParams({ mode: mode.mode });
                        setParticipantId(undefined);
                      }}
                      variant={active ? 'dark' : 'primary'}
                    >
                      {active ? 'Mode dipilih' : 'Pilih mode'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Kesiapan dan aktivitas">
          <div>
            <h2 className="m-0 text-3xl font-black tracking-[-0.04em]">Kesiapan alat</h2>
            <div className="mt-5">
              {summary.isPending ? (
                <DashboardSummarySkeleton />
              ) : summary.isError ? (
                <div className="rounded-md border-2 border-danger bg-danger-soft p-5">
                  <p className="m-0 text-lg font-bold text-danger">Kesiapan alat belum dapat dimuat.</p>
                  <Button className="mt-4" onClick={() => void summary.refetch()} variant="secondary">Coba lagi</Button>
                </div>
              ) : (
                <div className="rounded-md border-2 border-divider bg-white p-5 shadow-[0_4px_0_#d9d4c5]">
                  <p className="m-0 text-2xl font-black">{summary.data?.readinessMessage}</p>
                  <dl className="mt-5 grid grid-cols-3 gap-3">
                    <div><dt className="text-base text-muted">Siap</dt><dd className="m-0 text-3xl font-black">{summary.data?.readyDevices}</dd></div>
                    <div><dt className="text-base text-muted">Online</dt><dd className="m-0 text-3xl font-black">{summary.data?.onlineDevices}</dd></div>
                    <div><dt className="text-base text-muted">Aktif</dt><dd className="m-0 text-3xl font-black">{summary.data?.totalActiveDevices}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="m-0 text-3xl font-black tracking-[-0.04em]">Aktivitas permainan</h2>
            <p className="mt-2 mb-0 text-lg text-muted">Catatan faktual institusi—bukan diagnosis atau ukuran kemampuan klinis.</p>
            <div className="mt-5">
              {activity.isPending ? (
                <ActivitySkeleton />
              ) : activity.isError ? (
                <div className="rounded-md border-2 border-danger bg-danger-soft p-5">
                  <p className="m-0 text-lg font-bold text-danger">Aktivitas belum dapat dimuat.</p>
                  <Button className="mt-4" onClick={() => void activity.refetch()} variant="secondary">Coba lagi</Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md border-2 border-divider bg-white p-5"><p className="m-0 text-base text-muted">Peserta aktif</p><p className="mt-2 mb-0 text-4xl font-black">{activity.data?.activeParticipants}</p></div>
                  <div className="rounded-md border-2 border-divider bg-white p-5"><p className="m-0 text-base text-muted">Sesi tersimpan</p><p className="mt-2 mb-0 text-4xl font-black">{activity.data?.savedSessionsTotal}</p></div>
                  <div className="rounded-md border-2 border-divider bg-white p-5"><p className="m-0 text-base text-muted">7 hari terakhir</p><p className="mt-2 mb-0 text-4xl font-black">{activity.data?.savedSessionsLast7Days}</p></div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="analysis-title">
          <div className="rounded-md border-2 border-divider bg-white p-6 shadow-[0_5px_0_#d9d4c5]">
            <div className="flex items-center gap-4">
              <img alt="" aria-hidden className="size-16" src={selected.emoji} />
              <div>
                <p className="m-0 text-base font-bold text-muted">Mode dipilih</p>
                <h2 className="m-0 text-3xl font-black" id="analysis-title">{selected.title}</h2>
              </div>
            </div>
            <dl className="mt-6 grid gap-4">
              <div><dt className="text-base text-muted">Sesi tersimpan</dt><dd className="m-0 text-3xl font-black">{selectedActivity?.savedSessions ?? 0}</dd></div>
              <div><dt className="text-base text-muted">Sesi 7 hari terakhir</dt><dd className="m-0 text-3xl font-black">{selectedActivity?.sessionsLast7Days ?? 0}</dd></div>
              <div><dt className="text-base text-muted">Terakhir dimainkan</dt><dd className="m-0 text-lg font-bold">{dateLabel(selectedActivity?.latestSavedAt ?? null)}</dd></div>
            </dl>
          </div>

          <div className="rounded-md border-2 border-divider bg-white p-6 shadow-[0_5px_0_#d9d4c5]">
            <h2 className="m-0 text-3xl font-black tracking-[-0.04em]">Papan skor privat peserta</h2>
            <p className="mt-3 mb-0 text-lg leading-8 text-muted">Masukkan kode peserta. Peringkat hanya membandingkan sesi peserta yang sama pada {selected.title} dan versi aturan yang sama.</p>
            <form className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end" noValidate onSubmit={handleParticipant}>
              <Field
                autoComplete="off"
                error={participantError}
                inputRef={codeRef}
                label="Kode peserta fasilitas"
                name="participantReference"
                onChange={(event) => {
                  setParticipantReference(event.target.value);
                  if (participantError) setParticipantError('');
                }}
                placeholder="Contoh: PST-001"
                value={participantReference}
              />
              <Button disabled={!session.data || resolveParticipant.isPending} type="submit">{resolveParticipant.isPending ? 'Mencari…' : 'Lihat papan skor'}</Button>
            </form>

            {participantId && !selectedActivity?.latestRuleVersion && (
              <p className="mt-6 mb-0 rounded-sm bg-brand-soft p-4 text-lg font-bold">Belum ada sesi tersimpan untuk mode ini.</p>
            )}
            {leaderboard.isPending && participantId && selectedActivity?.latestRuleVersion && (
              <p aria-live="polite" className="mt-6 text-lg font-bold text-muted" role="status">Memuat papan skor…</p>
            )}
            {leaderboard.isError && (
              <div className="mt-6 rounded-sm bg-danger-soft p-4"><p className="m-0 text-lg font-bold text-danger">Papan skor belum dapat dimuat.</p><Button className="mt-3" onClick={() => void leaderboard.refetch()} variant="secondary">Coba lagi</Button></div>
            )}
            {leaderboard.data && participant.data && (
              <div className="mt-7">
                <h3 className="m-0 text-2xl font-black">Papan Skor {participant.data.displayName}</h3>
                <p className="mt-2 mb-0 text-base text-muted">Versi aturan: {leaderboard.data.ruleVersion}. Skor permainan bukan nilai klinis.</p>
                {leaderboard.data.entries.length === 0 ? (
                  <p className="mt-5 mb-0 rounded-sm bg-brand-soft p-4 text-lg font-bold">Belum ada hasil tersimpan untuk peserta ini.</p>
                ) : (
                  <ol className="mt-5 grid list-none gap-3 p-0">
                    {leaderboard.data.entries.map((entry) => (
                      <li className="grid gap-2 rounded-sm border-2 border-divider p-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center" key={entry.sessionId}>
                        <span className="text-2xl font-black">#{entry.rank}</span>
                        <div><p className="m-0 text-lg font-black">{dateLabel(entry.completedAt)}</p><p className="mt-1 mb-0 text-base leading-6 text-muted">{metricLabel(entry.metrics)}</p></div>
                        <p className="m-0 text-lg font-bold">Skor permainan: <span className="text-3xl font-black">{entry.score}</span></p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

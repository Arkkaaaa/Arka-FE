import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gamepad2, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppServerMessage } from '../../schemas/index.ts';
import { Button, buttonClassName } from '../../components/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useCreateGameSessionMutation, useCreatePreparationMutation } from '../../hooks/games/use-game-mutations.ts';
import { useGameSessionQuery } from '../../hooks/games/use-game-session-query.ts';
import { useSessionSocket, useSetupSocket } from '../../hooks/realtime/use-realtime.ts';
import {
  playCountdownTone,
  playSequenceTone,
  playStartTone,
  resumeSequenceAudio,
  SEQUENCE_TILES,
  SequenceParticipantEntry,
  SequenceTutorial,
  type SequenceParticipantIdentity,
} from './sequence-tutorial.tsx';

type SessionSnapshot = Extract<AppServerMessage, { type: 'session.snapshot' }>['payload'];

function SequenceBoard({ snapshot }: { snapshot: SessionSnapshot }) {
  const visual = snapshot.visual?.mode === 'SEQUENCE_MEMORY' ? snapshot.visual : null;
  const active = visual?.activeItem ?? null;
  const activeTile = SEQUENCE_TILES.find((tile) => tile.code === active);
  const phaseMessage = visual?.phase === 'EXAMPLE'
    ? activeTile && visual.activeIndex !== null
      ? `Contoh ${visual.activeIndex + 1}/${visual.sequenceLength}: ${activeTile.label}`
      : 'Perhatikan urutan warna dari web dan alat'
    : visual?.phase === 'RESPONSE'
      ? `Jawaban benar ${visual.responseIndex}/${visual.sequenceLength}`
      : visual?.feedback === 'ONE_BUTTON'
        ? 'Tekan satu tombol saja'
        : visual?.feedback === 'REPEAT'
          ? 'Belum tepat, urutan akan diulang'
          : 'Benar, lanjut ke level berikutnya';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <div className="mb-5 text-center" aria-live="polite" aria-atomic="true">
        <p className="m-0 text-sm font-black tracking-[0.1em] text-accent uppercase">Level {visual?.sequenceLength ?? 1} dari 6</p>
        <h2 className="mt-2 mb-0 text-3xl font-black">{phaseMessage}</h2>
        <p className="mt-2 mb-0 text-base font-bold text-muted">Kesempatan tersisa: {visual?.lives ?? 2}</p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 place-items-center gap-x-12 gap-y-7 sm:gap-x-20">
        {SEQUENCE_TILES.map((tile) => {
          const isActive = active === tile.code;
          return (
            <div className="grid min-h-40 place-items-center text-center" key={tile.code}>
              <span className="relative block size-24 sm:size-28" aria-hidden>
                {isActive && <span className="absolute inset-1 animate-ping rounded-full opacity-40" style={{ backgroundColor: tile.color }} />}
                <span
                  className={`relative block size-full rounded-full border-8 border-[#111] transition-[filter,transform] ${isActive ? 'scale-105 brightness-125' : ''}`}
                  style={{ backgroundColor: tile.color, filter: isActive ? `drop-shadow(0 0 26px ${tile.color})` : 'none' }}
                />
              </span>
              <strong className="mt-3 text-2xl">{tile.label}</strong>
              <span className="text-base font-bold text-muted">{tile.icon}</span>
            </div>
          );
        })}
      </div>
      {visual?.phase === 'RESPONSE' && <p className="mt-5 mb-0 text-center text-sm font-bold text-muted">Input hanya dihitung saat giliran Anda. Setiap tombol salah mengurangi satu kesempatan.</p>}
    </div>
  );
}

function SequenceResult({ snapshot, onReplay }: { snapshot: SessionSnapshot; onReplay: () => void }) {
  const result = snapshot.result;
  const metrics = result?.metrics.mode === 'SEQUENCE_MEMORY' ? result.metrics : null;

  if (!result || !metrics) return null;

  return (
    <section aria-labelledby="result-title">
      <p className="landing-eyebrow">Sesi tersimpan</p>
      <h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="result-title">Hasil sesi {snapshot.displayName}</h1>
      <p className="mt-4 mb-0 rounded-sm bg-brand-soft p-4 text-lg font-bold">Bagus sudah menyelesaikan permainan.</p>
      <p className="mt-4 mb-0 text-base font-bold text-muted">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p>
      <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Memory Span</dt><dd className="mt-2 ml-0 text-4xl font-black">Level {metrics.maxSequenceLength}</dd></div>
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Total skor</dt><dd className="mt-2 ml-0 text-4xl font-black">{result.score}</dd></div>
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Rata-rata waktu reaksi</dt><dd className="mt-2 ml-0 text-4xl font-black">{metrics.meanFirstResponseMs === null ? '—' : `${Math.round(metrics.meanFirstResponseMs)} ms`}</dd></div>
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Level selesai</dt><dd className="mt-2 ml-0 text-4xl font-black">{metrics.completedLevels}</dd></div>
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Percobaan salah</dt><dd className="mt-2 ml-0 text-4xl font-black">{metrics.wrongAttempts}</dd></div>
        <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">Permainan selesai karena</dt><dd className="mt-2 ml-0 text-xl font-black">{metrics.completionReason === 'LEVEL_CAP_REACHED' ? 'Semua level selesai' : 'Kesempatan habis'}</dd></div>
      </dl>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={onReplay}>Main lagi</Button>
        <Link className={buttonClassName('secondary')} to={ROUTES.progressBoard}>Lihat Progress Board</Link>
        <Link className={buttonClassName('quiet')} to={ROUTES.dashboard}>Kembali ke dashboard</Link>
      </div>
    </section>
  );
}

export type SequenceMemoryStage = 'participant' | 'tutorial' | 'setup' | 'session';

interface SequenceMemoryFlowProps {
  csrfToken: string;
  onStageChange: (stage: SequenceMemoryStage) => void;
}

export function SequenceMemoryFlow({ csrfToken, onStageChange }: SequenceMemoryFlowProps) {
  const [stage, setStageState] = useState<SequenceMemoryStage>('participant');
  const setStage = useCallback((next: SequenceMemoryStage) => {
    setStageState(next);
    onStageChange(next);
  }, [onStageChange]);
  const [participant, setParticipant] = useState<SequenceParticipantIdentity | null>(null);
  const participantName = participant?.displayName ?? '';
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [muted, setMuted] = useState(false);
  const sessionAttemptRef = useRef<{ preparationId: string; idempotencyKey: string } | null>(null);
  const sessionStartingRef = useRef(false);
  const sessionRecoveryRef = useRef<string | null>(null);
  const countdownToneRef = useRef<number | null>(null);
  const activeToneRef = useRef<string | null>(null);
  const preparation = useCreatePreparationMutation(csrfToken);
  const createSession = useCreateGameSessionMutation(csrfToken);
  const persistedSession = useGameSessionQuery(sessionId ?? undefined, {
    pollWhileActive: true,
    pollWhileSaving: true,
    retry: true,
  });
  const setupSocket = useSetupSocket(preparation.data?.setupId ?? null);
  const sessionSocket = useSessionSocket(sessionId);
  const setupSnapshot = setupSocket.message?.type === 'setup.snapshot' ? setupSocket.message.payload : null;
  const sessionSnapshot = sessionSocket.message?.type === 'session.snapshot' ? sessionSocket.message.payload : null;
  const canStart = setupSnapshot?.canStart ?? preparation.data?.canStart ?? false;
  const persistedStatus = persistedSession.data?.status;
  const status =
    persistedStatus && persistedStatus !== 'BINDING'
      ? persistedStatus
      : sessionSnapshot?.status ?? createSession.data?.status ?? 'BINDING';
  const setupTerminal = setupSnapshot?.state === 'CANCELLED' || setupSnapshot?.state === 'EXPIRED';
  const setupFailed = setupSocket.status === 'FAILED' || setupSocket.protocolError !== null;

  const startPreparation = useCallback(() => {
    if (!csrfToken || preparation.isPending) return;
    setStage('setup');
    sessionAttemptRef.current = null;
    sessionStartingRef.current = false;
    createSession.reset();
    preparation.reset();
    if (!participant) return;
    preparation.mutate({
      mode: 'SEQUENCE_MEMORY',
      displayName: participant.displayName,
      participantReference: participant.participantReference,
      privacyAcknowledged: true,
    });
  }, [createSession, csrfToken, participant, preparation, setStage]);

  const startSession = useCallback(async () => {
    const current = preparation.data;
    if (!current || sessionStartingRef.current) return;
    const existing = sessionAttemptRef.current;
    const attempt =
      existing?.preparationId === current.preparationId
        ? existing
        : { preparationId: current.preparationId, idempotencyKey: crypto.randomUUID() };
    sessionAttemptRef.current = attempt;
    sessionStartingRef.current = true;
    try {
      const created = await createSession.mutateAsync(attempt);
      setSessionId(created.sessionId);
      preparation.reset();
      sessionAttemptRef.current = null;
      setStage('session');
    } catch {
      return;
    } finally {
      sessionStartingRef.current = false;
    }
  }, [createSession, preparation.data, setStage]);

  useEffect(() => {
    if (stage === 'setup' && canStart && !createSession.isError) void startSession();
  }, [canStart, createSession.isError, stage, startSession]);

  function retrySetup() {
    if (createSession.isError && preparation.data && !setupTerminal) {
      createSession.reset();
      void startSession();
      return;
    }
    if (preparation.data && setupFailed && !setupTerminal) {
      setupSocket.reconnect();
      return;
    }
    startPreparation();
  }

  useEffect(() => {
    if (status !== 'COUNTDOWN') {
      setCountdown(3);
      return;
    }
    setCountdown(sessionSnapshot?.countdown ?? 3);
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [sessionSnapshot?.countdown, status]);

  useEffect(() => {
    if (muted) return;
    if (status === 'COUNTDOWN' && countdown > 0 && countdownToneRef.current !== countdown) {
      countdownToneRef.current = countdown;
      playCountdownTone(countdown);
      return;
    }
    if (status === 'PLAYING' && countdownToneRef.current !== 0) {
      countdownToneRef.current = 0;
      playStartTone();
    }
    if (status !== 'COUNTDOWN' && status !== 'PLAYING') countdownToneRef.current = null;
  }, [countdown, muted, status]);

  useEffect(() => {
    if (!sessionId) return;
    const websocketStatus = sessionSnapshot?.status ?? null;
    const durableStatus = persistedSession.data?.status ?? null;
    const needsRecovery =
      (countdown === 0 && websocketStatus === 'COUNTDOWN') ||
      (durableStatus !== null && durableStatus !== 'BINDING' && durableStatus !== websocketStatus);
    const recoveryKey = `${sessionId}:${durableStatus ?? 'countdown-expired'}:${websocketStatus ?? 'none'}`;
    if (!needsRecovery || sessionRecoveryRef.current === recoveryKey) return;
    sessionRecoveryRef.current = recoveryKey;
    sessionSocket.reconnect();
    void persistedSession.refetch();
  }, [countdown, persistedSession.data?.status, persistedSession.refetch, sessionId, sessionSnapshot?.status, sessionSocket]);

  useEffect(() => {
    if (!sessionSocket.message || sessionSocket.message.type !== 'session.snapshot') return;
    const snapshot = sessionSocket.message.payload;
    const visual = snapshot.visual?.mode === 'SEQUENCE_MEMORY' ? snapshot.visual : null;
    const activeItem = snapshot.status === 'PLAYING' && visual?.phase === 'EXAMPLE'
      ? visual.activeItem
      : null;
    if (activeItem === activeToneRef.current) return;
    activeToneRef.current = activeItem;
    if (!activeItem || muted) return;
    const tile = SEQUENCE_TILES.find((item) => item.code === activeItem);
    if (tile) playSequenceTone(tile.frequency);
  }, [muted, sessionSocket.message]);

  const sessionError = sessionSocket.protocolError;
  const connectionLabel = useMemo(() => {
    if (sessionSocket.status === 'OPEN') return 'Terhubung';
    if (sessionSocket.status === 'RECONNECTING') return 'Menyambungkan ulang…';
    if (sessionSocket.status === 'FAILED') return 'Koneksi gagal';
    return 'Menghubungkan…';
  }, [sessionSocket.status]);

  function reset() {
    sessionSocket.close();
    preparation.reset();
    createSession.reset();
    sessionAttemptRef.current = null;
    sessionStartingRef.current = false;
    setSessionId(null);
    setStage('participant');
  }

  if (stage === 'participant') {
    return <SequenceParticipantEntry csrfToken={csrfToken} onContinue={(identity) => {
      setParticipant(identity);
      setStage('tutorial');
    }} />;
  }

  if (stage === 'tutorial') {
    return (
      <SequenceTutorial
        onBack={() => setStage('participant')}
        onReady={() => {
          resumeSequenceAudio();
          startPreparation();
        }}
        participantName={participantName}
      />
    );
  }

  if (stage === 'setup') {
    return (
      <section aria-labelledby="setup-title">
        <p className="landing-eyebrow">Persiapan untuk {participantName}</p>
        <h1 className="m-0 text-4xl font-black tracking-[-0.05em]" id="setup-title">Siapkan empat tombol</h1>
        <p className="mt-4 mb-0 text-lg text-muted">Perangkat akan dipilih dan divalidasi otomatis oleh sistem.</p>

        {preparation.isPending ? (
          <div className="mt-8 flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border-2 border-divider p-6 text-center text-muted" role="status">
            <Gamepad2 aria-hidden className="size-9" />
            <p className="m-0 text-lg font-bold">Menyiapkan perangkat…</p>
          </div>
        ) : preparation.isError || setupTerminal || setupFailed || createSession.isError ? (
          <div className="mt-8 flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border-2 border-divider p-6 text-center text-muted" role="alert">
            <AlertTriangle aria-hidden className="size-9" />
            <p className="m-0 text-lg font-bold">
              {preparation.isError
                ? messageOf(preparation.error)
                : createSession.isError
                  ? messageOf(createSession.error)
                  : setupTerminal
                    ? 'Persiapan perangkat berakhir. Coba lagi.'
                    : 'Perangkat belum terhubung. Coba lagi.'}
            </p>
            <Button disabled={preparation.isPending || createSession.isPending} onClick={retrySetup} variant="secondary">
              {createSession.isPending || preparation.isPending ? 'Mencoba lagi…' : 'Coba lagi'}
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-md border-2 border-divider p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span aria-hidden className="grid size-12 place-items-center rounded-full bg-divider"><Gamepad2 className="size-6" /></span>
                <div>
                  <h2 className="m-0 text-2xl font-black">{preparation.data?.device.label}</h2>
                  <p className="mt-1 mb-0 text-base font-bold text-muted">{setupSnapshot?.instruction ?? 'Menghubungkan perangkat.'}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-base font-black text-muted">
                {canStart && <CheckCircle2 aria-hidden className="size-5 text-success" />}
                {canStart ? 'Perangkat siap. Permainan segera dimulai.' : 'Memvalidasi perangkat…'}
              </span>
            </div>
            <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-5 rounded-lg bg-[#171717] p-6">
              {SEQUENCE_TILES.map((tile) => {
                const checked = setupSnapshot?.checkedButton === tile.code;
                return <div className="grid place-items-center gap-2" key={tile.code}><span className="relative block size-20">{checked && <span className="absolute inset-1 animate-ping rounded-full opacity-40" style={{ backgroundColor: tile.color }} />}<span className={`relative block size-full rounded-full border-8 border-[#080808] ${checked ? 'brightness-125' : ''}`} style={{ backgroundColor: tile.color, filter: checked ? `drop-shadow(0 0 20px ${tile.color})` : 'none' }} /></span><strong className="text-sm text-white">{tile.label}</strong></div>;
              })}
            </div>
          </div>
        )}
      </section>
    );
  }

  if (sessionSnapshot?.status === 'SAVED') {
    return <SequenceResult onReplay={reset} snapshot={sessionSnapshot} />;
  }

  if (['ABORTED', 'INTERRUPTED', 'SAVE_FAILED'].includes(status)) {
    return (
      <section className="mx-auto grid min-h-[32rem] max-w-2xl place-items-center text-center" aria-labelledby="terminal-title">
        <div>
          <AlertTriangle aria-hidden className="mx-auto size-12 text-muted" />
          <h1 className="mt-5 mb-0 text-4xl font-black" id="terminal-title">
            {status === 'ABORTED' ? 'Sesi diakhiri' : status === 'INTERRUPTED' ? 'Koneksi alat terputus' : 'Hasil belum dapat disimpan'}
          </h1>
          <p className="mt-4 mb-0 text-lg leading-8 text-muted">
            {sessionSnapshot?.message ?? 'Sesi berhenti. Pastikan perangkat tetap terhubung lalu coba lagi.'}
          </p>
          <Button className="mt-7" onClick={reset}>Kembali ke awal</Button>
        </div>
      </section>
    );
  }

  if (status === 'COMPLETED' || status === 'SAVING') {
    return (
      <section className="grid min-h-96 place-items-center text-center" aria-live="polite">
        <div><CheckCircle2 aria-hidden className="mx-auto size-12 text-success" /><h1 className="mt-5 mb-0 text-4xl font-black">Permainan selesai</h1><p className="mt-3 mb-0 text-lg font-bold text-muted">Menyimpan hasil…</p></div>
      </section>
    );
  }

  if (status === 'BINDING' || status === 'COUNTDOWN') {
    return (
      <section className="grid min-h-[32rem] place-items-center text-center" aria-live="polite">
        <div>
          <p className="landing-eyebrow">{participantName}</p>
          {status === 'COUNTDOWN' ? (
            <><p className="m-0 text-[8rem] leading-none font-black text-accent">{countdown}</p><h1 className="mt-5 mb-0 text-4xl font-black">Bersiap</h1><p className="mt-3 mb-0 text-lg text-muted">Permainan belum dimulai.</p></>
          ) : (
            <><Gamepad2 aria-hidden className="mx-auto size-14 text-muted" /><h1 className="mt-5 mb-0 text-4xl font-black">Menyiapkan permainan—tunggu sebentar</h1><p className="mt-3 mb-0 text-lg text-muted">Perangkat dan aplikasi sedang dikonfirmasi.</p></>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="game-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-5">
        <div><p className="m-0 text-sm font-black text-muted">{participantName}</p><h1 className="mt-1 mb-0 text-3xl font-black" id="game-title">Ding Dong Dong</h1></div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-2 text-sm font-bold text-muted">{connectionLabel}</span>
          <Button onClick={() => sessionSocket.sendCommand(status === 'PAUSED' ? 'RESUME' : 'PAUSE')} variant="secondary">{status === 'PAUSED' ? <Play aria-hidden className="size-5" /> : <Pause aria-hidden className="size-5" />}{status === 'PAUSED' ? 'Lanjutkan' : 'Jeda'}</Button>
          <Button onClick={() => {
            if (window.confirm('Sesi tidak akan dihitung sebagai selesai. Akhiri sesi?')) sessionSocket.sendCommand('ABORT');
          }} variant="danger">Akhiri sesi</Button>
        </div>
      </div>
      {sessionError && <p className="mt-4 mb-0 text-base font-bold text-muted" role="status">{sessionError}</p>}
      {status === 'PAUSED' ? (
        <div className="mt-7 grid min-h-96 place-items-center rounded-md border-2 border-divider text-center"><div><Pause aria-hidden className="mx-auto size-12 text-muted" /><h2 className="mt-4 mb-0 text-4xl font-black">Dijeda</h2><p className="mt-3 mb-0 text-lg text-muted">Waktu dan penilaian berhenti.</p></div></div>
      ) : sessionSnapshot ? <div className="mt-7"><SequenceBoard snapshot={sessionSnapshot} /></div> : null}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gamepad2, Hand, Pause, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { AppServerMessage, GameMode } from '../../schemas/index.ts';
import { Button, buttonClassName } from '../../components/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { ROUTES } from '../../constants/routes.ts';
import { useCreateGameSessionMutation, useCreatePreparationMutation } from '../../hooks/games/use-game-mutations.ts';
import { useGameSessionQuery } from '../../hooks/games/use-game-session-query.ts';
import { useSessionSocket, useSetupSocket } from '../../hooks/realtime/use-realtime.ts';
import {
  GameParticipantEntry,
  GameTutorial,
  playCountdownTone,
  playSequenceTone,
  playStartTone,
  resumeGameAudio,
  SEQUENCE_TILES,
  type GameParticipantIdentity,
} from './sequence-tutorial.tsx';

type SessionSnapshot = Extract<AppServerMessage, { type: 'session.snapshot' }>['payload'];
type SetupSnapshot = Extract<AppServerMessage, { type: 'setup.snapshot' }>['payload'];

const STIMULUS_LABELS = {
  WAYANG: 'Wayang',
  BATIK: 'Batik',
  CANDI: 'Candi',
  MONAS: 'Monas',
  ANGKLUNG: 'Angklung',
} as const;

function SequenceBoard({ snapshot }: { snapshot: SessionSnapshot }) {
  const visual = snapshot.visual?.mode === 'SEQUENCE_MEMORY' ? snapshot.visual : null;
  const activeTile = SEQUENCE_TILES.find((tile) => tile.code === visual?.activeItem);
  const lastCueId = useRef<string | null>(null);
  const responseRemaining = visual ? Math.max(visual.sequenceLength - visual.responseIndex, 0) : 0;
  const instruction = visual?.feedback === 'ONE_BUTTON'
    ? 'Tekan satu tombol saja.'
    : visual?.feedback === 'REPEAT'
      ? 'Mari lihat urutannya lagi.'
      : visual?.phase === 'RESPONSE'
        ? 'Sekarang ikuti urutannya.'
        : 'Perhatikan urutannya.';

  useEffect(() => {
    if (!visual?.cueId || !activeTile || lastCueId.current === visual.cueId) return;
    lastCueId.current = visual.cueId;
    playSequenceTone(activeTile.frequency, 260);
  }, [activeTile, visual?.cueId]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-2xl font-black">{instruction}</p><span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-black">Sisa kesempatan {visual?.remainingAttempts ?? 3}</span></div>
      {visual?.phase === 'RESPONSE' && <p className="mt-2 mb-0 font-bold text-muted">Sisa {responseRemaining} tombol</p>}
      <div className="mt-7 grid grid-cols-2 gap-5 rounded-lg border-4 border-ink bg-[#171717] p-6 sm:gap-7 sm:p-8">
        {SEQUENCE_TILES.map((tile) => {
          const active = tile.code === visual?.activeItem;
          return <div className="grid place-items-center text-center" key={tile.code}><span className="relative block aspect-square w-full max-w-32">{active && <span className="absolute inset-2 animate-ping rounded-full opacity-40" style={{ backgroundColor: tile.color }} />}<span className={`relative block size-full rounded-full border-8 border-[#080808] transition ${active ? 'scale-105 brightness-125' : 'brightness-75'}`} style={{ backgroundColor: tile.color, filter: active ? `drop-shadow(0 0 28px ${tile.color})` : 'none' }} /></span><strong className="mt-3 block text-lg text-white">{tile.label}</strong><span className="mt-1 block text-sm font-bold text-white/70">{tile.icon}</span></div>;
        })}
      </div>
    </div>
  );
}

function MotorGripBoard({ snapshot }: { snapshot: SessionSnapshot }) {
  const visual = snapshot.visual?.mode === 'MOTOR_GRIP' ? snapshot.visual : null;
  const illustration = GAME_MODES.find((item) => item.mode === 'MOTOR_GRIP')!.emoji;
  const grip = Math.round(visual?.gripPercent ?? 0);
  const hold = Math.min(((visual?.holdProgressMs ?? 0) / 5000) * 100, 100);
  const remaining = Math.max(30 - Math.floor((visual?.activeElapsedMs ?? 0) / 1000), 0);
  return (
    <div className="mx-auto grid w-full max-w-4xl items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
      <div className="grid min-h-[28rem] place-items-center rounded-lg border-4 border-ink bg-[#fff7e7] p-8 text-center">
        <div><div className="relative mx-auto grid size-64 place-items-center rounded-full border-[12px] border-[#8f4815] bg-[#ef8f2f] shadow-[inset_-24px_-26px_0_rgba(149,72,17,0.2)]" style={{ transform: `scaleX(${Math.max(0.7, 1 - grip * 0.003)})` }}><img alt="" aria-hidden className="size-32" src={illustration} /></div><p className="mt-7 mb-0 text-3xl font-black">{grip >= 30 ? 'Tahan genggamannya' : 'Ayo genggam alatnya'}</p><p className="mt-2 mb-0 text-lg font-bold text-muted">{visual?.message ?? 'Peras jeruk sampai penuh.'}</p></div>
      </div>
      <div className="grid gap-6"><div className="rounded-md border-2 border-divider bg-white p-6"><div className="flex items-end justify-between gap-4"><span className="font-black text-muted">Kekuatan genggaman</span><strong className="text-5xl">{grip}%</strong></div><div aria-hidden className="mt-4 h-7 overflow-hidden rounded-full bg-divider"><div className="h-full bg-[#d67b1f] transition-[width] duration-100" style={{ width: `${grip}%` }} /></div></div><div className="rounded-md border-2 border-divider bg-white p-6"><div className="flex items-end justify-between gap-4"><span className="font-black text-muted">Tahan 5 detik</span><strong className="text-3xl">{((visual?.holdProgressMs ?? 0) / 1000).toFixed(1)} dtk</strong></div><div aria-hidden className="mt-4 h-7 overflow-hidden rounded-full bg-divider"><div className="h-full bg-[#399267] transition-[width] duration-100" style={{ width: `${hold}%` }} /></div></div><p className="m-0 text-center text-base font-black text-muted">Sisa waktu sesi {remaining} detik</p></div>
    </div>
  );
}

function GoNoGoBoard({ snapshot }: { snapshot: SessionSnapshot }) {
  const visual = snapshot.visual?.mode === 'GO_NO_GO' ? snapshot.visual : null;
  const stimulus = visual?.stimulus ? STIMULUS_LABELS[visual.stimulus] : 'Bersiap';
  const target = visual?.stimulus === 'WAYANG';
  const feedback = visual?.feedback === 'CORRECT' ? 'Bagus' : visual?.feedback === 'MISS' ? 'Tidak apa-apa, lanjutkan' : visual?.feedback === 'FALSE_POSITIVE' ? 'Tunggu Wayang berikutnya' : visual?.feedback === 'WAIT' ? 'Tunggu gambar berikutnya' : null;
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 rounded-full bg-[#eaf3ff] px-4 py-2 text-base font-black text-[#245f9f]">Genggam saat: Wayang</p><p className="m-0 font-black text-muted">Percobaan {visual?.trialNumber ?? 0} dari 40 · Benar {visual?.correctTrials ?? 0}</p></div>
      <div className={`mt-7 grid min-h-[30rem] place-items-center rounded-lg border-4 border-ink p-8 text-center ${target ? 'bg-[#e8f7ef]' : 'bg-[#f4f1e9]'}`} aria-live="polite">
        <div><p className="m-0 text-sm font-black tracking-[0.12em] text-muted uppercase">Gambar sekarang</p><h2 className="mt-5 mb-0 text-7xl font-black tracking-[-0.06em] sm:text-8xl">{stimulus}</h2><p className={`mt-8 mb-0 inline-flex rounded-md px-6 py-4 text-2xl font-black ${target ? 'bg-[#399267] text-white' : 'bg-white text-ink'}`}>{target ? 'Genggam sekarang' : 'Jangan genggam'}</p>{feedback && <p className="mt-6 mb-0 text-xl font-black text-muted">{feedback}</p>}</div>
      </div>
    </div>
  );
}

function GameBoard({ mode, snapshot }: { mode: GameMode; snapshot: SessionSnapshot }) {
  if (mode === 'MOTOR_GRIP') return <MotorGripBoard snapshot={snapshot} />;
  if (mode === 'GO_NO_GO') return <GoNoGoBoard snapshot={snapshot} />;
  return <SequenceBoard snapshot={snapshot} />;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border-2 border-divider p-5"><dt className="text-base font-bold text-muted">{label}</dt><dd className="mt-2 ml-0 text-4xl font-black">{value}</dd></div>;
}

function GameResult({ snapshot, onReplay }: { snapshot: SessionSnapshot; onReplay: () => void }) {
  const result = snapshot.result;
  if (!result) return null;
  const metrics = result.metrics;
  return (
    <section aria-labelledby="result-title">
      <p className="landing-eyebrow">Sesi tersimpan</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="result-title">Hasil sesi {snapshot.displayName}</h1><p className="mt-4 mb-0 text-base font-bold text-muted">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p>
      {metrics.mode === 'MOTOR_GRIP' && <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Total skor" value={result.score} /><MetricCard label="Kekuatan puncak" value={`${Math.round(metrics.peakGripPercent)}%`} /><MetricCard label="Durasi tahan" value={`${(metrics.continuousHoldMs / 1000).toFixed(1)} dtk`} /><MetricCard label="Target latihan" value={metrics.targetCompleted ? 'Tercapai' : 'Belum tercapai'} /><MetricCard label="Durasi permainan" value={`${Math.round(metrics.sessionElapsedMs / 1000)} dtk`} /></dl>}
      {metrics.mode === 'GO_NO_GO' && <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Total skor" value={result.score} /><MetricCard label="Akurasi atensi" value={`${Math.round(metrics.accuracyPercent)}%`} /><MetricCard label="Waktu reaksi rata-rata" value={metrics.meanHitReactionMs === null ? '—' : `${Math.round(metrics.meanHitReactionMs)} ms`} /><MetricCard label="Respons benar" value={metrics.hits + metrics.correctRejections} /><MetricCard label="Terlewat" value={metrics.misses} /><MetricCard label="Kesalahan impulsif" value={metrics.falsePositives} /></dl>}
      {metrics.mode === 'SEQUENCE_MEMORY' && <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Rentang ingatan" value={`Level ${metrics.maxSequenceLength}`} /><MetricCard label="Total skor" value={result.score} /><MetricCard label="Rata-rata waktu reaksi" value={metrics.meanFirstResponseMs === null ? '—' : `${Math.round(metrics.meanFirstResponseMs)} ms`} /><MetricCard label="Level selesai" value={metrics.completedLevels} /><MetricCard label="Percobaan salah" value={metrics.wrongAttempts} /><MetricCard label="Permainan selesai karena" value={metrics.completionReason === 'LEVEL_CAP_REACHED' ? 'Semua level selesai' : 'Kesempatan habis'} /></dl>}
      <div className="mt-7 flex flex-wrap gap-3"><Button onClick={onReplay}>Main lagi</Button><Link className={buttonClassName('secondary')} to={ROUTES.progressBoard}>Lihat Progress Board</Link><Link className={buttonClassName('quiet')} to={ROUTES.dashboard}>Kembali ke dashboard</Link></div>
    </section>
  );
}

function SetupPanel({ mode, snapshot, canStart }: { mode: GameMode; snapshot: SetupSnapshot | null; canStart: boolean }) {
  const illustration = GAME_MODES.find((item) => item.mode === mode)!.emoji;
  if (mode === 'SEQUENCE_MEMORY') return <div className="bg-gradient-to-br from-[#22221f] via-[#11110f] to-[#28261e] p-6 sm:p-8"><div className="mx-auto grid max-w-lg grid-cols-2 gap-5 sm:gap-7">{SEQUENCE_TILES.map((tile) => { const checked = snapshot?.checkedButton === tile.code; return <div className="grid place-items-center gap-3 rounded-md border border-white/10 bg-white/5 p-4" key={tile.code}><span className="relative block aspect-square w-full max-w-24">{checked && <span className="absolute inset-1 animate-ping rounded-full opacity-40" style={{ backgroundColor: tile.color }} />}<span className={`relative block size-full rounded-full border-8 border-[#080808] transition ${checked ? 'scale-105 brightness-125' : 'brightness-75'}`} style={{ backgroundColor: tile.color }} /></span><span className="text-center"><strong className="block text-base text-white">{tile.label}</strong><span className="mt-1 block text-xs font-bold text-white/60">{tile.icon}</span></span></div>; })}</div></div>;
  if (mode === 'GO_NO_GO') return <div className="grid min-h-80 place-items-center bg-[#eaf3ff] p-8 text-center"><div><span className="mx-auto grid size-20 place-items-center rounded-full bg-white"><Hand aria-hidden className="size-10 text-[#3978bd]" /></span><h3 className="mt-5 mb-0 text-4xl font-black">{snapshot?.state === 'PRACTICING' ? snapshot.practiceStimulus ? STIMULUS_LABELS[snapshot.practiceStimulus] : 'Latihan' : canStart ? 'Tombol siap' : 'Genggam ringan, lalu lepaskan'}</h3><p className="mt-3 mb-0 text-lg font-bold text-muted">{snapshot?.practiceFeedback === 'CORRECT' ? 'Bagus, lanjutkan.' : snapshot?.practiceFeedback === 'TRY_AGAIN' ? 'Coba lagi dengan tenang.' : snapshot?.practiceFeedback === 'WAIT' ? 'Tunggu gambar berikutnya.' : 'Latihan belum dihitung.'}</p></div></div>;
  return <div className="grid min-h-80 place-items-center bg-[#fff7e7] p-8 text-center"><div><img alt="" aria-hidden className="mx-auto size-28" src={illustration} /><h3 className="mt-5 mb-0 text-4xl font-black">{canStart ? 'Kekuatan tercatat' : 'Genggam sekuat tenaga yang nyaman'}</h3><p className="mt-3 mb-0 text-lg font-bold text-muted">{canStart ? 'Alat siap digunakan.' : 'Pertahankan genggaman selama dua detik.'}</p></div></div>;
}

export type GameFlowStage = 'participant' | 'tutorial' | 'setup' | 'session';

interface GameFlowProps {
  csrfToken: string;
  mode: GameMode;
  onStageChange: (stage: GameFlowStage) => void;
}

export function GameFlow({ csrfToken, mode, onStageChange }: GameFlowProps) {
  const navigate = useNavigate();
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  const [stage, setStageState] = useState<GameFlowStage>('participant');
  const setStage = useCallback((next: GameFlowStage) => { setStageState(next); onStageChange(next); }, [onStageChange]);
  const [participant, setParticipant] = useState<GameParticipantIdentity | null>(null);
  const participantName = participant?.displayName ?? '';
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [pauseCommand, setPauseCommand] = useState<'PAUSE' | 'RESUME' | null>(null);
  const [abortDialogOpen, setAbortDialogOpen] = useState(false);
  const sessionAttemptRef = useRef<{ preparationId: string; idempotencyKey: string } | null>(null);
  const sessionStartingRef = useRef(false);
  const sessionRecoveryRef = useRef<string | null>(null);
  const countdownToneRef = useRef<number | null>(null);
  const abortButtonRef = useRef<HTMLButtonElement>(null);
  const abortDialogRef = useRef<HTMLDialogElement>(null);
  const preparation = useCreatePreparationMutation(csrfToken);
  const createSession = useCreateGameSessionMutation(csrfToken);
  const persistedSession = useGameSessionQuery(sessionId ?? undefined, { pollWhileActive: true, pollWhileSaving: true, retry: true });
  const setupSocket = useSetupSocket(preparation.data?.setupId ?? null);
  const sessionSocket = useSessionSocket(sessionId);
  const setupSnapshot = setupSocket.message?.type === 'setup.snapshot' ? setupSocket.message.payload : null;
  const sessionSnapshot = sessionSocket.message?.type === 'session.snapshot' ? sessionSocket.message.payload : null;
  const canStart = setupSnapshot?.canStart ?? preparation.data?.canStart ?? false;
  const persistedStatus = persistedSession.data?.status;
  const status = sessionSnapshot?.status ?? (persistedStatus && persistedStatus !== 'BINDING' ? persistedStatus : createSession.data?.status ?? 'BINDING');
  const setupTerminal = setupSnapshot?.state === 'CANCELLED' || setupSnapshot?.state === 'EXPIRED';
  const setupFailed = setupSocket.status === 'FAILED' || setupSocket.protocolError !== null;

  const startPreparation = useCallback(() => {
    if (!csrfToken || preparation.isPending || !participant) return;
    setStage('setup');
    sessionAttemptRef.current = null;
    sessionStartingRef.current = false;
    createSession.reset();
    preparation.reset();
    preparation.mutate({ mode, displayName: participant.displayName, participantReference: participant.participantReference, privacyAcknowledged: true });
  }, [createSession, csrfToken, mode, participant, preparation, setStage]);

  const startSession = useCallback(async () => {
    const current = preparation.data;
    if (!current || sessionStartingRef.current) return;
    const existing = sessionAttemptRef.current;
    const attempt = existing?.preparationId === current.preparationId ? existing : { preparationId: current.preparationId, idempotencyKey: crypto.randomUUID() };
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
  }, [createSession, preparation, setStage]);

  useEffect(() => { if (stage === 'setup' && canStart && !createSession.isError) void startSession(); }, [canStart, createSession.isError, stage, startSession]);

  function retrySetup() {
    if (createSession.isError && preparation.data && !setupTerminal) { createSession.reset(); void startSession(); return; }
    if (preparation.data && setupFailed && !setupTerminal) { setupSocket.reconnect(); return; }
    startPreparation();
  }

  useEffect(() => {
    if (status !== 'COUNTDOWN') { setCountdown(3); return; }
    setCountdown(sessionSnapshot?.countdown ?? 3);
    const timer = window.setInterval(() => setCountdown((value) => Math.max(1, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [sessionSnapshot?.countdown, status]);

  useEffect(() => {
    if (status === 'COUNTDOWN' && countdown > 0 && countdownToneRef.current !== countdown) { countdownToneRef.current = countdown; playCountdownTone(countdown); return; }
    if (status === 'PLAYING' && countdownToneRef.current !== 0) { countdownToneRef.current = 0; playStartTone(); }
    if (status !== 'COUNTDOWN' && status !== 'PLAYING') countdownToneRef.current = null;
  }, [countdown, status]);

  useEffect(() => { const dialog = abortDialogRef.current; if (!dialog) return; if (abortDialogOpen && !dialog.open) dialog.showModal(); if (!abortDialogOpen && dialog.open) dialog.close(); }, [abortDialogOpen]);
  useEffect(() => { if ((pauseCommand === 'PAUSE' && status === 'PAUSED') || (pauseCommand === 'RESUME' && status === 'PLAYING')) setPauseCommand(null); }, [pauseCommand, status]);

  function togglePause() { const command = status === 'PAUSED' ? 'RESUME' : 'PAUSE'; setPauseCommand(command); if (!sessionSocket.sendCommand(command)) setPauseCommand(null); }
  function closeAbortDialog() { setAbortDialogOpen(false); requestAnimationFrame(() => abortButtonRef.current?.focus()); }
  function confirmAbort() { setAbortDialogOpen(false); if (sessionSocket.sendCommand('ABORT')) navigate(ROUTES.dashboard, { replace: true }); else sessionSocket.reconnect(); }

  useEffect(() => {
    if (!sessionId) return;
    const websocketStatus = sessionSnapshot?.status ?? null;
    const durableStatus = persistedSession.data?.status ?? null;
    const needsRecovery = sessionSocket.status !== 'OPEN' && durableStatus !== null && durableStatus !== 'BINDING' && durableStatus !== websocketStatus;
    const recoveryKey = `${sessionId}:${durableStatus ?? 'countdown-expired'}:${websocketStatus ?? 'none'}`;
    if (!needsRecovery || sessionRecoveryRef.current === recoveryKey) return;
    sessionRecoveryRef.current = recoveryKey;
    sessionSocket.reconnect();
    void persistedSession.refetch();
  }, [persistedSession.data?.status, persistedSession.refetch, sessionId, sessionSnapshot?.status, sessionSocket]);

  function reset() {
    sessionSocket.close(); preparation.reset(); createSession.reset(); sessionAttemptRef.current = null; sessionStartingRef.current = false; setSessionId(null); setStage('participant');
  }

  if (stage === 'participant') return <GameParticipantEntry csrfToken={csrfToken} mode={mode} onContinue={(identity) => { setParticipant(identity); setStage('tutorial'); }} />;
  if (stage === 'tutorial') return <GameTutorial mode={mode} onBack={() => setStage('participant')} onReady={() => { resumeGameAudio(); startPreparation(); }} participantName={participantName} />;

  if (stage === 'setup') return (
    <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[78rem] flex-col justify-center py-8" aria-labelledby="setup-title">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"><div><p className="landing-eyebrow">Persiapan untuk {participantName}</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="setup-title">Siapkan {selected.device.toLowerCase()}</h1><p className="mt-4 mb-0 max-w-xl text-lg leading-8 text-muted">{mode === 'MOTOR_GRIP' ? 'Kalibrasi kekuatan dilakukan agar latihan tetap nyaman.' : mode === 'GO_NO_GO' ? 'Atur sensitivitas genggaman, lalu selesaikan latihan singkat.' : 'Empat tombol diperiksa sebelum permainan dimulai.'}</p><div className="mt-7 rounded-md border-2 border-divider bg-white/90 p-5"><p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Perangkat yang digunakan</p><div className="mt-4 flex items-center gap-4"><span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft"><Gamepad2 className="size-6" /></span><div><h2 className="m-0 text-xl font-black">{preparation.data?.device.label ?? selected.device}</h2><p className="mt-1 mb-0 text-sm font-bold text-muted">{selected.title}</p></div></div></div></div>
        {preparation.isPending ? <div className="flex min-h-[30rem] flex-col items-center justify-center gap-4 rounded-lg border-2 border-divider bg-white/90 p-8 text-center text-muted shadow-[0_6px_0_#e7e3d7]" role="status"><span className="grid size-16 place-items-center rounded-full bg-brand-soft"><Gamepad2 aria-hidden className="size-8 animate-pulse" /></span><p className="m-0 text-xl font-black">Menyiapkan perangkat…</p></div> : preparation.isError || setupTerminal || setupFailed || createSession.isError ? <div className="flex min-h-[30rem] flex-col items-center justify-center gap-4 rounded-lg border-2 border-divider bg-white/90 p-8 text-center text-muted shadow-[0_6px_0_#e7e3d7]" role="alert"><span className="grid size-16 place-items-center rounded-full bg-danger-soft"><AlertTriangle aria-hidden className="size-8 text-danger" /></span><p className="m-0 max-w-md text-lg font-bold">{preparation.isError ? messageOf(preparation.error) : createSession.isError ? messageOf(createSession.error) : setupTerminal ? 'Persiapan perangkat berakhir. Coba lagi.' : 'Perangkat belum terhubung. Coba lagi.'}</p><Button disabled={preparation.isPending || createSession.isPending} onClick={retrySetup} variant="secondary">Coba lagi</Button></div> : <div className="overflow-hidden rounded-lg border-2 border-ink bg-white/95 shadow-[0_7px_0_#d9d4c5]"><div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-divider px-5 py-4 sm:px-6"><div><p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Pemeriksaan alat</p><p className="mt-1 mb-0 font-bold text-muted">{setupSnapshot?.instruction ?? 'Menghubungkan perangkat.'}</p></div><span className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-black ${canStart ? 'bg-brand-soft text-success' : 'bg-divider text-muted'}`}>{canStart ? <CheckCircle2 aria-hidden className="size-5" /> : <span aria-hidden className="size-2 animate-pulse rounded-full bg-accent" />}{canStart ? 'Siap' : 'Memvalidasi'}</span></div><SetupPanel canStart={canStart} mode={mode} snapshot={setupSnapshot} /><p className="m-0 border-t-2 border-divider bg-white px-5 py-4 text-center font-black text-muted sm:px-6">{canStart ? 'Perangkat siap. Permainan segera dimulai.' : setupSnapshot?.instruction ?? 'Ikuti petunjuk untuk menyelesaikan pemeriksaan.'}</p></div>}
      </div>
    </section>
  );

  if (sessionSnapshot?.status === 'SAVED') return <GameResult onReplay={reset} snapshot={sessionSnapshot} />;
  if (['ABORTED', 'INTERRUPTED', 'SAVE_FAILED'].includes(status)) return <section className="mx-auto grid min-h-[32rem] max-w-2xl place-items-center text-center" aria-labelledby="terminal-title"><div><AlertTriangle aria-hidden className="mx-auto size-12 text-muted" /><h1 className="mt-5 mb-0 text-4xl font-black" id="terminal-title">{status === 'ABORTED' ? 'Sesi diakhiri' : status === 'INTERRUPTED' ? 'Koneksi alat terputus' : 'Hasil belum dapat disimpan'}</h1><p className="mt-4 mb-0 text-lg leading-8 text-muted">{sessionSnapshot?.message ?? 'Sesi berhenti. Pastikan perangkat tetap terhubung lalu coba lagi.'}</p><Button className="mt-7" onClick={reset}>Kembali ke awal</Button></div></section>;
  if (status === 'COMPLETED' || status === 'SAVING') return <section className="grid min-h-96 place-items-center text-center" aria-live="polite"><div><CheckCircle2 aria-hidden className="mx-auto size-12 text-success" /><h1 className="mt-5 mb-0 text-4xl font-black">Permainan selesai</h1><p className="mt-3 mb-0 text-lg font-bold text-muted">Menyimpan hasil…</p></div></section>;
  if (status === 'BINDING' || status === 'COUNTDOWN') return <section className="grid min-h-[32rem] place-items-center text-center" aria-live="polite"><div><p className="landing-eyebrow">{participantName}</p>{status === 'COUNTDOWN' ? <><p className="m-0 text-[8rem] leading-none font-black text-accent">{countdown}</p><h1 className="mt-5 mb-0 text-4xl font-black">Bersiap</h1><p className="mt-3 mb-0 text-lg text-muted">Permainan belum dimulai.</p></> : <><Gamepad2 aria-hidden className="mx-auto size-14 text-muted" /><h1 className="mt-5 mb-0 text-4xl font-black">Menyiapkan permainan</h1><p className="mt-3 mb-0 text-lg text-muted">Perangkat dan aplikasi sedang dikonfirmasi.</p></>}</div></section>;

  return (
    <section aria-labelledby="game-title"><div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-5"><div><p className="m-0 text-sm font-black text-muted">{participantName}</p><h1 className="mt-1 mb-0 text-3xl font-black" id="game-title">{selected.title}</h1></div><div className="flex flex-wrap items-center gap-2"><Button disabled={pauseCommand !== null} onClick={togglePause} variant="secondary">{status === 'PAUSED' ? <Play aria-hidden className="size-5" /> : <Pause aria-hidden className="size-5" />}{pauseCommand === 'PAUSE' ? 'Menjeda…' : pauseCommand === 'RESUME' ? 'Melanjutkan…' : status === 'PAUSED' ? 'Lanjutkan' : 'Jeda'}</Button><button className={buttonClassName('danger')} onClick={() => setAbortDialogOpen(true)} ref={abortButtonRef} type="button">Akhiri sesi</button></div></div>{sessionSocket.protocolError && <p className="mt-4 mb-0 text-base font-bold text-muted" role="status">{sessionSocket.protocolError}</p>}{status === 'PAUSED' ? <div className="mt-7 grid min-h-96 place-items-center rounded-md border-2 border-divider text-center"><div><Pause aria-hidden className="mx-auto size-12 text-muted" /><h2 className="mt-4 mb-0 text-4xl font-black">Dijeda</h2><p className="mt-3 mb-0 text-lg text-muted">Waktu dan penilaian berhenti.</p></div></div> : sessionSnapshot ? <div className="mt-7"><GameBoard mode={mode} snapshot={sessionSnapshot} /></div> : null}<dialog aria-describedby="abort-session-description" aria-labelledby="abort-session-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border-2 border-divider bg-white p-0 text-ink backdrop:bg-ink/60" onCancel={(event) => { event.preventDefault(); closeAbortDialog(); }} ref={abortDialogRef} role="alertdialog"><div className="p-6 sm:p-8"><h2 className="m-0 text-3xl font-black tracking-[-0.04em]" id="abort-session-title">Akhiri sesi?</h2><p className="mt-4 mb-0 text-lg leading-8 text-muted" id="abort-session-description">Sesi akan dihentikan dan tidak dihitung sebagai permainan selesai.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Button onClick={closeAbortDialog} variant="secondary">Lanjut bermain</Button><Button onClick={confirmAbort} variant="danger">Ya, akhiri sesi</Button></div></div></dialog></section>
  );
}

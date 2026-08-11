import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Hand, Pause, Play, RotateCcw } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { GameMetrics } from '../../schemas/index.ts';
import { Button, buttonClassName } from '../../components/index.ts';
import { GameResultChart } from '../../components/game-result-charts.tsx';
import { ResultStats } from '../../components/result-stats.tsx';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { goNoGoTargetAudioUrl, type GoNoGoStimulus } from '../../constants/go-no-go-stimuli.ts';
import { gameModeFromSlug, ROUTES } from '../../constants/routes.ts';
import {
  GoNoGoBoard,
  MotorGripBoard,
  SequenceBoard,
  type EncouragementState,
  type SessionSnapshot,
} from './sequence-memory-flow.tsx';
import { playCountdownTone, playStartTone, resumeGameAudio, SEQUENCE_TILES } from './sequence-tutorial.tsx';

type DemoStage = 'idle' | 'countdown' | 'playing' | 'paused' | 'finished';
type GripSample = { elapsedSecond: number; gripPercent: number; kilograms: number };
type GoOutcome = { level: 1 | 2; outcome: 'HIT' | 'MISS' | 'FALSE_POSITIVE'; reactionMs: number | null };

function longestTargetHold(samples: readonly GripSample[], targetKilograms: number): number {
  let longest = 0;
  let current = 0;
  for (const sample of samples) {
    current = sample.kilograms >= targetKilograms ? current + 1_000 : 0;
    longest = Math.max(longest, current);
  }
  return Math.min(longest, 5_000);
}

function primeHtmlAudio(src: string): void {
  const audio = new Audio(src);
  audio.volume = 0;
  void audio.play().then(() => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }).catch(() => undefined);
}

function Countdown({ value }: { value: number }) {
  return (
    <section aria-live="polite" className="grid min-h-[32rem] place-items-center text-center">
      <div><p className="landing-eyebrow">Peserta Demo</p><p className="m-0 text-[8rem] leading-none font-black text-accent">{value}</p><h1 className="mt-5 mb-0 text-4xl font-black">Bersiap</h1><p className="mt-3 mb-0 text-lg text-muted">Permainan belum dimulai.</p></div>
    </section>
  );
}

function PreviewResult({ metrics, onReplay, score }: { metrics: GameMetrics; onReplay: () => void; score: number }) {
  return (
    <section aria-labelledby="preview-result-title" className="mx-auto grid w-full max-w-[78rem] gap-3 py-5">
      <header><p className="landing-eyebrow">Preview selesai</p><h1 className="m-0 text-3xl font-black tracking-[-0.05em] sm:text-4xl" id="preview-result-title">Hasil sesi Peserta Demo</h1><p className="mt-1 mb-0 text-sm font-bold text-muted">Hasil simulasi ini tidak disimpan dan bukan diagnosis atau rekomendasi terapi.</p></header>
      <div><ResultStats metrics={metrics} score={score} /><GameResultChart metrics={metrics} /></div>
      <div className="flex flex-wrap gap-2"><Button onClick={onReplay}><RotateCcw aria-hidden className="size-5" />Main lagi</Button><Link className={buttonClassName('quiet')} to={ROUTES.dashboard}>Kembali ke dashboard</Link></div>
    </section>
  );
}

function Idle({ illustration, mode, onStart, title }: { illustration: string; mode: 'MOTOR_GRIP' | 'GO_NO_GO' | 'SEQUENCE_MEMORY'; onStart: () => void; title: string }) {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-5xl items-center gap-8 py-8 lg:grid-cols-2" aria-labelledby="preview-title">
      <div><span className="inline-flex rounded-full border-2 border-brand bg-brand-soft px-4 py-2 text-sm font-black">Preview tanpa IoT</span><h1 className="mt-5 mb-0 text-5xl font-black tracking-[-0.05em]" id="preview-title">{title}</h1><p className="mt-4 mb-0 text-xl leading-8 font-bold text-muted">Tampilan, waktu, gambar, dan audio sama seperti permainan asli. Input alat genggam digantikan tombol di layar.</p><Button className="mt-7 min-h-16 px-7 text-xl" onClick={onStart}><Play aria-hidden className="size-6" />Mulai preview</Button><Link className={`${buttonClassName('quiet')} mt-3 sm:ml-3`} to={ROUTES.dashboard}><ArrowLeft aria-hidden className="size-5" />Kembali</Link></div>
      <div className="grid min-h-96 place-items-center rounded-lg border-2 border-divider bg-white p-8"><img alt="" aria-hidden className="max-h-80 w-full object-contain" src={illustration} />{mode === 'GO_NO_GO' && <p className="mt-3 mb-0 text-center text-lg font-black">Dengarkan target, lalu genggam saat jenis gambar yang sama muncul.</p>}{mode === 'SEQUENCE_MEMORY' && <p className="mt-3 mb-0 text-center text-lg font-black">Perhatikan urutan warna, lalu tekan tombol dengan urutan yang sama.</p>}</div>
    </section>
  );
}

function PlayingShell({ children, input, onFinish, onPause, title }: { children: ReactNode; input: ReactNode; onFinish: () => void; onPause: () => void; title: string }) {
  return (
    <section aria-labelledby="game-title" className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-3"><div><p className="m-0 text-sm font-black text-muted">Peserta Demo · Preview tanpa IoT</p><h1 className="mt-1 mb-0 text-3xl font-black" id="game-title">{title}</h1></div><div className="flex flex-wrap items-center gap-2"><Button onClick={onPause} variant="secondary"><Pause aria-hidden className="size-5" />Jeda</Button><button className={buttonClassName('danger')} onClick={onFinish} type="button">Akhiri sesi</button></div></div>
      <div className="min-h-0 overflow-hidden pt-4">{children}</div>
      <div className="fixed right-4 bottom-4 left-4 z-20 flex justify-center sm:left-auto">{input}</div>
    </section>
  );
}

function Paused({ onFinish, onResume, title }: { onFinish: () => void; onResume: () => void; title: string }) {
  return (
    <section aria-labelledby="game-title" className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-3"><div><p className="m-0 text-sm font-black text-muted">Peserta Demo · Preview tanpa IoT</p><h1 className="mt-1 mb-0 text-3xl font-black" id="game-title">{title}</h1></div><div className="flex gap-2"><Button onClick={onResume} variant="secondary"><Play aria-hidden className="size-5" />Lanjutkan</Button><button className={buttonClassName('danger')} onClick={onFinish} type="button">Akhiri sesi</button></div></div>
      <div className="mt-7 grid min-h-96 place-items-center rounded-md border-2 border-divider text-center"><div><Pause aria-hidden className="mx-auto size-12 text-muted" /><h2 className="mt-4 mb-0 text-4xl font-black">Dijeda</h2><p className="mt-3 mb-0 text-lg text-muted">Waktu dan penilaian berhenti.</p></div></div>
    </section>
  );
}

function MotorGripPreview() {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [grip, setGrip] = useState(0);
  const [squeezing, setSqueezing] = useState(false);
  const [samples, setSamples] = useState<GripSample[]>([]);
  const gripRef = useRef(0);
  const encouragementAudioRef = useRef<HTMLAudioElement | null>(null);
  const encouragementStateRef = useRef<EncouragementState>({ started: false, halfway: false, finalFive: false, lastPromptSecond: -10, lastCueSrc: null });
  const selected = GAME_MODES[0];

  useEffect(() => {
    const audio = new Audio();
    encouragementAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      encouragementAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stage !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        const next = countdown - 1;
        setCountdown(next);
        playCountdownTone(next);
      } else {
        playStartTone();
        setStage('playing');
      }
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [countdown, stage]);

  useEffect(() => {
    if (stage !== 'playing') return;
    const timer = window.setInterval(() => {
      const nextGrip = Math.max(0, Math.min(100, gripRef.current + (squeezing ? 4 : -5)));
      gripRef.current = nextGrip;
      setGrip(nextGrip);
      setElapsedMs((current) => {
        const next = Math.min(30_000, current + 100);
        if (Math.floor(next / 1_000) > Math.floor(current / 1_000)) {
          setSamples((currentSamples) => [...currentSamples, { elapsedSecond: Math.floor(next / 1_000), gripPercent: nextGrip, kilograms: nextGrip / 20 }]);
        }
        if (next >= 30_000) {
          setSqueezing(false);
          setStage('finished');
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [squeezing, stage]);

  useEffect(() => {
    if (stage !== 'playing') encouragementAudioRef.current?.pause();
  }, [stage]);

  function start() {
    resumeGameAudio();
    primeHtmlAudio('/audio/game-mode1/encouragement/started-1.m4a');
    encouragementStateRef.current = { started: false, halfway: false, finalFive: false, lastPromptSecond: -10, lastCueSrc: null };
    gripRef.current = 0;
    setElapsedMs(0);
    setGrip(0);
    setSamples([]);
    setSqueezing(false);
    setCountdown(3);
    playCountdownTone(3);
    setStage('countdown');
  }

  const kilograms = grip / 20;
  const averageKilograms = samples.length > 0 ? samples.reduce((total, sample) => total + sample.kilograms, 0) / samples.length : 0;
  const peakKilograms = Math.max(0, ...samples.map((sample) => sample.kilograms));
  const motorScore = Math.round((Math.min(1, averageKilograms / 5) * 0.7 + Math.min(1, peakKilograms / 5) * 0.3) * 1000);
  const motorMetrics: Extract<GameMetrics, { mode: 'MOTOR_GRIP' }> = { mode: 'MOTOR_GRIP', fruitVariant: 'ORANGE', targetKilograms: 5, peakGripPercent: Math.max(0, ...samples.map((sample) => sample.gripPercent)), peakKilograms, averageKilograms, continuousHoldMs: longestTargetHold(samples, 5), timeAtOrAboveTargetMs: samples.filter((sample) => sample.kilograms >= 5).length * 1_000, targetCompleted: peakKilograms >= 5, sessionElapsedMs: elapsedMs, gripSamples: samples };
  const snapshot: SessionSnapshot = {
    status: 'PLAYING', mode: 'MOTOR_GRIP', displayName: 'Peserta Demo', countdown: null, result: null, message: 'Permainan berlangsung',
    visual: { mode: 'MOTOR_GRIP', gripPercent: grip, kilograms, holdProgressMs: kilograms >= 3 ? Math.min(elapsedMs, 5_000) : 0, activeElapsedMs: elapsedMs, remainingMs: 30_000 - elapsedMs, gripSamples: samples, fruitVariant: 'ORANGE', targetKilograms: 5, averageKilograms: samples.length ? samples.reduce((total, sample) => total + sample.kilograms, 0) / samples.length : kilograms, timeAtOrAboveTargetMs: samples.filter((sample) => sample.kilograms >= 5).length * 1_000, message: squeezing ? 'Pertahankan genggaman' : 'Genggam dengan nyaman' },
  };

  if (stage === 'idle') return <Idle illustration={selected.illustration} mode="MOTOR_GRIP" onStart={start} title={selected.title} />;
  if (stage === 'countdown') return <Countdown value={countdown} />;
  if (stage === 'finished') return <PreviewResult metrics={motorMetrics} onReplay={start} score={motorScore} />;
  if (stage === 'paused') return <Paused onFinish={() => setStage('finished')} onResume={() => setStage('playing')} title={selected.title} />;

  const gripButton = (
    <button aria-pressed={squeezing} className={`flex min-h-20 w-full touch-none select-none items-center justify-center gap-3 rounded-md border-2 px-8 text-xl font-black sm:w-auto ${squeezing ? 'translate-y-1 border-[#7d3b0e] bg-[#d67b1f] text-white' : 'border-[#a94f12] bg-[#fff0df] text-[#7d3b0e] shadow-[0_6px_0_#d8a16f]'}`} onBlur={() => setSqueezing(false)} onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); setSqueezing(true); } }} onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') setSqueezing(false); }} onLostPointerCapture={() => setSqueezing(false)} onPointerCancel={() => setSqueezing(false)} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setSqueezing(true); }} onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); setSqueezing(false); }} type="button"><Hand aria-hidden className="size-8" />{squeezing ? 'Sedang menggenggam' : 'Tekan dan tahan sebagai alat'}</button>
  );

  return <PlayingShell input={gripButton} onFinish={() => setStage('finished')} onPause={() => { setSqueezing(false); setStage('paused'); }} title={selected.title}><MotorGripBoard encouragementAudioRef={encouragementAudioRef} encouragementStateRef={encouragementStateRef} fruit="ORANGE" snapshot={snapshot} /></PlayingShell>;
}

type Candidate = { stimulus: GoNoGoStimulus; assetIndex: number; targetAppearance: 1 | 2 | null };
type Question = { target: GoNoGoStimulus; targetAssetIndex: number; candidates: readonly Candidate[] };
type GoPhase = 'TARGET_PREVIEW' | 'NEXT_QUESTION' | 'CANDIDATE_GAP' | 'STIMULUS';

const GO_QUESTIONS: readonly Question[] = [
  { target: 'WAYANG', targetAssetIndex: 0, candidates: [{ stimulus: 'BATIK', assetIndex: 0, targetAppearance: null }, { stimulus: 'WAYANG', assetIndex: 2, targetAppearance: 1 }, { stimulus: 'CANDI', assetIndex: 1, targetAppearance: null }, { stimulus: 'WAYANG', assetIndex: 1, targetAppearance: 2 }] },
  { target: 'CANDI', targetAssetIndex: 0, candidates: [{ stimulus: 'MONAS', assetIndex: 1, targetAppearance: null }, { stimulus: 'CANDI', assetIndex: 2, targetAppearance: 1 }, { stimulus: 'ANGKLUNG', assetIndex: 0, targetAppearance: null }, { stimulus: 'CANDI', assetIndex: 3, targetAppearance: 2 }] },
  { target: 'BATIK', targetAssetIndex: 1, candidates: [{ stimulus: 'WAYANG', assetIndex: 3, targetAppearance: null }, { stimulus: 'BATIK', assetIndex: 2, targetAppearance: 1 }, { stimulus: 'MONAS', assetIndex: 2, targetAppearance: null }, { stimulus: 'BATIK', assetIndex: 0, targetAppearance: 2 }] },
  { target: 'ANGKLUNG', targetAssetIndex: 2, candidates: [{ stimulus: 'CANDI', assetIndex: 3, targetAppearance: null }, { stimulus: 'ANGKLUNG', assetIndex: 0, targetAppearance: 1 }, { stimulus: 'WAYANG', assetIndex: 0, targetAppearance: null }, { stimulus: 'ANGKLUNG', assetIndex: 3, targetAppearance: 2 }] },
  { target: 'MONAS', targetAssetIndex: 0, candidates: [{ stimulus: 'BATIK', assetIndex: 3, targetAppearance: null }, { stimulus: 'MONAS', assetIndex: 2, targetAppearance: 1 }, { stimulus: 'ANGKLUNG', assetIndex: 1, targetAppearance: null }, { stimulus: 'MONAS', assetIndex: 1, targetAppearance: 2 }] },
  { target: 'WAYANG', targetAssetIndex: 1, candidates: [{ stimulus: 'CANDI', assetIndex: 0, targetAppearance: null }, { stimulus: 'WAYANG', assetIndex: 3, targetAppearance: 1 }, { stimulus: 'BATIK', assetIndex: 1, targetAppearance: null }, { stimulus: 'WAYANG', assetIndex: 0, targetAppearance: 2 }] },
  { target: 'BATIK', targetAssetIndex: 3, candidates: [{ stimulus: 'ANGKLUNG', assetIndex: 2, targetAppearance: null }, { stimulus: 'BATIK', assetIndex: 0, targetAppearance: 1 }, { stimulus: 'MONAS', assetIndex: 3, targetAppearance: null }, { stimulus: 'BATIK', assetIndex: 2, targetAppearance: 2 }] },
  { target: 'CANDI', targetAssetIndex: 1, candidates: [{ stimulus: 'WAYANG', assetIndex: 2, targetAppearance: null }, { stimulus: 'CANDI', assetIndex: 3, targetAppearance: 1 }, { stimulus: 'ANGKLUNG', assetIndex: 3, targetAppearance: null }, { stimulus: 'CANDI', assetIndex: 0, targetAppearance: 2 }] },
  { target: 'MONAS', targetAssetIndex: 2, candidates: [{ stimulus: 'BATIK', assetIndex: 1, targetAppearance: null }, { stimulus: 'MONAS', assetIndex: 0, targetAppearance: 1 }, { stimulus: 'WAYANG', assetIndex: 1, targetAppearance: null }, { stimulus: 'MONAS', assetIndex: 3, targetAppearance: 2 }] },
  { target: 'ANGKLUNG', targetAssetIndex: 0, candidates: [{ stimulus: 'CANDI', assetIndex: 2, targetAppearance: null }, { stimulus: 'ANGKLUNG', assetIndex: 3, targetAppearance: 1 }, { stimulus: 'BATIK', assetIndex: 2, targetAppearance: null }, { stimulus: 'ANGKLUNG', assetIndex: 1, targetAppearance: 2 }] },
];

function GoNoGoPreview() {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [goPhase, setGoPhase] = useState<GoPhase>('TARGET_PREVIEW');
  const [correctTrials, setCorrectTrials] = useState(0);
  const [outcomes, setOutcomes] = useState<GoOutcome[]>([]);
  const [audioElements] = useState(() => ({ target: new Audio(goNoGoTargetAudioUrl(GO_QUESTIONS[0]!.target)), transition: new Audio('/audio/game-mode2/targets/next-question.m4a') }));
  const candidateStartedAtRef = useRef(0);
  const selected = GAME_MODES[1];
  const question = GO_QUESTIONS[questionIndex]!;
  const candidate = question.candidates[candidateIndex]!;

  const finishQuestion = useCallback((outcome?: GoOutcome) => {
    if (outcome) setOutcomes((current) => [...current, outcome]);
    if (questionIndex >= GO_QUESTIONS.length - 1) {
      setStage('finished');
      return;
    }
    setQuestionIndex((current) => current + 1);
    setCandidateIndex(0);
    setGoPhase('NEXT_QUESTION');
  }, [questionIndex]);

  useEffect(() => {
    if (stage !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown((current) => current - 1);
      else setStage('playing');
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [countdown, stage]);

  useEffect(() => {
    if (stage !== 'playing') return;
    const timer = window.setInterval(() => setElapsedMs((current) => Math.min(180_000, current + 100)), 100);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'playing') return;
    const delay = goPhase === 'TARGET_PREVIEW' ? 3_000 : goPhase === 'NEXT_QUESTION' ? 2_600 : goPhase === 'CANDIDATE_GAP' ? 500 : questionIndex < 5 ? 3_000 : 2_000;
    const timer = window.setTimeout(() => {
      if (goPhase === 'TARGET_PREVIEW') setGoPhase('CANDIDATE_GAP');
      else if (goPhase === 'NEXT_QUESTION') setGoPhase('TARGET_PREVIEW');
      else if (goPhase === 'CANDIDATE_GAP') {
        candidateStartedAtRef.current = performance.now();
        setGoPhase('STIMULUS');
      } else if (candidateIndex < question.candidates.length - 1) {
        candidateStartedAtRef.current = performance.now();
        setCandidateIndex((current) => current + 1);
      } else finishQuestion({ level: questionIndex < 5 ? 1 : 2, outcome: 'MISS', reactionMs: null });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [candidateIndex, finishQuestion, goPhase, question.candidates.length, questionIndex, stage]);

  function start() {
    void resumeGameAudio();
    for (const audio of Object.values(audioElements)) {
      audio.preload = 'auto';
      audio.volume = 0;
      void audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      }).catch(() => { audio.volume = 1; });
    }
    setElapsedMs(0);
    setQuestionIndex(0);
    setCandidateIndex(0);
    setCorrectTrials(0);
    setOutcomes([]);
    setGoPhase('TARGET_PREVIEW');
    setCountdown(3);
    setStage('countdown');
  }

  function grip() {
    if (stage !== 'playing' || goPhase !== 'STIMULUS') return;
    const hit = candidate.stimulus === question.target;
    if (hit) setCorrectTrials((current) => current + 1);
    finishQuestion({ level: questionIndex < 5 ? 1 : 2, outcome: hit ? 'HIT' : 'FALSE_POSITIVE', reactionMs: hit ? Math.max(0, performance.now() - candidateStartedAtRef.current) : null });
  }

  const hits = outcomes.filter((outcome) => outcome.outcome === 'HIT').length;
  const misses = outcomes.filter((outcome) => outcome.outcome === 'MISS').length;
  const falsePositives = outcomes.filter((outcome) => outcome.outcome === 'FALSE_POSITIVE').length;
  const hitReactionTimes = outcomes.flatMap((outcome) => outcome.reactionMs === null ? [] : [outcome.reactionMs]);
  const meanHitReactionMs = hitReactionTimes.length > 0 ? hitReactionTimes.reduce((total, value) => total + value, 0) / hitReactionTimes.length : null;
  const accuracyPercent = outcomes.length > 0 ? hits / outcomes.length * 100 : 0;
  const levelBreakdown = ([1, 2] as const).map((level) => {
    const levelOutcomes = outcomes.filter((outcome) => outcome.level === level);
    const levelHits = levelOutcomes.filter((outcome) => outcome.outcome === 'HIT').length;
    const levelMisses = levelOutcomes.filter((outcome) => outcome.outcome === 'MISS').length;
    const levelFalsePositives = levelOutcomes.filter((outcome) => outcome.outcome === 'FALSE_POSITIVE').length;
    const reactions = levelOutcomes.flatMap((outcome) => outcome.reactionMs === null ? [] : [outcome.reactionMs]);
    return { level, stimulusDurationMs: level === 1 ? 3_000 : 2_000, totalTrials: levelOutcomes.length, hits: levelHits, misses: levelMisses, falsePositives: levelFalsePositives, correctRejections: 0, accuracyPercent: levelOutcomes.length > 0 ? levelHits / levelOutcomes.length * 100 : 0, meanHitReactionMs: reactions.length > 0 ? reactions.reduce((total, value) => total + value, 0) / reactions.length : null };
  });
  const goNoGoMetrics: Extract<GameMetrics, { mode: 'GO_NO_GO' }> = { mode: 'GO_NO_GO', totalTrials: outcomes.length, targetTrials: outcomes.length, nonTargetTrials: 0, hits, misses, falsePositives, correctRejections: 0, accuracyPercent, meanHitReactionMs, levelBreakdown };
  const goNoGoScore = Math.round(accuracyPercent * 10);
  const visualPhase = goPhase === 'TARGET_PREVIEW' ? 'TARGET_PREVIEW' : goPhase === 'STIMULUS' ? 'STIMULUS' : 'TRANSITION';
  const snapshot: SessionSnapshot = {
    status: 'PLAYING', mode: 'GO_NO_GO', displayName: 'Peserta Demo', countdown: null, result: null, message: 'Permainan berlangsung',
    visual: { mode: 'GO_NO_GO', trialNumber: questionIndex + 1, questionNumber: questionIndex + 1, totalQuestions: 10, level: questionIndex < 5 ? 1 : 2, levelTrialNumber: questionIndex % 5 + 1, levelQuestionNumber: questionIndex % 5 + 1, levelTrialCount: 5, totalLevels: 2, targetStimulus: question.target, targetAssetIndex: question.targetAssetIndex, stimulus: visualPhase === 'TARGET_PREVIEW' ? question.target : visualPhase === 'STIMULUS' ? candidate.stimulus : null, assetIndex: visualPhase === 'TARGET_PREVIEW' ? question.targetAssetIndex : visualPhase === 'STIMULUS' ? candidate.assetIndex : null, candidateIndex: visualPhase === 'STIMULUS' || goPhase === 'CANDIDATE_GAP' ? candidateIndex : null, candidateNumber: visualPhase === 'STIMULUS' || goPhase === 'CANDIDATE_GAP' ? candidateIndex + 1 : null, targetAppearance: visualPhase === 'STIMULUS' ? candidate.targetAppearance : null, phase: visualPhase, activeElapsedMs: elapsedMs, remainingMs: 180_000 - elapsedMs, feedback: null, correctTrials },
  };

  if (stage === 'idle') return <Idle illustration={selected.illustration} mode="GO_NO_GO" onStart={start} title={selected.title} />;
  if (stage === 'countdown') return <Countdown value={countdown} />;
  if (stage === 'finished') return <PreviewResult metrics={goNoGoMetrics} onReplay={start} score={goNoGoScore} />;
  if (stage === 'paused') return <Paused onFinish={() => setStage('finished')} onResume={() => setStage('playing')} title={selected.title} />;

  const gripButton = <Button className="min-h-20 w-full bg-[#3978bd] px-9 text-xl text-white shadow-[0_6px_0_#24598f] hover:bg-[#286aa9] sm:w-auto" disabled={goPhase !== 'STIMULUS'} onClick={grip}><Hand aria-hidden className="size-8" />Genggam alat</Button>;
  return <PlayingShell input={gripButton} onFinish={() => setStage('finished')} onPause={() => setStage('paused')} title={selected.title}><GoNoGoBoard audioElements={audioElements} snapshot={snapshot} /></PlayingShell>;
}

type SequenceCode = (typeof SEQUENCE_TILES)[number]['code'];
type SequencePhase = 'EXAMPLE' | 'RESPONSE' | 'FEEDBACK';

const SEQUENCE_LEVELS: readonly (readonly SequenceCode[])[] = [
  ['RED'],
  ['RED', 'BLUE'],
  ['RED', 'BLUE', 'GREEN'],
  ['RED', 'BLUE', 'GREEN', 'YELLOW'],
  ['RED', 'BLUE', 'GREEN', 'YELLOW', 'BLUE'],
  ['RED', 'BLUE', 'GREEN', 'YELLOW', 'BLUE', 'RED'],
];

function SequenceMemoryPreview() {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [countdown, setCountdown] = useState(3);
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<SequencePhase>('EXAMPLE');
  const [cueIndex, setCueIndex] = useState<number | null>(null);
  const [responseIndex, setResponseIndex] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [feedback, setFeedback] = useState<'CORRECT' | 'REPEAT' | null>(null);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [timedOutAttempts, setTimedOutAttempts] = useState(0);
  const [latencies, setLatencies] = useState<{ level: number; latencyMs: number }[]>([]);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const responseStartedAtRef = useRef(0);
  const firstResponseLatencyRef = useRef<number | null>(null);
  const selected = GAME_MODES[2];
  const sequence = SEQUENCE_LEVELS[levelIndex]!;

  const beginExample = useCallback(() => {
    setPhase('EXAMPLE');
    setCueIndex(null);
    setResponseIndex(0);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (stage !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        const next = countdown - 1;
        setCountdown(next);
        playCountdownTone(next);
      } else {
        playStartTone();
        setStage('playing');
        beginExample();
      }
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [beginExample, countdown, stage]);

  useEffect(() => {
    if (stage !== 'playing' || phase !== 'EXAMPLE') return;
    const timers: number[] = [];
    setCueIndex(null);
    sequence.forEach((_, index) => {
      const startsAt = 1_200 + index * 1_250;
      timers.push(window.setTimeout(() => setCueIndex(index), startsAt));
      timers.push(window.setTimeout(() => setCueIndex(null), startsAt + 900));
    });
    const exampleDuration = 1_200 + sequence.length * 900 + Math.max(0, sequence.length - 1) * 350;
    timers.push(window.setTimeout(() => {
      responseStartedAtRef.current = performance.now();
      firstResponseLatencyRef.current = null;
      setPhase('RESPONSE');
    }, exampleDuration));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [attemptNumber, levelIndex, phase, sequence, stage]);

  useEffect(() => {
    if (stage !== 'playing' || phase !== 'FEEDBACK') return;
    const timer = window.setTimeout(() => {
      if (feedback === 'REPEAT') {
        setAttemptNumber((current) => current + 1);
        beginExample();
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [beginExample, feedback, phase, stage]);

  useEffect(() => {
    if (stage !== 'playing' || phase !== 'RESPONSE') return;
    const timer = window.setTimeout(() => {
      const nextAttempts = remainingAttempts - 1;
      setTimedOutAttempts((current) => current + 1);
      setRemainingAttempts(nextAttempts);
      if (nextAttempts <= 0) {
        setStage('finished');
        return;
      }
      setFeedback('REPEAT');
      setPhase('FEEDBACK');
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [phase, remainingAttempts, stage]);

  function start() {
    void resumeGameAudio();
    setLevelIndex(0);
    setCompletedLevels(0);
    setWrongAttempts(0);
    setTimedOutAttempts(0);
    setLatencies([]);
    setAttemptNumber(0);
    setRemainingAttempts(3);
    setResponseIndex(0);
    setFeedback(null);
    setCountdown(3);
    playCountdownTone(3);
    setStage('countdown');
  }

  function press(code: SequenceCode) {
    if (stage !== 'playing' || phase !== 'RESPONSE') return;
    if (responseIndex === 0 && firstResponseLatencyRef.current === null) firstResponseLatencyRef.current = Math.max(0, performance.now() - responseStartedAtRef.current);
    if (code !== sequence[responseIndex]) {
      const nextAttempts = remainingAttempts - 1;
      setWrongAttempts((current) => current + 1);
      setRemainingAttempts(nextAttempts);
      if (nextAttempts <= 0) {
        setStage('finished');
        return;
      }
      setFeedback('REPEAT');
      setPhase('FEEDBACK');
      return;
    }
    const nextResponseIndex = responseIndex + 1;
    if (nextResponseIndex < sequence.length) {
      setResponseIndex(nextResponseIndex);
      setFeedback('CORRECT');
      return;
    }
    const latencyMs = firstResponseLatencyRef.current ?? Math.max(0, performance.now() - responseStartedAtRef.current);
    setLatencies((current) => [...current, { level: sequence.length, latencyMs }]);
    setCompletedLevels((current) => current + 1);
    if (levelIndex >= SEQUENCE_LEVELS.length - 1) {
      setStage('finished');
      return;
    }
    setLevelIndex((current) => current + 1);
    setRemainingAttempts(3);
    setAttemptNumber(0);
    beginExample();
  }

  const sequenceMetrics: Extract<GameMetrics, { mode: 'SEQUENCE_MEMORY' }> = { mode: 'SEQUENCE_MEMORY', maxSequenceLength: completedLevels > 0 ? SEQUENCE_LEVELS[Math.min(completedLevels - 1, SEQUENCE_LEVELS.length - 1)]!.length : 0, completedLevels, wrongAttempts, timedOutAttempts, multiButtonAttempts: 0, meanFirstResponseMs: latencies.length > 0 ? latencies.reduce((total, item) => total + item.latencyMs, 0) / latencies.length : null, meanInterButtonMs: null, levelLatencies: latencies, completionReason: completedLevels >= SEQUENCE_LEVELS.length ? 'LEVEL_CAP_REACHED' : 'LIVES_EXHAUSTED' };
  const sequenceScore = Math.max(0, Math.min(1000, 125 * sequenceMetrics.maxSequenceLength + 20 * completedLevels - 50 * wrongAttempts - 25 * timedOutAttempts));
  const activeItem = phase === 'EXAMPLE' && cueIndex !== null ? sequence[cueIndex] ?? null : null;
  const snapshot: SessionSnapshot = { status: 'PLAYING', mode: 'SEQUENCE_MEMORY', displayName: 'Peserta Demo', countdown: null, result: null, message: 'Permainan berlangsung', visual: { mode: 'SEQUENCE_MEMORY', phase, activeItem, activeIndex: cueIndex, cueId: activeItem && cueIndex !== null ? `${levelIndex}:${attemptNumber}:${cueIndex}` : null, sequenceLength: sequence.length, responseIndex, remainingAttempts, errorIndex: feedback === 'REPEAT' ? responseIndex : null, feedback } };

  if (stage === 'idle') return <Idle illustration={selected.illustration} mode="SEQUENCE_MEMORY" onStart={start} title={selected.title} />;
  if (stage === 'countdown') return <Countdown value={countdown} />;
  if (stage === 'finished') return <PreviewResult metrics={sequenceMetrics} onReplay={start} score={sequenceScore} />;
  if (stage === 'paused') return <Paused onFinish={() => setStage('finished')} onResume={() => setStage('playing')} title={selected.title} />;

  const controls = <div className="grid w-full max-w-lg grid-cols-4 gap-2 rounded-md border-2 border-divider bg-white p-3 shadow-[0_6px_0_#d9d4c5]">{SEQUENCE_TILES.map((tile) => <button aria-label={`Tekan tombol ${tile.label}`} className="min-h-16 rounded-md border-4 border-[#080808] text-sm font-black text-white shadow-[0_4px_0_#050505] disabled:cursor-not-allowed disabled:opacity-45" disabled={phase !== 'RESPONSE'} key={tile.code} onClick={() => press(tile.code)} style={{ backgroundColor: tile.color }} type="button">{tile.label}</button>)}</div>;
  return <PlayingShell input={controls} onFinish={() => setStage('finished')} onPause={() => setStage('paused')} title={selected.title}><SequenceBoard snapshot={snapshot} /></PlayingShell>;
}

export function GamePreviewPage() {
  const { mode: modeSlug } = useParams();
  const mode = gameModeFromSlug(modeSlug);
  if (!mode) return <Navigate replace to={ROUTES.dashboard} />;
  return <div className="relative min-h-dvh w-full overflow-x-hidden bg-white px-4 py-3 text-ink sm:px-8 lg:px-12"><main className="min-h-[calc(100dvh-1.5rem)] outline-none" id="preview-main" tabIndex={-1}>{mode === 'MOTOR_GRIP' ? <MotorGripPreview /> : mode === 'GO_NO_GO' ? <GoNoGoPreview /> : <SequenceMemoryPreview />}</main></div>;
}

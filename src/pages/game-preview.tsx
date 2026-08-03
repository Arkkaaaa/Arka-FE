import { useEffect, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw, X } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { GameMetrics, GameMode } from '../schemas/index.ts';
import { Button, buttonClassName } from '../components/index.ts';
import { GameResultChart } from '../components/game-result-charts.tsx';
import { ResultStats } from '../components/result-stats.tsx';
import { SqueezableFruit } from '../components/squeezable-fruit.tsx';
import { GAME_MODES } from '../constants/game-modes.ts';
import { GO_NO_GO_STIMULUS_LABELS, goNoGoStimulusAssetAt } from '../constants/go-no-go-stimuli.ts';
import { ROUTES } from '../constants/routes.ts';
import { SEQUENCE_TILES } from './game-mode/sequence-tutorial.tsx';

const PREVIEW_MODES = [
  { mode: 'MOTOR_GRIP', slug: 'motor-grip' },
  { mode: 'GO_NO_GO', slug: 'go-no-go' },
  { mode: 'SEQUENCE_MEMORY', slug: 'sequence-memory' },
] as const;

type PreviewModeSlug = (typeof PREVIEW_MODES)[number]['slug'];
type PreviewView = 'game' | 'result';

type GripSample = { elapsedSecond: number; gripPercent: number; kilograms: number };

const MOTOR_SAMPLES: GripSample[] = Array.from({ length: 30 }, (_, index) => {
  const elapsedSecond = index + 1;
  const kilograms = Math.max(0.7, Math.min(4.8, 2.9 + Math.sin(index * 0.68) * 0.65 + Math.cos(index * 0.24) * 0.35));
  return { elapsedSecond, kilograms, gripPercent: Math.round((kilograms / 5) * 100) };
});

const RESULT_DATA: Record<GameMode, { score: number; metrics: GameMetrics }> = {
  MOTOR_GRIP: {
    score: 842,
    metrics: {
      mode: 'MOTOR_GRIP',
      fruitVariant: 'APPLE',
      targetKilograms: 1.5,
      peakGripPercent: 91,
      peakKilograms: 4.55,
      averageKilograms: 2.96,
      continuousHoldMs: 5000,
      timeAtOrAboveTargetMs: 24800,
      targetCompleted: true,
      sessionElapsedMs: 30000,
      gripSamples: MOTOR_SAMPLES,
    },
  },
  GO_NO_GO: {
    score: 900,
    metrics: {
      mode: 'GO_NO_GO',
      totalTrials: 88,
      targetTrials: 31,
      nonTargetTrials: 57,
      hits: 27,
      misses: 4,
      falsePositives: 5,
      correctRejections: 52,
      accuracyPercent: 89.8,
      meanHitReactionMs: 684,
      levelBreakdown: [
        { level: 1, stimulusDurationMs: 3000, totalTrials: 5, hits: 2, misses: 0, falsePositives: 1, correctRejections: 2, accuracyPercent: 80, meanHitReactionMs: 742 },
        { level: 2, stimulusDurationMs: 2000, totalTrials: 83, hits: 25, misses: 4, falsePositives: 4, correctRejections: 50, accuracyPercent: 90.4, meanHitReactionMs: 626 },
      ],
    },
  },
  SEQUENCE_MEMORY: {
    score: 870,
    metrics: {
      mode: 'SEQUENCE_MEMORY',
      maxSequenceLength: 6,
      completedLevels: 6,
      wrongAttempts: 0,
      timedOutAttempts: 0,
      multiButtonAttempts: 0,
      meanFirstResponseMs: 1142,
      meanInterButtonMs: 722,
      levelLatencies: [
        { level: 1, latencyMs: 1412 },
        { level: 2, latencyMs: 1320 },
        { level: 3, latencyMs: 1215 },
        { level: 4, latencyMs: 1120 },
        { level: 5, latencyMs: 978 },
        { level: 6, latencyMs: 807 },
      ],
      completionReason: 'LEVEL_CAP_REACHED',
    },
  },
};

function modeFromSlug(slug: string | undefined): GameMode | null {
  return PREVIEW_MODES.find((item) => item.slug === slug)?.mode ?? null;
}

function previewPath(mode: GameMode, view: PreviewView): string {
  const slug = PREVIEW_MODES.find((item) => item.mode === mode)!.slug;
  return `/preview/${slug}/${view}`;
}

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function SessionCountdown({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const urgent = remainingMs <= 10000;
  return <div className={`inline-flex min-w-36 items-center gap-3 rounded-md px-4 py-3 text-left ${urgent ? 'bg-danger-soft text-danger' : 'bg-ink text-white'}`} role="timer"><Clock3 aria-hidden className="size-7" /><span><span className="block text-xs font-black tracking-[0.1em] uppercase">Sisa waktu</span><strong className="block text-3xl leading-none tabular-nums">{formatCountdown(remainingMs)}</strong></span><span aria-hidden className="h-12 w-1 overflow-hidden rounded-full bg-white/25"><span className="block w-full origin-bottom bg-current transition-transform duration-300" style={{ height: '100%', transform: `scaleY(${Math.max(0, Math.min(remainingMs / totalMs, 1))})` }} /></span></div>;
}

function GripLineChart({ samples }: { samples: readonly GripSample[] }) {
  const width = 640;
  const height = 150;
  const left = 34;
  const right = 14;
  const top = 18;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = samples.map((sample) => ({ ...sample, x: left + ((sample.elapsedSecond - 1) / 29) * plotWidth, y: top + plotHeight - (sample.kilograms / 5) * plotHeight }));
  return <svg aria-label="Grafik kekuatan genggaman langsung" className="h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}>{[0, 1, 2, 3, 4, 5].map((kg) => { const y = top + plotHeight - (kg / 5) * plotHeight; return <line key={kg} stroke="#e7e3d7" strokeWidth="1.5" x1={left} x2={left + plotWidth} y1={y} y2={y} />; })}<polyline fill="none" points={points.map((point) => `${point.x},${point.y}`).join(' ')} stroke="#d67b1f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />{points.map((point) => <circle cx={point.x} cy={point.y} fill="white" key={point.elapsedSecond} r="3" stroke="#d67b1f" strokeWidth="2" />)}<text fill="#625f54" fontSize="13" fontWeight="700" x={left} y={height - 7}>1 dtk</text><text fill="#625f54" fontSize="13" fontWeight="700" textAnchor="end" x={left + plotWidth} y={height - 7}>30 dtk</text></svg>;
}

function MotorGripPreview({ tick }: { tick: number }) {
  const elapsedSecond = (tick % 30) + 1;
  const sample = MOTOR_SAMPLES[elapsedSecond - 1]!;
  const samples = MOTOR_SAMPLES.slice(0, elapsedSecond);
  const holdSeconds = Math.min(5, Math.max(0, elapsedSecond - 2));
  return <div className="mx-auto w-full max-w-6xl"><div className="flex flex-wrap items-start justify-between gap-4"><SessionCountdown remainingMs={(30 - elapsedSecond) * 1000} totalMs={30000} /><div className="rounded-md bg-[#fff4e7] px-5 py-3 text-right"><span className="block text-sm font-black text-muted">Berat genggaman saat ini</span><strong className="text-4xl tabular-nums text-[#a94f12]">{sample.kilograms.toFixed(2)} kg</strong></div></div><div className="mt-5 grid items-stretch gap-6 lg:grid-cols-[1fr_1.1fr]"><div className="grid min-h-[26rem] place-items-center p-6 text-center"><div><SqueezableFruit fruit="APPLE" showLabel={false} squeezePercent={sample.gripPercent} /><p className="mt-3 mb-0 text-xl font-bold text-muted">Mantap, pertahankan genggamannya!</p></div></div><div className="grid gap-5"><div className="rounded-md border-2 border-divider bg-white p-5"><div className="flex items-end justify-between gap-4"><span className="font-black text-muted">Kekuatan relatif</span><strong className="text-4xl">{sample.gripPercent}%</strong></div><div aria-hidden className="relative mt-4 h-4 rounded-full bg-divider"><div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f1c232] via-[#ee8f2a] to-[#dc4c3f] transition-[width] duration-300" style={{ width: `${sample.gripPercent}%` }} /></div></div><div className="rounded-md border-2 border-divider bg-white p-5"><div className="flex items-end justify-between gap-4"><span className="font-black text-muted">Target tahan</span><strong className="text-2xl">{holdSeconds.toFixed(1)} / 5.0 dtk</strong></div><div aria-hidden className="mt-3 h-5 overflow-hidden rounded-full bg-divider"><div className="h-full bg-[#399267] transition-[width] duration-300" style={{ width: `${(holdSeconds / 5) * 100}%` }} /></div></div><div className="rounded-md border-2 border-divider bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="font-black">Grafik genggaman langsung</span><span className="text-sm font-bold text-muted">kg per detik</span></div><div className="mt-2"><GripLineChart samples={samples} /></div></div></div></div></div>;
}

function GoNoGoPreview({ tick }: { tick: number }) {
  const totalCycleSeconds = 186;
  const elapsedSecond = (tick - 1) % totalCycleSeconds;
  const cycle = Math.floor((tick - 1) / totalCycleSeconds);
  const targetPreview = elapsedSecond < 3;
  const turnCue = elapsedSecond >= 3 && elapsedSecond < 6;
  const scoredSecond = Math.max(0, elapsedSecond - 6);
  const level = scoredSecond < 15 ? 1 : 2;
  const levelSecond = level === 1 ? scoredSecond : scoredSecond - 15;
  const durationSeconds = level === 1 ? 3 : 2;
  const levelTrial = Math.floor(levelSecond / durationSeconds) + 1;
  const trial = level === 1 ? levelTrial : 5 + levelTrial;
  const distractors = [
    ['CANDI', 0], ['WAYANG', 1], ['MONAS', 1], ['BATIK', 0], ['WAYANG', 2], ['ANGKLUNG', 0], ['CANDI', 1], ['WAYANG', 3], ['MONAS', 0], ['BATIK', 1], ['ANGKLUNG', 1],
  ] as const;
  const targetTrial = trial % 3 === 0;
  const distractor = distractors[(trial + cycle * 3) % distractors.length]!;
  const stimulus = targetTrial ? 'WAYANG' : distractor[0];
  const assetIndex = targetTrial ? 0 : distractor[1];
  const asset = goNoGoStimulusAssetAt(stimulus, assetIndex);

  useEffect(() => {
    if (!turnCue || elapsedSecond !== 3) return;
    const audio = new Audio('/turn.m4a');
    void audio.play().catch(() => undefined);
  }, [cycle, elapsedSecond, turnCue]);

  const remainingMs = targetPreview || turnCue ? 180000 : Math.max(0, (180 - scoredSecond) * 1000);
  return <div className="mx-auto w-full max-w-5xl"><SessionCountdown remainingMs={remainingMs} totalMs={180000} /><div className="mt-4 grid min-h-[27rem] place-items-center p-4 text-center sm:p-6">{!turnCue && <div className="w-full"><img alt={asset.alt} className="mx-auto aspect-[4/5] w-full max-w-60 rounded-md object-contain" key={`${cycle}-${targetPreview ? 'target' : trial}-${stimulus}-${assetIndex}`} src={targetPreview ? '/images/game-mode2/wayang-1.png' : asset.src} />{targetPreview && <h2 className="mt-3 mb-0 text-3xl font-black">Perhatikan Wayang ini</h2>}{targetPreview && <p className="mt-2 mb-0 font-bold text-muted">Ini adalah gambar sasaran.</p>}</div>}</div></div>;
}

function SequenceMemoryPreview({ tick }: { tick: number }) {
  const sequence = ['RED', 'BLUE', 'GREEN', 'YELLOW'] as const;
  const cycle = tick % 12;
  const showing = cycle < 8;
  const activeCode = showing && cycle % 2 === 0 ? sequence[Math.floor(cycle / 2)] : null;
  const activeTile = SEQUENCE_TILES.find((tile) => tile.code === activeCode);
  const idleBackground = `conic-gradient(from -45deg, ${SEQUENCE_TILES.map((tile, index) => `${tile.color} ${index * 25}% ${(index + 1) * 25}%`).join(', ')})`;
  return <div className="mx-auto w-full max-w-3xl"><div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-2xl font-black">{showing ? 'Perhatikan urutannya.' : 'Sekarang ikuti urutannya.'}</p><span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-black">Sisa kesempatan 3</span></div><div className="mt-10 grid place-items-center text-center"><div className="relative grid size-64 place-items-center sm:size-80">{activeTile && <><span aria-hidden className="absolute inset-5 animate-ping rounded-full opacity-20" style={{ backgroundColor: activeTile.color }} /><span aria-hidden className="absolute inset-1 rounded-full opacity-25 blur-2xl" style={{ backgroundColor: activeTile.color }} /></>}<div aria-label={activeTile ? `Warna ${activeTile.label}` : 'Tombol empat warna'} className={`relative size-52 rounded-full border-[12px] border-[#080808] transition duration-150 sm:size-64 ${activeTile ? 'scale-105 -translate-y-1' : 'saturate-[0.7] brightness-[0.72]'}`} role="img" style={{ background: activeTile ? `radial-gradient(circle at 34% 27%, white 0 4%, ${activeTile.color} 8% 58%, color-mix(in srgb, ${activeTile.color}, black 35%) 100%)` : idleBackground, boxShadow: activeTile ? `0 0 0 7px ${activeTile.color}55,0 0 38px ${activeTile.color},inset 0 -22px 26px rgba(0,0,0,.28),0 10px 0 #050505` : 'inset 0 -22px 26px rgba(0,0,0,.28),0 10px 0 #050505' }}><span aria-hidden className="absolute inset-x-10 top-5 h-8 rotate-[-12deg] rounded-full bg-white/28 blur-[1px]" /></div></div><p className="mt-2 mb-0 text-2xl font-black">{activeTile ? activeTile.label : showing ? 'Ingat setiap warna' : 'Tekan tombol fisik sesuai urutan'}</p></div></div>;
}

function ResultPreview({ mode }: { mode: GameMode }) {
  const { metrics, score } = RESULT_DATA[mode]!;
  return <section aria-labelledby="preview-result-title"><p className="landing-eyebrow">Sesi tersimpan</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="preview-result-title">Hasil sesi Budi Santoso</h1><p className="mt-4 mb-0 text-base font-bold text-muted">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p><ResultStats metrics={metrics} score={score} /><GameResultChart metrics={metrics} /><div className="mt-7 flex flex-wrap gap-3"><Link className={buttonClassName('primary')} to={previewPath(mode, 'game')}><RotateCcw aria-hidden className="size-5" />Lihat permainan lagi</Link><Link className={buttonClassName('quiet')} to={ROUTES.landing}>Kembali ke beranda</Link></div></section>;
}

function ActiveGamePreview({ mode, onTogglePause, paused, tick }: { mode: GameMode; onTogglePause: () => void; paused: boolean; tick: number }) {
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  return <section aria-labelledby="preview-game-title"><div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-5"><div><p className="m-0 text-sm font-black text-muted">Budi Santoso</p><h1 className="mt-1 mb-0 text-3xl font-black" id="preview-game-title">{selected.title}</h1></div><div className="flex items-center gap-2"><span className="inline-flex min-h-11 items-center rounded-full bg-[#e8f7ef] px-4 text-sm font-black text-success"><span aria-hidden className="mr-2 size-2 animate-pulse rounded-full bg-success" />Permainan aktif</span><Button onClick={onTogglePause} variant="secondary">{paused ? <Play aria-hidden className="size-5" /> : <Pause aria-hidden className="size-5" />}{paused ? 'Lanjutkan' : 'Jeda'}</Button><span className="inline-flex min-h-13 items-center rounded-sm border-2 border-danger bg-danger px-5 font-black text-white"><X aria-hidden className="mr-2 size-5" />Akhiri sesi</span></div></div>{paused ? <div className="mt-7 grid min-h-[32rem] place-items-center rounded-lg border-2 border-divider bg-white text-center"><div><Pause aria-hidden className="mx-auto size-12 text-muted" /><h2 className="mt-4 mb-0 text-4xl font-black">Dijeda</h2><p className="mt-3 mb-0 text-lg text-muted">Klik Lanjutkan untuk meneruskan preview.</p></div></div> : <div className="mt-7">{mode === 'MOTOR_GRIP' ? <MotorGripPreview tick={tick} /> : mode === 'GO_NO_GO' ? <GoNoGoPreview tick={tick} /> : <SequenceMemoryPreview tick={tick} />}</div>}</section>;
}

export function GamePreviewPage() {
  const { mode: modeSlug, view } = useParams();
  const mode = modeFromSlug(modeSlug);
  const validView = view === 'game' || view === 'result' ? view : null;
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(1);

  useEffect(() => {
    if (paused || validView !== 'game') return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, validView]);

  if (!mode || !validView) return <Navigate replace to={previewPath('MOTOR_GRIP', 'game')} />;

  return <div className="min-h-dvh bg-canvas text-ink"><header className="border-b-2 border-divider bg-white"><div className="mx-auto flex w-full max-w-[82rem] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div><p className="m-0 text-sm font-black tracking-[0.1em] text-accent uppercase">Dummy UI</p><p className="mt-1 mb-0 text-xl font-black">Preview permainan ARKA</p></div><Link className={buttonClassName('quiet')} to={ROUTES.landing}>Tutup preview</Link></div></header><main className="mx-auto w-full max-w-[82rem] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8" tabIndex={-1}><nav aria-label="Pilih preview permainan" className="rounded-lg border-2 border-divider bg-white p-3"><div className="grid gap-3 lg:grid-cols-[1fr_auto]"><div className="grid gap-2 sm:grid-cols-3">{GAME_MODES.map((item) => <Link aria-current={item.mode === mode ? 'page' : undefined} className={`flex min-h-16 items-center gap-3 rounded-md border-2 px-4 font-black no-underline transition ${item.mode === mode ? 'border-ink text-ink' : 'border-transparent bg-canvas text-muted hover:border-divider'}`} key={item.mode} style={item.mode === mode ? { backgroundColor: item.softColor } : undefined} to={previewPath(item.mode, validView)}><img alt="" aria-hidden className="size-9" src={item.emoji} /><span>{item.title}</span></Link>)}</div><div className="grid grid-cols-2 rounded-md bg-canvas p-1"><Link aria-current={validView === 'game' ? 'page' : undefined} className={`grid min-h-14 place-items-center rounded-sm px-5 font-black no-underline ${validView === 'game' ? 'bg-ink text-white' : 'text-muted'}`} to={previewPath(mode, 'game')}>Sedang bermain</Link><Link aria-current={validView === 'result' ? 'page' : undefined} className={`grid min-h-14 place-items-center rounded-sm px-5 font-black no-underline ${validView === 'result' ? 'bg-ink text-white' : 'text-muted'}`} to={previewPath(mode, 'result')}>Hasil</Link></div></div></nav><div className="mt-6 rounded-lg border-2 border-divider bg-white p-4 shadow-[0_7px_0_#e7e3d7] sm:p-6 lg:p-8">{validView === 'game' ? <ActiveGamePreview mode={mode} onTogglePause={() => setPaused((value) => !value)} paused={paused} tick={tick} /> : <ResultPreview mode={mode} />}</div></main></div>;
}

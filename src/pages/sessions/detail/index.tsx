import { ArrowLeft } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import type { GameMetrics } from '../../../schemas/index.ts';
import { AccountHeader } from '../../../components/index.ts';
import { GAME_MODES } from '../../../constants/game-modes.ts';
import { ROUTES } from '../../../constants/routes.ts';
import { useAccountPage } from '../../../hooks/auth/use-account-page.ts';
import { useGameSessionQuery } from '../../../hooks/games/use-game-session-query.ts';

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border-2 border-divider bg-white p-5"><dt className="font-bold text-muted">{label}</dt><dd className="mt-2 ml-0 text-3xl font-black">{value}</dd></div>;
}

function MetricCards({ metrics, score }: { metrics: GameMetrics; score: number }) {
  if (metrics.mode === 'MOTOR_GRIP') return <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Total skor" value={score} /><MetricCard label="Puncak genggaman" value={metrics.gripSamples.length > 0 ? `${metrics.peakKilograms.toFixed(2)} kg` : '—'} /><MetricCard label="Kekuatan relatif" value={`${Math.round(metrics.peakGripPercent)}%`} /><MetricCard label="Durasi tahan" value={`${(metrics.continuousHoldMs / 1000).toFixed(1)} dtk`} /><MetricCard label="Target latihan" value={metrics.targetCompleted ? 'Tercapai' : 'Belum tercapai'} /><MetricCard label="Durasi permainan" value={`${Math.round(metrics.sessionElapsedMs / 1000)} dtk`} /></dl>;
  if (metrics.mode === 'GO_NO_GO') return <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Total skor" value={score} /><MetricCard label="Akurasi" value={`${Math.round(metrics.accuracyPercent)}%`} /><MetricCard label="Respons benar" value={metrics.hits + metrics.correctRejections} /><MetricCard label="Respons terlewat" value={metrics.misses} /><MetricCard label="Respons keliru" value={metrics.falsePositives} /><MetricCard label="Rata-rata reaksi" value={metrics.meanHitReactionMs === null ? '—' : `${Math.round(metrics.meanHitReactionMs)} ms`} /></dl>;
  return <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Memory span" value={`Level ${metrics.maxSequenceLength}`} /><MetricCard label="Total skor" value={score} /><MetricCard label="Rata-rata waktu reaksi" value={metrics.meanFirstResponseMs === null ? '—' : `${Math.round(metrics.meanFirstResponseMs)} ms`} /><MetricCard label="Level selesai" value={metrics.completedLevels} /><MetricCard label="Percobaan salah" value={metrics.wrongAttempts} /><MetricCard label="Permainan selesai karena" value={metrics.completionReason === 'LEVEL_CAP_REACHED' ? 'Semua level selesai' : 'Kesempatan habis'} /></dl>;
}

function SequenceLatencyChart({ metrics }: { metrics: Extract<GameMetrics, { mode: 'SEQUENCE_MEMORY' }> }) {
  const reduceMotion = useReducedMotion();
  const latencyData = metrics.levelLatencies;
  if (latencyData.length === 0) return <section className="mt-7 grid min-h-48 place-items-center text-center text-muted"><div><p className="m-0 text-lg font-black">Data waktu reaksi belum tersedia</p><p className="mt-2 mb-0">Grafik akan muncul pada permainan berikutnya.</p></div></section>;
  const width = 640;
  const height = 210;
  const left = 48;
  const right = 28;
  const top = 34;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxLatency = Math.max(...latencyData.map((point) => point.latencyMs), 1);
  const points = latencyData.map((point, index) => ({ ...point, x: left + (index / Math.max(latencyData.length - 1, 1)) * plotWidth, y: top + plotHeight - (point.latencyMs / maxLatency) * plotHeight }));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  return (
    <section aria-labelledby="session-chart-title" className="mt-7 rounded-md border-2 border-divider bg-white p-5 sm:p-6">
      <p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Waktu respons</p><h2 className="mt-2 mb-0 text-2xl font-black" id="session-chart-title">Latensi per level</h2>
      <div className="mx-auto mt-5 max-w-3xl overflow-x-auto"><svg aria-label="Grafik garis latensi jawaban per level" className="h-auto min-w-[30rem] w-full" role="img" viewBox={`0 0 ${width} ${height}`}>{[0, 0.5, 1].map((ratio) => { const y = top + plotHeight * ratio; return <line key={ratio} stroke="#e7e3d7" strokeWidth="2" x1={left} x2={left + plotWidth} y1={y} y2={y} />; })}{points.length > 1 && <m.polyline animate={{ pathLength: 1, opacity: 1 }} fill="none" initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} points={line} stroke="#399267" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" transition={{ duration: 0.8, ease: 'easeOut' }} />}{points.map((point, index) => <m.g animate={{ opacity: 1, scale: 1 }} initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }} key={point.level} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} transition={{ delay: reduceMotion ? 0 : index * 0.12, duration: 0.3 }}><circle cx={point.x} cy={point.y} fill="white" r="7" stroke="#399267" strokeWidth="3" /><text fill="#171711" fontSize="14" fontWeight="800" textAnchor="middle" x={point.x} y={point.y - 15}>{Math.round(point.latencyMs)} ms</text><text fill="#625f54" fontSize="14" fontWeight="700" textAnchor="middle" x={point.x} y={height - 12}>Level {point.level}</text></m.g>)}</svg></div>
    </section>
  );
}

function MotorGripChart({ metrics }: { metrics: Extract<GameMetrics, { mode: 'MOTOR_GRIP' }> }) {
  const reduceMotion = useReducedMotion();
  const width = 640;
  const height = 250;
  const left = 52;
  const right = 22;
  const top = 30;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = metrics.gripSamples.map((sample) => ({ ...sample, x: left + ((sample.elapsedSecond - 1) / 29) * plotWidth, y: top + plotHeight - (sample.kilograms / 5) * plotHeight }));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  return <section aria-labelledby="session-chart-title" className="mt-7 rounded-md border-2 border-divider bg-white p-5 sm:p-6"><p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Kekuatan per detik</p><h2 className="mt-2 mb-0 text-2xl font-black" id="session-chart-title">Grafik genggaman selama 30 detik</h2>{points.length === 0 ? <p className="mt-5 mb-0 font-bold text-muted">Data per detik belum tersedia untuk sesi ini.</p> : <div className="mt-5 overflow-x-auto"><svg aria-label="Grafik garis berat genggaman per detik" className="h-auto min-w-[32rem] w-full" role="img" viewBox={`0 0 ${width} ${height}`}>{[0, 1, 2, 3, 4, 5].map((kg) => { const y = top + plotHeight - (kg / 5) * plotHeight; return <g key={kg}><line stroke="#e7e3d7" strokeWidth="1.5" x1={left} x2={left + plotWidth} y1={y} y2={y} /><text fill="#625f54" fontSize="13" fontWeight="700" textAnchor="end" x={left - 8} y={y + 4}>{kg} kg</text></g>; })}<m.polyline animate={{ pathLength: 1, opacity: 1 }} fill="none" initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }} points={line} stroke="#d67b1f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" transition={{ duration: 0.8 }} />{points.map((point) => <circle cx={point.x} cy={point.y} fill="white" key={point.elapsedSecond} r="4" stroke="#d67b1f" strokeWidth="2" />)}<text fill="#625f54" fontSize="13" fontWeight="700" x={left} y={height - 10}>1 detik</text><text fill="#625f54" fontSize="13" fontWeight="700" textAnchor="end" x={left + plotWidth} y={height - 10}>30 detik</text></svg></div>}</section>;
}

function GoNoGoChart({ metrics }: { metrics: Extract<GameMetrics, { mode: 'GO_NO_GO' }> }) {
  const reduceMotion = useReducedMotion();
  const values = [{ label: 'Tepat sasaran', value: metrics.hits, color: '#399267' }, { label: 'Tepat menahan', value: metrics.correctRejections, color: '#3978bd' }, { label: 'Terlewat', value: metrics.misses, color: '#e7b82c' }, { label: 'Respons keliru', value: metrics.falsePositives, color: '#dc4c3f' }];
  let offset = 0;
  const segments = values.map((item) => { const ratio = metrics.totalTrials === 0 ? 0 : item.value / metrics.totalTrials; const segment = { ...item, ratio, offset }; offset += ratio; return segment; });
  const gradient = segments.map((item) => `${item.color} ${item.offset * 100}% ${(item.offset + item.ratio) * 100}%`).join(', ');
  return <section aria-labelledby="session-chart-title" className="mt-7 rounded-md border-2 border-divider bg-white p-5 sm:p-6"><p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Komposisi respons</p><h2 className="mt-2 mb-0 text-2xl font-black" id="session-chart-title">Hasil seluruh percobaan</h2><div className="mt-7 grid items-center gap-8 sm:grid-cols-[auto_1fr]"><m.div animate={{ opacity: 1, rotate: 0, scale: 1 }} aria-label={`Akurasi ${Math.round(metrics.accuracyPercent)} persen`} className="mx-auto grid size-48 place-items-center rounded-full" initial={reduceMotion ? { opacity: 1, rotate: 0, scale: 1 } : { opacity: 0, rotate: -35, scale: 0.75 }} role="img" style={{ background: `conic-gradient(${gradient || '#e7e3d7 0 100%'})` }} transition={{ duration: 0.65, ease: 'easeOut' }}><div className="grid size-30 place-items-center rounded-full bg-white text-center"><span><strong className="block text-4xl">{Math.round(metrics.accuracyPercent)}%</strong><span className="text-sm font-bold text-muted">akurasi</span></span></div></m.div><ul className="m-0 grid list-none gap-3 p-0">{segments.map((item) => <li className="flex items-center justify-between gap-4" key={item.label}><span className="flex items-center gap-3 font-bold"><span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.value}</strong></li>)}</ul></div></section>;
}

function ResultChart({ metrics }: { metrics: GameMetrics }) {
  if (metrics.mode === 'MOTOR_GRIP') return <MotorGripChart metrics={metrics} />;
  if (metrics.mode === 'GO_NO_GO') return <GoNoGoChart metrics={metrics} />;
  return <SequenceLatencyChart metrics={metrics} />;
}

export function SessionDetailPage() {
  const { sessionId } = useParams();
  const { session: account, signOut } = useAccountPage();
  const session = useGameSessionQuery(sessionId, { retry: true });
  const mode = session.data ? GAME_MODES.find((item) => item.mode === session.data.mode) : null;
  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-ink">
      <div aria-hidden className="landing-glow landing-glow-soft -top-36 -right-40 size-[34rem]" />
      <AccountHeader isSigningOut={signOut.isPending} onSignOut={() => account.data && signOut.mutate(account.data)} user={account.data} />
      <main className="relative mx-auto w-full max-w-[68rem] px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-12" tabIndex={-1}>
        {session.isPending ? <div aria-label="Memuat detail permainan" className="animate-pulse" role="status"><div className="h-12 w-72 rounded-sm bg-divider" /><div className="mt-8 h-64 rounded-md border-2 border-divider bg-divider/30" /><div className="mt-5 h-72 rounded-md bg-divider/30" /></div> : session.isError || !session.data ? <div className="grid min-h-64 place-items-center text-muted">Detail permainan tidak tersedia.</div> : <><Link className="group inline-flex min-h-11 items-center gap-2 font-black no-underline" to={session.data.participantId ? ROUTES.participantHistory(session.data.participantId) : ROUTES.progressBoard}><ArrowLeft aria-hidden className="size-5" /><span className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-ink after:transition-transform group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">Kembali ke history</span></Link><section className="mt-8"><p className="landing-eyebrow">Detail permainan</p><div className="flex min-w-0 flex-wrap items-center gap-4">{mode && <img alt="" aria-hidden className="size-14" src={mode.emoji} />}<div className="min-w-0"><h1 className="m-0 break-words text-3xl font-black tracking-[-0.05em] sm:text-4xl">{mode?.title ?? session.data.mode}</h1><p className="mt-2 mb-0 font-bold text-muted">{session.data.displayName} · {session.data.completedAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(session.data.completedAt)) : session.data.status}</p></div></div>{session.data.result ? <><p className="mt-5 mb-0 text-base font-bold text-muted">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p><MetricCards metrics={session.data.result.metrics} score={session.data.result.score} /><ResultChart metrics={session.data.result.metrics} />{session.data.result.aiSummary.status === 'READY' && <section className="mt-7 rounded-md border-2 border-divider bg-white p-5 sm:p-6"><h2 className="m-0 text-2xl font-black">Ringkasan permainan</h2><p className="mt-3 mb-0 leading-7">{session.data.result.aiSummary.summaryText}</p>{session.data.result.aiSummary.observations.length > 0 && <ul className="mt-4 mb-0 grid gap-2 pl-5">{session.data.result.aiSummary.observations.map((item) => <li key={item}>{item}</li>)}</ul>}</section>}</> : <div className="mt-8 grid min-h-44 place-items-center text-muted">Hasil permainan belum tersimpan.</div>}</section></>}
      </main>
    </div>
  );
}

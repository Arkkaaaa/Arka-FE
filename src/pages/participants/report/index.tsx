import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { arkaLogo } from '../../../assets/index.ts';
import { FruitIcon } from '../../../components/squeezable-fruit.tsx';
import { ROUTES } from '../../../constants/routes.ts';
import { useAccountPage } from '../../../hooks/auth/use-account-page.ts';
import { useParticipantQuery } from '../../../hooks/participants/use-participant-queries.ts';
import type { ParticipantDetailDto } from '../../../schemas/index.ts';
import './report.css';

type ModeSummary = ParticipantDetailDto['modeSummaries'][number];

function ReportHeader({ audience, institution, page, participant }: { audience: string; institution: string; page: number; participant: ParticipantDetailDto }) {
  return <header className="report-header"><div><p>Laporan perkembangan untuk {audience}</p><h1>{participant.displayName}</h1><span>{participant.participantReference}</span></div><div className="report-institution"><strong>{institution}</strong><span>Halaman {page}</span></div></header>;
}

function ReportFooter({ institution }: { institution: string }) {
  return <footer className="report-footer"><span><img alt="" src={arkaLogo} />ARKA</span><span>{institution}</span></footer>;
}

function ReportPage({ audience, children, institution, page, participant }: { audience: string; children: React.ReactNode; institution: string; page: number; participant: ParticipantDetailDto }) {
  return <section className="report-page"><ReportHeader audience={audience} institution={institution} page={page} participant={participant} /><div className="report-content">{children}</div><ReportFooter institution={institution} /></section>;
}

function MemoryChart({ metrics }: { metrics: Extract<NonNullable<ModeSummary['overallMetrics']>, { mode: 'SEQUENCE_MEMORY' }> }) {
  const width = 620, height = 250, left = 54, top = 32, bottom = 48, right = 28;
  const max = Math.max(...metrics.levelLatencies.map((item) => item.latencyMs), 1);
  const points = metrics.levelLatencies.map((point, index) => ({ ...point, x: left + index / Math.max(metrics.levelLatencies.length - 1, 1) * (width - left - right), y: top + (height - top - bottom) * (1 - point.latencyMs / max) }));
  return <svg aria-label="Rata-rata waktu respons per level" className="report-chart" role="img" viewBox={`0 0 ${width} ${height}`}><line stroke="#d8dce7" strokeWidth="2" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />{points.length > 1 && <polyline fill="none" points={points.map((point) => `${point.x},${point.y}`).join(' ')} stroke="#356fae" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />}{points.map((point) => <g key={point.level}><circle cx={point.x} cy={point.y} fill="white" r="6" stroke="#356fae" strokeWidth="4" /><text fill="#171711" fontSize="12" fontWeight="800" textAnchor="middle" x={point.x} y={point.y - 14}>{Math.round(point.latencyMs)} ms</text><text fill="#625f54" fontSize="12" fontWeight="700" textAnchor="middle" x={point.x} y={height - 17}>Level {point.level}</text></g>)}</svg>;
}

function ModeNarrative({ audience, summary }: { audience: 'participant' | 'clinician'; summary: ModeSummary }) {
  const narrative = summary.narrativeSummary;
  if (!narrative || narrative.source !== 'AI') return null;
  return <section className="report-mode-narrative"><h3>Analisis perkembangan mode</h3><p>{audience === 'clinician' ? narrative.clinicianSummary : narrative.participantSummary}</p></section>;
}

function MotorReport({ summary }: { summary: ModeSummary }) {
  const metrics = summary.overallMetrics?.mode === 'MOTOR_GRIP' ? summary.overallMetrics : null;
  if (!metrics) return <p>Belum ada data Peras Jeruk.</p>;
  return <><h2>Peras Jeruk</h2><p className="report-lead">Gambaran kekuatan genggaman dan kemampuan mempertahankan beban selama permainan.</p><div className="report-metrics"><span><b>{metrics.averageScore}</b>Rata-rata skor</span><span><b>{metrics.averageKilograms.toFixed(2)} kg</b>Beban rata-rata</span><span><b>{metrics.averagePeakKilograms.toFixed(2)} kg</b>Beban puncak</span><span><b>{(metrics.averageContinuousHoldMs / 1000).toFixed(1)} dtk</b>Tahanan kontinu</span></div><div className="report-bars"><div><span>Beban rata-rata</span><i><em style={{ width: `${Math.min(100, metrics.averageKilograms / 5 * 100)}%` }} /></i><b>{metrics.averageKilograms.toFixed(2)} kg</b></div><div><span>Beban puncak</span><i><em style={{ width: `${Math.min(100, metrics.averagePeakKilograms / 5 * 100)}%` }} /></i><b>{metrics.averagePeakKilograms.toFixed(2)} kg</b></div></div></>;
}

function GoNoGoReport({ summary }: { summary: ModeSummary }) {
  const metrics = summary.overallMetrics?.mode === 'GO_NO_GO' ? summary.overallMetrics : null;
  if (!metrics) return <p>Belum ada data Go-No-Go.</p>;
  return <><h2>Go-No-Go</h2><p className="report-lead">Gambaran ketepatan mengenali kategori gambar dan waktu respons selama permainan.</p><div className="report-metrics"><span><b>{metrics.averageScore}</b>Rata-rata skor</span><span><b>{Math.round(metrics.averageAccuracyPercent)}%</b>Akurasi</span><span><b>{metrics.averageReactionMs === null ? '—' : `${Math.round(metrics.averageReactionMs)} ms`}</b>Waktu respons</span><span><b>{metrics.totalTrials}</b>Total soal</span></div><div className="report-response-bar"><span style={{ width: `${metrics.totalTrials ? metrics.totalHits / metrics.totalTrials * 100 : 0}%` }} /><span style={{ width: `${metrics.totalTrials ? metrics.totalMisses / metrics.totalTrials * 100 : 0}%` }} /><span style={{ width: `${metrics.totalTrials ? metrics.totalFalsePositives / metrics.totalTrials * 100 : 0}%` }} /></div><div className="report-legend"><span><i className="hit" />{metrics.totalHits} tepat</span><span><i className="miss" />{metrics.totalMisses} terlewat</span><span><i className="false" />{metrics.totalFalsePositives} belum tepat</span></div></>;
}

function MemoryReport({ summary }: { summary: ModeSummary }) {
  const metrics = summary.overallMetrics?.mode === 'SEQUENCE_MEMORY' ? summary.overallMetrics : null;
  if (!metrics) return <p>Belum ada data Ding Dong Dong.</p>;
  return <><h2>Ding Dong Dong</h2><p className="report-lead">Gambaran panjang urutan yang diingat dan kecepatan respons pada setiap level.</p><div className="report-metrics"><span><b>{metrics.averageScore}</b>Rata-rata skor</span><span><b>{metrics.averageMemorySpan.toFixed(1)}</b>Rentang ingatan</span><span><b>{metrics.averageFirstResponseMs === null ? '—' : `${Math.round(metrics.averageFirstResponseMs)} ms`}</b>Respons pertama</span></div><MemoryChart metrics={metrics} /></>;
}

export function ParticipantReportPage() {
  const { participantId } = useParams();
  const [searchParams] = useSearchParams();
  const audience = searchParams.get('audience') === 'clinician' ? 'clinician' : 'participant';
  const audienceLabel = audience === 'clinician' ? 'Dokter' : 'Peserta';
  const participant = useParticipantQuery(participantId);
  const { session } = useAccountPage();
  if (participant.isPending || session.isPending) return <main className="report-state">Menyiapkan laporan…</main>;
  if (!participant.data || !session.data) return <main className="report-state">Laporan tidak tersedia.</main>;
  const narrativesReady = participant.data.modeSummaries.every((summary) => summary.savedSessionsTotal === 0 || summary.narrativeSummary?.source === 'AI');
  if (!participant.data.aggregateSummary || participant.data.aggregateSummary.source !== 'AI' || !narrativesReady) return <main className="report-state">Ringkasan laporan sedang disiapkan.</main>;
  const institution = session.data.institution.name;
  const motor = participant.data.modeSummaries.find((summary) => summary.mode === 'MOTOR_GRIP')!;
  const attention = participant.data.modeSummaries.find((summary) => summary.mode === 'GO_NO_GO')!;
  const memory = participant.data.modeSummaries.find((summary) => summary.mode === 'SEQUENCE_MEMORY')!;
  const summaryText = participant.data.aggregateSummary ? audience === 'clinician' ? participant.data.aggregateSummary.clinicianSummary : participant.data.aggregateSummary.participantSummary : 'Ringkasan keseluruhan belum tersedia.';
  return <div className="report-shell"><div className="report-toolbar"><Link to={ROUTES.participant(participant.data.participantId)}><ArrowLeft aria-hidden />Kembali</Link><button onClick={() => window.print()} type="button"><Printer aria-hidden />Cetak / Simpan PDF</button></div><ReportPage audience={audienceLabel} institution={institution} page={1} participant={participant.data}><section className="report-overview"><p className="report-date">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</p><div className="report-level"><FruitIcon className="report-fruit" fruit="ORANGE" /><div><span>Permainan kekuatan genggaman</span><h2>Peras Jeruk · 30 detik</h2><p>Skor dihitung dari kekuatan rata-rata dan puncak terhadap referensi 5 kg.</p></div></div><h2>Ringkasan skor</h2><div className="report-score-grid">{participant.data.modeSummaries.map((item) => <div key={item.mode}><span>{item.mode === 'MOTOR_GRIP' ? 'Peras Jeruk' : item.mode === 'GO_NO_GO' ? 'Go-No-Go' : 'Ding Dong Dong'}</span><strong>{item.overallMetrics?.averageScore ?? '—'}</strong><small>Skor terbaru {item.latestSession?.score ?? '—'}</small></div>)}</div><div className="report-summary"><h2>Ringkasan keseluruhan untuk {audienceLabel}</h2><p>{summaryText}</p></div><p className="report-disclaimer">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p></section></ReportPage><ReportPage audience={audienceLabel} institution={institution} page={2} participant={participant.data}><><MotorReport summary={motor} /><ModeNarrative audience={audience} summary={motor} /></></ReportPage><ReportPage audience={audienceLabel} institution={institution} page={3} participant={participant.data}><><GoNoGoReport summary={attention} /><ModeNarrative audience={audience} summary={attention} /></></ReportPage><ReportPage audience={audienceLabel} institution={institution} page={4} participant={participant.data}><><MemoryReport summary={memory} /><ModeNarrative audience={audience} summary={memory} /></></ReportPage></div>;
}

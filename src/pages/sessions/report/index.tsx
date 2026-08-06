import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { arkaLogo } from '../../../assets/index.ts';
import { GameResultChart } from '../../../components/game-result-charts.tsx';
import { ResultStats } from '../../../components/result-stats.tsx';
import { GAME_MODES } from '../../../constants/game-modes.ts';
import { ROUTES } from '../../../constants/routes.ts';
import { useAccountPage } from '../../../hooks/auth/use-account-page.ts';
import { useGameSessionQuery } from '../../../hooks/games/use-game-session-query.ts';
import '../../participants/report/report.css';

function Header({ audience, institution, page, title }: { audience: string; institution: string; page: number; title: string }) {
  return <header className="report-header"><div><p>Laporan sesi untuk {audience}</p><h1>{title}</h1><span>Hasil satu sesi permainan</span></div><div className="report-institution"><strong>{institution}</strong><span>Halaman {page}</span></div></header>;
}

function Footer({ institution }: { institution: string }) {
  return <footer className="report-footer"><span><img alt="" src={arkaLogo} />ARKA</span><span>{institution}</span></footer>;
}

export function SessionReportPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const audience = searchParams.get('audience') === 'clinician' ? 'clinician' : 'participant';
  const audienceLabel = audience === 'clinician' ? 'Dokter' : 'Peserta';
  const session = useGameSessionQuery(sessionId, { pollWhileSaving: true, retry: true });
  const { session: account } = useAccountPage();
  if (session.isPending || account.isPending) return <main className="report-state">Menyiapkan laporan…</main>;
  if (!session.data?.result || !account.data || session.data.result.aiSummary.status !== 'READY') return <main className="report-state">Ringkasan laporan sedang disiapkan.</main>;
  const mode = GAME_MODES.find((item) => item.mode === session.data.mode)!;
  const institution = account.data.institution.name;
  const summary = session.data.result.aiSummary[audience];
  return <div className="report-shell"><div className="report-toolbar"><Link to={ROUTES.session(session.data.sessionId)}><ArrowLeft aria-hidden />Kembali</Link><button onClick={() => window.print()} type="button"><Printer aria-hidden />Cetak / Simpan PDF</button></div><section className="report-page"><Header audience={audienceLabel} institution={institution} page={1} title={mode.title} /><div className="report-content"><p className="report-date">{session.data.displayName} · {session.data.completedAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(session.data.completedAt)) : ''}</p><ResultStats metrics={session.data.result.metrics} score={session.data.result.score} /><section className="report-summary"><h2>Ringkasan sesi untuk {audienceLabel}</h2><p>{summary.summaryText}</p>{summary.observations.length > 0 && <ul>{summary.observations.map((item) => <li key={item}>{item}</li>)}</ul>}</section><p className="report-disclaimer">Hasil permainan ini bukan diagnosis atau rekomendasi terapi.</p></div><Footer institution={institution} /></section><section className="report-page"><Header audience={audienceLabel} institution={institution} page={2} title={mode.title} /><div className="report-content"><h2>Grafik sesi</h2><GameResultChart metrics={session.data.result.metrics} /></div><Footer institution={institution} /></section></div>;
}

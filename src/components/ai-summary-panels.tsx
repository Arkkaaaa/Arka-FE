import type { AiSummaryDto } from '../schemas/index.ts';

function SummaryAudience({ label, summary }: { label: string; summary: Extract<AiSummaryDto, { status: 'READY' }>['participant'] }) {
  return <article className="rounded-md border-2 border-divider bg-white p-4"><p className="m-0 text-xs font-black tracking-[0.08em] text-accent uppercase">{label}</p><p className="mt-2 mb-0 text-sm leading-6 font-bold">{summary.summaryText}</p>{summary.observations.length > 0 && <ul className="mt-2 mb-0 grid gap-1 pl-5 text-xs leading-5 text-muted">{summary.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul>}</article>;
}

export function AiSummaryPanels({ summary }: { summary: AiSummaryDto }) {
  if (summary.status === 'PENDING') return <section aria-live="polite" className="rounded-md border-2 border-divider bg-canvas/50 p-4 text-center text-sm font-bold text-muted">Ringkasan peserta dan dokter sedang disiapkan oleh AI lokal.</section>;
  if (summary.status === 'UNAVAILABLE') return <section className="rounded-md border-2 border-divider bg-canvas/50 p-4 text-center text-sm font-bold text-muted">Ringkasan AI belum tersedia untuk sesi ini.</section>;
  return <section aria-label="Ringkasan AI" className="grid gap-3 md:grid-cols-2"><SummaryAudience label="Untuk peserta" summary={summary.participant} /><SummaryAudience label="Untuk dokter" summary={summary.clinician} /></section>;
}

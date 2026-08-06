import { FileDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { AiSummaryDto } from '../schemas/index.ts';
import { API_ENDPOINTS, apiUrl } from '../constants/api.ts';
import { buttonClassName } from './ui/button/button.tsx';

type Audience = 'participant' | 'clinician';

const AUDIENCES: readonly { id: Audience; label: string }[] = [
  { id: 'participant', label: 'Peserta' },
  { id: 'clinician', label: 'Dokter' },
];

function normalizeSummaryText(text: string): string {
  return text.replace(
    /persentase akurasi\s+(\d+(?:[.,]\d+)?)\s+pada\s+(\d+)\s+total percobaan/giu,
    'akurasi $1% pada total $2 percobaan',
  );
}

export function AiSummaryPanels({ sessionId, summary }: { sessionId?: string; summary: AiSummaryDto }) {
  const [audience, setAudience] = useState<Audience>('participant');
  const tabsId = useId();
  if (summary.status !== 'READY') return <section aria-live="polite" className="rounded-md border-2 border-divider bg-white p-5 text-center font-bold text-muted">{summary.status === 'PENDING' ? 'Ringkasan sedang disiapkan.' : 'Ringkasan belum tersedia untuk sesi ini.'}</section>;
  const active = summary[audience];

  return (
    <section aria-labelledby={`${tabsId}-title`} className="overflow-hidden rounded-md border-2 border-divider bg-white">
      <div className="border-b-2 border-divider px-4 pt-4 sm:px-5">
        <p className="m-0 text-xs font-black tracking-[0.08em] text-accent uppercase" id={`${tabsId}-title`}>Ringkasan sesi</p>
        <div aria-label="Pilih ringkasan" className="mt-3 flex gap-2" role="tablist">
          {AUDIENCES.map((item) => (
            <button
              aria-controls={`${tabsId}-panel`}
              aria-selected={audience === item.id}
              className={`min-h-11 border-0 border-b-4 bg-transparent px-4 text-sm font-black transition ${audience === item.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`}
              id={`${tabsId}-${item.id}`}
              key={item.id}
              onClick={() => setAudience(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div aria-labelledby={`${tabsId}-${audience}`} className="p-4 sm:p-5" id={`${tabsId}-panel`} role="tabpanel" tabIndex={0}>
        <p className="m-0 text-base leading-7 font-bold">{normalizeSummaryText(active.summaryText)}</p>
        {active.observations.length > 0 && <ul className="mt-3 mb-0 grid gap-2 pl-5 text-sm leading-6 text-muted">{active.observations.map((observation) => <li key={observation}>{normalizeSummaryText(observation)}</li>)}</ul>}
        {sessionId && <div className="mt-5 flex justify-end"><a className={buttonClassName('secondary')} href={apiUrl(API_ENDPOINTS.games.sessionReport(sessionId, audience))}><FileDown aria-hidden className="size-5" />Unduh PDF {audience === 'participant' ? 'peserta' : 'dokter'}</a></div>}
      </div>
    </section>
  );
}

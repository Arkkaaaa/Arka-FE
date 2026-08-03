import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label: string;
  name: string;
  value: string;
  max?: string;
  onChange: (value: string) => void;
}

interface CalendarDay {
  date: Date;
  currentMonth: boolean;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] as const;
const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day ? date : null;
}

function dateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthDays(view: Date): CalendarDay[] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const gridStart = new Date(view.getFullYear(), view.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    return { date, currentMonth: date.getMonth() === view.getMonth() };
  });
}

export function DatePicker({ label, name, value, max, onChange }: DatePickerProps) {
  const selected = parseDate(value);
  const maximum = max ? parseDate(max) : null;
  const currentYear = maximum?.getFullYear() ?? new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState(() => selected ?? maximum ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const dialogId = useId();

  useEffect(() => {
    if (selected) setView(selected);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof PointerEvent && event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setDraft(value);
      setOpen(false);
      if (event instanceof KeyboardEvent) requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open, value]);

  const days = monthDays(view);
  const display = selected
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(selected)
    : 'Pilih tanggal lahir';
  const years = Array.from({ length: 121 }, (_, index) => currentYear - index);

  function toggle() {
    if (!open) {
      setDraft(value);
      setView(selected ?? maximum ?? new Date());
    }
    setOpen((current) => !current);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div className="relative" ref={rootRef}>
      <span className="mb-2 block font-black" id={labelId}>{label}</span>
      <button aria-controls={dialogId} aria-expanded={open} aria-haspopup="dialog" aria-labelledby={labelId} className="flex min-h-14 w-full items-center justify-between rounded-sm border-2 border-divider bg-white px-4 text-left font-bold text-ink shadow-[0_3px_0_#d9d4c5] transition hover:border-ink focus-visible:border-accent focus-visible:outline-4" name={name} onClick={toggle} ref={triggerRef} type="button">
        <span className={selected ? '' : 'text-muted'}>{display}</span><CalendarDays aria-hidden className="size-5 text-muted" />
      </button>
      {open && (
        <div aria-labelledby={labelId} className="absolute top-[calc(100%+0.55rem)] left-0 z-[110] w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-divider bg-white shadow-[0_8px_24px_rgba(23,23,17,0.2)]" id={dialogId} role="dialog">
          <div className="flex items-center justify-between gap-2 border-b border-divider px-3 py-2">
            <button aria-label="Bulan sebelumnya" className="grid size-9 place-items-center rounded-sm border-0 bg-transparent text-muted hover:bg-canvas hover:text-ink" onClick={() => setView((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button"><ChevronLeft aria-hidden className="size-5" /></button>
            <div className="flex min-w-0 items-center justify-center gap-1">
              <label className="sr-only" htmlFor={`${dialogId}-month`}>Bulan</label>
              <select className="min-h-9 rounded-sm border-0 bg-transparent px-1 text-sm font-black focus-visible:outline-2 focus-visible:outline-accent" id={`${dialogId}-month`} onChange={(event) => setView((current) => new Date(current.getFullYear(), Number(event.target.value), 1))} value={view.getMonth()}>{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
              <label className="sr-only" htmlFor={`${dialogId}-year`}>Tahun</label>
              <select className="min-h-9 w-20 rounded-sm border-0 bg-transparent px-1 text-sm font-black focus-visible:outline-2 focus-visible:outline-accent" id={`${dialogId}-year`} onChange={(event) => setView((current) => new Date(Number(event.target.value), current.getMonth(), 1))} value={view.getFullYear()}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            </div>
            <button aria-label="Bulan berikutnya" className="grid size-9 place-items-center rounded-sm border-0 bg-transparent text-muted hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-30" disabled={Boolean(maximum && new Date(view.getFullYear(), view.getMonth() + 1, 1) > new Date(maximum.getFullYear(), maximum.getMonth(), 1))} onClick={() => setView((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button"><ChevronRight aria-hidden className="size-5" /></button>
          </div>
          <div aria-hidden className="grid grid-cols-7 px-3 pt-2 text-center text-xs font-bold text-muted">{WEEKDAYS.map((day) => <span className="py-1.5" key={day}>{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">{days.map(({ date, currentMonth }) => {
            const candidate = dateValue(date);
            const active = candidate === draft;
            const disabled = Boolean(maximum && date > maximum);
            return <button aria-label={new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)} aria-pressed={active} className={`mx-auto grid size-9 place-items-center rounded-sm border-0 text-sm font-bold transition ${active ? 'bg-accent text-white shadow-[0_2px_0_#a55f00]' : currentMonth ? 'bg-transparent text-ink hover:bg-brand-soft' : 'bg-transparent text-muted/45 hover:bg-canvas'} disabled:cursor-not-allowed disabled:opacity-20`} disabled={disabled} key={candidate} onClick={() => { setDraft(candidate); if (!currentMonth) setView(new Date(date.getFullYear(), date.getMonth(), 1)); }} type="button">{date.getDate()}</button>;
          })}</div>
          <div className="flex items-center justify-end gap-2 border-t border-divider bg-canvas/45 px-3 py-2.5">
            <button className="min-h-10 rounded-sm border border-divider bg-white px-3 font-bold text-muted hover:border-ink hover:text-ink" onClick={() => setDraft('')} type="button">Hapus</button>
            <button className="min-h-10 rounded-sm border-0 bg-accent px-4 font-black text-white shadow-[0_3px_0_#a55f00] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50" disabled={draft === value} onClick={apply} type="button">Terapkan</button>
          </div>
        </div>
      )}
    </div>
  );
}

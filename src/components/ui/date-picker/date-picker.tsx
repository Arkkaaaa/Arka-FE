import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label: string;
  name: string;
  value: string;
  max?: string;
  onChange: (value: string) => void;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day ? date : null;
}

function dateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthDays(view: Date): Array<Date | null> {
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: days }, (_, index) => new Date(year, month, index + 1))];
}

export function DatePicker({ label, name, value, max, onChange }: DatePickerProps) {
  const selected = parseDate(value);
  const maximum = max ? parseDate(max) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected ?? maximum ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
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
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const days = monthDays(view);
  const display = selected
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(selected)
    : 'Pilih tanggal lahir';

  return (
    <div className="relative" ref={rootRef}>
      <span className="mb-2 block font-black" id={labelId}>{label}</span>
      <button aria-controls={dialogId} aria-expanded={open} aria-labelledby={labelId} className="flex min-h-14 w-full items-center justify-between rounded-sm border-2 border-divider bg-white px-4 text-left font-bold text-ink shadow-[0_3px_0_#d9d4c5] transition hover:border-ink focus-visible:border-accent focus-visible:outline-4" name={name} onClick={() => setOpen((current) => !current)} type="button">
        <span className={selected ? '' : 'text-muted'}>{display}</span><CalendarDays aria-hidden className="size-5 text-muted" />
      </button>
      {open && (
        <div aria-labelledby={labelId} className="absolute top-[calc(100%+0.65rem)] left-0 z-[110] w-full min-w-72 rounded-md border-2 border-divider bg-white p-4 shadow-[0_6px_0_#d9d4c5]" id={dialogId} role="dialog">
          <div className="flex items-center justify-between gap-3">
            <button aria-label="Bulan sebelumnya" className="grid size-11 place-items-center rounded-full border-0 bg-canvas hover:bg-divider" onClick={() => setView((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button"><ChevronLeft aria-hidden className="size-5" /></button>
            <strong>{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(view)}</strong>
            <button aria-label="Bulan berikutnya" className="grid size-11 place-items-center rounded-full border-0 bg-canvas hover:bg-divider" disabled={Boolean(maximum && new Date(view.getFullYear(), view.getMonth() + 1, 1) > maximum)} onClick={() => setView((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button"><ChevronRight aria-hidden className="size-5" /></button>
          </div>
          <div aria-hidden className="mt-4 grid grid-cols-7 text-center text-xs font-black text-muted">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => <span className="py-2" key={day}>{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">{days.map((date, index) => date ? <button aria-label={new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)} aria-pressed={dateValue(date) === value} className={`grid aspect-square min-h-9 place-items-center rounded-full border-0 text-sm font-black transition ${dateValue(date) === value ? 'bg-ink text-white' : 'bg-transparent hover:bg-brand-soft'} disabled:cursor-not-allowed disabled:opacity-25`} disabled={Boolean(maximum && date > maximum)} key={dateValue(date)} onClick={() => { onChange(dateValue(date)); setOpen(false); }} type="button">{date.getDate()}</button> : <span aria-hidden key={`empty-${index}`} />)}</div>
          {selected && <button className="mt-3 min-h-10 w-full rounded-sm border-0 bg-canvas font-black text-muted hover:bg-divider" onClick={() => { onChange(''); setOpen(false); }} type="button">Kosongkan tanggal</button>}
        </div>
      )}
    </div>
  );
}

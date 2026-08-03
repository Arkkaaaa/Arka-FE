import { useDeferredValue, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react';
import type { GameMode, ParticipantDto } from '../../schemas/index.ts';
import { Button, Field } from '../../components/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { tutorials } from '../../constants/tutorials.ts';
import { useCreateParticipantMutation } from '../../hooks/participants/use-participant-mutations.ts';
import { useParticipantSearchQuery } from '../../hooks/participants/use-participant-queries.ts';

export const SEQUENCE_TILES = [
  { code: 'GREEN', label: 'Hijau', icon: 'Wayang', color: '#399267', frequency: 494 },
  { code: 'BLUE', label: 'Biru', icon: 'Candi', color: '#3978bd', frequency: 587 },
  { code: 'YELLOW', label: 'Kuning', icon: 'Angklung', color: '#e7b82c', frequency: 659 },
  { code: 'RED', label: 'Merah', icon: 'Batik', color: '#dc4c3f', frequency: 392 },
] as const;

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedAudioContext ??= new AudioContextClass();
  if (sharedAudioContext.state === 'suspended') void sharedAudioContext.resume();
  return sharedAudioContext;
}

export function resumeGameAudio(): void {
  void getAudioContext()?.resume();
}

export function playSequenceTone(frequency: number, durationMs = 220): void {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000 + 0.02);
}

export function playCountdownTone(value: number): void {
  playSequenceTone(value === 1 ? 784 : 587, 140);
}

export function playStartTone(): void {
  playSequenceTone(1_046, 280);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function TutorialVisual({ mode, step }: { mode: GameMode; step: number }) {
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  if (mode === 'SEQUENCE_MEMORY') {
    return (
      <div className="grid w-full max-w-xl grid-cols-2 gap-5 rounded-lg border-4 border-ink bg-[#171717] p-6 sm:gap-7 sm:p-8" role="img" aria-label="Panel tombol hijau, biru, kuning, dan merah">
        {SEQUENCE_TILES.map((tile) => (
          <div className="grid place-items-center text-center" key={tile.code}>
            <span aria-hidden className="block aspect-square w-full max-w-28 rounded-full border-8 border-[#080808]" style={{ backgroundColor: tile.color }} />
            <strong className="mt-3 block text-lg text-white">{tile.label}</strong>
            <span className="mt-1 block text-sm font-bold text-white/70">{tile.icon}</span>
          </div>
        ))}
      </div>
    );
  }
  if (mode === 'GO_NO_GO') {
    const target = step !== 2;
    return (
      <div className="grid w-full max-w-xl gap-5 rounded-lg border-4 border-ink bg-[#171717] p-7 text-center text-white sm:p-10" role="img" aria-label={target ? 'Wayang, genggam alat' : 'Gambar selain Wayang, tunggu'}>
        <span className="text-sm font-black tracking-[0.12em] text-white/60 uppercase">Gambar latihan</span>
        <strong className="text-5xl font-black sm:text-6xl">{target ? 'Wayang' : step === 2 ? 'Batik' : 'Wayang'}</strong>
        <span className={`rounded-md px-5 py-4 text-xl font-black ${target ? 'bg-[#399267]' : 'bg-white/15'}`}>{target ? 'Genggam' : 'Tunggu'}</span>
      </div>
    );
  }
  return (
    <div className="grid w-full max-w-xl place-items-center gap-6 rounded-lg border-4 border-ink bg-[#fff7e7] p-8 text-center sm:p-12" role="img" aria-label="Latihan menggenggam untuk memeras jeruk">
      <img alt="" aria-hidden className="size-28 sm:size-36" src={selected.emoji} />
      <div className="w-full max-w-sm">
        <div className="h-6 overflow-hidden rounded-full bg-white ring-2 ring-ink"><div className="h-full bg-[#d67b1f]" style={{ width: `${Math.min(20 + step * 20, 100)}%` }} /></div>
        <p className="mt-4 mb-0 text-xl font-black">Genggam dengan nyaman</p>
      </div>
    </div>
  );
}

interface GameTutorialProps {
  mode: GameMode;
  participantName: string;
  onBack: () => void;
  onReady: () => void;
}

export function GameTutorial({ mode, participantName, onBack, onReady }: GameTutorialProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const definition = tutorials[mode];
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  const current = definition.steps[step]!;

  function changeStep(next: number) {
    if (next < 0 || next >= definition.steps.length) return;
    setStep(next);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[88rem] flex-col py-2" aria-labelledby="tutorial-title">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="landing-eyebrow">Tutorial untuk {participantName}</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="tutorial-title">{selected.title}</h1><p className="mt-3 mb-0 text-lg font-bold text-muted">{definition.instruction}</p></div>
        <div className="flex items-center gap-4"><p aria-label={`Langkah ${step + 1} dari ${definition.steps.length}`} className="m-0 text-2xl font-black text-accent">{step + 1}/{definition.steps.length}</p><Button onClick={onReady} variant="quiet">Lewati tutorial</Button></div>
      </header>

      <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, scale: 1, y: 0 }} className="grid w-full place-items-center" exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : -10 }} initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 14 }} key={`${mode}-${step}`} transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}>
            <TutorialVisual mode={mode} step={step} />
          </m.div>
        </AnimatePresence>
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, x: 0 }} className="max-w-xl" exit={{ opacity: 0, x: reduceMotion ? 0 : -18 }} initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }} key={current.title} transition={{ duration: reduceMotion ? 0 : 0.26 }}>
            <p className="m-0 text-sm font-black tracking-[0.1em] text-accent uppercase">Langkah {step + 1}</p>
            <h2 className="mt-3 mb-0 text-4xl font-black tracking-[-0.04em]">{current.title}</h2>
            <p className="mt-5 mb-0 text-xl leading-9">{current.instruction}</p>
            <p className="mt-4 mb-0 text-base leading-7 text-muted">{current.caption}</p>
            <div className="mt-7 rounded-md border-2 border-divider bg-white p-4"><p className="m-0 text-sm font-black tracking-[0.08em] text-muted uppercase">Panduan visual</p><p className="mt-2 mb-0 font-bold">{current.visual}</p></div>
            <p className="mt-4 mb-0 inline-flex rounded-full bg-brand-soft px-4 py-2 text-sm font-black text-accent">Latihan belum dihitung</p>
          </m.div>
        </AnimatePresence>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <button className="w-fit border-0 bg-transparent p-0 text-sm font-bold text-muted underline-offset-4 hover:underline" onClick={onBack} type="button">Kembali ke nama peserta</button>
        <div className="flex flex-wrap gap-2">
          <Button disabled={step === 0} onClick={() => changeStep(step - 1)} variant="quiet"><ChevronLeft aria-hidden className="size-5" />Sebelumnya</Button>
          {step < definition.steps.length - 1 ? <Button onClick={() => changeStep(step + 1)} variant="secondary">Berikutnya<ChevronRight aria-hidden className="size-5" /></Button> : <Button onClick={onReady}>Siap bermain<ChevronRight aria-hidden className="size-5" /></Button>}
        </div>
      </footer>
    </section>
  );
}

export interface GameParticipantIdentity {
  displayName: string;
  participantReference: string;
}

interface GameParticipantEntryProps {
  csrfToken: string;
  mode: GameMode;
  onContinue: (participant: GameParticipantIdentity) => void;
}

export function GameParticipantEntry({ csrfToken, mode, onContinue }: GameParticipantEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [name, setName] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDto | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const deferredName = useDeferredValue(name);
  const searchInput = deferredName.trim();
  const search = useParticipantSearchQuery(searchInput);
  const createParticipant = useCreateParticipantMutation(csrfToken);
  const suggestions = search.data ?? [];
  const searchSettled = searchInput === name.trim();
  const hasName = name.trim().length > 0;
  const isSearching = hasName && !selectedParticipant && (!searchSettled || search.isFetching);
  const showSuggestions = dropdownOpen && !selectedParticipant && searchSettled && !search.isFetching && suggestions.length > 0;
  const isNewParticipant = hasName && !selectedParticipant && searchSettled && !search.isFetching && suggestions.length === 0;
  const selectedMode = GAME_MODES.find((item) => item.mode === mode)!;

  function choose(participant: ParticipantDto) {
    setName(participant.displayName);
    setSelectedParticipant(participant);
    setDropdownOpen(false);
    setError('');
    inputRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setError('Masukkan nama peserta.');
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (!selectedParticipant && (!searchSettled || search.isFetching)) {
      setError('Tunggu pencarian peserta selesai.');
      return;
    }
    const existing = selectedParticipant?.displayName.toLocaleLowerCase('id-ID') === normalized.toLocaleLowerCase('id-ID')
      ? selectedParticipant
      : suggestions.find((participant) => participant.displayName.toLocaleLowerCase('id-ID') === normalized.toLocaleLowerCase('id-ID'));
    if (existing) {
      onContinue({ displayName: existing.displayName, participantReference: existing.participantReference });
      return;
    }
    try {
      const participant = await createParticipant.mutateAsync({ displayName: normalized });
      onContinue({ displayName: participant.displayName, participantReference: participant.participantReference });
    } catch (creationError) {
      setError(messageOf(creationError));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <section className="mx-auto max-w-2xl" aria-labelledby="participant-title">
      <p className="landing-eyebrow">{selectedMode.title}</p>
      <h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="participant-title">Siapa yang akan bermain?</h1>
      <p className="mt-4 mb-0 text-lg leading-8 text-muted">Cari peserta yang sudah ada. Jika namanya belum terdaftar, profil baru akan dibuat otomatis.</p>
      <form className="mt-8 grid gap-5 rounded-md border-2 border-divider p-6 sm:p-8" noValidate onSubmit={submit}>
        <div className="relative">
          <Field aria-autocomplete="list" aria-controls={listId} aria-expanded={showSuggestions} autoComplete="off" autoFocus error={error} hint={error ? undefined : selectedParticipant ? undefined : 'Ketik nama peserta.'} inputRef={inputRef} label="Cari atau tambah peserta" maxLength={100} name="participantName" onChange={(event) => { setName(event.target.value); setSelectedParticipant(null); setDropdownOpen(true); if (error) setError(''); }} placeholder="Contoh: Andrian" required role="combobox" trailing={<Search aria-hidden className="mr-3 size-5 text-muted" />} value={name} />
          {isSearching && <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-muted" role="status"><Search aria-hidden className="size-4 animate-pulse" />Mencari peserta…</p>}
          {showSuggestions && <div className="absolute inset-x-0 top-[5.6rem] z-20 max-h-64 overflow-y-auto overscroll-contain rounded-sm border-2 border-ink bg-white p-1 shadow-[0_5px_0_#d9d4c5]"><p className="sticky top-0 z-10 m-0 bg-white px-3 py-2 text-xs font-black tracking-[0.08em] text-muted uppercase">Peserta ditemukan</p><ul className="m-0 list-none p-0" id={listId} role="listbox">{suggestions.map((participant) => <li className="border-b-2 border-divider last:border-b-0" key={participant.participantId} role="option"><button className="flex min-h-12 w-full items-center px-3 text-left font-bold hover:bg-divider focus-visible:bg-divider" onClick={() => choose(participant)} type="button">{participant.displayName}</button></li>)}</ul></div>}
          {isNewParticipant && <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-muted"><UserPlus aria-hidden className="size-4" />Peserta baru. Profil akan dibuat saat melanjutkan.</p>}
          {selectedParticipant && <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-success"><Check aria-hidden className="size-4" />Peserta dipilih: {selectedParticipant.displayName}</p>}
        </div>
        <Button disabled={createParticipant.isPending || isSearching} type="submit">{createParticipant.isPending ? 'Membuat peserta…' : isNewParticipant ? 'Buat peserta dan lanjut' : 'Lanjut ke tutorial'}</Button>
      </form>
    </section>
  );
}

import { useDeferredValue, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, MousePointerClick, Pause, Play, RotateCcw, Search, UserPlus } from 'lucide-react';
import type { ParticipantDto } from '../../schemas/index.ts';
import { Button, Field } from '../../components/index.ts';
import { messageOf } from '../../config/api-client.ts';
import { tutorials } from '../../constants/tutorials.ts';
import { useCreateParticipantMutation } from '../../hooks/participants/use-participant-mutations.ts';
import { useParticipantSearchQuery } from '../../hooks/participants/use-participant-queries.ts';

const definition = tutorials.SEQUENCE_MEMORY;
const AUDIO_SOURCES = [
  '/tutorial/step/step1.m4a',
  '/tutorial/step/step2.m4a',
  '/tutorial/step/step3.m4a',
  '/tutorial/step/step4.m4a',
  '/tutorial/step/step5.m4a',
] as const;

export const SEQUENCE_TILES = [
  { code: 'GREEN', label: 'Hijau', icon: 'Wayang', color: '#399267', frequency: 494 },
  { code: 'BLUE', label: 'Biru', icon: 'Candi', color: '#3978bd', frequency: 587 },
  { code: 'YELLOW', label: 'Kuning', icon: 'Angklung', color: '#e7b82c', frequency: 659 },
  { code: 'RED', label: 'Merah', icon: 'Batik', color: '#dc4c3f', frequency: 392 },
] as const;

type TileCode = (typeof SEQUENCE_TILES)[number]['code'];

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedAudioContext ??= new AudioContextClass();
  if (sharedAudioContext.state === 'suspended') void sharedAudioContext.resume();
  return sharedAudioContext;
}

export function resumeSequenceAudio(): void {
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

function activeCodeAt(step: number, progress: number, currentTime: number): TileCode | null {
  if (step === 0) {
    const cues: readonly [TileCode, number, number][] = [
      ['BLUE', 5.4, 6.8],
      ['RED', 8.1, 9.5],
      ['GREEN', 10.8, 12.2],
      ['YELLOW', 13.5, 14.9],
    ];
    return cues.find(([, start, end]) => currentTime >= start && currentTime <= end)?.[0] ?? null;
  }
  if (step === 1) {
    if (progress >= 0.42 && progress <= 0.54) return 'RED';
    if (progress >= 0.6 && progress <= 0.72) return 'BLUE';
  }
  if (step === 2) {
    if (progress >= 0.38 && progress <= 0.5) return 'RED';
    if (progress >= 0.58 && progress <= 0.7) return 'BLUE';
  }
  if (step === 3) {
    if (progress >= 0.28 && progress <= 0.4) return 'GREEN';
    if (progress >= 0.6 && progress <= 0.72) return 'RED';
    if (progress >= 0.8 && progress <= 0.92) return 'BLUE';
  }
  return null;
}

function fingerTarget(step: number, progress: number): { left: string; top: string; pressing: boolean } | null {
  if (step === 2 && progress >= 0.28 && progress <= 0.78) {
    return progress < 0.54
      ? { left: '78%', top: '68%', pressing: progress >= 0.38 && progress <= 0.5 }
      : { left: '78%', top: '30%', pressing: progress >= 0.58 && progress <= 0.7 };
  }
  if (step === 3 && progress >= 0.18 && progress <= 0.94) {
    if (progress < 0.5) return { left: '22%', top: '30%', pressing: progress >= 0.28 && progress <= 0.4 };
    if (progress < 0.76) return { left: '78%', top: '68%', pressing: progress >= 0.6 && progress <= 0.72 };
    return { left: '78%', top: '30%', pressing: progress >= 0.8 && progress <= 0.92 };
  }
  return null;
}

function SequenceTiles({ step, progress, currentTime }: { step: number; progress: number; currentTime: number }) {
  const reduceMotion = useReducedMotion();
  const activeCode = activeCodeAt(step, progress, currentTime);
  const finger = fingerTarget(step, progress);
  const previousCodeRef = useRef<TileCode | null>(null);

  useEffect(() => {
    if (activeCode === previousCodeRef.current) return;
    previousCodeRef.current = activeCode;
    if (!activeCode) return;
    const tile = SEQUENCE_TILES.find((item) => item.code === activeCode);
    if (tile) playSequenceTone(step === 3 && activeCode === 'GREEN' ? 180 : tile.frequency);
  }, [activeCode, step]);

  return (
    <div className="relative grid w-full max-w-xl grid-cols-2 gap-5 rounded-lg border-4 border-ink bg-[#171717] p-6 sm:gap-7 sm:p-8" role="img" aria-label="Panel tombol: Hijau kiri atas, biru kanan atas, kuning kiri bawah, dan merah kanan bawah">
      {SEQUENCE_TILES.map((tile) => {
        const active = step === 4 ? progress >= 0.4 : activeCode === tile.code;
        return (
          <div className="grid place-items-center text-center" key={tile.code}>
            <span className="relative block aspect-square w-full max-w-32" aria-hidden>
              {active && <m.span animate={reduceMotion ? { opacity: 0.45 } : { opacity: [0.2, 0.58, 0], scale: [0.9, 1.45, 1.65] }} className="absolute inset-2 rounded-full" style={{ backgroundColor: tile.color }} transition={{ duration: 0.75 }} />}
              <m.span
                animate={active
                  ? { filter: `brightness(1.4) drop-shadow(0 0 28px ${tile.color})`, opacity: 1, scale: reduceMotion ? 1 : 1.06 }
                  : { filter: 'brightness(0.72)', opacity: step === 0 ? 0.58 : 0.82, scale: 1 }}
                className="relative block size-full rounded-full border-8 border-[#080808]"
                style={{ backgroundColor: tile.color }}
                transition={{ duration: 0.2 }}
              />
            </span>
            <strong className="mt-3 block text-lg text-white">{tile.label}</strong>
            <span className="mt-1 block text-sm font-bold text-white/70">{tile.icon}</span>
          </div>
        );
      })}

      {!reduceMotion && finger && (
        <m.div
          animate={{ left: finger.left, top: finger.top, opacity: 1, rotate: -18, scale: finger.pressing ? 0.88 : 1, y: finger.pressing ? -7 : 0 }}
          aria-hidden
          className="pointer-events-none absolute z-20 text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <MousePointerClick className="size-12" strokeWidth={2.2} />
        </m.div>
      )}
      {!reduceMotion && step === 3 && progress >= 0.34 && progress <= 0.5 && <m.div animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 1.35] }} className="pointer-events-none absolute top-[24%] left-[25%] z-30 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-danger text-3xl font-black text-white" transition={{ duration: 0.8 }}>×</m.div>}
      {!reduceMotion && step === 4 && progress >= 0.55 && <m.div animate={{ opacity: [0, 1], scale: [0.8, 1] }} className="pointer-events-none absolute inset-0 z-30 grid place-items-center text-7xl font-black text-white" transition={{ duration: 0.5 }}>✓</m.div>}
    </div>
  );
}

interface SequenceTutorialProps {
  participantName: string;
  onBack: () => void;
  onReady: () => void;
}

export function SequenceTutorial({ participantName, onBack, onReady }: SequenceTutorialProps) {
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const stateRef = useRef({ step, playing });
  stateRef.current = { step, playing };
  const current = definition.steps[step]!;
  const displayProgress = progress >= 1 ? 1 : 1 - Math.pow(1 - progress, 1.35);

  function updateProgress() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) setProgress(Math.min(audio.currentTime / audio.duration, 1));
    if (!audio.paused && !audio.ended) frameRef.current = requestAnimationFrame(updateProgress);
  }

  function playAudio(restart = false) {
    const audio = audioRef.current;
    if (!audio) return;
    if (restart) {
      audio.pause();
      audio.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
    }
    setAudioError('');
    void audio.play().catch(() => {
      setPlaying(false);
      setAudioError('Tekan Putar untuk memulai rekaman tutorial.');
    });
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = AUDIO_SOURCES[step]!;
    audio.load();
    setProgress(0);
    setAudioError('');
    const start = () => playAudio(true);
    audio.addEventListener('canplay', start, { once: true });
    return () => {
      audio.removeEventListener('canplay', start);
      audio.pause();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [step]);

  function changeStep(next: number) {
    if (next < 0 || next >= definition.steps.length) return;
    setStep(next);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const state = stateRef.current;
      if (event.code === 'Space') {
        event.preventDefault();
        const audio = audioRef.current;
        if (!audio) return;
        if (state.playing) audio.pause();
        else playAudio(false);
        return;
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        playAudio(true);
        return;
      }
      if (event.key === 'ArrowLeft' && state.step > 0) {
        event.preventDefault();
        changeStep(state.step - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (state.step < definition.steps.length - 1) changeStep(state.step + 1);
        else onReady();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReady]);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[88rem] flex-col py-2" aria-labelledby="tutorial-title">
      <audio
        onEnded={() => { setProgress(1); setPlaying(false); }}
        onError={() => { setAudioError('Rekaman tutorial tidak dapat diputar.'); setPlaying(false); }}
        onPause={() => setPlaying(false)}
        onPlay={() => { setPlaying(true); if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = requestAnimationFrame(updateProgress); }}
        preload="auto"
        ref={audioRef}
      />
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="landing-eyebrow">Tutorial untuk {participantName}</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="tutorial-title">Ding Dong Dong</h1><p className="mt-3 mb-0 text-lg text-muted">Ikuti tutorial dengan tombol berikutnya atau langsung lewati.</p></div>
        <div className="flex items-center gap-4">
          <p aria-label={`Langkah ${step + 1} dari ${definition.steps.length}`} className="m-0 text-2xl font-black text-accent">{step + 1}/{definition.steps.length}</p>
          <Button onClick={onReady} variant="quiet">Lewati tutorial</Button>
        </div>
      </header>

      <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, scale: 1, y: 0 }} className="grid w-full place-items-center" exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : -10 }} initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 14 }} key={step} transition={{ duration: reduceMotion ? 0 : 0.38, ease: 'easeOut' }}>
            <SequenceTiles currentTime={currentTime} progress={progress} step={step} />
          </m.div>
        </AnimatePresence>
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, x: 0 }} className="max-w-xl" exit={{ opacity: 0, x: reduceMotion ? 0 : -18 }} initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }} key={current.title} transition={{ duration: reduceMotion ? 0 : 0.32 }}>
            <p className="m-0 text-sm font-black tracking-[0.1em] text-accent uppercase">Langkah {step + 1}</p><h2 className="mt-3 mb-0 text-4xl font-black tracking-[-0.04em]">{current.title}</h2><p className="mt-5 mb-0 text-xl leading-9">{current.instruction}</p><p className="mt-4 mb-0 text-base leading-7 text-muted">{current.caption}</p>
            <div aria-hidden className="mt-7 h-2 overflow-hidden rounded-full bg-divider"><div className="h-full bg-accent" style={{ width: `${displayProgress * 100}%` }} /></div>
            {audioError && <p className="mt-3 mb-0 text-sm font-bold text-muted" role="status">{audioError}</p>}
          </m.div>
        </AnimatePresence>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { const audio = audioRef.current; if (!audio) return; if (playing) audio.pause(); else playAudio(false); }} variant="secondary">{playing ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}{playing ? 'Jeda' : 'Putar'}</Button>
          <Button onClick={() => playAudio(true)} variant="quiet"><RotateCcw aria-hidden className="size-5" />Ulangi</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={step === 0} onClick={() => changeStep(step - 1)} variant="quiet"><ChevronLeft aria-hidden className="size-5" />Sebelumnya</Button>
          {step < definition.steps.length - 1 ? <Button onClick={() => changeStep(step + 1)} variant="secondary">Berikutnya<ChevronRight aria-hidden className="size-5" /></Button> : <Button onClick={onReady}>Mulai bermain<ChevronRight aria-hidden className="size-5" /></Button>}
        </div>
      </footer>
      <button className="mt-4 w-fit border-0 bg-transparent p-0 text-sm font-bold text-muted underline-offset-4 hover:underline" onClick={onBack} type="button">Kembali ke nama peserta</button>
    </section>
  );
}

export interface SequenceParticipantIdentity {
  displayName: string;
  participantReference: string;
}

interface SequenceParticipantEntryProps {
  csrfToken: string;
  onContinue: (participant: SequenceParticipantIdentity) => void;
}

export function SequenceParticipantEntry({ csrfToken, onContinue }: SequenceParticipantEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<ParticipantDto | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const deferredName = useDeferredValue(name);
  const searchInput = deferredName.trim();
  const search = useParticipantSearchQuery(searchInput);
  const createParticipant = useCreateParticipantMutation(csrfToken);
  const suggestions = search.data ?? [];
  const searchSettled = searchInput === name.trim();
  const hasName = name.trim().length > 0;
  const isSearching = hasName && !selected && (!searchSettled || search.isFetching);
  const showSuggestions = dropdownOpen && !selected && searchSettled && !search.isFetching && suggestions.length > 0;
  const isNewParticipant = hasName && !selected && searchSettled && !search.isFetching && suggestions.length === 0;

  function choose(participant: ParticipantDto) {
    setName(participant.displayName);
    setSelected(participant);
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
    if (!selected && (!searchSettled || search.isFetching)) {
      setError('Tunggu pencarian peserta selesai.');
      return;
    }
    const existing = selected?.displayName.toLocaleLowerCase('id-ID') === normalized.toLocaleLowerCase('id-ID')
      ? selected
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
      <p className="landing-eyebrow">Ding Dong Dong</p>
      <h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="participant-title">Siapa yang akan bermain?</h1>
      <p className="mt-4 mb-0 text-lg leading-8 text-muted">Cari peserta yang sudah ada. Jika namanya belum terdaftar, profil baru akan dibuat otomatis.</p>
      <form className="mt-8 grid gap-5 rounded-md border-2 border-divider p-6 sm:p-8" noValidate onSubmit={submit}>
        <div className="relative">
          <Field
            aria-controls={listId}
            aria-expanded={showSuggestions}
            autoComplete="off"
            autoFocus
            error={error}
            hint={error ? undefined : selected ? undefined : 'Ketik nama peserta.'}
            inputRef={inputRef}
            label="Cari atau tambah peserta"
            maxLength={100}
            name="participantName"
            onChange={(event) => {
              setName(event.target.value);
              setSelected(null);
              setDropdownOpen(true);
              if (error) setError('');
            }}
            placeholder="Contoh: Andrian"
            required
            trailing={<Search aria-hidden className="mr-3 size-5 text-muted" />}
            value={name}
          />
          {isSearching && (
            <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-muted" role="status"><Search aria-hidden className="size-4 animate-pulse" />Mencari peserta…</p>
          )}
          {showSuggestions && (
            <div className="absolute inset-x-0 top-[5.6rem] z-20 max-h-64 overflow-y-auto rounded-sm border-2 border-ink bg-white p-1 shadow-[0_5px_0_#d9d4c5]" id={listId}>
              <p className="px-3 py-2 text-xs font-black tracking-[0.08em] text-muted uppercase">Peserta ditemukan</p>
              <ul className="m-0 list-none p-0">
                {suggestions.map((participant) => (
                  <li className="border-b-2 border-divider last:border-b-0" key={participant.participantId}>
                    <button className="flex min-h-12 w-full items-center px-3 text-left font-bold hover:bg-divider focus-visible:bg-divider" onClick={() => choose(participant)} type="button">
                      {participant.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isNewParticipant && (
            <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-muted"><UserPlus aria-hidden className="size-4" />Peserta baru. Profil akan dibuat saat melanjutkan.</p>
          )}
          {selected && (
            <p className="mt-2 mb-0 flex items-center gap-2 text-sm font-bold text-success"><Check aria-hidden className="size-4" />Peserta dipilih: {selected.displayName}</p>
          )}
        </div>
        <Button disabled={createParticipant.isPending || isSearching} type="submit">{createParticipant.isPending ? 'Membuat peserta…' : isNewParticipant ? 'Buat peserta dan lanjut' : 'Lanjut ke tutorial'}</Button>
      </form>
    </section>
  );
}

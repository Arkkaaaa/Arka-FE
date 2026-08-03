import { useDeferredValue, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Search, UserPlus } from 'lucide-react';
import type { GameMode, ParticipantDto } from '../../schemas/index.ts';
import { Button, Field } from '../../components/index.ts';
import { SqueezableFruit, type FruitVariant } from '../../components/squeezable-fruit.tsx';
import { messageOf } from '../../config/api-client.ts';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { tutorials } from '../../constants/tutorials.ts';
import { GO_NO_GO_STIMULI, goNoGoStimulusAsset, preloadGoNoGoImages, type GoNoGoStimulus } from '../../constants/go-no-go-stimuli.ts';
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

function activeCue(progress: number, cues: readonly (readonly [string, number, number])[]): string | null {
  return cues.find(([, start, end]) => progress >= start && progress < end)?.[0] ?? null;
}

function sequenceTutorialTile(step: number, progress: number): string | null {
  if (step === 0) {
    return activeCue(progress, [
      ['RED', 0.4, 0.51],
      ['YELLOW', 0.53, 0.64],
      ['BLUE', 0.66, 0.77],
      ['GREEN', 0.79, 0.92],
    ]);
  }
  if (step === 1) {
    return activeCue(progress, [
      ['RED', 0.36, 0.49],
      ['BLUE', 0.56, 0.69],
      ['GREEN', 0.76, 0.89],
    ]);
  }
  if (step === 2) {
    return activeCue(progress, [
      ['RED', 0.48, 0.59],
      ['YELLOW', 0.64, 0.75],
      ['BLUE', 0.8, 0.91],
    ]);
  }
  if (step === 3) {
    return activeCue(progress, [
      ['RED', 0.5, 0.63],
      ['BLUE', 0.72, 0.85],
    ]);
  }
  if (step === 4) {
    return activeCue(progress, [
      ['RED', 0.56, 0.67],
      ['BLUE', 0.72, 0.83],
      ['GREEN', 0.86, 0.97],
    ]);
  }
  return null;
}

function tutorialStimulus(step: number, progress: number): GoNoGoStimulus {
  if (step === 0) return GO_NO_GO_STIMULI[Math.min(Math.floor(progress * GO_NO_GO_STIMULI.length), GO_NO_GO_STIMULI.length - 1)]!;
  if (step === 2) return progress < 0.55 ? 'BATIK' : 'CANDI';
  if (step === 4) {
    const practice: readonly GoNoGoStimulus[] = ['WAYANG', 'BATIK', 'WAYANG', 'ANGKLUNG'];
    return practice[Math.min(Math.floor(progress * practice.length), practice.length - 1)]!;
  }
  return 'WAYANG';
}

function TutorialVisual({ fruit, mode, step, progress }: { fruit: FruitVariant; mode: GameMode; step: number; progress: number }) {
  if (mode === 'SEQUENCE_MEMORY') {
    const activeCode = sequenceTutorialTile(step, progress);
    return (
      <div className="grid w-full max-w-xl grid-cols-2 gap-5 rounded-lg border-4 border-ink bg-[#171717] p-6 sm:gap-7 sm:p-8" role="img" aria-label="Panel tombol hijau, biru, kuning, dan merah">
        {SEQUENCE_TILES.map((tile) => {
          const active = tile.code === activeCode;
          return (
            <div className="grid place-items-center text-center" key={tile.code}>
              <span className="relative block aspect-square w-full max-w-28">
                {active && <span aria-hidden className="absolute inset-1 animate-ping rounded-full opacity-40" style={{ backgroundColor: tile.color }} />}
                <span aria-hidden className={`relative block size-full rounded-full border-8 border-[#080808] transition ${active ? 'scale-105 brightness-125' : 'brightness-75'}`} style={{ backgroundColor: tile.color, filter: active ? `drop-shadow(0 0 24px ${tile.color})` : 'none' }} />
              </span>
              <strong className="mt-3 block text-lg text-white">{tile.label}</strong>
              <span className="mt-1 block text-sm font-bold text-white/70">{tile.icon}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (mode === 'GO_NO_GO') {
    const stimulus = tutorialStimulus(step, progress);
    const asset = goNoGoStimulusAsset(stimulus, `tutorial:${step}`);
    const target = stimulus === 'WAYANG';
    const released = step === 3 && progress > 0.72;
    const action = target && !released ? 'Genggam' : released ? 'Lepaskan' : 'Tunggu';
    return (
      <div className="grid w-full max-w-xl place-items-center gap-4 p-4 text-center sm:p-6" role="img" aria-label={`${asset.alt}. ${action}`}>
        <img alt={asset.alt} className="aspect-[4/5] w-full max-w-72 object-contain" src={asset.src} />
        <p className="m-0 text-2xl font-black">{target && !released ? 'Genggam saat melihat Wayang' : released ? 'Lepaskan alat kembali' : 'Perhatikan gambar berikutnya'}</p>
      </div>
    );
  }
  const grip = step === 0
    ? 10
    : step === 1
      ? 15 + progress * 55
      : step === 2
        ? 25 + progress * 75
        : step === 3
          ? 75
          : step === 4
            ? 70 * (1 - progress)
            : 30 + progress * 35;
  return (
    <div className="grid w-full max-w-xl place-items-center gap-5 p-4 text-center sm:p-6">
      <SqueezableFruit fruit={fruit} squeezePercent={grip} />
      <div className="w-full max-w-sm">
        <div className="h-3 overflow-hidden rounded-full bg-divider"><div className="h-full origin-left bg-[#d67b1f] transition-transform duration-100" style={{ transform: `scaleX(${grip / 100})` }} /></div>
        <p className="mt-4 mb-0 text-xl font-black">{step === 4 ? 'Lepaskan perlahan' : step === 3 ? 'Tahan genggamannya' : 'Genggam dengan nyaman'}</p>
      </div>
    </div>
  );
}

interface GameTutorialProps {
  fruit: FruitVariant;
  mode: GameMode;
  participantName: string;
  onBack: () => void;
  onReady: () => void;
}

export function GameTutorial({ fruit, mode, participantName, onBack, onReady }: GameTutorialProps) {
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<number | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);
  const tutorialStateRef = useRef({ step: 0, isPlaying: false, imagesReady: mode !== 'GO_NO_GO', imageError: false });
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [imagesReady, setImagesReady] = useState(mode !== 'GO_NO_GO');
  const [imageError, setImageError] = useState(false);
  const definition = tutorials[mode];
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  const current = definition.steps[step]!;
  tutorialStateRef.current = { step, isPlaying, imagesReady, imageError };

  function stopFrame() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  function stopAutoAdvance() {
    if (autoAdvanceRef.current !== null) window.clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = null;
  }

  function updateProgress() {
    const audio = audioRef.current;
    if (!audio) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    setProgress(duration > 0 ? Math.min(audio.currentTime / duration, 1) : 0);
    if (!audio.paused && !audio.ended) frameRef.current = requestAnimationFrame(updateProgress);
  }

  async function playNarration() {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(false);
    try {
      await audio.play();
      setNeedsGesture(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setNeedsGesture(true);
      } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setAudioError(true);
      }
    }
  }

  function pauseNarration() {
    audioRef.current?.pause();
  }

  function replayNarration() {
    const audio = audioRef.current;
    if (!audio) return;
    stopAutoAdvance();
    audio.currentTime = 0;
    setProgress(0);
    void playNarration();
  }

  function stopNarration() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    stopFrame();
  }

  useEffect(() => {
    if (mode !== 'GO_NO_GO') return;
    let active = true;
    void preloadGoNoGoImages()
      .then(() => {
        if (active) setImagesReady(true);
      })
      .catch(() => {
        if (active) setImageError(true);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopFrame();
    audio.pause();
    audio.src = current.audioSrc;
    audio.load();
    setProgress(0);
    setIsPlaying(false);
    setNeedsGesture(false);
    setAudioError(false);

    const handlePlay = () => {
      setIsPlaying(true);
      stopFrame();
      frameRef.current = requestAnimationFrame(updateProgress);
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopFrame();
      updateProgress();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(1);
      stopFrame();
      stopAutoAdvance();
      if (step < definition.steps.length - 1) {
        autoAdvanceRef.current = window.setTimeout(() => {
          autoAdvanceRef.current = null;
          setStep((currentStep) => Math.min(currentStep + 1, definition.steps.length - 1));
        }, 700);
      }
    };
    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
      stopFrame();
    };
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    void playNarration();

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      stopFrame();
      stopAutoAdvance();
    };
  }, [current.audioSrc]);

  function changeStep(next: number) {
    if (next < 0 || next >= definition.steps.length) return;
    stopAutoAdvance();
    stopNarration();
    setStep(next);
  }

  function leaveTutorial(action: () => void) {
    stopAutoAdvance();
    stopNarration();
    action();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select, button, a, [role="button"]'))) return;
      const state = tutorialStateRef.current;
      if (event.code === 'Space') {
        event.preventDefault();
        if (state.isPlaying) pauseNarration();
        else void playNarration();
        return;
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        replayNarration();
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
        else if (state.imagesReady && !state.imageError) leaveTutorial(onReady);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [definition.steps.length, onReady]);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[88rem] flex-col py-2" aria-labelledby="tutorial-title">
      <audio aria-label={`Panduan suara langkah ${step + 1}`} lang={definition.audioLanguage} preload="auto" ref={audioRef} />
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="landing-eyebrow">Tutorial untuk {participantName}</p><h1 className="m-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl" id="tutorial-title">{selected.title}</h1><p className="mt-3 mb-0 text-lg font-bold text-muted">{definition.instruction}</p></div>
        <div className="flex items-center gap-4"><p aria-label={`Langkah ${step + 1} dari ${definition.steps.length}`} className="m-0 text-2xl font-black text-accent">{step + 1}/{definition.steps.length}</p><Button disabled={!imagesReady || imageError} onClick={() => leaveTutorial(onReady)} variant="quiet">Lewati tutorial</Button></div>
      </header>

      <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, scale: 1, y: 0 }} className="grid w-full place-items-center" exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : -10 }} initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 14 }} key={`${mode}-${step}`} transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}>
            <TutorialVisual fruit={fruit} mode={mode} progress={progress} step={step} />
          </m.div>
        </AnimatePresence>
        <AnimatePresence initial={false} mode="wait">
          <m.div animate={{ opacity: 1, x: 0 }} className="max-w-xl" exit={{ opacity: 0, x: reduceMotion ? 0 : -18 }} initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }} key={current.title} transition={{ duration: reduceMotion ? 0 : 0.26 }}>
            <p className="m-0 text-sm font-black tracking-[0.1em] text-accent uppercase">Langkah {step + 1}</p>
            <h2 className="mt-3 mb-0 text-4xl font-black tracking-[-0.04em]">{current.title}</h2>
            <p className="mt-5 mb-0 text-xl leading-9">{current.instruction}</p>
            <p className="mt-4 mb-0 text-base leading-7 text-muted">{current.caption}</p>
            <div aria-label={`Progres panduan suara ${Math.round(progress * 100)} persen`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(progress * 100)} className="mt-7 h-2 overflow-hidden rounded-full bg-divider" role="progressbar"><div className="h-full origin-left bg-accent transition-transform duration-100" style={{ transform: `scaleX(${progress})` }} /></div>
            {audioError && <p className="mt-3 mb-0 text-sm font-bold text-danger" role="alert">Panduan suara belum dapat diputar. Anda tetap dapat membaca petunjuk di layar.</p>}
            {!imagesReady && !imageError && <p className="mt-3 mb-0 text-sm font-bold text-muted" role="status">Menyiapkan gambar permainan…</p>}
            {imageError && <p className="mt-3 mb-0 text-sm font-bold text-danger" role="alert">Gambar permainan belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.</p>}
          </m.div>
        </AnimatePresence>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={isPlaying ? pauseNarration : () => void playNarration()} variant="secondary">{isPlaying ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}{isPlaying ? 'Jeda' : needsGesture ? 'Putar panduan' : 'Putar'}</Button>
          <Button onClick={replayNarration} variant="quiet"><RotateCcw aria-hidden className="size-5" />Ulangi</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={step === 0} onClick={() => changeStep(step - 1)} variant="quiet"><ChevronLeft aria-hidden className="size-5" />Sebelumnya</Button>
          {step < definition.steps.length - 1 ? <Button onClick={() => changeStep(step + 1)} variant="secondary">Berikutnya<ChevronRight aria-hidden className="size-5" /></Button> : <Button disabled={!imagesReady || imageError} onClick={() => leaveTutorial(onReady)}>Mulai bermain<ChevronRight aria-hidden className="size-5" /></Button>}
        </div>
      </footer>
      <button className="mt-4 w-fit border-0 bg-transparent p-0 text-sm font-bold text-muted underline-offset-4 hover:underline" onClick={() => leaveTutorial(onBack)} type="button">Kembali ke nama peserta</button>
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

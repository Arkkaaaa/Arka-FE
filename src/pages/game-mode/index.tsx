import { useState } from 'react';
import { ArrowLeft, Battery, Gamepad2, Radio, Wifi } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AccountHeader } from '../../components/index.ts';
import { GAME_MODES } from '../../constants/game-modes.ts';
import { gameModeFromSlug, ROUTES } from '../../constants/routes.ts';
import { useAccountPage } from '../../hooks/auth/use-account-page.ts';
import { useDevicesQuery } from '../../hooks/devices/use-devices.ts';
import { SequenceMemoryFlow, type SequenceMemoryStage } from './sequence-memory-flow.tsx';
import { resolveGameModeSurface } from './route-flow.ts';

export function GameModePage() {
  const { mode: modeSlug } = useParams();
  const mode = gameModeFromSlug(modeSlug);
  const { session, signOut } = useAccountPage();
  const devices = useDevicesQuery(Boolean(session.data) && mode !== 'SEQUENCE_MEMORY');
  const [sequenceStage, setSequenceStage] = useState<SequenceMemoryStage>('participant');

  if (!mode) return <Navigate replace to={ROUTES.dashboard} />;
  const selected = GAME_MODES.find((item) => item.mode === mode)!;
  const compatibleDevices = (devices.data ?? []).filter(
    (device) => device.inventoryStatus === 'ACTIVE' && device.capabilities.includes(selected.capability),
  );
  const readyDevices = compatibleDevices.filter((device) => device.readinessCode === 'READY').length;
  const onlineDevices = compatibleDevices.filter((device) => device.connectionStatus === 'ONLINE').length;
  const surface = resolveGameModeSurface(mode, Boolean(session.data));
  const immersiveTutorial = surface === 'sequence-flow' && sequenceStage === 'tutorial';
  const immersiveSession = surface === 'sequence-flow' && (sequenceStage === 'setup' || sequenceStage === 'session');
  const hideSequenceChrome = immersiveTutorial || immersiveSession;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-ink">
      {surface === 'sequence-flow' && sequenceStage === 'participant' && <div aria-hidden className="landing-glow landing-glow-soft -top-36 -right-40 size-[34rem]" />}
      {!hideSequenceChrome && <a className="skip-link" href="#game-mode-main">Lewati ke konten utama</a>}
      {!hideSequenceChrome && (
        <AccountHeader
          isSigningOut={signOut.isPending}
          onSignOut={() => session.data && signOut.mutate(session.data)}
          user={session.data}
        />
      )}
      <main
        className={hideSequenceChrome
          ? 'relative min-h-dvh w-full px-4 py-5 outline-none sm:px-8 lg:px-12'
          : 'relative mx-auto w-full max-w-[78rem] px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-12'}
        id="game-mode-main"
        tabIndex={-1}
      >
        {!hideSequenceChrome && (
          <Link className="group inline-flex min-h-11 items-center gap-2 font-black no-underline" to={ROUTES.dashboard}>
            <ArrowLeft aria-hidden className="size-5" />
            <span className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-ink after:transition-transform group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">Kembali ke dashboard</span>
          </Link>
        )}

        {surface === 'sequence-flow' ? (
             <div className={hideSequenceChrome ? '' : 'mt-8'}>
            <SequenceMemoryFlow csrfToken={session.data?.csrfToken ?? ''} onStageChange={setSequenceStage} />
          </div>
        ) : (
          <>
            <section className="mt-8 grid overflow-hidden rounded-md border-2 border-divider lg:grid-cols-[1fr_1.1fr]">
              <div className="grid min-h-72 place-items-center bg-gradient-to-br from-[#f4f6f9] via-white to-[#edf1f6] p-8"><img alt="" aria-hidden className="max-h-72 w-full object-contain" src={selected.illustration} /></div>
              <div className="flex flex-col justify-center p-6 sm:p-10"><img alt="" aria-hidden className="size-16" src={selected.emoji} /><p className="mt-6 mb-0 text-base font-black tracking-[0.08em] text-accent uppercase">Mode permainan</p><h1 className="mt-2 mb-0 text-4xl font-black tracking-[-0.05em] sm:text-5xl">{selected.title}</h1><p className="mt-4 mb-0 max-w-xl text-lg leading-8 text-muted">{selected.detail}</p><dl className="mt-7 border-t-2 border-divider pt-5"><dt className="text-base font-bold text-muted">Perangkat yang digunakan</dt><dd className="mt-1 ml-0 text-xl font-black">{selected.device}</dd></dl><p className="mt-7 mb-0 text-lg font-bold text-muted">Permainan untuk mode ini belum tersedia.</p></div>
            </section>
            <section className="mt-8" aria-labelledby="device-title">
              <div className="flex items-center gap-3"><Gamepad2 aria-hidden className="size-7 text-muted" /><div><h2 className="m-0 text-3xl font-black tracking-[-0.04em]" id="device-title">Kesiapan alat</h2><p className="mt-1 mb-0 text-base text-muted">Hanya perangkat yang kompatibel dengan {selected.title}.</p></div></div>
              <div className="mt-5 flex gap-4 overflow-x-auto pb-1"><div className="min-w-52 flex-1 rounded-md border-2 border-divider p-5"><Radio aria-hidden className="size-6 text-muted" /><p className="mt-4 mb-0 text-base font-bold text-muted">Perangkat aktif</p><p className="mt-1 mb-0 text-3xl font-black">{compatibleDevices.length}</p></div><div className="min-w-52 flex-1 rounded-md border-2 border-divider p-5"><Wifi aria-hidden className="size-6 text-muted" /><p className="mt-4 mb-0 text-base font-bold text-muted">Online</p><p className="mt-1 mb-0 text-3xl font-black">{onlineDevices}</p></div><div className="min-w-52 flex-1 rounded-md border-2 border-divider p-5"><Battery aria-hidden className="size-6 text-muted" /><p className="mt-4 mb-0 text-base font-bold text-muted">Siap digunakan</p><p className="mt-1 mb-0 text-3xl font-black">{readyDevices}</p></div></div>
              {compatibleDevices.length > 0 ? <ul className="mt-4 grid list-none gap-3 p-0">{compatibleDevices.map((device) => <li className="flex flex-wrap items-center justify-between gap-4 rounded-md border-2 border-divider p-4" key={device.deviceId}><div><p className="m-0 text-lg font-black">{device.label}</p><p className="mt-1 mb-0 text-sm font-bold text-muted">{device.readinessMessage}</p></div><span className="rounded-full bg-divider px-3 py-1 text-sm font-black">{device.readinessCode === 'READY' ? 'Siap' : 'Belum siap'}</span></li>)}</ul> : <div className="mt-4 flex min-h-32 flex-col items-center justify-center gap-3 p-5 text-center text-muted" role="status"><Gamepad2 aria-hidden className="size-8" strokeWidth={1.75} /><p className="m-0 text-base font-semibold">{devices.isError ? 'Data perangkat belum tersedia.' : `Belum ada ${selected.device.toLowerCase()} yang aktif.`}</p></div>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

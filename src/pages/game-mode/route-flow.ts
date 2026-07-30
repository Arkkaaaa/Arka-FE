export type GameModeSurface = 'redirect' | 'sequence-flow' | 'generic';

export function resolveGameModeSurface(
  mode: string | null,
  sessionReady: boolean,
): GameModeSurface {
  if (!mode) return 'redirect';
  if (mode === 'SEQUENCE_MEMORY') return 'sequence-flow';
  void sessionReady;
  return 'generic';
}

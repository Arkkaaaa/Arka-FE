import type { GameMode } from '@/schemas';
import {
  athletesTrainingIllustration,
  eyesEmoji,
  mindfulnessIllustration,
  musicalNotesEmoji,
  retroVideoGameIllustration,
  tangerineEmoji,
} from '../assets/index.ts';

export const GAME_MODES = [
  {
    mode: 'MOTOR_GRIP',
    title: 'Peras Jeruk',
    detail: 'Latihan menggenggam dan mempertahankan genggaman yang nyaman.',
    device: 'Genggam alat',
    capability: 'FSR',
    illustration: athletesTrainingIllustration,
    emoji: tangerineEmoji,
  },
  {
    mode: 'GO_NO_GO',
    title: 'Tangkap Wayang',
    detail: 'Latihan perhatian dengan menggenggam hanya saat Wayang muncul.',
    device: 'Genggam alat',
    capability: 'FSR',
    illustration: mindfulnessIllustration,
    emoji: eyesEmoji,
  },
  {
    mode: 'SEQUENCE_MEMORY',
    title: 'Ding Dong Dong',
    detail: 'Latihan mengingat urutan melalui empat tombol fisik.',
    device: 'Empat tombol fisik',
    capability: 'BUTTONS_4',
    illustration: retroVideoGameIllustration,
    emoji: musicalNotesEmoji,
  },
] as const;

export function isGameMode(value: string | undefined): value is GameMode {
  return value === 'MOTOR_GRIP' || value === 'GO_NO_GO' || value === 'SEQUENCE_MEMORY';
}

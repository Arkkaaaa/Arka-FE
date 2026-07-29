import type { GameMode } from '@/schemas';

export const TUTORIAL_AUDIO_LANGUAGE = 'id-ID' as const;

export interface TutorialStep {
  title: string;
  instruction: string;
  visual: string;
  caption: string;
}

export interface TutorialDefinition {
  audioBase: string;
  audioLanguage: typeof TUTORIAL_AUDIO_LANGUAGE;
  instruction: string;
  steps: readonly TutorialStep[];
}

export const tutorials: Readonly<Record<GameMode, TutorialDefinition>> = {
  MOTOR_GRIP: {
    audioBase: '/tutorial/audio/motor-grip',
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Genggam alat sekuat tenaga yang nyaman selama 2 detik.',
    steps: [
      {
        title: 'Siapkan alat',
        instruction: 'Dekatkan tangan ke alat genggam.',
        visual: 'Tangan berada dekat alat.',
        caption: 'Pastikan posisi tangan terasa nyaman.',
      },
      {
        title: 'Genggam nyaman',
        instruction: 'Genggam tanpa memaksakan tangan.',
        visual: 'Tangan menggenggam alat dengan tenang.',
        caption: 'Peserta boleh berhenti kapan saja.',
      },
      {
        title: 'Tahan 2 detik',
        instruction: 'Pertahankan genggaman selama dua detik.',
        visual: 'Indikator tahan terisi perlahan.',
        caption: 'Tahan hanya selama terasa nyaman.',
      },
      {
        title: 'Lihat perasan',
        instruction: 'Perhatikan jeruk dan wadah jus.',
        visual: 'Jeruk mengerut dan jus bertambah.',
        caption: 'Visual mengikuti pembacaan alat saat permainan.',
      },
      {
        title: 'Lepaskan',
        instruction: 'Lepaskan alat setelah selesai.',
        visual: 'Tangan kembali rileks.',
        caption: 'Latihan belum dihitung.',
      },
    ],
  },
  GO_NO_GO: {
    audioBase: '/tutorial/audio/go-no-go',
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Genggam hanya saat muncul Wayang.',
    steps: [
      {
        title: 'Ingat aturan',
        instruction: 'Wayang berarti genggam; gambar lain berarti tunggu.',
        visual: 'Wayang dan Batik tampil berdampingan.',
        caption: 'Genggam hanya saat Wayang.',
      },
      {
        title: 'Wayang muncul',
        instruction: 'Genggam alat satu kali.',
        visual: 'Kartu Wayang disorot dengan tanda benar.',
        caption: 'Wayang adalah sasaran.',
      },
      {
        title: 'Batik muncul',
        instruction: 'Jangan menggenggam.',
        visual: 'Kartu Batik tampil dengan tanda tunggu.',
        caption: 'Gambar selain Wayang bukan sasaran.',
      },
      {
        title: 'Wayang kembali',
        instruction: 'Genggam ketika Wayang terlihat lagi.',
        visual: 'Kartu Wayang kembali disorot.',
        caption: 'Tunggu setiap gambar sebelum merespons.',
      },
      {
        title: 'Siap mencoba',
        instruction: 'Ulangi aturan dengan tenang.',
        visual: 'Wayang diberi label genggam.',
        caption: 'Latihan belum dihitung.',
      },
    ],
  },
  SEQUENCE_MEMORY: {
    audioBase: '/tutorial/audio/sequence-memory',
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Perhatikan urutannya, lalu tekan tombol fisik yang sama.',
    steps: [
      {
        title: 'Lihat dahulu',
        instruction: 'Perhatikan kotak yang menyala.',
        visual: 'Kisi empat warna dan ikon berada pada posisi tetap.',
        caption: 'Belum perlu menekan tombol.',
      },
      {
        title: 'Ingat urutan',
        instruction: 'Ingat dua atau tiga kotak yang disorot.',
        visual: 'Batik lalu Wayang disorot berurutan.',
        caption: 'Warna selalu disertai ikon dan nama.',
      },
      {
        title: 'Tirukan',
        instruction: 'Tekan tombol fisik dalam urutan yang sama.',
        visual: 'Tangan menekan tombol Batik lalu Wayang.',
        caption: 'Gunakan tombol pada alat, bukan layar.',
      },
      {
        title: 'Selesaikan urutan',
        instruction: 'Tunggu konfirmasi setelah urutan lengkap.',
        visual: 'Tanda benar muncul dengan lembut.',
        caption: 'Jika keliru, urutan akan ditampilkan ulang.',
      },
      {
        title: 'Siap bermain',
        instruction: 'Lihat dahulu, lalu tirukan.',
        visual: 'Kisi kembali pada keadaan siap.',
        caption: 'Latihan belum dihitung.',
      },
    ],
  },
};

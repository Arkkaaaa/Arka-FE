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
        title: 'Kenali tombol',
        instruction: 'Hijau di kiri atas, biru di kanan atas, kuning di kiri bawah, dan merah di kanan bawah.',
        visual: 'Posisi layar sama dengan posisi tombol pada alat.',
        caption: 'Gunakan posisi dan warna untuk mengenali setiap tombol.',
      },
      {
        title: 'Perhatikan contoh',
        instruction: 'Layar akan menyalakan beberapa tombol satu per satu, disertai bunyi yang berbeda.',
        visual: 'Merah lalu biru menyala berurutan.',
        caption: 'Lihat sampai seluruh urutan selesai.',
      },
      {
        title: 'Tirukan urutan',
        instruction: 'Setelah contoh selesai, tekan tombol fisik dengan urutan yang sama.',
        visual: 'Tombol merah ditekan, lalu tombol biru.',
        caption: 'Tekan tombol pada alat, bukan pada layar.',
      },
      {
        title: 'Coba kembali',
        instruction: 'Jika urutan belum tepat, contoh akan diputar kembali dengan tenang.',
        visual: 'Urutan yang sama ditampilkan ulang.',
        caption: 'Peserta dapat mencoba kembali tanpa terburu-buru.',
      },
      {
        title: 'Mulai bermain',
        instruction: 'Ingat caranya: perhatikan contoh, lalu tirukan pada alat.',
        visual: 'Empat tombol kembali dalam keadaan siap.',
        caption: 'Caregiver dapat melanjutkan saat peserta sudah siap.',
      },
    ],
  },
};

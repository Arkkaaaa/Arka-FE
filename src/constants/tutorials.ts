import type { GameMode } from '@/schemas';

export const TUTORIAL_AUDIO_LANGUAGE = 'id-ID' as const;

export interface TutorialStep {
  title: string;
  instruction: string;
  visual: string;
  caption: string;
  audioSrc: string;
}

export interface TutorialDefinition {
  audioLanguage: typeof TUTORIAL_AUDIO_LANGUAGE;
  instruction: string;
  steps: readonly TutorialStep[];
}

export const tutorials: Readonly<Record<GameMode, TutorialDefinition>> = {
  MOTOR_GRIP: {
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Genggam alat untuk memeras buah di layar.',
    steps: [
      {
        title: 'Pegang alat',
        instruction: 'Pegang alat dengan nyaman. Pastikan alat tidak mudah lepas.',
        visual: 'Alat berada dalam posisi yang nyaman di tangan.',
        caption: 'Tidak perlu terburu-buru.',
        audioSrc: '/tutorial/step-mode1/step1.m4a',
      },
      {
        title: 'Genggam alat',
        instruction: 'Sekarang, genggam alat dengan tangan Anda.',
        visual: 'Jeruk mulai terperas saat alat digenggam.',
        caption: 'Gunakan kekuatan yang tetap terasa nyaman.',
        audioSrc: '/tutorial/step-mode1/step2.m4a',
      },
      {
        title: 'Peras buah',
        instruction: 'Lihat buah di layar. Genggam alat untuk memeras buah.',
        visual: 'Jeruk mengerut dan indikator kekuatan bertambah.',
        caption: 'Semakin kuat genggaman, semakin banyak buah terperas.',
        audioSrc: '/tutorial/step-mode1/step3.m4a',
      },
      {
        title: 'Tahan genggaman',
        instruction: 'Terus genggam. Tahan sebentar sampai waktunya selesai.',
        visual: 'Indikator waktu terisi selama genggaman ditahan.',
        caption: 'Lepaskan jika tangan terasa tidak nyaman.',
        audioSrc: '/tutorial/step-mode1/step4.m4a',
      },
      {
        title: 'Lepaskan perlahan',
        instruction: 'Setelah selesai, lepaskan genggaman secara perlahan.',
        visual: 'Jeruk dan tangan kembali rileks.',
        caption: 'Istirahatkan tangan sejenak.',
        audioSrc: '/tutorial/step-mode1/step5.m4a',
      },
      {
        title: 'Siap bermain',
        instruction: 'Bagus. Anda sudah siap. Mari kita mulai bermain.',
        visual: 'Jeruk siap diperas dalam permainan.',
        caption: 'Latihan tutorial belum dihitung.',
        audioSrc: '/tutorial/step-mode1/step6.m4a',
      },
    ],
  },
  GO_NO_GO: {
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Genggam hanya saat gambar Wayang muncul.',
    steps: [
      {
        title: 'Perhatikan gambar',
        instruction: 'Perhatikan gambar yang muncul di layar.',
        visual: 'Beberapa gambar budaya diperlihatkan dengan jelas.',
        caption: 'Lihat satu gambar pada satu waktu.',
        audioSrc: '/tutorial/step-mode2/step1.m4a',
      },
      {
        title: 'Wayang berarti genggam',
        instruction: 'Jika gambar Wayang muncul, genggam alat.',
        visual: 'Wayang tampil dengan petunjuk genggam.',
        caption: 'Wayang adalah satu-satunya gambar sasaran.',
        audioSrc: '/tutorial/step-mode2/step2.m4a',
      },
      {
        title: 'Bukan Wayang berarti tunggu',
        instruction: 'Jika gambar bukan Wayang, jangan genggam. Tunggu gambar berikutnya.',
        visual: 'Batik tampil dengan petunjuk tunggu.',
        caption: 'Jangan genggam saat melihat gambar lain.',
        audioSrc: '/tutorial/step-mode2/step3.m4a',
      },
      {
        title: 'Lepaskan kembali',
        instruction: 'Setelah menggenggam, lepaskan alat kembali.',
        visual: 'Wayang tampil, alat digenggam, lalu dilepaskan.',
        caption: 'Siapkan tangan untuk gambar berikutnya.',
        audioSrc: '/tutorial/step-mode2/step4.m4a',
      },
      {
        title: 'Ayo berlatih',
        instruction: 'Wayang, genggam. Bukan Wayang, tunggu.',
        visual: 'Wayang dan gambar lain bergantian sebagai latihan.',
        caption: 'Ikuti petunjuk yang tampil di bawah gambar.',
        audioSrc: '/tutorial/step-mode2/step5.m4a',
      },
      {
        title: 'Siap bermain',
        instruction: 'Ingat, genggam hanya saat Wayang muncul. Mari kita mulai.',
        visual: 'Wayang kembali tampil sebagai gambar sasaran.',
        caption: 'Latihan tutorial belum dihitung.',
        audioSrc: '/tutorial/step-mode2/step6.m4a',
      },
    ],
  },
  SEQUENCE_MEMORY: {
    audioLanguage: TUTORIAL_AUDIO_LANGUAGE,
    instruction: 'Perhatikan urutannya, lalu tekan tombol fisik yang sama.',
    steps: [
      {
        title: 'Kenali empat tombol',
        instruction: 'Di depan Anda ada empat tombol. Merah, kuning, biru, dan hijau.',
        visual: 'Empat tombol diperkenalkan satu per satu.',
        caption: 'Posisi layar mengikuti posisi tombol pada alat.',
        audioSrc: '/tutorial/step-mode3/step1.m4a',
      },
      {
        title: 'Perhatikan urutan',
        instruction: 'Perhatikan tombol yang menyala. Ingat urutannya.',
        visual: 'Tombol merah, biru, lalu hijau menyala berurutan.',
        caption: 'Lihat sampai seluruh urutan selesai.',
        audioSrc: '/tutorial/step-mode3/step2.m4a',
      },
      {
        title: 'Tunggu giliran',
        instruction: 'Jangan tekan dulu. Tunggu sampai semua tombol selesai menyala.',
        visual: 'Urutan tampil sementara tombol fisik belum ditekan.',
        caption: 'Tekan hanya setelah contoh selesai.',
        audioSrc: '/tutorial/step-mode3/step3.m4a',
      },
      {
        title: 'Ulangi urutan',
        instruction: 'Sekarang, tekan tombol dengan urutan yang sama.',
        visual: 'Urutan yang sama ditirukan pada tombol fisik.',
        caption: 'Tekan satu tombol pada satu waktu.',
        audioSrc: '/tutorial/step-mode3/step4.m4a',
      },
      {
        title: 'Jika lupa',
        instruction: 'Jika lupa, tidak apa-apa. Urutannya akan ditampilkan kembali.',
        visual: 'Urutan diputar kembali dengan lebih tenang.',
        caption: 'Anda dapat mencoba kembali tanpa terburu-buru.',
        audioSrc: '/tutorial/step-mode3/step5.m4a',
      },
      {
        title: 'Siap bermain',
        instruction: 'Perhatikan, ingat, lalu tekan. Mari kita mulai.',
        visual: 'Empat tombol kembali dalam keadaan siap.',
        caption: 'Latihan tutorial belum dihitung.',
        audioSrc: '/tutorial/step-mode3/step6.m4a',
      },
    ],
  },
};

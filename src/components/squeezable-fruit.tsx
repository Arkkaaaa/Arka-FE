import { m, useReducedMotion } from 'framer-motion';

export const FRUIT_VARIANTS = ['ORANGE', 'WATERMELON', 'LEMON', 'APPLE'] as const;
export type FruitVariant = (typeof FRUIT_VARIANTS)[number];

const FRUIT_DETAILS: Record<FruitVariant, { label: string; color: string; dark: string; leaf: string; shape: 'round' | 'oval' }> = {
  ORANGE: { label: 'Jeruk', color: '#f39a2d', dark: '#b85b16', leaf: '#398c55', shape: 'round' },
  WATERMELON: { label: 'Semangka', color: '#62a94d', dark: '#27633a', leaf: '#27633a', shape: 'oval' },
  LEMON: { label: 'Lemon', color: '#f3cd38', dark: '#b88e18', leaf: '#4b995d', shape: 'oval' },
  APPLE: { label: 'Apel', color: '#dc5144', dark: '#8f2925', leaf: '#419259', shape: 'round' },
};

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function fruitVariantForSeed(seed: string): FruitVariant {
  return FRUIT_VARIANTS[stableHash(seed) % FRUIT_VARIANTS.length]!;
}

export function randomFruitVariant(): FruitVariant {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return FRUIT_VARIANTS[random[0]! % FRUIT_VARIANTS.length]!;
}

interface SqueezableFruitProps {
  fruit: FruitVariant;
  squeezePercent: number;
  showLabel?: boolean;
}

export function SqueezableFruit({ fruit, squeezePercent, showLabel = true }: SqueezableFruitProps) {
  const reduceMotion = useReducedMotion();
  const details = FRUIT_DETAILS[fruit];
  const squeeze = Math.max(0, Math.min(squeezePercent, 100));
  const drops = squeeze >= 70 ? 3 : squeeze >= 45 ? 2 : squeeze >= 25 ? 1 : 0;
  const oval = details.shape === 'oval';

  return (
    <div className="grid place-items-center text-center" role="img" aria-label={`${details.label} terperas ${Math.round(squeeze)} persen`}>
      <div className="relative grid h-64 w-72 place-items-center sm:h-72 sm:w-80">
        <m.div
          animate={{
            rotate: reduceMotion ? 0 : squeeze >= 45 ? [-1.5, 1.5, -1.5] : 0,
            scaleX: oval ? 1.08 + squeeze * 0.0012 : 1 + squeeze * 0.0015,
            scaleY: 1 - squeeze * 0.0032,
            y: squeeze * 0.18,
          }}
          className="relative grid place-items-center border-[10px] shadow-[inset_-20px_-24px_0_rgba(0,0,0,0.12)]"
          style={{
            width: oval ? '14rem' : '12.5rem',
            height: oval ? '11rem' : '12.5rem',
            borderColor: details.dark,
            borderRadius: oval ? '48% 52% 50% 50%' : fruit === 'APPLE' ? '46% 46% 50% 50%' : '50%',
            backgroundColor: details.color,
          }}
          transition={{ rotate: { duration: 0.3, repeat: squeeze >= 45 && !reduceMotion ? Infinity : 0 }, scaleX: { duration: 0.12 }, scaleY: { duration: 0.12 }, y: { duration: 0.12 } }}
        >
          {fruit === 'WATERMELON' && <><span aria-hidden className="absolute inset-y-3 left-[28%] w-4 rounded-full bg-[#307244]/55" /><span aria-hidden className="absolute inset-y-3 right-[28%] w-4 rounded-full bg-[#307244]/55" /></>}
          {fruit === 'ORANGE' && <span aria-hidden className="size-20 rounded-full border-4 border-[#efb363]/70" />}
          {fruit === 'LEMON' && <span aria-hidden className="h-16 w-24 rounded-[50%] border-4 border-[#f8e47c]/70" />}
          {fruit === 'APPLE' && <span aria-hidden className="h-20 w-28 rounded-[50%] bg-[#ef7566]/35" />}
          <span aria-hidden className="absolute -top-10 left-1/2 h-12 w-3 -translate-x-1/2 -rotate-6 rounded-full bg-[#6d411f]" />
          <span aria-hidden className="absolute -top-8 left-[52%] h-9 w-16 origin-left -rotate-20 rounded-[100%_0_100%_0]" style={{ backgroundColor: details.leaf }} />
        </m.div>
        {Array.from({ length: drops }).map((_, index) => (
          <m.span
            animate={reduceMotion ? { opacity: 0.85 } : { opacity: [0, 1, 0], y: [0, 54, 72], scale: [0.7, 1, 0.8] }}
            aria-hidden
            className="absolute top-[72%] size-5 rounded-[50%_50%_55%_45%] bg-[#f2a72c]"
            key={index}
            style={{ left: `${42 + index * 8}%` }}
            transition={{ delay: index * 0.18, duration: 0.9, repeat: Infinity }}
          />
        ))}
      </div>
      {showLabel && <p className="m-0 text-2xl font-black">Peras {details.label}</p>}
    </div>
  );
}

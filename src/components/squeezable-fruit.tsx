import { useEffect, useId, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';

export const FRUIT_VARIANTS = ['ORANGE', 'WATERMELON', 'LEMON', 'APPLE'] as const;
export type FruitVariant = (typeof FRUIT_VARIANTS)[number];

interface FruitDetails {
  label: string;
  color: string;
  light: string;
  dark: string;
  juice: string;
  juiceLight: string;
  leaf: string;
}

const FRUIT_DETAILS: Record<FruitVariant, FruitDetails> = {
  ORANGE: { label: 'Jeruk', color: '#f3922b', light: '#ffc36b', dark: '#a94d12', juice: '#f5a623', juiceLight: '#ffd566', leaf: '#398c55' },
  WATERMELON: { label: 'Semangka', color: '#5fa848', light: '#9bd57c', dark: '#235b34', juice: '#e74d58', juiceLight: '#ff8c91', leaf: '#2f7844' },
  LEMON: { label: 'Lemon', color: '#f2cd35', light: '#ffec7c', dark: '#a98113', juice: '#f4d53f', juiceLight: '#fff19a', leaf: '#4b995d' },
  APPLE: { label: 'Apel', color: '#da4c43', light: '#f27a6d', dark: '#852722', juice: '#e36a43', juiceLight: '#ffad74', leaf: '#419259' },
};

const TEXTURE_DOTS = [
  [205, 118, 2.2], [231, 102, 1.5], [281, 109, 2], [316, 126, 1.5], [188, 151, 1.5],
  [219, 171, 2], [260, 137, 1.5], [300, 166, 2.2], [330, 149, 1.6], [245, 195, 1.8],
  [279, 190, 1.4], [207, 202, 1.4], [313, 204, 1.8],
] as const;

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

function fruitPath(fruit: FruitVariant): string {
  if (fruit === 'LEMON') return 'M132 158 C151 137 164 104 214 88 C252 76 304 86 335 108 C358 124 370 145 390 158 C370 176 357 202 329 217 C294 236 239 237 200 220 C165 205 150 179 132 158Z';
  if (fruit === 'APPLE') return 'M259 92 C229 73 184 83 166 119 C141 170 166 225 207 239 C229 247 244 235 260 235 C277 235 291 247 314 239 C355 224 379 168 354 119 C336 84 290 73 259 92Z';
  if (fruit === 'WATERMELON') return 'M139 160 C139 112 188 81 260 81 C332 81 381 112 381 160 C381 208 332 239 260 239 C188 239 139 208 139 160Z';
  return 'M260 75 C326 75 369 111 369 159 C369 212 326 246 260 246 C194 246 151 212 151 159 C151 111 194 75 260 75Z';
}

function HandPalm({ side, squeeze, reduced }: { side: 'left' | 'right'; squeeze: number; reduced: boolean }) {
  const isLeft = side === 'left';
  const pressure = squeeze / 100;
  const transform = isLeft ? undefined : 'translate(520 0) scale(-1 1)';
  return (
    <m.g animate={{ opacity: squeeze > 3 ? 1 : 0, x: (isLeft ? 1 : -1) * (-24 + pressure * 52), y: pressure * 4 }} initial={false} transition={{ duration: reduced ? 0 : 0.14, ease: 'easeOut' }}>
      <g transform={transform}>
        <path d="M-16 119 C22 109 57 112 90 126 C107 107 132 99 157 106 C181 113 195 133 190 158 C185 185 158 205 124 207 C91 208 65 187 43 174 C21 162 2 163 -16 167Z" fill="#d9956c" stroke="#855039" strokeWidth="5" />
        <path d="M8 130 C34 126 59 134 77 150" fill="none" stroke="#b87455" strokeLinecap="round" strokeWidth="3" />
        <path d="M12 153 C38 149 58 156 75 169" fill="none" stroke="#efb18a" strokeLinecap="round" strokeWidth="3" />
        <path d="M103 135 C116 116 141 112 156 128 C169 142 163 164 143 176 C123 188 98 177 94 157 C92 149 96 141 103 135Z" fill="#c97f5b" stroke="#8f573f" strokeWidth="3" />
        <ellipse cx="126" cy="150" fill="#e7a47d" opacity="0.65" rx="20" ry="25" />
      </g>
    </m.g>
  );
}

function GripFingers({ side, squeeze, reduced }: { side: 'left' | 'right'; squeeze: number; reduced: boolean }) {
  const isLeft = side === 'left';
  const pressure = squeeze / 100;
  const transform = isLeft ? undefined : 'translate(520 0) scale(-1 1)';
  return (
    <m.g animate={{ opacity: squeeze > 3 ? 1 : 0, x: (isLeft ? 1 : -1) * (-24 + pressure * 52), y: pressure * 4 }} initial={false} transition={{ duration: reduced ? 0 : 0.14, ease: 'easeOut' }}>
      <g transform={transform}>
        <path d="M147 97 C165 94 188 103 202 117 C211 126 208 139 197 144 C186 149 176 140 166 133 C156 126 143 123 135 116 C126 108 134 99 147 97Z" fill="#edb38c" stroke="#955a40" strokeWidth="3" />
        <path d="M151 121 C172 119 195 130 207 143 C215 152 211 165 199 169 C187 173 179 164 169 157 C159 150 145 148 138 140 C130 131 138 123 151 121Z" fill="#e8aa82" stroke="#955a40" strokeWidth="3" />
        <path d="M149 147 C169 145 192 155 202 169 C209 179 204 191 192 194 C180 197 173 188 164 181 C155 174 142 173 135 165 C128 156 136 149 149 147Z" fill="#e2a078" stroke="#955a40" strokeWidth="3" />
        <path d="M140 173 C157 169 177 177 187 188 C194 196 190 207 179 211 C168 214 161 207 153 201 C145 195 134 194 128 188 C121 181 129 175 140 173Z" fill="#da966f" stroke="#955a40" strokeWidth="3" />
        <path d="M151 103 C165 101 178 106 187 114" fill="none" stroke="#f8d1b4" strokeLinecap="round" strokeWidth="4" />
        <path d="M157 128 C170 128 183 133 191 141" fill="none" stroke="#f5c8a9" strokeLinecap="round" strokeWidth="4" />
        <path d="M155 154 C168 153 180 158 188 166" fill="none" stroke="#efbc9a" strokeLinecap="round" strokeWidth="4" />
        <path d="M145 180 C156 178 167 182 174 188" fill="none" stroke="#eab28f" strokeLinecap="round" strokeWidth="4" />
        <path d="M191 116 C199 120 204 126 205 132" fill="none" stroke="#9b6047" strokeLinecap="round" strokeWidth="2" />
        <path d="M197 143 C204 149 207 154 206 160" fill="none" stroke="#9b6047" strokeLinecap="round" strokeWidth="2" />
      </g>
    </m.g>
  );
}

export function SqueezableFruit({ fruit, squeezePercent, showLabel = true }: SqueezableFruitProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const details = FRUIT_DETAILS[fruit];
  const squeeze = Math.max(0, Math.min(squeezePercent, 100));
  const pressure = squeeze / 100;
  const active = squeeze >= 7;
  const juiceActive = squeeze >= 18;
  const wrinkleOpacity = Math.max(0, (squeeze - 16) / 84);
  const [fillPercent, setFillPercent] = useState(4);

  useEffect(() => {
    setFillPercent(4);
  }, [fruit]);

  useEffect(() => {
    if (!juiceActive) return;
    const timer = window.setInterval(() => {
      setFillPercent((current) => Math.min(91, current + 0.35 + pressure * 1.15));
    }, 250);
    return () => window.clearInterval(timer);
  }, [juiceActive, pressure]);

  const shape = fruitPath(fruit);
  const streamWidth = 3 + pressure * 9;
  const fruitScaleX = 1 - pressure * 0.22;
  const fruitScaleY = 1 + pressure * 0.14;
  const fruitY = pressure * 9;
  const fillHeight = fillPercent * 0.86;
  const fillY = 397 - fillHeight;

  return (
    <div className="grid place-items-center text-center" role="img" aria-label={`${details.label} ditekan ${Math.round(squeeze)} persen. Gelas jus terisi ${Math.round(fillPercent)} persen.`}>
      <svg aria-hidden className="h-auto w-full max-w-[38rem] overflow-visible" viewBox="0 0 520 430">
        <defs>
          <clipPath id={`fruit-${id}`}><path d={shape} /></clipPath>
          <clipPath id={`glass-${id}`}><path d="M214 307 L306 307 L296 405 Q260 416 224 405Z" /></clipPath>
          <linearGradient id={`fruitGradient-${id}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={details.light} /><stop offset="0.48" stopColor={details.color} /><stop offset="1" stopColor={details.dark} /></linearGradient>
          <linearGradient id={`juiceGradient-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={details.juiceLight} /><stop offset="1" stopColor={details.juice} /></linearGradient>
          <filter id={`shadow-${id}`} height="160%" width="160%" x="-30%" y="-30%"><feDropShadow dx="0" dy="9" floodColor="#171711" floodOpacity="0.2" stdDeviation="6" /></filter>
        </defs>

        <ellipse cx="260" cy="410" fill="#171711" opacity="0.1" rx="96" ry="12" />
        <HandPalm reduced={reduceMotion} side="left" squeeze={squeeze} />
        <HandPalm reduced={reduceMotion} side="right" squeeze={squeeze} />

        <m.g
          animate={{ rotate: reduceMotion || squeeze < 58 ? 0 : [-0.8, 0.8, -0.8], scaleX: fruitScaleX, scaleY: fruitScaleY, y: fruitY }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          transition={{ rotate: { duration: 0.24, repeat: squeeze >= 58 && !reduceMotion ? Infinity : 0 }, scaleX: { duration: reduceMotion ? 0 : 0.13 }, scaleY: { duration: reduceMotion ? 0 : 0.13 }, y: { duration: reduceMotion ? 0 : 0.13 } }}
        >
          <path d={shape} fill={`url(#fruitGradient-${id})`} filter={`url(#shadow-${id})`} stroke={details.dark} strokeLinejoin="round" strokeWidth="9" />
          <g clipPath={`url(#fruit-${id})`}>
            <ellipse cx="221" cy="111" fill="white" opacity="0.22" rx="35" ry="19" transform="rotate(-24 221 111)" />
            {fruit === 'WATERMELON' && <><path d="M178 79 C205 119 205 203 178 239" fill="none" opacity="0.55" stroke="#28683a" strokeWidth="17" /><path d="M260 76 C280 117 280 203 260 241" fill="none" opacity="0.48" stroke="#28683a" strokeWidth="14" /><path d="M342 83 C317 120 317 202 343 236" fill="none" opacity="0.55" stroke="#28683a" strokeWidth="17" /></>}
            {fruit !== 'WATERMELON' && TEXTURE_DOTS.map(([cx, cy, radius], index) => <circle cx={cx} cy={cy} fill={details.dark} key={index} opacity={fruit === 'ORANGE' ? 0.28 : 0.16} r={radius} />)}
            {fruit === 'ORANGE' && <><circle cx="260" cy="218" fill="#9f4811" opacity="0.55" r="7" /><path d="M251 217 Q260 209 269 217" fill="none" stroke="#f6b95d" strokeWidth="3" /></>}
            {fruit === 'LEMON' && <><path d="M143 158 L128 151 L136 169Z" fill="#d9ad1d" /><path d="M377 151 L393 158 L377 168Z" fill="#d9ad1d" /><path d="M188 134 Q260 103 332 134" fill="none" opacity="0.25" stroke="#fff5ad" strokeWidth="5" /></>}
            {fruit === 'APPLE' && <><path d="M236 91 Q260 108 284 91" fill="none" stroke="#7c201d" strokeWidth="5" /><ellipse cx="213" cy="128" fill="#ff9a8d" opacity="0.25" rx="25" ry="16" transform="rotate(-22 213 128)" /></>}
            {fruit === 'WATERMELON' && <><path d="M217 84 Q203 160 220 232" fill="none" opacity="0.3" stroke="#b7e696" strokeWidth="5" /><path d="M302 84 Q318 160 300 232" fill="none" opacity="0.3" stroke="#b7e696" strokeWidth="5" /></>}
            {[0, 1, 2, 3].map((index) => <path d={`M${218 + index * 21} ${130 + (index % 2) * 14} Q${230 + index * 17} ${143 + index * 6} ${214 + index * 24} ${156 + (index % 2) * 10}`} fill="none" key={index} opacity={wrinkleOpacity} stroke={details.dark} strokeLinecap="round" strokeWidth="3" />)}
            <ellipse cx="170" cy="160" fill={details.dark} opacity={0.08 + pressure * 0.25} rx={8 + pressure * 16} ry="47" />
            <ellipse cx="350" cy="160" fill={details.dark} opacity={0.08 + pressure * 0.25} rx={8 + pressure * 16} ry="47" />
          </g>
          <path d="M258 91 C250 72 254 56 265 43" fill="none" stroke="#6d411f" strokeLinecap="round" strokeWidth="11" />
          <path d="M264 55 C280 35 307 35 322 49 C307 67 282 72 264 55Z" fill={details.leaf} stroke="#285f3b" strokeWidth="4" />
          <path d="M270 56 C286 52 300 49 315 48" fill="none" stroke="#9bce86" strokeLinecap="round" strokeWidth="2.5" />
        </m.g>
        <GripFingers reduced={reduceMotion} side="left" squeeze={squeeze} />
        <GripFingers reduced={reduceMotion} side="right" squeeze={squeeze} />

        <m.rect animate={{ opacity: squeeze >= 18 ? 0.95 : 0, width: streamWidth, x: 260 - streamWidth / 2 }} fill={`url(#juiceGradient-${id})`} height="108" rx={streamWidth / 2} transition={{ duration: reduceMotion ? 0 : 0.13 }} y="226" />
        {[0, 1, 2, 3].map((index) => (
          <m.circle
            animate={reduceMotion ? { opacity: juiceActive ? 0.8 : 0 } : { cx: [260, 237 + index * 15, 228 + index * 20], cy: [242, 272, 305], opacity: juiceActive ? [0, 1, 0] : 0, r: [2, 5, 3] }}
            fill={details.juice}
            key={index}
            transition={{ delay: index * 0.17, duration: Math.max(0.52, 1.05 - pressure * 0.38), repeat: Infinity }}
          />
        ))}

        <path d="M210 300 L310 300 L300 410 Q260 423 220 410Z" fill="#dff3ff" fillOpacity="0.3" stroke="#3978bd" strokeOpacity="0.55" strokeWidth="5" />
        <g clipPath={`url(#glass-${id})`}>
          <m.rect animate={{ height: fillHeight, y: fillY }} fill={`url(#juiceGradient-${id})`} transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }} width="108" x="206" />
          <m.path animate={{ y: fillY - 311 }} d="M205 311 Q225 303 245 311 T285 311 T325 311" fill="none" stroke={details.juiceLight} strokeWidth="6" transition={{ duration: reduceMotion ? 0 : 0.24 }} />
          {fillPercent > 22 && <><circle cx="241" cy={fillY + 22} fill="white" opacity="0.55" r="4" /><circle cx="277" cy={fillY + 34} fill="white" opacity="0.4" r="3" /><circle cx="260" cy={fillY + 50} fill="white" opacity="0.35" r="2.5" /></>}
        </g>
        <path d="M222 314 C223 349 227 386 234 401" fill="none" opacity="0.65" stroke="white" strokeLinecap="round" strokeWidth="5" />
        <ellipse cx="260" cy="301" fill="none" rx="50" ry="8" stroke="#3978bd" strokeOpacity="0.6" strokeWidth="5" />
      </svg>
      {showLabel && <p className="m-0 text-2xl font-black">Peras {details.label}</p>}
    </div>
  );
}

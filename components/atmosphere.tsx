'use client'
// Cinematische achtergrond: Songshan-bergen, tempelsilhouet, drijvende mist,
// stofdeeltjes en lichtstralen. Puur CSS/SVG — geen externe assets, dus snel,
// offline-proof en zonder licentiegedoe. GPU-vriendelijk (transform/opacity).

const DUST = [
  { l: '8%', d: '19s', delay: '0s' },
  { l: '22%', d: '26s', delay: '-9s' },
  { l: '31%', d: '17s', delay: '-4s' },
  { l: '44%', d: '29s', delay: '-15s' },
  { l: '57%', d: '21s', delay: '-2s' },
  { l: '66%', d: '25s', delay: '-12s' },
  { l: '78%', d: '18s', delay: '-6s' },
  { l: '88%', d: '27s', delay: '-18s' },
  { l: '95%', d: '22s', delay: '-10s' },
]

export function Atmosphere({ intensity = 'subtle' }: { intensity?: 'full' | 'subtle' }) {
  const full = intensity === 'full'
  return (
    <div className="atmo" aria-hidden style={{ opacity: full ? 1 : 0.55 }}>
      {/* Songshan-bergketens + tempel op de graat */}
      <svg
        viewBox="0 0 430 360"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 h-[46%] w-full"
        style={{ opacity: full ? 0.8 : 0.5 }}
      >
        <defs>
          <linearGradient id="mFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2a22" />
            <stop offset="1" stopColor="#0e0d09" />
          </linearGradient>
          <linearGradient id="mNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#171410" />
            <stop offset="1" stopColor="#0b0907" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="100%" r="100%">
            <stop offset="0" stopColor="#e0873a" stopOpacity="0.16" />
            <stop offset="1" stopColor="#e0873a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* zachte avondgloed achter de verre keten */}
        <ellipse cx="215" cy="250" rx="240" ry="110" fill="url(#sunGlow)" />
        {/* verre keten — vloeiende karst-ruggen */}
        <path
          d="M0 262 Q22 244 44 224 Q58 210 72 222 Q90 236 108 214 Q126 190 146 178 Q160 170 174 186 Q192 208 214 196 Q238 182 258 160 Q272 146 288 162 Q306 180 330 196 Q352 210 374 198 Q394 187 412 206 Q422 216 430 224 L430 360 L0 360 Z"
          fill="url(#mFar)"
        />
        {/* tempel-silhouet op de graat */}
        <g fill="#0d0c08" transform="translate(285 140)">
          <path d="M-26 32 L-22 22 L22 22 L26 32 Z" />
          <path d="M-30 22 Q0 10 30 22 L24 17 L-24 17 Z" />
          <path d="M-19 17 L-16 8 L16 8 L19 17 Z" />
          <path d="M-23 8 Q0 -2 23 8 L18 4 L-18 4 Z" />
          <path d="M-12 4 L-9 -3 L9 -3 L12 4 Z" />
          <path d="M-15 -3 Q0 -11 15 -3 L11 -6 L-11 -6 Z" />
          <rect x="-1.4" y="-14" width="2.8" height="8" />
        </g>
        {/* nabije keten — donkerder, rustiger golving */}
        <path
          d="M0 316 Q28 296 58 278 Q80 265 102 280 Q128 298 158 282 Q186 266 214 256 Q236 249 258 264 Q284 282 314 272 Q342 262 368 276 Q398 292 430 306 L430 360 L0 360 Z"
          fill="url(#mNear)"
        />
      </svg>

      {/* lichtstralen */}
      <div className="atmo-ray" />
      <div className="atmo-ray atmo-ray2" />

      {/* mistlagen */}
      <div className="atmo-mist" />
      <div className="atmo-mist atmo-mist2" />

      {/* zwevende stofdeeltjes in het licht */}
      {full && (
        <div className="atmo-dust">
          {DUST.map((p, i) => (
            <span key={i} style={{ left: p.l, animationDuration: p.d, animationDelay: p.delay }} />
          ))}
        </div>
      )}
    </div>
  )
}

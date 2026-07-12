'use client'
// Parametrisch levend coachportret: zelfde premium stijl als Meester Tiě Shān
// (ademen, knipperen, micro-beweging), maar per coach een eigen gezicht via
// config (haar, baard, hoofdband, bril, kledingkleur, accent).
import { coachById, type Coach } from '@/lib/coaches'
import { MasterPortrait } from './master'

function Hair({ c }: { c: Coach }) {
  const l = c.look
  const col = l.hairColor || '#2c2018'
  switch (l.hair) {
    case 'short':
      return <path d="M100 20 Q140 20 139 58 Q139 47 132 40 Q118 28 100 28 Q82 28 68 40 Q61 47 61 58 Q60 20 100 20 Z" fill={col} />
    case 'pony':
      return (
        <g fill={col}>
          <path d="M100 20 Q140 20 139 58 Q139 46 130 38 Q116 27 100 27 Q84 27 70 38 Q61 46 61 58 Q60 20 100 20 Z" />
          <path d="M134 40 Q150 52 146 84 Q143 106 136 118 Q142 92 136 66 Q133 50 128 42 Z" />
        </g>
      )
    case 'bun':
      return (
        <g fill={col}>
          <path d="M100 20 Q140 20 139 58 Q139 46 130 38 Q116 27 100 27 Q84 27 70 38 Q61 46 61 58 Q60 20 100 20 Z" />
          <circle cx="100" cy="16" r="10" />
        </g>
      )
    case 'long':
      return (
        <g fill={col}>
          <path d="M100 20 Q141 20 140 60 Q142 92 136 122 L124 122 Q131 92 130 62 Q128 40 114 31 Q106 27 100 27 Q94 27 86 31 Q72 40 70 62 Q69 92 76 122 L64 122 Q58 92 60 60 Q59 20 100 20 Z" />
        </g>
      )
    default:
      return null
  }
}

export function CoachPortrait({ coachId, size = 180, halo = true }: { coachId?: string | null; size?: number; halo?: boolean }) {
  const c = coachById(coachId)
  if (c.id === 'tieshan') return <MasterPortrait size={size} halo={halo} />
  const l = c.look

  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {halo && (
        <>
          <div
            className="animate-breathe absolute inset-[-14%] rounded-full"
            style={{ background: `radial-gradient(50% 50% at 50% 55%, ${c.accent}44, transparent 70%)` }}
          />
          <svg viewBox="0 0 100 100" className="animate-halo absolute inset-[-7%]" style={{ opacity: 0.6 }}>
            <circle cx="50" cy="50" r="48" fill="none" stroke={c.accent} strokeWidth="0.7" strokeDasharray="0.5 5.6" strokeLinecap="round" />
          </svg>
        </>
      )}
      <svg viewBox="0 0 200 200" width={size} height={size} className="relative">
        <defs>
          <radialGradient id={`cp-bg-${c.id}`} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#241c12" />
            <stop offset="62%" stopColor="#15100a" />
            <stop offset="100%" stopColor="#0c0906" />
          </radialGradient>
          <linearGradient id={`cp-skin-${c.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={l.skin} />
            <stop offset="100%" stopColor={l.skinShade} />
          </linearGradient>
          <linearGradient id={`cp-top-${c.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={l.top} />
            <stop offset="100%" stopColor={l.topDark} />
          </linearGradient>
          <radialGradient id={`cp-light-${c.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
          </radialGradient>
          <clipPath id={`cp-clip-${c.id}`}><circle cx="100" cy="100" r="94" /></clipPath>
        </defs>

        <circle cx="100" cy="100" r="94" fill={`url(#cp-bg-${c.id})`} />
        <g clipPath={`url(#cp-clip-${c.id})`}>
          {/* zacht accentlicht */}
          <circle cx="140" cy="55" r="85" fill={`url(#cp-light-${c.id})`} className="tsn-light" />

          <g className="tsn-body">
            {/* schouders/kleding */}
            <path d="M22 200 L26 156 Q34 130 62 122 L100 114 L138 122 Q166 130 174 156 L178 200 Z" fill={`url(#cp-top-${c.id})`} />
            <path d="M100 116 Q104 160 104 200 L178 200 L175 158 Q168 134 140 124 Z" fill="#000" opacity="0.22" />
            {/* kraag-accent */}
            <path d="M78 122 Q100 132 122 122" stroke={c.accent} strokeWidth="2.5" fill="none" opacity="0.7" />
            {/* hals */}
            <path d="M85 96 Q85 119 100 123 Q115 119 115 96 L115 84 L85 84 Z" fill={l.skinShade} />

            <g className="tsn-head">
              {/* hoofd */}
              <path
                d="M100 22 Q136 22 138 60 Q139 76 134 88 Q128 106 114 112 Q100 117 86 112 Q72 106 66 88 Q61 76 62 60 Q64 22 100 22 Z"
                fill={`url(#cp-skin-${c.id})`}
              />
              <path d="M62 70 Q54 68 56 79 Q58 90 66 88 Z" fill={l.skinShade} />
              <path d="M138 70 Q146 68 144 79 Q142 90 134 88 Z" fill={`url(#cp-skin-${c.id})`} />
              <ellipse cx="112" cy="38" rx="20" ry="11" fill="#fff" opacity="0.14" />
              <Hair c={c} />
              {l.band && <path d="M62 52 Q100 42 138 52 L138 61 Q100 51 62 61 Z" fill={l.band} opacity="0.92" />}

              {/* wenkbrauwen */}
              <path d="M72 66 Q80 61 90 64" stroke={l.hairColor || '#4a3626'} strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M110 64 Q120 61 128 66" stroke={l.hairColor || '#4a3626'} strokeWidth="2.6" strokeLinecap="round" fill="none" />
              {/* ogen + knipperen */}
              <g>
                <path d="M73 74 Q81 70 90 74 Q81 78.5 73 74 Z" fill="#efe6d2" opacity="0.9" />
                <path d="M110 74 Q119 70 127 74 Q119 78.5 110 74 Z" fill="#efe6d2" opacity="0.9" />
                <circle cx="81.5" cy="74" r="2.6" fill="#332414" />
                <circle cx="118.5" cy="74" r="2.6" fill="#332414" />
                <circle cx="82.3" cy="73.2" r="0.8" fill={c.accent} opacity="0.95" />
                <circle cx="119.3" cy="73.2" r="0.8" fill={c.accent} opacity="0.95" />
                <g className="tsn-blink">
                  <path d="M72 74 Q81 68.5 91 74 Q81 74.5 72 74 Z" fill={`url(#cp-skin-${c.id})`} />
                  <path d="M109 74 Q119 68.5 128 74 Q119 74.5 109 74 Z" fill={`url(#cp-skin-${c.id})`} />
                </g>
              </g>
              {l.glasses && (
                <g stroke="#d9cbb0" strokeWidth="1.8" fill="none" opacity="0.9">
                  <circle cx="81" cy="74" r="8.5" />
                  <circle cx="119" cy="74" r="8.5" />
                  <path d="M89.5 74 L110.5 74 M72.5 73 L64 70 M127.5 73 L136 70" />
                </g>
              )}
              {/* neus + mond */}
              <path d="M100 76 Q98 88 95 93 Q100 97 105 93 Q102 88 100 76" fill={l.skinShade} opacity="0.55" />
              <path d="M88 103 Q100 109 112 103" stroke="#4a3220" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              {l.beard && (
                <path
                  d="M70 84 Q72 108 86 115 Q100 121 114 115 Q128 108 130 84 Q131 100 126 110 Q118 122 100 123 Q82 122 74 110 Q69 100 70 84 Z"
                  fill={l.hairColor || '#3a2c1c'} opacity="0.95"
                />
              )}
              {/* rim light */}
              <path d="M124 28 Q138 40 137 62 Q138 76 133 88" stroke="#f2e2bd" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.55" />
            </g>
          </g>
        </g>
        <circle cx="100" cy="100" r="94" fill="none" stroke={c.accent} strokeWidth="1.6" opacity="0.85" />
        <circle cx="100" cy="100" r="90" fill="none" stroke={c.accent} strokeWidth="0.6" opacity="0.3" />
      </svg>
    </div>
  )
}

// Spreekkaart in de stem van de actieve coach.
export function CoachSays({ coachId, label, children }: { coachId?: string | null; label?: string; children: React.ReactNode }) {
  const c = coachById(coachId)
  return (
    <div className="card" style={{ borderColor: `${c.accent}33` }}>
      <div className="mb-2 flex items-center gap-2.5">
        <CoachPortrait coachId={c.id} size={34} halo={false} />
        <div>
          <div className="font-display text-[13px] font-bold tracking-wide" style={{ color: c.accent }}>
            {label || `${c.naam} spreekt`}
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted">{c.tag}</div>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{children}</div>
    </div>
  )
}

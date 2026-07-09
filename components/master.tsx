'use client'
// Meester Tiě Shān (铁山 — "IJzeren Berg"), de ziel van IRON MONK.
// Handgemaakt vector-portret: sereen, gedisciplineerd, warm aangelicht.
// Geen externe afbeeldingen — schaalbaar, snel en altijd beschikbaar.

export const MASTER = {
  name: 'Tiě Shān',
  hanzi: '铁山',
  title: 'Meester',
  meaning: 'IJzeren Berg',
}

export function MasterPortrait({ size = 180, halo = true }: { size?: number; halo?: boolean }) {
  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {halo && (
        <>
          {/* ademende gloed achter de meester */}
          <div
            className="animate-breathe absolute inset-[-14%] rounded-full"
            style={{ background: 'radial-gradient(50% 50% at 50% 55%, rgba(224,135,58,0.28), transparent 70%)' }}
          />
          {/* langzaam draaiende gebedskrans-ring */}
          <svg viewBox="0 0 100 100" className="animate-halo absolute inset-[-7%]" style={{ opacity: 0.65 }}>
            <circle
              cx="50" cy="50" r="48"
              fill="none" stroke="#d9b36a" strokeWidth="0.7"
              strokeDasharray="0.5 5.6" strokeLinecap="round"
            />
          </svg>
        </>
      )}
      <svg viewBox="0 0 200 200" width={size} height={size} className="relative">
        <defs>
          <radialGradient id="mp-bg" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#2b2115" />
            <stop offset="62%" stopColor="#171208" />
            <stop offset="100%" stopColor="#0d0a06" />
          </radialGradient>
          <linearGradient id="mp-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#caa079" />
            <stop offset="55%" stopColor="#ab8258" />
            <stop offset="100%" stopColor="#7d5c3c" />
          </linearGradient>
          <linearGradient id="mp-skin-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a6845" />
            <stop offset="100%" stopColor="#6b4e33" />
          </linearGradient>
          <linearGradient id="mp-robe" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2953f" />
            <stop offset="55%" stopColor="#b96d2e" />
            <stop offset="100%" stopColor="#7e4520" />
          </linearGradient>
          <linearGradient id="mp-robe-dark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a3018" />
            <stop offset="100%" stopColor="#2c1c0e" />
          </linearGradient>
          <radialGradient id="mp-rim" cx="72%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#f2d193" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#f2d193" stopOpacity="0" />
          </radialGradient>
          <clipPath id="mp-clip"><circle cx="100" cy="100" r="94" /></clipPath>
        </defs>

        <circle cx="100" cy="100" r="94" fill="url(#mp-bg)" />
        <g clipPath="url(#mp-clip)">
          {/* warm licht van rechtsboven */}
          <circle cx="100" cy="100" r="94" fill="url(#mp-rim)" />

          {/* schouders & pij — één schouder ontbloot, Shaolin-stijl */}
          <path d="M22 200 L26 156 Q34 130 62 122 L98 112 L138 122 Q166 130 174 156 L178 200 Z" fill="url(#mp-robe)" />
          <path d="M100 118 L146 132 Q170 141 175 162 L178 200 L96 200 Q92 156 100 118 Z" fill="url(#mp-robe-dark)" />
          {/* plooien in de pij */}
          <path d="M64 200 Q60 164 70 134" stroke="#7e4520" strokeWidth="2.2" fill="none" opacity="0.55" />
          <path d="M44 200 Q42 172 50 148" stroke="#7e4520" strokeWidth="2" fill="none" opacity="0.4" />
          <path d="M108 124 Q104 160 106 200" stroke="#241608" strokeWidth="2.2" fill="none" opacity="0.5" />
          {/* zoom over de schouder */}
          <path d="M96 116 Q120 122 148 134" stroke="#e8b96b" strokeWidth="3" fill="none" opacity="0.65" />

          {/* hals */}
          <path d="M84 96 Q84 120 100 124 Q116 120 116 96 L116 84 L84 84 Z" fill="url(#mp-skin-shade)" />

          {/* hoofd — kaalgeschoren, waardig */}
          <path
            d="M100 22 Q136 22 138 60 Q139 76 134 88 Q128 106 114 112 Q100 117 86 112 Q72 106 66 88 Q61 76 62 60 Q64 22 100 22 Z"
            fill="url(#mp-skin)"
          />
          {/* oren */}
          <path d="M62 70 Q54 68 56 79 Q58 90 66 88 Z" fill="url(#mp-skin-shade)" />
          <path d="M138 70 Q146 68 144 79 Q142 90 134 88 Z" fill="url(#mp-skin)" />
          {/* schedel-highlight */}
          <ellipse cx="112" cy="38" rx="22" ry="12" fill="#e8c48f" opacity="0.35" />

          {/* wenkbrauwen — grijs, rustig */}
          <path d="M72 68 Q80 63 90 66" stroke="#d8cebc" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M110 66 Q120 63 128 68" stroke="#d8cebc" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          {/* gesloten, serene ogen */}
          <path d="M74 76 Q81 80 90 77" stroke="#3a2917" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M110 77 Q119 80 126 76" stroke="#3a2917" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* neus */}
          <path d="M100 76 Q98 88 95 93 Q100 97 105 93 Q102 88 100 76" fill="#8a6845" opacity="0.55" />
          {/* kalme, vriendelijke mond */}
          <path d="M88 103 Q100 109 112 103" stroke="#5d4026" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M92 108 Q100 111 108 108" stroke="#8a6845" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
          {/* karakterlijnen */}
          <path d="M83 92 Q86 95 90 96" stroke="#8a6845" strokeWidth="1.2" fill="none" opacity="0.45" />
          <path d="M117 92 Q114 95 110 96" stroke="#8a6845" strokeWidth="1.2" fill="none" opacity="0.45" />

          {/* rim light langs schedel en schouder */}
          <path d="M124 28 Q138 40 137 62 Q138 76 133 88" stroke="#f2d193" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M146 132 Q166 140 173 158" stroke="#f2d193" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.5" />

          {/* gebedskrans (mala) */}
          {[
            [76, 138], [84, 146], [93, 152], [103, 155], [113, 154], [123, 150], [131, 143],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.6" fill="#5a3a1e" stroke="#c99a58" strokeWidth="1" />
          ))}
          <circle cx="103" cy="155" r="5.6" fill="#7e4520" stroke="#e8b96b" strokeWidth="1.2" />
        </g>
        {/* gouden rand */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="#d9b36a" strokeWidth="1.6" opacity="0.85" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#d9b36a" strokeWidth="0.6" opacity="0.35" />
      </svg>
    </div>
  )
}

// Kaart waarop de meester spreekt — voor briefing, aanbevelingen en quotes.
export function MasterSays({ label = 'Tiě Shān spreekt', children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="card border-amber/20">
      <div className="mb-2 flex items-center gap-2.5">
        <MasterPortrait size={34} halo={false} />
        <div>
          <div className="font-display text-[13px] font-bold tracking-wide text-neon">{label}</div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted">{MASTER.hanzi} · {MASTER.meaning}</div>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{children}</div>
    </div>
  )
}

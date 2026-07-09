'use client'
// Meester Tiě Shān (铁山 — "IJzeren Berg"), de ziel van IRON MONK.
// v2 — de LEVENDE meester: hij ademt, knippert, beweegt subtiel zijn hoofd en
// schouders, zijn pij wiegt zacht mee en af en toe verdiept zijn glimlach.
// Alles is SVG + CSS/SMIL (transform/opacity) — cinematisch maar licht op de
// GPU, geen 3D-model of video nodig. prefers-reduced-motion zet alles stil.

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
          <radialGradient id="mp-mist" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#f1e8d4" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#f1e8d4" stopOpacity="0" />
          </radialGradient>
          <clipPath id="mp-clip"><circle cx="100" cy="100" r="94" /></clipPath>
        </defs>

        <circle cx="100" cy="100" r="94" fill="url(#mp-bg)" />
        <g clipPath="url(#mp-clip)">
          {/* bewegend licht + mist achter hem */}
          <circle cx="100" cy="100" r="94" fill="url(#mp-rim)" className="tsn-light" />
          <ellipse cx="100" cy="150" rx="86" ry="40" fill="url(#mp-mist)" className="tsn-mist" />

          {/* ——— HET LICHAAM ADEMT: schouders/pij heffen zacht ——— */}
          <g className="tsn-body">
            {/* schouders & pij — één schouder ontbloot, Shaolin-stijl */}
            <path d="M22 200 L26 156 Q34 130 62 122 L98 112 L138 122 Q166 130 174 156 L178 200 Z" fill="url(#mp-robe)" />
            <path d="M100 118 L146 132 Q170 141 175 162 L178 200 L96 200 Q92 156 100 118 Z" fill="url(#mp-robe-dark)" />
            {/* plooien — wiegen heel subtiel mee */}
            <g className="tsn-robe">
              <path d="M64 200 Q60 164 70 134" stroke="#7e4520" strokeWidth="2.2" fill="none" opacity="0.55" />
              <path d="M44 200 Q42 172 50 148" stroke="#7e4520" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M108 124 Q104 160 106 200" stroke="#241608" strokeWidth="2.2" fill="none" opacity="0.5" />
            </g>
            {/* zoom over de schouder */}
            <path d="M96 116 Q120 122 148 134" stroke="#e8b96b" strokeWidth="3" fill="none" opacity="0.65" />
            {/* rim light schouder */}
            <path d="M146 132 Q166 140 173 158" stroke="#f2d193" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* gebedskrans (mala) met zachte glinstering */}
            <g className="tsn-mala">
              {[
                [76, 138], [84, 146], [93, 152], [103, 155], [113, 154], [123, 150], [131, 143],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4.6" fill="#5a3a1e" stroke="#c99a58" strokeWidth="1" />
              ))}
              <circle cx="103" cy="155" r="5.6" fill="#7e4520" stroke="#e8b96b" strokeWidth="1.2" />
            </g>

            {/* hals */}
            <path d="M84 96 Q84 120 100 124 Q116 120 116 96 L116 84 L84 84 Z" fill="url(#mp-skin-shade)" />

            {/* ——— HET HOOFD LEEFT: micro-kanteling ——— */}
            <g className="tsn-head">
              <path
                d="M100 22 Q136 22 138 60 Q139 76 134 88 Q128 106 114 112 Q100 117 86 112 Q72 106 66 88 Q61 76 62 60 Q64 22 100 22 Z"
                fill="url(#mp-skin)"
              />
              <path d="M62 70 Q54 68 56 79 Q58 90 66 88 Z" fill="url(#mp-skin-shade)" />
              <path d="M138 70 Q146 68 144 79 Q142 90 134 88 Z" fill="url(#mp-skin)" />
              <ellipse cx="112" cy="38" rx="22" ry="12" fill="#e8c48f" opacity="0.35" />

              {/* wenkbrauwen — grijs, rustig */}
              <path d="M72 66 Q80 61 90 64" stroke="#d8cebc" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M110 64 Q120 61 128 66" stroke="#d8cebc" strokeWidth="2.6" strokeLinecap="round" fill="none" />

              {/* ——— OGEN: zacht open, warme blik — en ze knipperen ——— */}
              <g>
                {/* oogwit/lid-schaduw */}
                <path d="M73 74 Q81 70 90 74 Q81 78.5 73 74 Z" fill="#efe3cd" opacity="0.9" />
                <path d="M110 74 Q119 70 127 74 Q119 78.5 110 74 Z" fill="#efe3cd" opacity="0.9" />
                {/* iris/pupil */}
                <circle cx="81.5" cy="74" r="2.6" fill="#3a2917" />
                <circle cx="118.5" cy="74" r="2.6" fill="#3a2917" />
                <circle cx="82.3" cy="73.2" r="0.8" fill="#f2d193" opacity="0.9" />
                <circle cx="119.3" cy="73.2" r="0.8" fill="#f2d193" opacity="0.9" />
                {/* onderlid-lijn (wijsheid) */}
                <path d="M75 77.5 Q81 79.5 88 77.8" stroke="#8a6845" strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M112 77.8 Q119 79.5 125 77.5" stroke="#8a6845" strokeWidth="1" fill="none" opacity="0.6" />
                {/* oogleden — knipperen (scaleY vanuit het oog-midden) */}
                <g className="tsn-blink">
                  <path d="M72 74 Q81 68.5 91 74 Q81 74.5 72 74 Z" fill="url(#mp-skin)" />
                  <path d="M109 74 Q119 68.5 128 74 Q119 74.5 109 74 Z" fill="url(#mp-skin)" />
                </g>
              </g>

              {/* neus */}
              <path d="M100 76 Q98 88 95 93 Q100 97 105 93 Q102 88 100 76" fill="#8a6845" opacity="0.55" />

              {/* ——— MOND: kalm, en af en toe verdiept de glimlach (SMIL-morph) ——— */}
              <path stroke="#5d4026" strokeWidth="2.4" strokeLinecap="round" fill="none" d="M88 103 Q100 108 112 103">
                <animate
                  attributeName="d"
                  dur="14s"
                  repeatCount="indefinite"
                  keyTimes="0; 0.62; 0.7; 0.84; 0.92; 1"
                  values="M88 103 Q100 108 112 103; M88 103 Q100 108 112 103; M87 102.5 Q100 110.5 113 102.5; M87 102.5 Q100 110.5 113 102.5; M88 103 Q100 108 112 103; M88 103 Q100 108 112 103"
                />
              </path>
              <path d="M92 108 Q100 111 108 108" stroke="#8a6845" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
              {/* karakterlijnen */}
              <path d="M83 92 Q86 95 90 96" stroke="#8a6845" strokeWidth="1.2" fill="none" opacity="0.45" />
              <path d="M117 92 Q114 95 110 96" stroke="#8a6845" strokeWidth="1.2" fill="none" opacity="0.45" />
              {/* rim light schedel */}
              <path d="M124 28 Q138 40 137 62 Q138 76 133 88" stroke="#f2d193" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          </g>
        </g>
        {/* gouden rand */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="#d9b36a" strokeWidth="1.6" opacity="0.85" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#d9b36a" strokeWidth="0.6" opacity="0.35" />

        <style>{`
          .tsn-body { animation: tsnBreath 4.6s ease-in-out infinite; transform-origin: 100px 200px; }
          .tsn-head { animation: tsnHead 9s ease-in-out infinite; transform-origin: 100px 96px; }
          .tsn-robe { animation: tsnRobe 7s ease-in-out infinite; transform-origin: 100px 200px; }
          .tsn-mala { animation: tsnMala 4.6s ease-in-out infinite; transform-origin: 103px 148px; }
          .tsn-blink { animation: tsnBlink 5.2s infinite; transform-origin: 100px 74px; transform-box: view-box; }
          .tsn-light { animation: tsnLight 11s ease-in-out infinite alternate; }
          .tsn-mist { animation: tsnMist 16s ease-in-out infinite alternate; }
          @keyframes tsnBreath {
            0%, 100% { transform: translateY(0) scaleY(1); }
            42% { transform: translateY(-1.6px) scaleY(1.013); }
            58% { transform: translateY(-1.6px) scaleY(1.013); }
          }
          @keyframes tsnHead {
            0%, 100% { transform: rotate(0deg); }
            30% { transform: rotate(-1.1deg) translateY(0.4px); }
            65% { transform: rotate(0.9deg); }
          }
          @keyframes tsnRobe {
            0%, 100% { transform: translateX(0) skewX(0deg); }
            50% { transform: translateX(0.9px) skewX(0.5deg); }
          }
          @keyframes tsnMala {
            0%, 100% { transform: translateY(0); }
            45% { transform: translateY(0.9px); }
          }
          @keyframes tsnBlink {
            0%, 91.5%, 100% { transform: scaleY(0.12); opacity: 0; }
            93.5%, 96% { transform: scaleY(1); opacity: 1; }
            98.5% { transform: scaleY(0.12); opacity: 0; }
          }
          @keyframes tsnLight {
            from { opacity: 0.75; } to { opacity: 1; }
          }
          @keyframes tsnMist {
            from { transform: translateX(-5px); opacity: 0.7; }
            to { transform: translateX(6px); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .tsn-body, .tsn-head, .tsn-robe, .tsn-mala, .tsn-blink, .tsn-light, .tsn-mist { animation: none !important; }
            .tsn-blink { opacity: 0; }
          }
        `}</style>
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

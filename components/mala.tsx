'use client'
// De Mala: 108 kralen in een cirkel, per streng gekleurd. Verdiende kralen
// branden warm; de rest wacht. Onderaan de guru-kraal (meesterkraal).
import type { Strand } from '@/lib/mala'
import { malaBeads } from '@/lib/mala'

export function MalaRing({
  strands,
  lit,
  total,
  guru,
  size = 300,
}: {
  strands: Strand[]
  lit: number
  total: number
  guru: boolean
  size?: number
}) {
  const beads = malaBeads(strands)
  const c = size / 2
  const R = size / 2 - 22 // ringradius
  const bead = 7

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto block max-w-full">
      <defs>
        <radialGradient id="malaCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(217,179,106,0.10)" />
          <stop offset="100%" stopColor="rgba(217,179,106,0)" />
        </radialGradient>
      </defs>

      {/* zachte gloed in het midden */}
      <circle cx={c} cy={c} r={R - 6} fill="url(#malaCore)" />

      {/* de draad */}
      <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(217,179,106,0.14)" strokeWidth="1" />

      {/* 108 kralen — start bovenaan (−90°), met de knoop/guru onderaan */}
      {beads.map((b, i) => {
        // laat een kleine opening onderaan voor de guru-kraal
        const gapDeg = 14
        const span = 360 - gapDeg
        const theta = (-90 + gapDeg / 2 + (i / (beads.length - 1)) * span) * (Math.PI / 180)
        const x = c + R * Math.cos(theta)
        const y = c + R * Math.sin(theta)
        return (
          <g key={i}>
            {b.lit && <circle cx={x} cy={y} r={bead + 2.5} fill={b.color} opacity={0.22} />}
            <circle
              cx={x}
              cy={y}
              r={bead}
              fill={b.lit ? b.color : 'rgba(60,50,36,0.55)'}
              stroke={b.lit ? 'rgba(255,240,214,0.55)' : 'rgba(217,179,106,0.12)'}
              strokeWidth={b.lit ? 1 : 0.75}
            />
          </g>
        )
      })}

      {/* guru-kraal onderaan */}
      <g>
        <circle
          cx={c}
          cy={c + R + 2}
          r={guru ? 13 : 11}
          fill={guru ? '#d9b36a' : 'rgba(60,50,36,0.7)'}
          stroke={guru ? 'rgba(255,240,214,0.7)' : 'rgba(217,179,106,0.2)'}
          strokeWidth="1.5"
        />
        {guru && <circle cx={c} cy={c + R + 2} r={17} fill="#d9b36a" opacity={0.2} />}
        <text x={c} y={c + R + 6} textAnchor="middle" fontSize="12" fill={guru ? '#1a140c' : 'rgba(217,179,106,0.5)'}>
          尊
        </text>
      </g>

      {/* centrum: teller */}
      <text x={c} y={c - 8} textAnchor="middle" className="num" fontSize="34" fontWeight="700" fill="#e8d5b7">
        {lit}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="12" fill="rgba(217,179,106,0.6)" letterSpacing="3">
        / {total} KRALEN
      </text>
    </svg>
  )
}

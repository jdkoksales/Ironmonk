'use client'
import { todayISO, addDays } from '@/lib/game'

export function Ring({ v = 0, size = 150, stroke = 11, color = '#00E5A0', track = '#16202A', children }: any) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, v)) / 100)
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ filter: `drop-shadow(0 0 8px ${color}55)`, transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Spark({ data = [], w = 300, h = 64, color = '#00E5A0' }: any) {
  const vals = data.filter((v: any) => v != null).map(Number)
  if (vals.length < 2)
    return <div className="flex h-16 items-center justify-center text-xs text-muted">Nog te weinig data</div>
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const pts = vals.map(
    (v: number, i: number) => `${(i / (vals.length - 1)) * w},${h - 6 - ((v - min) / span) * (h - 12)}`
  )
  const last = pts[pts.length - 1].split(',')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" height={h} preserveAspectRatio="none">
      <polyline points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={color + '14'} stroke="none" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}

export function XPBar({ pct = 0 }: any) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet to-neon transition-all duration-700"
        style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(139,92,246,.6)' }}
      />
    </div>
  )
}

export function Slider({ label, value, onChange, min = 0, max = 10, step = 1, color = '#00E5A0', low, high }: any) {
  return (
    <div className="py-2">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-ink">{label}</span>
        <span className="num font-display text-lg font-semibold" style={{ color }}>
          {value ?? '–'}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? Math.round((min + max) / 2)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ ['--c' as any]: color }}
      />
      {(low || high) && (
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{low}</span>
          <span>{high}</span>
        </div>
      )}
    </div>
  )
}

export function Stepper({ label, value, onChange, step = 1, unit = '', min = 0 }: any) {
  const v = value ?? null
  const set = (n: number) => onChange(Math.max(min, Math.round(n * 100) / 100))
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => set((v ?? 0) - step)} className="btn-step">
          −
        </button>
        <div className="min-w-[76px] text-center">
          <input
            inputMode="decimal"
            value={v ?? ''}
            placeholder="–"
            onChange={(e) => {
              const n = parseFloat(e.target.value.replace(',', '.'))
              onChange(isNaN(n) ? null : n)
            }}
            className="num w-[76px] rounded-lg border border-line bg-panel2 px-1 py-1.5 text-center font-display text-base text-ink outline-none focus:border-neon"
          />
          {unit && <div className="text-[10px] text-muted">{unit}</div>}
        </div>
        <button type="button" onClick={() => set((v ?? 0) + step)} className="btn-step">
          +
        </button>
      </div>
    </div>
  )
}

export function Chips({ options, values = [], onToggle }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o: string) => {
        const on = values.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${
              on
                ? 'border-neon bg-neon/10 text-neon shadow-[0_0_12px_rgba(0,229,160,.25)]'
                : 'border-line bg-panel2 text-muted'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export function Dots({ dates }: any) {
  const set = new Set(dates)
  const days: string[] = []
  for (let i = 13; i >= 0; i--) days.push(addDays(todayISO(), -i))
  return (
    <div className="flex items-center justify-between">
      {days.map((d) => (
        <div
          key={d}
          className={`h-2.5 w-2.5 rounded-full ${
            set.has(d) ? 'bg-neon shadow-[0_0_8px_rgba(0,229,160,.7)]' : 'border border-line bg-panel2'
          }`}
        />
      ))}
    </div>
  )
}

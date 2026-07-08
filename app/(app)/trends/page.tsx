'use client'
import { useApp } from '@/lib/store'
import { Spark } from '@/components/viz'
import { todayISO } from '@/lib/game'

const METRICS = [
  { key: 'weight', label: 'Gewicht', unit: 'kg', color: '#00E5A0', dec: 1 },
  { key: 'rhr', label: 'Rusthartslag', unit: 'bpm', color: '#FF4D5E', dec: 0 },
  { key: 'sleep_hours', label: 'Slaap', unit: 'uur', color: '#8B5CF6', dec: 1 },
  { key: 'energy', label: 'Energie', unit: '/10', color: '#FFB020', dec: 0 },
]

export default function Trends() {
  const app = useApp()
  if (!app?.profile) return null

  const asc = [...app.checkins].reverse().slice(-30)
  const now = new Date(todayISO() + 'T12:00:00').getTime()

  const weekCounts: { label: string; n: number }[] = []
  for (let w = 5; w >= 0; w--) weekCounts.push({ label: w === 0 ? 'nu' : `-${w}w`, n: 0 })
  app.checkins.forEach((c: any) => {
    const diff = Math.floor((now - new Date(c.date + 'T12:00:00').getTime()) / 86400000)
    const bucket = Math.floor(diff / 7)
    if (bucket >= 0 && bucket < 6) {
      const trained = (c.training_types || []).filter((t: string) => t !== 'Rustdag').length > 0
      if (trained) weekCounts[5 - bucket].n++
    }
  })
  const maxW = Math.max(1, ...weekCounts.map((w) => w.n))

  const totMed = app.checkins.reduce((a: number, c: any) => a + (c.meditation_min || 0), 0)

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">Laatste 30 dagen</p>
        <h1 className="font-display text-xl font-bold text-ink">Trends</h1>
      </div>

      {METRICS.map((m) => {
        const series = asc.map((c: any) => c[m.key])
        const defined = series.filter((v: any) => v != null).map(Number)
        const lastV = defined.length ? defined[defined.length - 1] : null
        const delta = defined.length >= 2 ? defined[defined.length - 1] - defined[0] : null
        return (
          <section key={m.key} className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="lbl">{m.label}</span>
              <span className="num font-display text-xl font-bold" style={{ color: m.color }}>
                {lastV != null ? lastV.toFixed(m.dec) : '–'}
                <span className="ml-1 text-xs font-normal text-muted">{m.unit}</span>
                {delta != null && Math.abs(delta) >= 0.05 && (
                  <span className="ml-2 text-xs font-normal text-muted">
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(m.dec)} /30d
                  </span>
                )}
              </span>
            </div>
            <Spark data={series} color={m.color} />
          </section>
        )
      })}

      <section className="card">
        <p className="lbl mb-3">Trainingsdagen per week</p>
        <div className="flex h-24 items-end justify-between gap-2">
          {weekCounts.map((w, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="num text-[10px] text-muted">{w.n || ''}</span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${Math.max(4, (w.n / maxW) * 78)}%`,
                  background: w.n ? '#00E5A0' : '#1D2830',
                  boxShadow: w.n ? '0 0 10px rgba(0,229,160,.3)' : 'none',
                }}
              />
              <span className="text-[10px] text-muted">{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { v: app.checkins.length, l: 'Check-ins' },
          { v: totMed, l: 'Min. meditatie' },
          { v: app.tests.length, l: 'Testmetingen' },
        ].map((x) => (
          <div key={x.l} className="card p-3 text-center">
            <div className="num font-display text-2xl font-bold text-ink">{x.v}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">{x.l}</div>
          </div>
        ))}
      </section>
      <div className="h-2" />
    </div>
  )
}

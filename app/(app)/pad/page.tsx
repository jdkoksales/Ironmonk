'use client'
// Bergpad (Mountain Path): De visuele bergklim naar Dengfeng. Elke dag een steen,
// elke week een stap hoger. Fase-overgangen zijn poortwachtersproeven, rustdagen
// theehuis-haltes. Tik op een dag om de blokken van die dag te zien.
import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, daysUntil, effectiveStreak } from '@/lib/game'

const W = 280
const H = 600
const PAD = 34
const CX = W / 2

type PathDay = {
  date: string
  week_no: number
  day_no: number
  title: string
  is_rest: boolean
  is_complete: boolean
  phase_target: number
  is_phase_transition: boolean
  blockLabels: string[]
  x: number
  y: number
}

const fmt = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

// Slingerend bergpad van de vallei (onder) naar de tempel (boven). Puur op index,
// zodat het pad stabiel is ongeacht hoeveel dagen er zijn.
function mountainPath(n: number): string {
  if (n === 0) return ''
  let d = `M ${CX} ${H - PAD}`
  const step = (H - 2 * PAD) / Math.max(n, 1)
  let y = H - PAD
  for (let i = 0; i < n; i++) {
    y -= step
    const side = i % 2 === 0 ? 1 : -1
    const wave = Math.sin((i / n) * Math.PI * 4) * (W / 6)
    const x = CX + wave + side * 20
    if (i % 3 === 0) {
      const nextY = i < n - 1 ? y - step : y
      d += ` Q ${x + side * 30} ${y} ${x} ${nextY}`
    } else {
      d += ` L ${x} ${y}`
    }
  }
  return d
}

export default function Bergpad() {
  const app = useApp()
  const today = todayISO()
  const plan = app?.plan || []
  const profile = app?.profile || {}
  const checkins = app?.checkins || []

  const [selected, setSelected] = useState<PathDay | null>(null)
  const [pathEl, setPathEl] = useState<SVGPathElement | null>(null)

  const pathDays = useMemo<PathDay[]>(() => {
    return plan.map((d: any, i: number) => {
      const total = (d.blocks || []).reduce((x: number, b: any) => x + b.items.length, 0)
      const isComplete = !!d.completed_at || (d.done_keys?.length && d.done_keys.length >= total && total > 0)
      const prev = i > 0 ? plan[i - 1] : null
      return {
        date: d.date,
        week_no: d.week_no,
        day_no: d.day_no,
        title: d.title,
        is_rest: !!d.is_rest,
        is_complete: !!isComplete,
        phase_target: d.phase_target,
        is_phase_transition: prev ? d.phase_target > prev.phase_target : false,
        blockLabels: (d.blocks || []).map((b: any) => b.label),
        x: 0,
        y: 0,
      }
    })
  }, [plan])

  const pathData = useMemo(() => mountainPath(pathDays.length), [pathDays.length])

  // Plaats elke dag op het pad zodra de <path> gemeten kan worden.
  const positioned = useMemo(() => {
    if (!pathEl || pathDays.length === 0) return pathDays
    const len = pathEl.getTotalLength()
    return pathDays.map((d, i) => {
      const p = pathEl.getPointAtLength((i / Math.max(pathDays.length - 1, 1)) * len)
      return { ...d, x: p.x, y: p.y }
    })
  }, [pathDays, pathEl])

  const curIndex = positioned.findIndex((d) => d.date === today)
  const cur = curIndex >= 0 ? positioned[curIndex] : null

  const streak = effectiveStreak(checkins.map((c: any) => c.date), profile.shield_dates || [])
  const dep = daysUntil(profile.departure_date)
  const doneCount = pathDays.filter((d) => d.is_complete).length

  if (!app?.profile) return null

  if (!plan.length)
    return (
      <div className="space-y-4 pt-4">
        <div>
          <p className="lbl">Jouw Bergpad</p>
          <h1 className="font-display text-xl font-bold text-ink">De klim naar Dengfeng</h1>
        </div>
        <div className="card text-sm text-muted">Nog geen schema geladen — open Vandaag om je pad op te bouwen.</div>
      </div>
    )

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">Jouw Bergpad</p>
        <h1 className="font-display text-xl font-bold text-ink">De klim naar Dengfeng</h1>
        <p className="mt-1 text-xs text-muted">
          {curIndex >= 0 ? `Dag ${curIndex + 1} van ${pathDays.length}` : 'Je pad wacht'} · {doneCount} volbracht · streak {streak}
          {dep != null ? ` · nog ${dep} dagen` : ''}
        </p>
      </div>

      <div className="card !p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ height: 'auto' }}>
          <defs>
            <linearGradient id="padSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(217,179,106,0.08)" />
              <stop offset="55%" stopColor="rgba(20,15,10,0)" />
              <stop offset="100%" stopColor="rgba(42,33,20,0.35)" />
            </linearGradient>
          </defs>

          <rect width={W} height={H} fill="url(#padSky)" />

          {/* bergsilhouet */}
          <path
            d={`M 0 ${H * 0.62} Q ${W * 0.2} ${H * 0.46} ${W * 0.36} ${H * 0.55} Q ${W * 0.5} ${H * 0.36} ${W * 0.66} ${H * 0.55} Q ${W * 0.82} ${H * 0.46} ${W} ${H * 0.62} L ${W} ${H} L 0 ${H} Z`}
            fill="rgba(60,50,40,0.18)"
          />

          {/* het pad */}
          <path ref={setPathEl} d={pathData} stroke="rgba(217,179,106,0.32)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* dagmarkers — pas tonen als het pad gemeten is */}
          {pathEl &&
            positioned.map((day) => {
              const isToday = day.date === today
              return (
                <g key={day.date} style={{ cursor: 'pointer' }} onClick={() => setSelected(day)}>
                  {day.is_complete && <circle cx={day.x} cy={day.y} r="9" fill="#d9b36a" opacity="0.22" className="pad-glow" />}
                  <circle
                    cx={day.x}
                    cy={day.y}
                    r={isToday ? 7 : day.is_complete ? 6 : 4.5}
                    fill={isToday || day.is_complete ? '#d9b36a' : 'rgba(217,179,106,0.28)'}
                    stroke={isToday ? 'rgba(255,240,214,0.85)' : day.is_complete ? 'rgba(217,179,106,0.5)' : 'rgba(217,179,106,0.2)'}
                    strokeWidth={isToday ? 2 : 1.25}
                  />
                  {day.is_phase_transition && (
                    <>
                      <circle cx={day.x} cy={day.y} r="11" fill="none" stroke="#e8d5b7" strokeWidth="1.25" opacity="0.55" />
                      <text x={day.x} y={day.y - 15} textAnchor="middle" fontSize="8" fill="#e8d5b7" opacity="0.7">
                        Fase {day.phase_target}
                      </text>
                    </>
                  )}
                  {day.is_rest && (
                    <text x={day.x} y={day.y + 15} textAnchor="middle" fontSize="9">
                      ☕
                    </text>
                  )}
                </g>
              )
            })}

          {/* de klimmer op de huidige positie */}
          {pathEl && cur && (
            <text x={cur.x} y={cur.y - 11} textAnchor="middle" fontSize="15">
              🧗
            </text>
          )}

          {/* de tempel bovenaan */}
          <text x={CX} y="22" textAnchor="middle" fontSize="22">
            ⛩️
          </text>
          <text x={CX} y="40" textAnchor="middle" fontSize="9" fill="#e8d5b7" opacity="0.75" letterSpacing="1">
            DENGFENG
          </text>
        </svg>

        <style jsx>{`
          .pad-glow {
            animation: padPulse 2.4s ease-in-out infinite;
          }
          @keyframes padPulse {
            0%,
            100% {
              opacity: 0.28;
            }
            50% {
              opacity: 0.08;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .pad-glow {
              animation: none;
            }
          }
        `}</style>
      </div>

      {/* legenda */}
      <div className="card !p-3">
        <div className="grid grid-cols-2 gap-y-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-neon" />
            <span className="text-muted">Volbracht</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-neon/40 bg-neon/25" />
            <span className="text-muted">Nog te gaan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]">☕</span>
            <span className="text-muted">Rustdag</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]">⛩️</span>
            <span className="text-muted">Dengfeng — het doel</span>
          </div>
        </div>
      </div>

      {/* dagdetail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom),24px)]"
            style={{
              background: 'linear-gradient(170deg, rgba(42,33,20,0.95), rgba(14,11,7,0.98))',
              borderTop: '1px solid rgba(217,179,106,0.28)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 -18px 60px rgba(0,0,0,0.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="lbl">
                  Week {selected.week_no} · dag {selected.day_no} · fase {selected.phase_target}
                </p>
                <h3 className="font-display text-lg font-bold leading-tight text-ink">{selected.title}</h3>
                <p className="mt-0.5 text-xs capitalize text-muted">
                  {fmt(selected.date)}
                  {selected.is_complete ? ' · ✓ volbracht' : selected.date === today ? ' · vandaag' : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted">
                <X size={15} />
              </button>
            </div>

            {selected.is_phase_transition && (
              <div className="mb-3 rounded-lg border border-amber/30 bg-amber/10 p-3">
                <p className="text-xs font-semibold text-amber">Poortwachtersproef — fase {selected.phase_target}</p>
                <p className="mt-1 text-xs leading-relaxed text-amber/90">
                  Een nieuwe fase ontsluit. Impact (springen, hardlopen, trappen) pas als je de fasecriteria haalt.
                </p>
              </div>
            )}

            {selected.is_rest ? (
              <div className="rounded-lg bg-panel2/70 p-3 text-center">
                <p className="text-sm text-ink">Theehuis · rustdag ☕</p>
                <p className="mt-1 text-xs text-muted">Herstel is training. Adem, mediteer, laad op.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selected.blockLabels.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-panel2/60 px-3 py-2 text-sm text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon/70" />
                    {label}
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-muted">Open Vandaag of Schema voor de oefeningen, sets en reps.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
// Bergpad (Mountain Path): De visuele bergklim naar Dengfeng. Elke dag een steen,
// elke week een stap hoger. Fase-overgangen zijn poortwachters-proeven.
// Rust-weken zijn theehuis-haltes. Tap om een dag in te zien.
import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, daysUntil, streakFrom } from '@/lib/game'
import { isDeload, isTaper } from '@/lib/plan'

interface PathDay {
  date: string
  week_no: number
  day_no: number
  title: string
  is_rest?: boolean
  is_complete?: boolean
  phase_target: number
  is_phase_transition?: boolean
  position: number // 0-1 along the path
  x: number
  y: number
}

const DOW = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const fmt = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// SVG path generator: winding mountain trail from valley → mountain → temple
function generateMountainPath(days: PathDay[]): string {
  if (days.length === 0) return ''

  const width = 280
  const height = 600
  const padding = 30

  // Create path segments that wind side-to-side as we go up
  let pathData = `M ${width / 2} ${height - padding}`
  let x = width / 2
  let y = height - padding
  const stepHeight = (height - 2 * padding) / Math.max(days.length, 1)

  for (let i = 0; i < days.length; i++) {
    y -= stepHeight
    // Alternate side to side for winding effect
    const side = i % 2 === 0 ? 1 : -1
    const wave = Math.sin((i / days.length) * Math.PI * 4) * (width / 6)
    x = width / 2 + wave + side * 20

    if (i % 3 === 0) {
      // Curve segments for organic feel
      const nextY = i < days.length - 1 ? y - stepHeight : y
      pathData += ` Q ${x + side * 30} ${y} ${x} ${nextY}`
    } else {
      pathData += ` L ${x} ${y}`
    }
  }

  return pathData
}

// Position marker for character on path
function positionOnPath(pathElement: SVGPathElement | null, t: number): { x: number; y: number } {
  if (!pathElement) return { x: 150, y: 500 }
  const length = pathElement.getTotalLength()
  const point = pathElement.getPointAtLength(t * length)
  return { x: point.x, y: point.y }
}

export default function Bergpad() {
  const app = useApp()
  const today = todayISO()
  const plan = app?.plan || []
  const profile = app?.profile || {}
  const checkins = app?.checkins || []

  const [selectedDay, setSelectedDay] = useState<PathDay | null>(null)
  const [pathRef, setPathRef] = useState<SVGPathElement | null>(null)

  // Build path data with positions
  const pathDays = useMemo(() => {
    const completed = new Set(checkins.map((c: any) => c.date))
    const days: PathDay[] = []
    const totalDays = plan.length
    const checkPhaseChange = (prev: number, curr: number) => curr > prev

    for (let i = 0; i < plan.length; i++) {
      const d = plan[i]
      const prev = i > 0 ? plan[i - 1] : null
      const isPrev = i > 0 && plan[i - 1].completed_at
      const isCurr =
        d.completed_at || (d.done_keys?.length && d.done_keys.length >= d.blocks.reduce((x: number, b: any) => x + b.items.length, 0))

      days.push({
        date: d.date,
        week_no: d.week_no,
        day_no: d.day_no,
        title: d.title,
        is_rest: d.is_rest,
        is_complete: isCurr,
        phase_target: d.phase_target,
        is_phase_transition: prev ? checkPhaseChange(prev.phase_target, d.phase_target) : false,
        position: i / totalDays,
        x: 0,
        y: 0,
      })
    }
    return days
  }, [plan, checkins])

  // Calculate x,y for each day on the path
  const positionedDays = useMemo(() => {
    if (!pathRef || pathDays.length === 0) return pathDays

    return pathDays.map((d, i) => {
      const length = pathRef.getTotalLength()
      const point = pathRef.getPointAtLength((i / pathDays.length) * length)
      return { ...d, x: point.x, y: point.y }
    })
  }, [pathDays, pathRef])

  // Current position on path
  const currentDayIndex = positionedDays.findIndex((d) => d.date === today)
  const currentPos = currentDayIndex >= 0 ? currentDayIndex / Math.max(pathDays.length, 1) : 0
  const currentPoint = pathRef && currentDayIndex >= 0 ? positionOnPath(pathRef, currentPos) : { x: 150, y: 500 }

  const streak = streakFrom(checkins.map((c: any) => c.date))
  const dep = daysUntil(profile.departure_date)
  const phase = profile.current_phase || 1

  const pathData = generateMountainPath(positionedDays)

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div>
        <p className="lbl">Jouw Bergpad</p>
        <h1 className="font-display text-xl font-bold text-ink">De klim naar Dengfeng</h1>
        <p className="mt-1 text-xs text-muted">
          {currentDayIndex >= 0 ? `Dag ${currentDayIndex + 1}/${pathDays.length}` : 'Bereid je voor'} · Streak {streak}{' '}
          {dep != null ? ` · nog ${dep} dagen tot vertrek` : ''}
        </p>
      </div>

      {/* Mountain Path Visualization */}
      <div className="card !p-3">
        <svg viewBox="0 0 280 600" className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Path */}
          <g>
            {/* Sky gradient background */}
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(20, 15, 10, 0.3)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(42, 33, 20, 0.5)', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(217, 179, 106, 0.2)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(192, 121, 78, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            {/* Background */}
            <rect width="280" height="600" fill="url(#skyGrad)" />

            {/* Mountain silhouette (subtle) */}
            <path
              d="M 0 400 Q 50 300 100 350 Q 140 250 200 350 Q 240 300 280 400 L 280 600 L 0 600 Z"
              fill="rgba(60, 50, 40, 0.2)"
              opacity="0.3"
            />

            {/* Main path line */}
            <path
              ref={setPathRef}
              d={pathData}
              stroke="rgba(217, 179, 106, 0.4)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Path fill for visual depth */}
            <path d={pathData} stroke="url(#pathGrad)" strokeWidth="1.5" fill="none" opacity="0.6" />

            {/* Day markers */}
            {positionedDays.map((day, idx) => {
              const isToday = day.date === today
              const isFuture = day.date > today
              const phaseChanged = day.is_phase_transition

              return (
                <g key={day.date}>
                  {/* Glow for completed days */}
                  {day.is_complete && (
                    <circle
                      cx={day.x}
                      cy={day.y}
                      r="10"
                      fill="rgba(217, 179, 106, 0.3)"
                      opacity="0.6"
                      style={{
                        animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) ${idx * 0.1}s infinite`,
                      }}
                    />
                  )}

                  {/* Main stone/checkpoint */}
                  <circle
                    cx={day.x}
                    cy={day.y}
                    r={isToday ? 7 : day.is_complete ? 6 : 4.5}
                    fill={isToday ? '#d9b36a' : day.is_complete ? '#d9b36a' : 'rgba(217, 179, 106, 0.3)'}
                    stroke={
                      isToday
                        ? 'rgba(217, 179, 106, 0.8)'
                        : day.is_complete
                          ? 'rgba(217, 179, 106, 0.5)'
                          : 'rgba(217, 179, 106, 0.2)'
                    }
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDay(day)}
                  />

                  {/* Phase transition marker (gate) */}
                  {phaseChanged && (
                    <>
                      <circle cx={day.x} cy={day.y - 16} r="8" fill="none" stroke="#e8d5b7" strokeWidth="1.5" opacity="0.5" />
                      <text x={day.x} y={day.y - 32} textAnchor="middle" fontSize="8" fill="#e8d5b7" opacity="0.6">
                        Fase {day.phase_target}
                      </text>
                    </>
                  )}

                  {/* Rest day marker (teahouse) */}
                  {day.is_rest && (
                    <g>
                      <path
                        d={`M ${day.x - 6} ${day.y + 8} L ${day.x} ${day.y + 12} L ${day.x + 6} ${day.y + 8}`}
                        fill="none"
                        stroke="rgba(100, 180, 200, 0.4)"
                        strokeWidth="1"
                      />
                      <text x={day.x} y={day.y + 18} textAnchor="middle" fontSize="7" fill="rgba(100, 180, 200, 0.5)">
                        ☕
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* Character (current position) */}
            {currentDayIndex >= 0 && (
              <g>
                <circle cx={currentPoint.x} cy={currentPoint.y - 12} r="8" fill="#d9b36a" opacity="0.8" />
                <text x={currentPoint.x} y={currentPoint.y - 6} textAnchor="middle" fontSize="10">
                  🏔️
                </text>
              </g>
            )}

            {/* Temple at top (goal) */}
            <g>
              <text x="140" y="25" textAnchor="middle" fontSize="20">
                ⛩️
              </text>
              <text x="140" y="42" textAnchor="middle" fontSize="9" fill="#e8d5b7" opacity="0.7">
                Dengfeng
              </text>
            </g>
          </g>
        </svg>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              r: 10px;
              opacity: 0.3;
            }
            50% {
              r: 14px;
              opacity: 0.1;
            }
          }
        `}</style>
      </div>

      {/* Legend */}
      <div className="card !p-3">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="text-muted">Afgerond</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/30" />
            <span className="text-muted">Toekomst</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⛩️</span>
            <span className="text-muted">Doel (Dengfeng)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>☕</span>
            <span className="text-muted">Rustdag</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedDay(null)}
        >
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
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="lbl">Dag {selectedDay.day_no} · Week {selectedDay.week_no}</p>
                <h3 className="font-display text-lg font-bold leading-tight text-ink">{selectedDay.title}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {fmt(selectedDay.date)}
                  {selectedDay.is_complete && ' ✓ Afgerond'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content from plan_days */}
            <div className="space-y-3">
              {selectedDay.is_rest ? (
                <div className="rounded-lg bg-panel2/70 p-3 text-center">
                  <p className="text-sm text-ink">Rustdag ☕</p>
                  <p className="mt-1 text-xs text-muted">Herstellen en voorbereiding op volgende week.</p>
                </div>
              ) : (
                <>
                  {selectedDay.is_phase_transition && (
                    <div className="rounded-lg border border-amber/30 bg-amber/10 p-3">
                      <p className="text-xs font-semibold text-amber">Fase {selectedDay.phase_target} begint</p>
                      <p className="mt-1 text-xs text-amber/90">Poortwachtersproef — nieuwe uitdagingen ontsluiten.</p>
                    </div>
                  )}
                  <div className="text-xs text-muted">
                    <p>Oefeningsblokkken voor deze dag kunnen in het Schema worden bekeken.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

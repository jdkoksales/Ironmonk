'use client'
// Schema-overzicht: het volledige 12-weken-pad, vooruit én terug bladerbaar.
// Puur database-lookup (plan_days) — geen AI-calls.
import { useMemo, useState } from 'react'
import { ChevronDown, CheckCircle2, Circle, BatteryLow, FlaskConical, MapPin, PlayCircle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, daysUntil } from '@/lib/game'
import { PROGRAM_WEEKS, isDeload, isTaper, RETEST_WEEKS } from '@/lib/plan'
import { findExercise } from '@/lib/exercises'
import { ExerciseSheet } from '@/components/exercise-sheet'

const fmt = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const DOW = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

export default function Schema() {
  const app = useApp()
  const today = todayISO()
  const plan = app?.plan || []

  const weeks = useMemo(() => {
    const map = new Map<number, any[]>()
    for (const d of plan) {
      if (!map.has(d.week_no)) map.set(d.week_no, [])
      map.get(d.week_no)!.push(d)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([no, days]) => ({ no, days: days.sort((a: any, b: any) => a.day_no - b.day_no) }))
  }, [plan])

  const curWeekNo = plan.find((d: any) => d.date === today)?.week_no ?? null
  const [openWeek, setOpenWeek] = useState<number | null>(curWeekNo ?? (weeks[0]?.no ?? null))
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [demo, setDemo] = useState<{ ex: any; name: string } | null>(null)

  if (!app?.profile) return null

  const dep = daysUntil(app.profile.departure_date)
  const phase = app.profile.current_phase || 1

  if (!plan.length)
    return (
      <div className="pt-4">
        <div className="card text-sm text-muted">Nog geen schema geladen — open Vandaag om het op te bouwen.</div>
      </div>
    )

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">12-weken-pad naar Dengfeng</p>
        <h1 className="font-display text-xl font-bold text-ink">Schema</h1>
        <p className="mt-1 text-xs text-muted">
          {curWeekNo ? `Week ${curWeekNo} van ${PROGRAM_WEEKS}` : `Start ${fmt(plan[0].date)}`} · enkelfase {phase}
          {dep != null ? ` · nog ${dep} dagen tot vertrek` : ''}
        </p>
      </div>

      {weeks.map((w) => {
        const open = openWeek === w.no
        const isCur = w.no === curWeekNo
        const doneDays = w.days.filter(
          (d: any) =>
            d.completed_at ||
            (d.done_keys?.length && d.done_keys.length >= d.blocks.reduce((x: number, b: any) => x + b.items.length, 0))
        ).length
        return (
          <section key={w.no} className={`card ${isCur ? 'border-neon/40' : ''}`}>
            <button onClick={() => setOpenWeek(open ? null : w.no)} className="flex w-full items-center gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-bold ${
                  isCur ? 'bg-neon/15 text-neon' : 'bg-panel2 text-muted'
                }`}
              >
                W{w.no}
              </span>
              <div className="flex-1 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">
                    {fmt(w.days[0].date)} – {fmt(w.days[w.days.length - 1].date)}
                  </span>
                  {isCur && (
                    <span className="flex items-center gap-0.5 rounded-full bg-neon/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">
                      <MapPin size={9} /> nu
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted">
                  <span>Fase {w.days[0].phase_target}</span>
                  {isDeload(w.no) && (
                    <span className="flex items-center gap-0.5 text-azure">
                      <BatteryLow size={10} /> deload
                    </span>
                  )}
                  {isTaper(w.no) && <span className="text-violet">taper</span>}
                  {RETEST_WEEKS.includes(w.no) && (
                    <span className="flex items-center gap-0.5 text-amber">
                      <FlaskConical size={10} /> hertest / ijkpunt
                    </span>
                  )}
                  <span className="num">{doneDays}/7 dagen</span>
                </div>
              </div>
              <ChevronDown size={17} className={`shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="mt-3 space-y-2">
                {RETEST_WEEKS.includes(w.no) && (
                  <p className="rounded-lg border border-amber/30 bg-amber/10 p-2.5 text-xs leading-relaxed text-amber">
                    IJkpuntweek: herhaal deze week je testbatterij op de Testen-pagina — het Kompas rekent er je
                    koers mee bij.
                  </p>
                )}
                {w.days.map((d: any) => {
                  const total = d.blocks.reduce((x: number, b: any) => x + b.items.length, 0)
                  const done = (d.done_keys || []).length
                  const isToday = d.date === today
                  const past = d.date < today
                  const dOpen = openDay === d.id
                  return (
                    <div
                      key={d.id}
                      className={`rounded-xl bg-panel2 ${isToday ? 'ring-1 ring-neon/50' : ''}`}
                    >
                      <button onClick={() => setOpenDay(dOpen ? null : d.id)} className="flex w-full items-center gap-2.5 p-3">
                        <span
                          className={`w-8 shrink-0 text-center font-display text-[11px] font-bold uppercase ${
                            isToday ? 'text-neon' : 'text-muted'
                          }`}
                        >
                          {DOW[d.day_no - 1]}
                          <span className="block num text-[10px] font-normal">{fmt(d.date).split(' ')[0]}</span>
                        </span>
                        <div className="flex-1 text-left">
                          <div className={`text-sm ${d.is_rest ? 'text-muted' : 'text-ink'}`}>{d.title}</div>
                          <div className="text-[10px] text-muted">{d.subtitle}</div>
                        </div>
                        <span className="num shrink-0 text-[11px] text-muted">
                          {past || done > 0 ? (
                            done >= total && total > 0 ? (
                              <CheckCircle2 size={16} className="text-neon" />
                            ) : (
                              `${done}/${total}`
                            )
                          ) : (
                            <Circle size={14} className="text-line" />
                          )}
                        </span>
                        <ChevronDown size={14} className={`shrink-0 text-muted transition ${dOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {dOpen && (
                        <div className="space-y-2.5 px-3 pb-3">
                          {d.coach_note && (
                            <p className="rounded-lg border border-neon/30 bg-neon/10 p-2 text-[11px] text-ink">
                              <span className="font-semibold text-neon">Coach-focus:</span> {d.coach_note}
                            </p>
                          )}
                          {d.blocks.map((b: any, bi: number) => (
                            <div key={bi}>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">{b.label}</p>
                              <div className="space-y-1">
                                {b.items.map((it: any) => {
                                  const checked = (d.done_keys || []).includes(it.key)
                                  const ex = findExercise(it.name)
                                  return (
                                    <button
                                      key={it.key}
                                      onClick={() => ex && setDemo({ ex, name: it.name })}
                                      disabled={!ex}
                                      className="flex w-full items-start gap-2 text-left"
                                    >
                                      {checked ? (
                                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-neon" />
                                      ) : (
                                        <Circle size={13} className="mt-0.5 shrink-0 text-line" />
                                      )}
                                      <p className="flex-1 text-xs leading-snug">
                                        <span className={checked ? 'text-muted line-through' : 'text-ink'}>{it.name}</span>{' '}
                                        <span className="text-muted">— {it.detail}</span>
                                      </p>
                                      {ex && <PlayCircle size={12} className="mt-0.5 shrink-0 text-copper" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          {d.date > today && (
                            <p className="text-center text-[10px] uppercase tracking-widest text-muted">
                              vooruitblik — afvinken kan op de dag zelf
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
      {demo && <ExerciseSheet ex={demo.ex} itemName={demo.name} onClose={() => setDemo(null)} />}
      <div className="h-2" />
    </div>
  )
}

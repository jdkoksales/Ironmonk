'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  CheckCircle2, Circle, Wind, Timer, ChevronRight, Dumbbell, Footprints,
  HeartPulse, Flame, Brain, BedDouble, Activity, Compass, Target as TargetIcon,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { readiness, todayISO, daysUntil, streakFrom, XP, goalStreak } from '@/lib/game'
import { kompasSummary, COURSE_META } from '@/lib/kompas'
import { PHASES, proverbOfDay } from '@/lib/protocol'
import { Ring, Dots } from '@/components/viz'
import { BreathTimer, StanceTimer } from '@/components/timers'

const BLOCK_ICON: any = {
  strength: Dumbbell, ankle: Footprints, conditioning: HeartPulse, stance: Timer,
  core: Flame, mobility: Activity, meditation: Brain, rest: BedDouble,
}
// Warm tempelpalet per bloktype: goud, koper, jade, fakkel-oranje.
const BLOCK_COLOR: any = {
  strength: '#D9B36A', ankle: '#E0873A', conditioning: '#7FB596', stance: '#E8C684',
  core: '#E25A48', mobility: '#C0794E', meditation: '#9DC3A8', rest: '#9E8E71',
}

function PlanToday() {
  const app = useApp()
  const day = app.plan?.find((d: any) => d.date === todayISO())
  if (!day) {
    const next = app.plan?.find((d: any) => d.date > todayISO())
    return (
      <section className="card">
        <p className="lbl mb-1">Trainingsschema</p>
        <p className="text-sm text-muted">
          {next
            ? `Je 12-weken-schema start ${new Date(next.date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}. Gebruik de dagen ervoor om je nulmeting af te ronden en rustig in te komen.`
            : 'Nog geen schema geladen.'}
        </p>
      </section>
    )
  }

  const allItems = day.blocks.flatMap((b: any) => b.items)
  const allKeys = allItems.map((i: any) => i.key)
  const done: string[] = day.done_keys || []
  const doneCount = allKeys.filter((k: string) => done.includes(k)).length
  const total = allKeys.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const phaseGap = (app.profile?.current_phase || 1) < day.phase_target

  const toggle = (item: any) => {
    const set = new Set<string>(done)
    let award = 0
    if (set.has(item.key)) set.delete(item.key)
    else {
      set.add(item.key)
      award += item.xp || 0
    }
    const keys = Array.from(set)
    const wasComplete = allKeys.every((k: string) => done.includes(k))
    const nowComplete = total > 0 && allKeys.every((k: string) => keys.includes(k))
    if (nowComplete && !wasComplete) award += XP.PLAN_DAY_BONUS
    if (award > 0) app.awardXp('plan', award, { date: day.date })
    app.savePlanDay(day.id, keys, nowComplete)
  }

  return (
    <section className="card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="lbl">
            Week {day.week_no} · Dag {day.day_no} · Fase {day.phase_target}
          </p>
          <h2 className="font-display text-lg font-bold leading-tight text-ink">{day.title}</h2>
          <p className="text-[11px] text-muted">{day.subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="num font-display text-lg font-bold leading-none text-neon">
            {doneCount}/{total}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">afgevinkt</div>
        </div>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-panel2">
        <div className="h-full rounded-full bg-neon transition-all" style={{ width: `${pct}%` }} />
      </div>

      {phaseGap && (
        <p className="mb-3 rounded-lg border border-amber/30 bg-amber/10 p-2.5 text-xs leading-relaxed text-amber">
          Deze week is gepland op <b>fase {day.phase_target}</b>, maar jij staat nog op <b>fase{' '}
          {app.profile?.current_phase || 1}</b>. Doe de niet-impact-varianten en schakel impact (hardlopen,
          springen, trappen) pas in als je de fasecriteria haalt — die zijn heilig.
        </p>
      )}

      {day.coach_note && (
        <p className="mb-3 rounded-lg border border-neon/30 bg-neon/10 p-2.5 text-xs leading-relaxed text-ink">
          <span className="font-semibold text-neon">Tiě Shān:</span> {day.coach_note}
        </p>
      )}

      {day.is_rest && (
        <p className="mb-3 text-xs italic text-muted">Rustdag — herstel is training. Vink af wat je doet.</p>
      )}

      <div className="space-y-3">
        {day.blocks.map((b: any, bi: number) => {
          const Icon = BLOCK_ICON[b.type] || Activity
          const color = BLOCK_COLOR[b.type] || '#7A8B94'
          return (
            <div key={bi} className="rounded-xl bg-panel2 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${color}1A`, color }}
                >
                  <Icon size={15} />
                </span>
                <span className="text-sm font-semibold text-ink">{b.label}</span>
              </div>
              {b.note && <p className="mb-2 text-[11px] leading-relaxed text-muted">{b.note}</p>}
              <div className="space-y-1.5">
                {b.items.map((it: any) => {
                  const checked = done.includes(it.key)
                  return (
                    <button
                      key={it.key}
                      onClick={() => toggle(it)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left"
                    >
                      {checked ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-neon" />
                      ) : (
                        <Circle size={18} className="mt-0.5 shrink-0 text-line" />
                      )}
                      <span className="flex-1">
                        <span className={`text-sm ${checked ? 'text-muted line-through' : 'text-ink'}`}>
                          {it.name}
                        </span>
                        <span className="block text-[11px] text-muted">{it.detail}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function KompasCard() {
  const app = useApp()
  if (!(app?.targets || []).length) return null
  const s = kompasSummary(app.targets, app.tests || [], app.profile)
  const overall = s.stalled > 0 ? 'stalled' : s.behind > s.ahead ? 'behind' : s.ahead > 0 ? 'ahead' : 'on'
  const c = COURSE_META[overall as keyof typeof COURSE_META]
  return (
    <Link href="/kompas" className="card flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: `${c.color}1A`, color: c.color }}
      >
        <Compass size={19} />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink">Kompas</div>
        <div className="text-[11px] text-muted">
          {s.ahead} vóór · {s.on} op schema · {s.behind} achter{s.stalled ? ` · ${s.stalled} rood` : ''}
          {s.retests > 0 ? ` · ${s.retests}× hertest` : ''}
        </div>
      </div>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  )
}

function GoalsCard() {
  const app = useApp()
  const goals = (app?.goals || []).filter((g: any) => g.active)
  if (!goals.length) return null
  return (
    <section className="card">
      <div className="mb-2 flex items-center gap-2">
        <TargetIcon size={14} className="text-violet" />
        <span className="lbl">Doelen</span>
      </div>
      <div className="space-y-1.5">
        {goals.map((g: any) => {
          const st = goalStreak(g.id, app.goalLogs || [])
          return (
            <div key={g.id} className="flex items-center justify-between rounded-lg bg-panel2 px-3 py-2">
              <span className="text-sm text-ink">{g.title}</span>
              {g.type.startsWith('habit') && (
                <span className="num font-display text-sm font-bold text-neon">{st} dgn</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Vandaag() {
  const app = useApp()
  const [modal, setModal] = useState<null | 'breath' | 'stance'>(null)
  if (!app?.profile) return null

  const today = app.checkins.find((c: any) => c.date === todayISO())
  const rd = readiness(today, app.checkins)
  const dep = daysUntil(app.profile.departure_date)
  const phase = PHASES.find((p) => p.n === (app.profile.current_phase || 1))
  const met = phase
    ? phase.criteria.filter((cr: any) =>
        app.criteria.some((x: any) => x.phase === phase.n && x.criterion_key === cr.key && x.met)
      ).length
    : 0
  const streak = streakFrom(app.checkins.map((c: any) => c.date))
  const color = !rd ? '#9E8E71' : rd.score >= 75 ? '#D9B36A' : rd.score >= 50 ? '#E0873A' : '#E25A48'
  const dateLabel = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="lbl">Vandaag</p>
          <h1 className="font-display text-xl font-bold capitalize text-ink">{dateLabel}</h1>
        </div>
        {dep != null ? (
          <div className="rounded-xl border border-line bg-panel px-3 py-1.5 text-right">
            <div className="num font-display text-lg font-bold leading-none text-neon">{dep}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">dgn tot Dengfeng</div>
          </div>
        ) : (
          <Link href="/profiel" className="text-xs text-azure">
            Zet vertrekdatum →
          </Link>
        )}
      </div>

      <section className="card">
        <div className="flex items-center gap-4">
          <Ring v={rd?.score ?? 0} color={color} size={150}>
            {rd ? (
              <>
                <span className="num font-display text-5xl font-bold text-ink">{rd.score}</span>
                <span className="lbl">Readiness</span>
              </>
            ) : (
              <span className="px-5 text-center text-xs text-muted">Vul je check-in in voor je score</span>
            )}
          </Ring>
          <div className="flex-1 space-y-2.5">
            {(rd?.parts || [
              { label: 'Slaap', v: 0 },
              { label: 'Rust-HR', v: 0 },
              { label: 'Energie', v: 0 },
              { label: 'Enkel', v: 0 },
            ]).map((p: any) => (
              <div key={p.label}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted">{p.label}</span>
                  <span className="num text-ink">{rd ? p.v : '–'}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-panel2">
                  <div className="h-full rounded-full" style={{ width: `${rd ? p.v : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="/checkin"
          className={`mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-display text-sm font-bold tracking-wide ${
            today
              ? 'border border-line bg-panel2 text-muted'
              : 'btn-primary'
          }`}
        >
          {today ? (
            <>
              <CheckCircle2 size={16} className="text-neon" /> Check-in gedaan — aanpassen
            </>
          ) : (
            <>DAGELIJKSE CHECK-IN · +50 XP</>
          )}
        </Link>
      </section>

      <PlanToday />

      <KompasCard />
      <GoalsCard />

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => setModal('breath')} className="card flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-azure/10 text-azure">
            <Wind size={19} />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Ademwerk</div>
            <div className="text-[11px] text-muted">Box 4·4·4·4</div>
          </div>
        </button>
        <button onClick={() => setModal('stance')} className="card flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/10 text-amber">
            <Timer size={19} />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Ma Bu timer</div>
            <div className="text-[11px] text-muted">Horse stance</div>
          </div>
        </button>
      </section>

      <Link href="/enkel" className="card flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/10 font-display text-lg font-bold text-neon">
          F{phase?.n}
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-ink">
            Enkelfase {phase?.n} — {phase?.title}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-neon"
                style={{ width: `${phase ? (met / phase.criteria.length) * 100 : 0}%` }}
              />
            </div>
            <span className="num text-[11px] text-muted">
              {met}/{phase?.criteria.length}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="lbl">Laatste 14 dagen</span>
          <span className="text-xs text-amber">🔥 {streak} dagen streak</span>
        </div>
        <Dots dates={app.checkins.map((c: any) => c.date)} />
      </section>

      <p className="px-2 pb-2 text-center text-xs italic leading-relaxed text-muted">{proverbOfDay()}</p>

      {modal === 'breath' && <BreathTimer onClose={() => setModal(null)} />}
      {modal === 'stance' && <StanceTimer onClose={() => setModal(null)} />}
    </div>
  )
}

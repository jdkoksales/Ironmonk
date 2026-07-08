'use client'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Wind, Timer, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/store'
import { readiness, todayISO, daysUntil, streakFrom } from '@/lib/game'
import { PHASES, proverbOfDay } from '@/lib/protocol'
import { Ring, Dots } from '@/components/viz'
import { BreathTimer, StanceTimer } from '@/components/timers'

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
  const color = !rd ? '#7A8B94' : rd.score >= 75 ? '#00E5A0' : rd.score >= 50 ? '#FFB020' : '#FF4D5E'
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
              : 'bg-neon text-bg shadow-[0_0_24px_rgba(0,229,160,.35)]'
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

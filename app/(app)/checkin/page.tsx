'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, XP, effectiveStreak, streakMult, goalStreak } from '@/lib/game'
import { TRAINING_TYPES } from '@/lib/protocol'
import { Slider, Stepper, Chips } from '@/components/viz'

// Stille teller voor habit-doelen: één tik = "vandaag gelukt". Geen moraal, geen pop-ups.
function HabitBlock() {
  const app = useApp()
  const today = todayISO()
  const habits = (app?.goals || []).filter((g: any) => g.active && g.type.startsWith('habit'))
  if (!habits.length) return null
  return (
    <section className="card">
      <p className="lbl mb-2">Vandaag gelukt</p>
      <div className="space-y-1.5">
        {habits.map((g: any) => {
          const done = (app.goalLogs || []).some((l: any) => l.goal_id === g.id && l.date === today && l.done)
          const st = goalStreak(g.id, app.goalLogs || [])
          return (
            <button
              key={g.id}
              onClick={() => app.toggleGoalLog(g.id, today, !done)}
              className="flex w-full items-center gap-2.5 rounded-xl bg-panel2 px-3 py-2.5 text-left"
            >
              {done ? (
                <CheckCircle2 size={18} className="shrink-0 text-neon" />
              ) : (
                <Circle size={18} className="shrink-0 text-line" />
              )}
              <span className="flex-1 text-sm text-ink">{g.title}</span>
              <span className="num text-[11px] text-muted">{st} dgn</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function CheckIn() {
  const app = useApp()
  const router = useRouter()
  const today = todayISO()
  const ex = app?.checkins.find((c: any) => c.date === today)
  const lastWeight = app?.checkins.find((c: any) => c.weight != null)

  const [f, setF] = useState<any>({
    mood: ex?.mood ?? 7,
    energy: ex?.energy ?? 7,
    ankle_pain: ex?.ankle_pain ?? 2,
    ankle_stability: ex?.ankle_stability ?? 7,
    sleep_quality: ex?.sleep_quality ?? 7,
    nutrition_score: ex?.nutrition_score ?? 7,
    weight: ex?.weight ?? lastWeight?.weight ?? null,
    sleep_hours: ex?.sleep_hours ?? 7,
    rhr: ex?.rhr ?? null,
    water_l: ex?.water_l ?? null,
    steps: ex?.steps ?? null,
    meditation_min: ex?.meditation_min ?? 0,
    training_types: ex?.training_types ?? [],
    notes: ex?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))

  const shieldDates = app?.profile?.shield_dates || []
  const xpPreview = Math.round(
    XP.CHECKIN * streakMult(effectiveStreak([today, ...(app?.checkins.map((c: any) => c.date) || [])], shieldDates))
  )

  const save = async () => {
    if (!app?.user || busy) return
    setBusy(true)
    const row = { user_id: app.user.id, date: today, ...f }
    const { error } = await app.supabase.from('daily_checkins').upsert(row, { onConflict: 'user_id,date' })
    if (error) {
      setBusy(false)
      alert('Opslaan mislukt: ' + error.message)
      return
    }
    if (!ex) {
      const streak = effectiveStreak([today, ...app.checkins.map((c: any) => c.date)], shieldDates)
      await app.awardXp('checkin', XP.CHECKIN * streakMult(streak), { streak })
    }
    await app.refresh()
    router.push('/vandaag')
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">Dagelijkse check-in</p>
        <h1 className="font-display text-xl font-bold text-ink">Hoe sta je ervoor?</h1>
      </div>

      <section className="card">
        <p className="lbl mb-1">Lichaam & geest</p>
        <Slider label="Humeur" value={f.mood} onChange={(v: any) => set('mood', v)} min={1} color="#7FB596" low="Zwaar" high="Top" />
        <Slider label="Energie" value={f.energy} onChange={(v: any) => set('energy', v)} min={1} color="#D9B36A" low="Leeg" high="Vol" />
        <Slider label="Slaapkwaliteit" value={f.sleep_quality} onChange={(v: any) => set('sleep_quality', v)} min={1} color="#C0794E" />
        <Slider label="Voeding vandaag" value={f.nutrition_score} onChange={(v: any) => set('nutrition_score', v)} min={1} color="#E0873A" low="Los" high="Strak" />
      </section>

      <section className="card">
        <p className="lbl mb-1">Enkel</p>
        <Slider label="Pijn" value={f.ankle_pain} onChange={(v: any) => set('ankle_pain', v)} min={0} color="#E25A48" low="0 = geen" high="10 = ernstig" />
        <Slider label="Stabiliteit" value={f.ankle_stability} onChange={(v: any) => set('ankle_stability', v)} min={0} color="#D9B36A" low="Wankel" high="Rotsvast" />
        {f.ankle_pain >= 6 && (
          <p className="mt-1 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs leading-relaxed text-danger">
            🔴 Rood in het stoplichtmodel: vandaag geen enkelbelasting en 2 dagen een stap terug in het protocol. Houdt
            dit aan of neemt het toe → fysiotherapeut.
          </p>
        )}
        {f.ankle_pain >= 3 && f.ankle_pain < 6 && (
          <p className="mt-1 rounded-lg border border-amber/30 bg-amber/10 p-2.5 text-xs leading-relaxed text-amber">
            🟠 Oranje: maak de dag rustig af en zet de volgende sessie een stap terug in belasting.
          </p>
        )}
      </section>

      <section className="card">
        <p className="lbl mb-1">Metingen</p>
        <Stepper label="Gewicht" value={f.weight} onChange={(v: any) => set('weight', v)} step={0.1} unit="kg" />
        <Stepper label="Slaapuren" value={f.sleep_hours} onChange={(v: any) => set('sleep_hours', v)} step={0.25} unit="uur" />
        <Stepper label="Rusthartslag" value={f.rhr} onChange={(v: any) => set('rhr', v)} step={1} unit="bpm" />
        <Stepper label="Water" value={f.water_l} onChange={(v: any) => set('water_l', v)} step={0.25} unit="L" />
        <Stepper label="Stappen" value={f.steps} onChange={(v: any) => set('steps', v)} step={500} unit="stappen" />
        <Stepper label="Meditatie" value={f.meditation_min} onChange={(v: any) => set('meditation_min', v)} step={5} unit="min" />
      </section>

      <section className="card">
        <p className="lbl mb-2">Training vandaag</p>
        <Chips
          options={TRAINING_TYPES}
          values={f.training_types}
          onToggle={(o: string) =>
            set(
              'training_types',
              f.training_types.includes(o)
                ? f.training_types.filter((x: string) => x !== o)
                : [...f.training_types, o]
            )
          }
        />
        <textarea
          value={f.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Notities (hoe voelde het, bijzonderheden…)"
          rows={2}
          className="mt-3 w-full rounded-xl border border-line bg-panel2 p-3 text-sm text-ink outline-none placeholder:text-muted focus:border-neon"
        />
      </section>

      <HabitBlock />

      <button onClick={save} disabled={busy} className="btn-primary w-full py-3.5 text-base">
        {busy ? 'Opslaan…' : ex ? 'Check-in bijwerken' : `Check-in opslaan · +${xpPreview} XP`}
      </button>
      <div className="h-2" />
    </div>
  )
}

'use client'
// De Sessie-speler: je coach leidt je door de training — set voor set, met
// vorige prestaties, rusttimer, PR-detectie en een afsluiting in de stem van
// je coach. Geen AI-calls: instant en altijd beschikbaar.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ChevronRight, Play, Plus, Minus, Trophy, Timer as TimerIcon, SkipForward } from 'lucide-react'
import { useApp } from '@/lib/store'
import { coachById } from '@/lib/coaches'
import { CoachPortrait } from '@/components/coach-portrait'
import { findExercise } from '@/lib/exercises'
import { ExerciseSheet } from '@/components/exercise-sheet'
import { Figure } from '@/components/figure'
import { inputMode, targetSets, targetReps, restFor, bestFor, lastFor, isPr, e1rm, sessionClosing, type InputMode } from '@/lib/session'
import { XP } from '@/lib/game'

function beep(freq = 880, dur = 0.15) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    o.start(); o.stop(ctx.currentTime + dur + 0.02)
  } catch {}
}

type Item = { key: string; name: string; detail: string; xp: number; blockType: string; blockLabel: string }

function Step({ v, set, step, min = 0, label }: { v: number; set: (n: number) => void; step: number; min?: number; label: string }) {
  return (
    <div className="flex-1">
      <div className="lbl mb-1 text-center">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => set(Math.max(min, +(v - step).toFixed(1)))} className="btn-step"><Minus size={15} /></button>
        <input
          inputMode="decimal"
          value={v || ''}
          placeholder="0"
          onChange={(e) => { const n = parseFloat(e.target.value.replace(',', '.')); set(isNaN(n) ? 0 : n) }}
          className="num w-[68px] rounded-lg border border-line bg-bg/60 px-1 py-2 text-center font-display text-xl font-bold text-ink outline-none focus:border-neon"
        />
        <button onClick={() => set(+(v + step).toFixed(1))} className="btn-step"><Plus size={15} /></button>
      </div>
    </div>
  )
}

export function SessionPlayer({ day, onClose }: { day: any; onClose: () => void }) {
  const app = useApp()
  const coach = coachById(app?.profile?.coach_id)

  const items: Item[] = useMemo(
    () =>
      (day.blocks || []).flatMap((b: any) =>
        b.items.map((it: any) => ({ ...it, blockType: b.type, blockLabel: b.label }))
      ),
    [day]
  )
  const startDone: string[] = day.done_keys || []
  const firstOpen = Math.max(0, items.findIndex((it) => !startDone.includes(it.key)))

  const [idx, setIdx] = useState(firstOpen)
  const [doneKeys, setDoneKeys] = useState<string[]>(startDone)
  const [setNo, setSetNo] = useState(1)
  const [reps, setReps] = useState(0)
  const [kg, setKg] = useState(0)
  const [secs, setSecs] = useState(0)
  const [rest, setRest] = useState<number | null>(null)
  const [pr, setPr] = useState(false)
  const [demo, setDemo] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const startRef = useRef(Date.now())
  const statsRef = useRef({ sets: 0, volume: 0, prs: 0 })
  const sessionLogs = useRef<any[]>([])
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [])
  // rusttimer
  useEffect(() => {
    if (rest == null) return
    if (rest <= 0) { beep(880); setTimeout(() => beep(1100), 180); setRest(null); return }
    const t = setTimeout(() => { if (rest <= 4) beep(520, 0.08); setRest(rest - 1) }, 1000)
    return () => clearTimeout(t)
  }, [rest])

  const it = items[idx]
  const mode: InputMode = it ? inputMode(it.blockType, it.name, it.detail) : 'check'
  const sets = it ? targetSets(it.detail) : 3
  const logs = app?.setLogs || []
  const last = it ? lastFor(logs, it.name) : null
  const best = it ? bestFor(logs, it.name, mode) : null
  const ex = it ? findExercise(it.name) : null

  // prefill bij oefeningwissel
  useEffect(() => {
    if (!it) return
    setSetNo(1); setPr(false)
    const l: any = lastFor(app?.setLogs || [], it.name)
    setReps(l?.reps ? Number(l.reps) : targetReps(it.detail) || 0)
    setKg(l?.weight ? Number(l.weight) : 0)
    setSecs(l?.seconds ? Number(l.seconds) : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  if (!app?.user || !mounted) return null

  const markDone = (key: string) => {
    if (!doneKeys.includes(key)) {
      const item = items.find((x) => x.key === key)
      if (item?.xp) app.awardXp('sessie', item.xp, { date: day.date })
      setDoneKeys((k) => [...k, key])
      return [...doneKeys, key]
    }
    return doneKeys
  }

  const logSet = async () => {
    const entry: any = { reps: mode !== 'time' ? reps || null : null, weight: mode === 'load' ? kg || null : null, seconds: mode === 'time' ? secs || null : null }
    if (!entry.reps && !entry.seconds) return
    const hit = isPr(mode, best, entry)
    if (hit) { statsRef.current.prs++; setPr(true); beep(1320, 0.2); setTimeout(() => setPr(false), 2600) }
    statsRef.current.sets++
    if (entry.weight && entry.reps) statsRef.current.volume += entry.weight * entry.reps
    const row = { user_id: app.user.id, date: day.date, exercise: it.name, item_key: it.key, set_no: setNo, ...entry }
    sessionLogs.current.push(row)
    app.supabase.from('set_logs').insert(row).then(() => {})
    if (setNo >= sets) {
      markDone(it.key)
      setRest(null)
    } else {
      setSetNo((n) => n + 1)
      setRest(restFor(it.blockType))
    }
  }

  const finish = async () => {
    setFinishing(true)
    const total = items.length
    const complete = items.every((x) => doneKeys.includes(x.key))
    let keys = doneKeys
    if (complete && !items.every((x) => startDone.includes(x.key))) app.awardXp('sessie', XP.PLAN_DAY_BONUS, { date: day.date })
    await app.savePlanDay(day.id, keys, complete)
    const duration = Math.floor((Date.now() - startRef.current) / 1000)
    const s = statsRef.current
    await app.supabase.from('workout_sessions').insert({
      user_id: app.user.id, plan_day_id: day.id, date: day.date,
      started_at: new Date(startRef.current).toISOString(), finished_at: new Date().toISOString(),
      duration_sec: duration,
      stats: { sets: s.sets, volume: Math.round(s.volume), prs: s.prs, items_done: keys.length, items_total: total },
      summary: sessionClosing(coach.naam, { prs: s.prs, sets: s.sets, volume: s.volume, minutes: Math.max(1, Math.round(duration / 60)), complete }),
    })
    await app.refresh()
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const doneCount = items.filter((x) => doneKeys.includes(x.key)).length
  const s = statsRef.current

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'linear-gradient(175deg, #14100a 0%, #0b0907 60%)' }}>
      {/* ———— afsluitscherm ———— */}
      {finishing ? (
        <div className="animate-fadeUp mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <CoachPortrait coachId={coach.id} size={130} />
          <h2 className="title-gold mt-4 font-display text-2xl font-bold">Sessie volbracht</h2>
          <div className="mt-4 grid w-full grid-cols-3 gap-2">
            {[
              [`${mm}:${ss}`, 'duur'],
              [String(s.sets), 'sets'],
              [s.volume >= 1000 ? `${(s.volume / 1000).toFixed(1)}t` : `${Math.round(s.volume)}kg`, 'volume'],
            ].map(([v, l]) => (
              <div key={l} className="card !p-3">
                <div className="num font-display text-xl font-bold text-neon">{v}</div>
                <div className="lbl mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          {s.prs > 0 && (
            <div className="animate-pop mt-3 flex items-center gap-2 rounded-full border border-neon/50 bg-neon/10 px-4 py-2">
              <Trophy size={16} className="text-neon" />
              <span className="font-display text-sm font-bold text-neon">{s.prs}× nieuw record</span>
            </div>
          )}
          <p className="mt-4 max-w-[300px] text-sm italic leading-relaxed text-ink/90">
            {sessionClosing(coach.naam, { prs: s.prs, sets: s.sets, volume: s.volume, minutes: Math.max(1, Math.round(elapsed / 60)), complete: doneCount === items.length })}
          </p>
          <button onClick={onClose} className="btn-primary mt-6 w-full max-w-xs py-3.5">Terug naar de tempel</button>
        </div>
      ) : (
        <>
          {/* ———— header ———— */}
          <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)]">
            <button onClick={finish} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted">
              <X size={16} />
            </button>
            <div className="flex-1">
              <div className="lbl">{day.title}</div>
              <div className="h-1 overflow-hidden rounded-full bg-panel2">
                <div className="h-full rounded-full bg-neon transition-all" style={{ width: `${(doneCount / Math.max(1, items.length)) * 100}%` }} />
              </div>
            </div>
            <div className="num text-right font-display text-lg font-bold text-ink">{mm}:{ss}</div>
          </div>

          {/* ———— PR-banner ———— */}
          {pr && (
            <div className="animate-pop pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-neon bg-bg/90 px-5 py-2.5 shadow-[0_0_40px_rgba(217,179,106,.5)]">
                <Trophy size={18} className="text-neon" />
                <span className="title-gold font-display text-base font-bold tracking-wide">NIEUW RECORD</span>
              </div>
            </div>
          )}

          {/* ———— oefening ———— */}
          {it ? (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-6 pt-3">
              <div className="lbl">{it.blockLabel} · oefening {idx + 1}/{items.length}</div>
              <button onClick={() => ex && setDemo(true)} className="mt-1 flex items-start justify-between gap-2 text-left">
                <h2 className="font-display text-xl font-bold leading-tight text-ink">{it.name}</h2>
                {ex && <Play size={17} className="mt-1 shrink-0 text-copper" />}
              </button>
              <p className="mt-0.5 text-sm text-muted">{it.detail}</p>

              {ex && (
                <button onClick={() => setDemo(true)} className="card mt-3 !p-1">
                  <Figure pattern={ex.pattern} size={168} />
                </button>
              )}

              {/* vorige prestatie */}
              {(last || best != null) && mode !== 'check' && (
                <div className="mt-3 flex gap-2 text-[11px]">
                  {last && (
                    <span className="rounded-full bg-panel2/80 px-3 py-1.5 text-muted">
                      vorige: <span className="num text-ink">
                        {mode === 'time' ? `${last.seconds ?? '–'}s` : mode === 'load' ? `${last.weight ?? '–'}kg × ${last.reps ?? '–'}` : `${last.reps ?? '–'} reps`}
                      </span>
                    </span>
                  )}
                  {best != null && (
                    <span className="rounded-full bg-neon/10 px-3 py-1.5 text-neon">
                      record: <span className="num">{mode === 'load' ? `${Math.round(best)} e1RM` : mode === 'time' ? `${Math.round(best)}s` : `${best} reps`}</span>
                    </span>
                  )}
                </div>
              )}

              {/* invoer */}
              {mode === 'check' ? (
                <button
                  onClick={() => { markDone(it.key); if (idx < items.length - 1) setIdx(idx + 1); else finish() }}
                  className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-base"
                >
                  <Check size={18} /> Voltooid
                </button>
              ) : (
                <>
                  <div className="card mt-4 !p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="lbl">Set {setNo} van {sets}</span>
                      <span className="flex gap-1">
                        {Array.from({ length: sets }).map((_, i) => (
                          <span key={i} className={`h-1.5 w-5 rounded-full ${i < setNo - 1 ? 'bg-neon' : i === setNo - 1 ? 'bg-neon/40' : 'bg-panel2'}`} />
                        ))}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {mode === 'time' ? (
                        <Step v={secs} set={setSecs} step={5} label="seconden" />
                      ) : (
                        <>
                          <Step v={reps} set={setReps} step={1} label="reps" />
                          {mode === 'load' && <Step v={kg} set={setKg} step={2.5} label="kg" />}
                        </>
                      )}
                    </div>
                    <button onClick={logSet} className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3.5">
                      <Check size={17} /> Set voltooid
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {doneKeys.includes(it.key) && setNo >= sets && (
                      <button onClick={() => setSetNo((n) => n + 1)} className="btn-ghost flex-1 py-2.5 text-xs">
                        + extra set
                      </button>
                    )}
                    <button
                      onClick={() => { if (idx < items.length - 1) setIdx(idx + 1); else finish() }}
                      className={`${doneKeys.includes(it.key) ? 'btn-primary' : 'btn-ghost'} flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs`}
                    >
                      {doneKeys.includes(it.key) ? <>Volgende <ChevronRight size={14} /></> : <><SkipForward size={13} /> Overslaan</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center"><button onClick={finish} className="btn-primary px-8 py-3">Afronden</button></div>
          )}

          {/* ———— rust-overlay ———— */}
          {rest != null && (
            <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center bg-bg/92 backdrop-blur-md" onClick={() => setRest(null)}>
              <TimerIcon size={22} className="mb-3 text-jade" />
              <div className="lbl">Rust — adem laag</div>
              <div className="num font-display text-7xl font-bold text-ink">{rest}</div>
              <div className="mt-5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setRest(rest + 30)} className="btn-ghost px-4 py-2 text-xs">+30s</button>
                <button onClick={() => setRest(null)} className="btn-primary px-5 py-2 text-xs">Klaar — volgende set</button>
              </div>
            </div>
          )}
        </>
      )}

      {demo && ex && <ExerciseSheet ex={ex} itemName={it?.name} onClose={() => setDemo(false)} />}
    </div>,
    document.body
  )
}

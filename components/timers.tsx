'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Play, Pause } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, XP } from '@/lib/game'
import { Ring } from './viz'

function beep(freq = 660, dur = 0.18) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    o.start()
    o.stop(ctx.currentTime + dur + 0.02)
  } catch {}
}

export function Modal({ title, onClose, children }: any) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-wide text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function BreathTimer({ onClose }: any) {
  const app = useApp()
  const [running, setRunning] = useState(false)
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => setT((x) => x + 0.1), 100)
    return () => clearInterval(iv)
  }, [running])

  const cycle = t % 16
  const phase = cycle < 4 ? 'ADEM IN' : cycle < 8 ? 'VASTHOUDEN' : cycle < 12 ? 'ADEM UIT' : 'VASTHOUDEN'
  const scale = cycle < 4 ? 0.55 + (cycle / 4) * 0.45 : cycle < 8 ? 1 : cycle < 12 ? 1 - ((cycle - 8) / 4) * 0.45 : 0.55
  const secLeft = 4 - Math.floor(cycle % 4)

  const finish = async () => {
    setRunning(false)
    const min = Math.floor(t / 60)
    if (min >= 1 && app?.user) {
      const today = todayISO()
      const ex = app.checkins.find((c: any) => c.date === today)
      await app.supabase
        .from('daily_checkins')
        .upsert({ user_id: app.user.id, date: today, meditation_min: (ex?.meditation_min || 0) + min }, { onConflict: 'user_id,date' })
      await app.awardXp('meditatie', min * XP.MED_PER_MIN, { min })
      app.refresh()
    }
    onClose()
  }

  return (
    <Modal title="Ademwerk — Box breathing" onClose={finish}>
      <div className="flex flex-col items-center py-4">
        <div className="relative grid h-52 w-52 place-items-center">
          <div className="absolute inset-0 rounded-full border border-line" />
          <div
            className="grid h-40 w-40 place-items-center rounded-full bg-azure/10 transition-transform duration-300 ease-linear"
            style={{ transform: `scale(${scale})`, boxShadow: '0 0 40px rgba(62,166,255,.25)' }}
          >
            <div className="h-24 w-24 rounded-full bg-azure/20" />
          </div>
          <div className="absolute text-center">
            <div className="font-display text-lg font-bold tracking-widest text-azure">{running ? phase : 'KLAAR?'}</div>
            <div className="num font-display text-4xl text-ink">{running ? secLeft : '4·4·4·4'}</div>
          </div>
        </div>
        <div className="lbl mt-4">
          Totaal {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, '0')} · +{XP.MED_PER_MIN} XP per minuut
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="btn-primary flex items-center gap-2">
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pauze' : 'Start'}
          </button>
          <button onClick={finish} className="btn-ghost">
            Stop & log
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function StanceTimer({ onClose }: any) {
  const app = useApp()
  const [target, setTarget] = useState(60)
  const [left, setLeft] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const totalRef = useRef(0)

  useEffect(() => {
    if (left == null) return
    if (left <= 0) {
      beep(880)
      setTimeout(() => beep(880), 220)
      setTimeout(() => beep(1100), 440)
      setLeft(null)
      return
    }
    const tm = setTimeout(() => {
      if (left <= 4 && left > 1) beep(520, 0.1)
      setLeft((l) => (l as number) - 1)
      setTotal((x) => {
        totalRef.current = x + 1
        return x + 1
      })
    }, 1000)
    return () => clearTimeout(tm)
  }, [left])

  const finish = async () => {
    const sec = totalRef.current
    const xp = Math.round((sec / 60) * XP.STANCE_PER_MIN)
    if (xp > 0 && app?.user) await app.awardXp('stance', xp, { sec })
    onClose()
  }

  const pct = left != null ? ((target - left) / target) * 100 : 0

  return (
    <Modal title="Stance-timer — Ma Bu 马步" onClose={finish}>
      <div className="flex flex-col items-center py-2">
        <Ring v={pct} size={180} color="#FFB020">
          <div className="num font-display text-5xl font-bold text-ink">{left ?? target}</div>
          <div className="lbl">seconden</div>
        </Ring>
        <div className="mt-4 flex gap-2">
          {[30, 60, 90, 120].map((v) => (
            <button
              key={v}
              onClick={() => setTarget(v)}
              disabled={left != null}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                target === v ? 'border-amber bg-amber/10 text-amber' : 'border-line text-muted'
              } disabled:opacity-40`}
            >
              {v}s
            </button>
          ))}
        </div>
        <div className="lbl mt-3">Totaal gehouden: {total}s</div>
        <div className="mt-4 flex gap-3">
          {left == null ? (
            <button
              onClick={() => {
                beep(880)
                setLeft(target)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Play size={16} />
              Start ronde
            </button>
          ) : (
            <button onClick={() => setLeft(null)} className="btn-ghost flex items-center gap-2">
              <Pause size={16} />
              Stop ronde
            </button>
          )}
          <button onClick={finish} className="btn-ghost">
            Klaar & log
          </button>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          Zak in een diepe horse stance: voeten ruim, rug recht, knieën naar buiten. Adem laag en rustig — dit is het
          fundament van elke Shaolin-dag.
        </p>
      </div>
    </Modal>
  )
}

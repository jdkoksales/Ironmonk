'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useApp } from '@/lib/store'
import { LEVELS, levelFor, badges } from '@/lib/game'

export default function Profiel() {
  const app = useApp()
  const router = useRouter()
  const [name, setName] = useState(app?.profile?.name || '')
  const [dep, setDep] = useState(app?.profile?.departure_date || '')
  const [saved, setSaved] = useState(false)
  if (!app?.profile) return null

  const lv = levelFor(app.profile.xp || 0)
  const bs = badges(app)

  const save = async () => {
    await app.supabase
      .from('profiles')
      .update({ name: name || 'Krijger', departure_date: dep || null })
      .eq('id', app.user.id)
    await app.refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const logout = async () => {
    await app.supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">Profiel</p>
        <h1 className="font-display text-xl font-bold text-ink">{app.profile.name}</h1>
      </div>

      <section className="card flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-neon/40 bg-neon/5 font-display text-3xl text-neon shadow-[0_0_20px_rgba(217,179,106,.25)]">
          {lv.hanzi}
        </span>
        <div>
          <div className="font-display text-lg font-bold text-ink">
            Level {lv.level} · {lv.rank}
          </div>
          <div className="num text-sm text-muted">
            {app.profile.xp} XP {lv.next ? `· nog ${lv.next.xp - app.profile.xp} tot ${lv.next.rank}` : '· maximum'}
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <p className="lbl">Instellingen</p>
        <div>
          <label className="mb-1 block text-xs text-muted">Naam</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="inp" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Vertrekdatum naar China</label>
          <input type="date" value={dep || ''} onChange={(e) => setDep(e.target.value)} className="inp" />
        </div>
        <button onClick={save} className="btn-primary w-full py-2.5">
          {saved ? 'Opgeslagen ✓' : 'Opslaan'}
        </button>
      </section>

      <section className="card">
        <p className="lbl mb-3">Badges</p>
        <div className="grid grid-cols-2 gap-2">
          {bs.map((b: any) => (
            <div
              key={b.label}
              className={`rounded-xl border p-3 ${b.on ? 'border-neon/30 bg-neon/5' : 'border-line bg-panel2 opacity-45'}`}
            >
              <div className="text-xl">{b.icon}</div>
              <div className="mt-1 text-sm font-semibold text-ink">{b.label}</div>
              <div className="text-[11px] text-muted">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="lbl mb-3">Rangenladder</p>
        <div className="space-y-1.5">
          {LEVELS.map((l, i) => {
            const on = i + 1 === lv.level
            const passed = i + 1 < lv.level
            return (
              <div
                key={l.rank}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 ${on ? 'bg-neon/10' : ''}`}
              >
                <span className={`font-display text-lg ${on ? 'text-neon' : passed ? 'text-ink' : 'text-muted'}`}>
                  {l.hanzi}
                </span>
                <span className={`flex-1 text-sm ${on ? 'font-semibold text-neon' : passed ? 'text-ink' : 'text-muted'}`}>
                  {l.rank}
                </span>
                <span className="num text-[11px] text-muted">{l.xp} XP</span>
              </div>
            )
          })}
        </div>
      </section>

      <button onClick={logout} className="btn-ghost flex w-full items-center justify-center gap-2 text-danger">
        <LogOut size={15} />
        Uitloggen
      </button>

      <p className="pb-2 text-center text-[11px] text-muted">IRON MONK v1.0 · gebouwd met Claude · data beveiligd met RLS</p>
    </div>
  )
}

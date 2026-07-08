'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Activity, ClipboardList, TrendingUp, MessageCircle, User, Flame } from 'lucide-react'
import { useApp } from '@/lib/store'
import { levelFor, streakFrom } from '@/lib/game'
import { XPBar } from './viz'

export function Header() {
  const app = useApp()
  const [chips, setChips] = useState<any[]>([])
  const [lvlUp, setLvlUp] = useState<any>(null)

  useEffect(() => {
    const onXp = (e: any) => {
      const id = Date.now() + Math.random()
      setChips((c) => [...c, { id, amount: e.detail.amount }])
      setTimeout(() => setChips((c) => c.filter((x) => x.id !== id)), 2200)
    }
    const onLvl = (e: any) => {
      setLvlUp(e.detail)
      setTimeout(() => setLvlUp(null), 3500)
    }
    window.addEventListener('ironxp', onXp)
    window.addEventListener('ironlevelup', onLvl)
    return () => {
      window.removeEventListener('ironxp', onXp)
      window.removeEventListener('ironlevelup', onLvl)
    }
  }, [])

  if (!app?.profile) return null
  const lv = levelFor(app.profile.xp || 0)
  const streak = streakFrom(app.checkins.map((c: any) => c.date))

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto max-w-md px-4 pb-2.5 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/vandaag" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-neon/40 bg-neon/5 font-display text-lg text-neon shadow-[0_0_14px_rgba(0,229,160,.2)]">
              {lv.hanzi}
            </span>
            <div>
              <div className="font-display text-sm font-bold tracking-[0.18em] text-ink">IRON MONK</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">
                Lv {lv.level} · {lv.rank}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                streak > 0 ? 'border-amber/40 bg-amber/10 text-amber' : 'border-line bg-panel2 text-muted'
              }`}
            >
              <Flame size={13} className={streak > 0 ? 'animate-flame' : ''} />
              <span className="num font-display text-sm font-semibold">{streak}</span>
            </div>
            <Link
              href="/profiel"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel2 text-muted"
            >
              <User size={16} />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <XPBar pct={lv.pct} />
          <span className="num shrink-0 text-[10px] text-muted">
            {lv.next ? `${app.profile.xp}/${lv.next.xp}` : 'MAX'}
          </span>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col items-end gap-1">
        {chips.map((c) => (
          <div
            key={c.id}
            className="animate-rise rounded-full border border-violet/50 bg-violet/15 px-3 py-1 font-display text-sm font-bold text-violet shadow-[0_0_16px_rgba(139,92,246,.4)]"
          >
            +{c.amount} XP
          </div>
        ))}
      </div>

      {lvlUp && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-bg/80 backdrop-blur-sm"
          onClick={() => setLvlUp(null)}
        >
          <div className="card animate-pop w-72 border-neon/40 text-center shadow-[0_0_60px_rgba(0,229,160,.25)]">
            <div className="font-display text-6xl text-neon">{lvlUp.hanzi}</div>
            <div className="lbl mt-3">Level {lvlUp.level} bereikt</div>
            <div className="font-display text-2xl font-bold text-ink">{lvlUp.rank}</div>
            <p className="mt-1 text-sm text-muted">Nieuwe rang ontgrendeld</p>
          </div>
        </div>
      )}
    </header>
  )
}

const TABS = [
  { href: '/vandaag', label: 'Vandaag', icon: Home },
  { href: '/enkel', label: 'Enkel', icon: Activity },
  { href: '/testen', label: 'Testen', icon: ClipboardList },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/coach', label: 'Coach', icon: MessageCircle },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
        {TABS.map((t) => {
          const on = path?.startsWith(t.href)
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] ${
                on ? 'text-neon' : 'text-muted'
              }`}
            >
              <Icon size={20} style={on ? { filter: 'drop-shadow(0 0 6px rgba(0,229,160,.8))' } : undefined} />
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

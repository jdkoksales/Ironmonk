'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Activity, ClipboardList, TrendingUp, MessageCircle, User, Flame, CalendarRange,
  Landmark, Swords, Compass, MoreHorizontal, X, Mountain, CircleDot,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { levelFor, effectiveStreak, incenseState } from '@/lib/game'
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
  const streak = effectiveStreak(app.checkins.map((c: any) => c.date), app.profile.shield_dates || [])
  const incense = incenseState(app.checkins.length, app.profile.shield_dates || []).available

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto max-w-md px-4 pb-2.5 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/tempel" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-neon/40 bg-neon/5 font-display text-lg text-neon shadow-[0_0_14px_rgba(217,179,106,.3)]">
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
            {incense > 0 && (
              <div
                className="flex items-center gap-1 rounded-full border border-copper/40 bg-copper/10 px-2 py-1 text-copper"
                title={`${incense} wierookstok(ken) — beschermen je reeks bij een gemiste dag`}
              >
                <span className="text-[13px] leading-none">🪔</span>
                <span className="num text-sm font-semibold">{incense}</span>
              </div>
            )}
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
            className="animate-rise rounded-full border border-violet/50 bg-violet/15 px-3 py-1 font-display text-sm font-bold text-violet shadow-[0_0_16px_rgba(192,121,78,.45)]"
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
          <div className="card animate-pop w-72 border-neon/40 text-center shadow-[0_0_60px_rgba(217,179,106,.3)]">
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
  { href: '/tempel', label: 'Tempel', icon: Landmark },
  { href: '/vandaag', label: 'Vandaag', icon: Swords },
  { href: '/pad', label: 'Pad', icon: Mountain },
  { href: '/coach', label: 'Meester', icon: MessageCircle },
]

const MORE = [
  { href: '/mala', label: 'Mala', desc: '108 kralen — jouw mijlpalen', icon: CircleDot },
  { href: '/enkel', label: 'Enkel', desc: '4-fasen protocol & criteria', icon: Activity },
  { href: '/testen', label: 'Testen', desc: 'Testbatterij & media-kluis', icon: ClipboardList },
  { href: '/kompas', label: 'Kompas', desc: 'Dengfeng-standaard & koers', icon: Compass },
  { href: '/trends', label: 'Trends', desc: 'Gewicht, hartslag, slaap', icon: TrendingUp },
  { href: '/profiel', label: 'Profiel', desc: 'Rang, badges & instellingen', icon: User },
]

export function BottomNav() {
  const path = usePathname()
  const [more, setMore] = useState(false)
  const moreOn = MORE.some((m) => path?.startsWith(m.href))
  return (
    <>
      {more && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setMore(false)}>
          <div
            className="animate-fadeUp w-full max-w-md rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom),20px)]"
            style={{
              background: 'linear-gradient(170deg, rgba(42,33,20,0.92), rgba(16,12,7,0.96))',
              borderTop: '1px solid rgba(217,179,106,0.25)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="lbl">De tempelvleugels</span>
              <button onClick={() => setMore(false)} className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1.5">
              {MORE.map((m) => {
                const Icon = m.icon
                const on = path?.startsWith(m.href)
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setMore(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 ${on ? 'bg-neon/10' : 'bg-panel2/60'}`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${on ? 'bg-neon/15 text-neon' : 'bg-panel text-muted'}`}>
                      <Icon size={17} />
                    </span>
                    <span className="flex-1">
                      <span className={`block text-sm font-semibold ${on ? 'text-neon' : 'text-ink'}`}>{m.label}</span>
                      <span className="block text-[11px] text-muted">{m.desc}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(11,9,7,0.82), rgba(11,9,7,0.95))',
          borderTop: '1px solid rgba(217,179,106,0.14)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
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
                <Icon size={20} style={on ? { filter: 'drop-shadow(0 0 7px rgba(217,179,106,.9))' } : undefined} />
                {t.label}
              </Link>
            )
          })}
          <button
            onClick={() => setMore(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] ${moreOn ? 'text-neon' : 'text-muted'}`}
          >
            <MoreHorizontal size={20} style={moreOn ? { filter: 'drop-shadow(0 0 7px rgba(217,179,106,.9))' } : undefined} />
            Meer
          </button>
        </div>
      </nav>
    </>
  )
}

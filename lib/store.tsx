'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from './supabase'
import { levelFor } from './game'
import { planRows } from './plan'

const Ctx = createContext<any>(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }: any) {
  const supabase = useMemo(() => sb(), [])
  const router = useRouter()
  const [s, setS] = useState<any>({
    loading: true,
    user: null,
    profile: null,
    checkins: [],
    ankle: [],
    tests: [],
    criteria: [],
    plan: [],
  })

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    const [p, c, a, t, cr, pl] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(120),
      supabase.from('ankle_checks').select('*').eq('user_id', user.id).order('week_date', { ascending: false }).limit(30),
      supabase.from('test_results').select('*').eq('user_id', user.id).order('tested_at', { ascending: true }).limit(1000),
      supabase.from('criteria_state').select('*').eq('user_id', user.id),
      supabase.from('plan_days').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    ])
    let profile = p.data
    if (!profile) {
      const ins = await supabase.from('profiles').insert({ id: user.id }).select().single()
      profile = ins.data
    }
    // Self-seed: bouw het 12-weken-schema eenmalig als het er nog niet is (geen AI).
    let plan = pl.data || []
    if (!plan.length) {
      const rows = planRows(user.id)
      const { data: seeded } = await supabase.from('plan_days').insert(rows).select().order('date', { ascending: true })
      plan = seeded || []
    }
    setS({
      loading: false,
      user,
      profile,
      checkins: c.data || [],
      ankle: a.data || [],
      tests: t.data || [],
      criteria: cr.data || [],
      plan,
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const awardXp = async (source: string, amount: number, meta: any = {}) => {
    amount = Math.round(amount)
    if (!s.user || amount <= 0) return
    const before = levelFor(s.profile?.xp || 0).level
    const newXp = (s.profile?.xp || 0) + amount
    setS((x: any) => ({ ...x, profile: { ...x.profile, xp: newXp } }))
    window.dispatchEvent(new CustomEvent('ironxp', { detail: { amount, source } }))
    const after = levelFor(newXp)
    if (after.level > before) window.dispatchEvent(new CustomEvent('ironlevelup', { detail: after }))
    await supabase.from('xp_events').insert({ user_id: s.user.id, source, amount, meta })
    await supabase.from('profiles').update({ xp: newXp }).eq('id', s.user.id)
  }

  const savePlanDay = async (dayId: string, done_keys: string[], completed: boolean) => {
    const completed_at = completed ? new Date().toISOString() : null
    setS((x: any) => ({
      ...x,
      plan: x.plan.map((d: any) => (d.id === dayId ? { ...d, done_keys, completed_at } : d)),
    }))
    await supabase.from('plan_days').update({ done_keys, completed_at }).eq('id', dayId)
  }

  if (s.loading)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 animate-pulse place-items-center rounded-full border-2 border-neon font-display text-2xl text-neon shadow-[0_0_30px_rgba(0,229,160,.35)]">
            铁
          </div>
          <p className="lbl">IRON MONK laden…</p>
        </div>
      </div>
    )

  return <Ctx.Provider value={{ ...s, supabase, refresh: load, awardXp, savePlanDay }}>{children}</Ctx.Provider>
}

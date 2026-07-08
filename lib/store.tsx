'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from './supabase'
import { levelFor } from './game'

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
  })

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    const [p, c, a, t, cr] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(120),
      supabase.from('ankle_checks').select('*').eq('user_id', user.id).order('week_date', { ascending: false }).limit(30),
      supabase.from('test_results').select('*').eq('user_id', user.id).order('tested_at', { ascending: true }).limit(1000),
      supabase.from('criteria_state').select('*').eq('user_id', user.id),
    ])
    let profile = p.data
    if (!profile) {
      const ins = await supabase.from('profiles').insert({ id: user.id }).select().single()
      profile = ins.data
    }
    setS({
      loading: false,
      user,
      profile,
      checkins: c.data || [],
      ankle: a.data || [],
      tests: t.data || [],
      criteria: cr.data || [],
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

  return <Ctx.Provider value={{ ...s, supabase, refresh: load, awardXp }}>{children}</Ctx.Provider>
}

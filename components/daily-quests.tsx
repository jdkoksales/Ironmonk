'use client'
// Dagtaken: drie kleine dagelijkse taken die de gebruiker terugbrengen.
// XP wordt één keer per taak per dag uitgekeerd (quest_claims). Tik op een
// volbrachte taak om je XP te ontvangen; alles af = bonus van de meester.
import { useEffect, useState } from 'react'
import { Check, Lock, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO } from '@/lib/game'
import { dailyQuests, QUEST_BONUS_XP } from '@/lib/quests'

export function DailyQuests() {
  const app = useApp()
  const today = todayISO()
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!app?.user) return
      const { data } = await app.supabase
        .from('quest_claims')
        .select('quest_key')
        .eq('user_id', app.user.id)
        .eq('date', today)
      setClaimed(new Set((data || []).map((r: any) => r.quest_key)))
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.user, today])

  if (!app?.profile) return null
  const quests = dailyQuests(app, today)

  const claim = async (key: string, xp: number) => {
    if (busy || claimed.has(key)) return
    setBusy(key)
    const { error } = await app.supabase
      .from('quest_claims')
      .insert({ user_id: app.user.id, quest_key: key, date: today, xp })
    if (!error) {
      setClaimed((c) => new Set(c).add(key))
      await app.awardXp(`quest:${key}`, xp)
    } else if (error.code === '23505') {
      // Al geclaimd (race/dubbele tik) — alleen lokaal markeren, geen XP.
      setClaimed((c) => new Set(c).add(key))
    }
    setBusy(null)
  }

  const allDone = quests.every((q) => q.done)
  const allClaimed = quests.every((q) => claimed.has(q.key))
  const bonusClaimed = claimed.has('dagtaken_bonus')

  const claimBonus = async () => {
    if (busy || bonusClaimed || !allClaimed) return
    setBusy('dagtaken_bonus')
    const { error } = await app.supabase
      .from('quest_claims')
      .insert({ user_id: app.user.id, quest_key: 'dagtaken_bonus', date: today, xp: QUEST_BONUS_XP })
    if (!error) {
      setClaimed((c) => new Set(c).add('dagtaken_bonus'))
      await app.awardXp('quest:bonus', QUEST_BONUS_XP)
    } else if (error.code === '23505') {
      setClaimed((c) => new Set(c).add('dagtaken_bonus'))
    }
    setBusy(null)
  }

  const doneCount = quests.filter((q) => q.done).length

  return (
    <section className="card">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-neon" />
          <span className="lbl">Dagtaken</span>
        </div>
        <span className="num text-[11px] text-muted">{doneCount}/{quests.length} volbracht</span>
      </div>

      <div className="space-y-1.5">
        {quests.map((q) => {
          const isClaimed = claimed.has(q.key)
          const claimable = q.done && !isClaimed && !loading
          return (
            <button
              key={q.key}
              disabled={!claimable}
              onClick={() => claim(q.key, q.xp)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                isClaimed
                  ? 'border-neon/25 bg-neon/5'
                  : claimable
                    ? 'border-neon/50 bg-neon/10 shadow-[0_0_16px_rgba(217,179,106,.14)]'
                    : 'border-line bg-panel2/60'
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg ${
                  q.done ? 'bg-neon/15' : 'bg-panel opacity-60'
                }`}
              >
                {q.icon}
              </span>
              <span className="flex-1">
                <span className={`block text-sm font-semibold ${isClaimed ? 'text-neon' : 'text-ink'}`}>{q.label}</span>
                <span className="block text-[11px] text-muted">{q.desc}</span>
              </span>
              <span className="shrink-0 text-right">
                {isClaimed ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-neon">
                    <Check size={13} /> +{q.xp}
                  </span>
                ) : claimable ? (
                  <span className="rounded-full border border-neon/50 bg-neon/10 px-2.5 py-1 text-[11px] font-bold text-neon">
                    +{q.xp} XP
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Lock size={11} /> +{q.xp}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bonus wanneer alle taken volbracht en geclaimd zijn */}
      {allDone && (
        <button
          disabled={!allClaimed || bonusClaimed || busy === 'dagtaken_bonus'}
          onClick={claimBonus}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
            bonusClaimed
              ? 'border-copper/30 bg-copper/5 text-copper'
              : allClaimed
                ? 'border-copper/60 bg-copper/15 text-copper shadow-[0_0_18px_rgba(192,121,78,.2)]'
                : 'border-line bg-panel2/60 text-muted'
          }`}
        >
          {bonusClaimed ? (
            <>
              <Check size={15} /> Dagbonus ontvangen · +{QUEST_BONUS_XP}
            </>
          ) : allClaimed ? (
            <>
              <Sparkles size={15} /> Ontvang de dagbonus · +{QUEST_BONUS_XP} XP
            </>
          ) : (
            <>Claim eerst je taken voor de bonus</>
          )}
        </button>
      )}
    </section>
  )
}

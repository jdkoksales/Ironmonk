'use client'
// De Tempel — het startscherm. Geen dashboard, maar een ontvangst:
// je meester wacht op je in het ochtendlicht van Songshan.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MessageCircle, ChevronRight, Scroll, Swords, Target } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, daysUntil, streakFrom, goalStreak } from '@/lib/game'
import { kompasSummary } from '@/lib/kompas'
import { proverbOfDay } from '@/lib/protocol'
import { MasterPortrait, MasterSays, MASTER } from '@/components/master'

const MOTIVATIE = [
  'IJzer wordt niet gesmeed op zachte dagen. Vandaag telt.',
  'De berg vraagt niet of je er zin in hebt. Hij vraagt of je komt.',
  'Elke herhaling is een steen in je fundament. Leg hem goed.',
  'Discipline is stil. Ze schreeuwt niet — ze verschijnt, elke dag.',
  'Je enkel geneest in het tempo van geduld, niet van verlangen.',
  'Wie vandaag zorgvuldig traint, staat in Dengfeng zonder twijfel.',
  'Rust is ook training. Een boog die altijd gespannen staat, breekt.',
]

export default function Tempel() {
  const app = useApp()
  const [briefing, setBriefing] = useState<string | null>(null)
  const [briefBusy, setBriefBusy] = useState(false)

  // Ochtendbriefing van de meester — 1 AI-call per dag, gecachet in daily_briefings.
  useEffect(() => {
    ;(async () => {
      if (!app?.user) return
      const today = todayISO()
      const cached = (app.briefings || []).find((b: any) => b.date === today)
      if (cached) return setBriefing(cached.content)
      if (new Date().getHours() < 4) return
      setBriefBusy(true)
      try {
        const r = await fetch('/api/coach/briefing', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ date: today }),
        })
        const data = await r.json()
        if (r.ok && data.text) setBriefing(data.text)
      } catch {}
      setBriefBusy(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.user])

  if (!app?.profile) return null

  const h = new Date().getHours()
  const groet = h < 6 ? 'De nacht is nog jong' : h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
  const naam = app.profile.name || 'krijger'
  const today = todayISO()
  const dag = (app.plan || []).find((d: any) => d.date === today)
  const volgend = (app.plan || []).find((d: any) => d.date > today)
  const dep = daysUntil(app.profile.departure_date)
  const streak = streakFrom(app.checkins.map((c: any) => c.date))
  const ks = (app.targets || []).length ? kompasSummary(app.targets, app.tests || [], app.profile) : null
  const doelen = (app.goals || []).filter((g: any) => g.active).slice(0, 3)
  const motivatie = MOTIVATIE[Math.floor(Date.now() / 86400000) % MOTIVATIE.length]
  const dagTotaal = dag ? dag.blocks.reduce((x: number, b: any) => x + b.items.length, 0) : 0
  const dagDone = dag ? (dag.done_keys || []).length : 0

  return (
    <div className="flex min-h-dvh flex-col items-center pt-[max(env(safe-area-inset-top),20px)]">
      {/* aftelling naar Dengfeng, klein en gewijd */}
      {dep != null && (
        <div className="animate-fadeUp mb-1 mt-2 text-[10px] uppercase tracking-[0.3em] text-muted">
          Dengfeng over <span className="num text-neon">{dep}</span> dagen
        </div>
      )}

      {/* De meester */}
      <div className="animate-fadeUp d1 mt-4">
        <MasterPortrait size={196} />
      </div>
      <h1 className="animate-fadeUp d2 title-gold mt-5 text-center font-display text-[26px] font-bold tracking-[0.06em]">
        {MASTER.title} {MASTER.name}
      </h1>
      <div className="animate-fadeUp d2 mt-0.5 text-[11px] uppercase tracking-[0.3em] text-muted">
        {MASTER.hanzi} · {MASTER.meaning}
      </div>

      <p className="animate-fadeUp d3 mt-4 text-center text-base text-ink">
        {groet}, <span className="font-semibold">{naam}</span>.
      </p>

      <div className="mt-5 w-full space-y-3">
        {/* Woorden van de meester (ochtendbriefing) */}
        {(briefing || briefBusy) && (
          <div className="animate-fadeUp d3">
            <MasterSays label={`${MASTER.name} spreekt`}>
              {briefing || <span className="animate-pulse text-muted">De meester overdenkt je ochtend…</span>}
            </MasterSays>
          </div>
        )}

        {/* Les van vandaag */}
        <section className="card animate-fadeUp d4">
          <div className="mb-1.5 flex items-center gap-2">
            <Scroll size={13} className="text-copper" />
            <span className="lbl">Les van vandaag</span>
          </div>
          <p className="text-sm italic leading-relaxed text-ink/90">{proverbOfDay()}</p>
        </section>

        {/* Missie van vandaag */}
        <Link href="/vandaag" className="card animate-fadeUp d5 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
            <Swords size={19} />
          </span>
          <div className="flex-1">
            <div className="lbl mb-0.5">Missie van vandaag</div>
            {dag ? (
              <>
                <div className="text-sm font-semibold text-ink">{dag.title}</div>
                <div className="text-[11px] text-muted">
                  Week {dag.week_no} · fase {dag.phase_target} · {dagDone}/{dagTotaal} volbracht
                </div>
              </>
            ) : (
              <div className="text-sm text-muted">
                {volgend ? `Je pad begint ${new Date(volgend.date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} — rust en bereid je voor.` : 'Nog geen schema geladen.'}
              </div>
            )}
          </div>
          <ChevronRight size={17} className="shrink-0 text-muted" />
        </Link>

        {/* Doelen & koers */}
        <Link href="/kompas" className="card animate-fadeUp d5 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-copper/15 text-copper">
            <Target size={19} />
          </span>
          <div className="flex-1">
            <div className="lbl mb-0.5">Jouw pad</div>
            {ks ? (
              <div className="text-sm text-ink">
                <span className="text-neon">{ks.ahead} vóór</span> · {ks.on} op koers ·{' '}
                <span className={ks.behind + ks.stalled > 0 ? 'text-amber' : ''}>{ks.behind + ks.stalled} vraagt aandacht</span>
              </div>
            ) : (
              <div className="text-sm text-muted">Nog geen doelen gesteld</div>
            )}
            <div className="text-[11px] text-muted">
              {streak > 0 ? `🔥 ${streak} dagen discipline` : 'Begin vandaag je reeks'}
              {doelen.length
                ? ' · ' + doelen.map((g: any) => `${g.title} ${goalStreak(g.id, app.goalLogs || [])}d`).join(' · ')
                : ''}
            </div>
          </div>
          <ChevronRight size={17} className="shrink-0 text-muted" />
        </Link>

        {/* Motivatie van de meester */}
        <p className="animate-fadeUp d6 px-6 pt-1 text-center text-[13px] italic leading-relaxed text-muted">
          „{motivatie}”
        </p>

        {/* CTA — spreek met je meester */}
        <div className="animate-fadeUp d6 space-y-2.5 pb-6 pt-2">
          <Link
            href="/coach"
            className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-[15px]"
          >
            <MessageCircle size={17} />
            Spreek met {MASTER.name}
          </Link>
          <Link href="/vandaag" className="btn-ghost flex w-full items-center justify-center gap-2 py-3">
            Betreed de trainingshal
          </Link>
        </div>
      </div>
    </div>
  )
}

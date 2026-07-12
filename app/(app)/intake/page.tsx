'use client'
// Intake: kies je doel (of laat de AI je coach kiezen), voer het intakegesprek
// en laat je coach een volledig persoonlijk traject smeden.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, ChevronRight, Hammer } from 'lucide-react'
import { useApp } from '@/lib/store'
import { COACH_LIST, coachById, type Coach } from '@/lib/coaches'
import { CoachPortrait } from '@/components/coach-portrait'

type Stap = 'kies' | 'match' | 'gesprek' | 'smeden' | 'klaar'

export default function Intake() {
  const app = useApp()
  const router = useRouter()
  const [stap, setStap] = useState<Stap>('kies')
  const [goal, setGoal] = useState('')
  const [coach, setCoach] = useState<Coach | null>(null)
  const [matchReden, setMatchReden] = useState('')
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [planInfo, setPlanInfo] = useState<any>(null)
  const endRef = useRef<any>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  const doMatch = async () => {
    if (!goal.trim() || busy) return
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'match', goal }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCoach(coachById(d.coach_id)); setMatchReden(d.reden || ''); setStap('match')
    } catch (e: any) { setErr(e.message || 'Er ging iets mis.') }
    setBusy(false)
  }

  const startGesprek = async (c: Coach) => {
    setCoach(c); setStap('gesprek'); setMsgs([]); setBusy(true); setErr('')
    try {
      const r = await fetch('/api/intake', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'chat', coach_id: c.id, messages: goal.trim() ? [{ role: 'user', content: `Mijn doel: ${goal.trim()}` }] : [] }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMsgs([{ role: 'assistant', content: d.text }])
    } catch (e: any) { setErr(e.message || 'Er ging iets mis.') }
    setBusy(false)
  }

  const send = async (text: string) => {
    if (!text.trim() || busy || !coach) return
    const next = [...msgs, { role: 'user', content: text.trim() }]
    setMsgs(next); setInput(''); setBusy(true); setErr('')
    try {
      const r = await fetch('/api/intake', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'chat', coach_id: coach.id, messages: next }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMsgs((m) => [...m, { role: 'assistant', content: d.text }])
      if (d.finished) {
        setStap('smeden')
        const pr = await fetch('/api/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'plan' }) })
        const pd = await pr.json()
        if (!pr.ok) throw new Error(pd.error)
        setPlanInfo(pd)
        await app.refresh()
        setStap('klaar')
      }
    } catch (e: any) { setErr(e.message || 'Er ging iets mis.'); if (stap === 'smeden') setStap('gesprek') }
    setBusy(false)
  }

  // ————— Stap 1: doel + coachkeuze —————
  if (stap === 'kies' || stap === 'match')
    return (
      <div className="space-y-4 pb-6 pt-4">
        <div className="animate-fadeUp text-center">
          <p className="lbl">Welkom in de tempel</p>
          <h1 className="title-gold font-display text-2xl font-bold">Kies je pad</h1>
          <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-muted">
            Vertel je doel — dan kiest de AI de coach die het best bij je past. Of kies zelf uit het team.
          </p>
        </div>

        <div className="card animate-fadeUp d1">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder="Bijv. 'ik wil over 6 maanden een halve marathon lopen' of 'sterker en gedisciplineerder worden'…"
            className="w-full resize-none rounded-xl border border-line bg-bg/50 p-3 text-sm text-ink outline-none placeholder:text-muted focus:border-neon"
          />
          <button onClick={doMatch} disabled={busy || !goal.trim()} className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-3">
            <Sparkles size={15} />
            {busy ? 'Even denken…' : 'Vind mijn coach'}
          </button>
        </div>

        {stap === 'match' && coach && (
          <div className="card animate-fadeUp border-neon/30 text-center">
            <div className="flex justify-center"><CoachPortrait coachId={coach.id} size={110} /></div>
            <h2 className="mt-3 font-display text-lg font-bold" style={{ color: coach.accent }}>
              {coach.titel} {coach.naam}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{coach.specialiteit}</p>
            {matchReden && <p className="mt-2 text-sm italic leading-relaxed text-ink/90">„{matchReden}”</p>}
            <button onClick={() => startGesprek(coach)} className="btn-primary mt-3 w-full py-3">
              Start de intake met {coach.naam}
            </button>
            <button onClick={() => setStap('kies')} className="mt-2 w-full text-center text-xs text-muted">
              Liever zelf kiezen? Bekijk het team hieronder ↓
            </button>
          </div>
        )}

        {err && <p className="text-center text-sm text-danger">{err}</p>}

        <div className="animate-fadeUp d2">
          <p className="lbl mb-2 px-1">Of kies zelf je coach</p>
          <div className="space-y-2">
            {COACH_LIST.map((c) => (
              <button key={c.id} onClick={() => startGesprek(c)} className="card flex w-full items-center gap-3 text-left">
                <CoachPortrait coachId={c.id} size={52} halo={false} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold" style={{ color: c.accent }}>
                    {c.titel} {c.naam}
                  </span>
                  <span className="block text-[11px] leading-snug text-muted">{c.specialiteit}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )

  // ————— Stap 3: het plan wordt gesmeed —————
  if (stap === 'smeden')
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <CoachPortrait coachId={coach?.id} size={140} />
        <Hammer size={20} className="animate-flame mt-6 text-neon" />
        <h2 className="title-gold mt-2 font-display text-xl font-bold">Je traject wordt gesmeed…</h2>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
          {coach?.naam} bouwt je volledige persoonlijke plan: trainingen, herstel, doelen en gewoontes. Dit duurt
          een halve minuut.
        </p>
      </div>
    )

  // ————— Stap 4: klaar —————
  if (stap === 'klaar')
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <CoachPortrait coachId={coach?.id} size={150} />
        <h2 className="title-gold mt-5 font-display text-2xl font-bold">Je pad ligt klaar</h2>
        <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-muted">
          {planInfo?.titel ? `“${planInfo.titel}” — ` : ''}{planInfo?.weeks} weken, {planInfo?.days} dagen gepland
          {planInfo?.targets ? `, ${planInfo.targets} kompas-doelen gesteld` : ''}. {coach?.naam} kijkt vanaf nu
          dagelijks met je mee en stelt bij waar nodig.
        </p>
        <button onClick={() => router.replace('/tempel')} className="btn-primary mt-5 w-full max-w-xs py-3.5">
          Betreed de tempel
        </button>
      </div>
    )

  // ————— Stap 2: het intakegesprek —————
  return (
    <div className="flex min-h-[calc(100dvh-190px)] flex-col pt-4">
      <div className="mb-3 flex items-center gap-3">
        <CoachPortrait coachId={coach?.id} size={46} halo={false} />
        <div className="flex-1">
          <p className="lbl">Intake · {coach?.specialiteit}</p>
          <h1 className="font-display text-lg font-bold" style={{ color: coach?.accent }}>
            {coach?.titel} {coach?.naam}
          </h1>
        </div>
      </div>
      <p className="mb-3 rounded-lg bg-panel2/70 p-2.5 text-[11px] leading-relaxed text-muted">
        Neem de tijd — hoe eerlijker en vollediger je antwoordt, hoe beter je plan. {coach?.naam} vraagt door tot het
        beeld compleet is (10-20 min).
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === 'user' ? 'ml-auto border border-neon/20 bg-neon/10 text-ink' : 'border border-line bg-panel text-ink'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="w-16 rounded-2xl border border-line bg-panel px-3.5 py-2.5 text-sm text-muted">
            <span className="animate-pulse">●●●</span>
          </div>
        )}
        {err && <p className="text-center text-sm text-danger">{err}</p>}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-line pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="Je antwoord…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
          }}
          className="max-h-28 flex-1 resize-none rounded-xl border border-line bg-panel2 p-3 text-sm text-ink outline-none placeholder:text-muted focus:border-neon"
        />
        <button onClick={() => send(input)} disabled={busy} className="btn-primary grid h-11 w-11 shrink-0 place-items-center !px-0 !py-0">
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}

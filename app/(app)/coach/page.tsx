'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, Copy, CalendarCheck } from 'lucide-react'
import { useApp } from '@/lib/store'
import { coachContext, weekReport, todayISO } from '@/lib/game'
import { MasterPortrait, MasterSays, MASTER } from '@/components/master'

const QUICK = [
  'Wat is mijn focus voor vandaag?',
  'Analyseer mijn enkeldata',
  'Leg mijn schema van deze week uit',
  'Motiveer me — ik zit er even doorheen',
]

export default function Coach() {
  const app = useApp()
  const [msgs, setMsgs] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)
  const [briefBusy, setBriefBusy] = useState(false)
  const endRef = useRef<any>(null)

  // Ochtendbriefing: 1 AI-call per dag, gecachet in daily_briefings.
  // Bij openen na 04:00 automatisch genereren; bestaat er al één, dan tonen zonder AI-call.
  useEffect(() => {
    ;(async () => {
      if (!app?.user) return
      const today = todayISO()
      const cached = (app.briefings || []).find((b: any) => b.date === today)
      if (cached) {
        setBriefing(cached.content)
        return
      }
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

  useEffect(() => {
    ;(async () => {
      if (!app?.user) return
      const { data } = await app.supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', app.user.id)
        .order('created_at', { ascending: true })
        .limit(60)
      setMsgs(data || [])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])

  const send = async (text: string) => {
    if (!text.trim() || busy || !app?.user) return
    const userMsg = { role: 'user', content: text.trim() }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setInput('')
    setBusy(true)
    await app.supabase.from('coach_messages').insert({ user_id: app.user.id, ...userMsg })
    try {
      const r = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m: any) => ({ role: m.role, content: m.content })),
          context: coachContext(app),
          date: todayISO(),
        }),
      })
      const data = await r.json()
      const content = r.ok ? data.text : `⚠️ ${data.error || 'Er ging iets mis.'}`
      const am = { role: 'assistant', content }
      setMsgs((m) => [...m, am])
      if (r.ok) await app.supabase.from('coach_messages').insert({ user_id: app.user.id, ...am })
      // De coach kan via tools echt iets hebben aangepast — herlaad dan schema/doelen/targets.
      if (r.ok && data.actions?.length) await app.refresh()
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: '⚠️ Netwerkfout — probeer het opnieuw.' }])
    }
    setBusy(false)
  }

  const copyReport = async () => {
    await navigator.clipboard.writeText(weekReport(app))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const runWeekly = async (force = false) => {
    if (busy || !app?.user) return
    setBusy(true)
    try {
      const r = await fetch('/api/coach/weekly', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await r.json()
      if (data.cooldown) {
        if (typeof window !== 'undefined' && window.confirm(`${data.error}\n\nToch opnieuw draaien?`)) {
          setBusy(false)
          return runWeekly(true)
        }
      } else if (r.ok) {
        const extra =
          data.applied > 0
            ? `\n\n✅ ${data.applied} aanpassing(en) in je komende weken doorgevoerd.`
            : '\n\n(Geen aanpassingen nodig — koers vasthouden.)'
        setMsgs((m) => [...m, { role: 'assistant', content: `📋 Weekevaluatie\n\n${data.text}${extra}` }])
        await app.refresh()
      } else {
        setMsgs((m) => [...m, { role: 'assistant', content: `⚠️ ${data.error || 'Er ging iets mis.'}` }])
      }
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: '⚠️ Netwerkfout — probeer het opnieuw.' }])
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-[calc(100dvh-200px)] flex-col pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MasterPortrait size={46} halo={false} />
          <div>
            <p className="lbl">{MASTER.hanzi} · {MASTER.meaning}</p>
            <h1 className="title-gold font-display text-xl font-bold">{MASTER.title} {MASTER.name}</h1>
          </div>
        </div>
        <button onClick={copyReport} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs">
          <Copy size={13} />
          {copied ? 'Gekopieerd ✓' : 'Rapport'}
        </button>
      </div>

      <button
        onClick={() => runWeekly(false)}
        disabled={busy}
        className="btn-primary mb-3 flex w-full items-center justify-center gap-2 py-3"
      >
        <CalendarCheck size={16} />
        Weekevaluatie — beoordeel & stel mijn schema bij
      </button>

      {(briefing || briefBusy) && (
        <div className="mb-3">
          <MasterSays label="Woorden van vanochtend">
            {briefing || <span className="animate-pulse text-muted">{MASTER.name} overdenkt je ochtend…</span>}
          </MasterSays>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {msgs.length === 0 && (
          <div className="card flex flex-col items-center py-7 text-center">
            <MasterPortrait size={120} />
            <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-muted">
              Ik ken je pad, {'​'}je schema, je enkel en je doelen — en ik kan ze voor je bijstellen.
              Spreek vrijuit. Bij rode vlaggen stuur ik je naar de fysio; je fasecriteria zijn heilig.
            </p>
          </div>
        )}
        {msgs.map((m: any, i: number) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
        <div ref={endRef} />
      </div>

      {msgs.length === 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs text-muted">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-line pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder={`Spreek met ${MASTER.name}…`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          className="max-h-28 flex-1 resize-none rounded-xl border border-line bg-panel2 p-3 text-sm text-ink outline-none placeholder:text-muted focus:border-neon"
        />
        <button
          onClick={() => send(input)}
          disabled={busy}
          className="btn-primary grid h-11 w-11 shrink-0 place-items-center !px-0 !py-0"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}

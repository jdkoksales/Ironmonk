'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, Copy, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/store'
import { coachContext, weekReport } from '@/lib/game'

const QUICK = [
  'Maak mijn weekevaluatie',
  'Wat is mijn focus voor vandaag?',
  'Analyseer mijn enkeldata',
  'Motiveer me — ik zit er even doorheen',
]

export default function Coach() {
  const app = useApp()
  const [msgs, setMsgs] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const endRef = useRef<any>(null)

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
        }),
      })
      const data = await r.json()
      const content = r.ok ? data.text : `⚠️ ${data.error || 'Er ging iets mis.'}`
      const am = { role: 'assistant', content }
      setMsgs((m) => [...m, am])
      if (r.ok) await app.supabase.from('coach_messages').insert({ user_id: app.user.id, ...am })
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

  return (
    <div className="flex min-h-[calc(100dvh-200px)] flex-col pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="lbl">Coach Iron Monk</p>
          <h1 className="font-display text-xl font-bold text-ink">Shifu spreekt</h1>
        </div>
        <button onClick={copyReport} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs">
          <Copy size={13} />
          {copied ? 'Gekopieerd ✓' : 'Weekrapport'}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {msgs.length === 0 && (
          <div className="card text-sm leading-relaxed text-muted">
            <Sparkles size={16} className="mb-2 text-neon" />
            Ik ken je data: check-ins, enkelfase, criteria en testresultaten. Vraag me om analyses, een dagfocus of een
            aanpassing van je week. Ik respecteer altijd het stoplichtmodel — en bij rode vlaggen stuur ik je naar de
            fysio.
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
          placeholder="Vraag je coach…"
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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon text-bg shadow-[0_0_18px_rgba(0,229,160,.35)] disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}

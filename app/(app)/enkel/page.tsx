'use client'
import { useState } from 'react'
import { Check, ChevronDown, Copy, ShieldAlert } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, XP } from '@/lib/game'
import { PHASES } from '@/lib/protocol'
import { Stepper, Slider } from '@/components/viz'

export default function Enkel() {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const a = app?.ankle?.[0]
  const [f, setF] = useState<any>({
    figure8_l: a?.figure8_l ?? null,
    figure8_r: a?.figure8_r ?? null,
    ktw_l: a?.ktw_l ?? null,
    ktw_r: a?.ktw_r ?? null,
    balance_l: a?.balance_l ?? null,
    balance_r: a?.balance_r ?? null,
    heel_raises_l: a?.heel_raises_l ?? null,
    heel_raises_r: a?.heel_raises_r ?? null,
    pain_week: a?.pain_week ?? 2,
    instability: a?.instability ?? 3,
    notes: '',
  })
  if (!app?.profile) return null

  const phaseN = app.profile.current_phase || 1
  const phase = PHASES.find((p) => p.n === phaseN)
  const injured = app.profile.injured_side === 'L' ? 'l' : 'r'
  const healthy = injured === 'l' ? 'r' : 'l'
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))

  const latestTest = (key: string, side: string) => {
    const rows = app.tests.filter((t: any) => t.test_key === key && t.side === side)
    return rows.length ? Number(rows[rows.length - 1].value) : null
  }
  const lsi = (i: number | null, h: number | null) => (i != null && h != null && h > 0 ? (i / h) * 100 : null)
  const testLsi = (key: string) => lsi(latestTest(key, injured.toUpperCase()), latestTest(key, healthy.toUpperCase()))

  const evalAuto = (key?: string): { ok: boolean; text: string } | null => {
    if (!key) return null
    const num = (v: any) => (v == null ? null : Number(v))
    if (key === 'f8' || key === 'ktw') {
      const l = num(a?.[key === 'f8' ? 'figure8_l' : 'ktw_l'])
      const r = num(a?.[key === 'f8' ? 'figure8_r' : 'ktw_r'])
      if (l == null || r == null) return null
      const diff = Math.abs(l - r)
      return { ok: diff < (key === 'f8' ? 1 : 1.5), text: `Δ ${diff.toFixed(1)} cm` }
    }
    if (key === 'heel80' || key === 'heel90') {
      const iv = num(a?.[`heel_raises_${injured}`])
      const hv = num(a?.[`heel_raises_${healthy}`])
      const r = lsi(iv, hv)
      if (iv == null || r == null) return null
      const ok = key === 'heel80' ? iv >= 15 && r >= 80 : iv >= 20 && r >= 90
      return { ok, text: `${iv} reps · ${Math.round(r)}%` }
    }
    if (key === 'bal20') {
      const bv = num(a?.[`balance_${injured}`])
      if (bv == null) return null
      return { ok: bv >= 20, text: `${bv} s` }
    }
    if (key === 'bal30') {
      const l = num(a?.balance_l)
      const r = num(a?.balance_r)
      if (l == null || r == null) return null
      return { ok: l >= 30 && r >= 30, text: `${l}/${r} s` }
    }
    if (key === 'hop_single_90' || key === 'hop_triple_90' || key === 'hop_side_90') {
      const map: any = { hop_single_90: 'hop_single', hop_triple_90: 'hop_triple', hop_side_90: 'hop_side' }
      const r = testLsi(map[key])
      if (r == null) return null
      return { ok: r >= 90, text: `LSI ${Math.round(r)}%` }
    }
    if (key === 'hop_95') {
      const s = testLsi('hop_single')
      const t = testLsi('hop_triple')
      if (s == null || t == null) return null
      return { ok: s >= 95 && t >= 95, text: `${Math.round(s)}% / ${Math.round(t)}%` }
    }
    return null
  }

  const isMet = (key: string) =>
    app.criteria.some((x: any) => x.phase === phaseN && x.criterion_key === key && x.met)

  const toggle = async (key: string) => {
    const met = !isMet(key)
    await app.supabase.from('criteria_state').upsert(
      { user_id: app.user.id, phase: phaseN, criterion_key: key, met, met_at: met ? new Date().toISOString() : null },
      { onConflict: 'user_id,phase,criterion_key' }
    )
    app.refresh()
  }

  const setPhase = async (n: number) => {
    await app.supabase.from('profiles').update({ current_phase: n }).eq('id', app.user.id)
    app.refresh()
  }
  const setSide = async (s: string) => {
    await app.supabase.from('profiles').update({ injured_side: s }).eq('id', app.user.id)
    app.refresh()
  }

  const saveCheck = async () => {
    if (busy) return
    setBusy(true)
    const today = todayISO()
    const exists = app.ankle.find((x: any) => x.week_date === today)
    const { error } = await app.supabase.from('ankle_checks').upsert(
      { user_id: app.user.id, week_date: today, phase: phaseN, ...f },
      { onConflict: 'user_id,week_date' }
    )
    if (!error && !exists) await app.awardXp('enkelcheck', XP.ANKLE_CHECK)
    await app.refresh()
    setBusy(false)
    setOpen(false)
  }

  const copyLine = async () => {
    const src = a || f
    const line = `ENKEL WK ${todayISO()}: figure-8 L/R: ${src.figure8_l ?? '-'}/${src.figure8_r ?? '-'} | knee-to-wall L/R: ${src.ktw_l ?? '-'}/${src.ktw_r ?? '-'} | balans dicht L/R: ${src.balance_l ?? '-'}/${src.balance_r ?? '-'} | heel raises L/R: ${src.heel_raises_l ?? '-'}/${src.heel_raises_r ?? '-'} | pijn: ${src.pain_week ?? '-'} | instabiliteit: ${src.instability ?? '-'} | fase: ${phaseN}`
    await navigator.clipboard.writeText(line)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const heelLsi = lsi(Number(a?.[`heel_raises_${injured}`]), Number(a?.[`heel_raises_${healthy}`]))

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="lbl">Enkelprotocol</p>
          <h1 className="font-display text-xl font-bold text-ink">Return to Shaolin</h1>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-line text-xs">
          {['L', 'R'].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`px-2.5 py-1.5 ${app.profile.injured_side === s ? 'bg-danger/15 text-danger' : 'bg-panel2 text-muted'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-muted">Geblesseerde zijde: {app.profile.injured_side === 'L' ? 'links' : 'rechts'}</p>

      <div className="grid grid-cols-4 gap-2">
        {PHASES.map((p) => (
          <button
            key={p.n}
            onClick={() => setPhase(p.n)}
            className={`rounded-xl border py-2.5 font-display text-sm font-bold ${
              phaseN === p.n
                ? 'border-neon bg-neon/10 text-neon shadow-[0_0_14px_rgba(217,179,106,.25)]'
                : 'border-line bg-panel text-muted'
            }`}
          >
            F{p.n}
          </button>
        ))}
      </div>

      <section className="card">
        <p className="lbl">
          Fase {phase?.n} — {phase?.title}
        </p>
        <p className="mt-1 text-xs text-muted">{phase?.goal}</p>
        <div className="mt-3 space-y-2">
          {phase?.criteria.map((cr: any) => {
            const met = isMet(cr.key)
            const auto = evalAuto(cr.auto)
            return (
              <button
                key={cr.key}
                onClick={() => toggle(cr.key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  met ? 'border-neon/40 bg-neon/5' : 'border-line bg-panel2'
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    met ? 'border-neon bg-neon text-bg' : 'border-line'
                  }`}
                >
                  {met && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className={`block text-sm ${met ? 'text-ink' : 'text-muted'}`}>{cr.label}</span>
                  {auto && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                        auto.ok ? 'bg-neon/10 text-neon' : 'bg-danger/10 text-danger'
                      }`}
                    >
                      data: {auto.text} {auto.ok ? '✓' : '✗'}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        {phaseN === 4 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 p-2.5 text-xs leading-relaxed text-amber">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            Niet alles groen 2 weken vóór vertrek? Verschuiven is sterker dan geblesseerd aankomen. Bespreek de
            eindcheck met je fysio.
          </p>
        )}
      </section>

      {a && (
        <section className="card">
          <p className="lbl mb-3">Laatste meting · {a.week_date}</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-panel2 p-3">
              <div className="num font-display text-2xl font-bold text-ink">
                {heelLsi != null ? `${Math.round(heelLsi)}%` : '–'}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Heel raise symmetrie</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="num font-display text-2xl font-bold text-ink">
                {a.figure8_l != null && a.figure8_r != null ? `${Math.abs(a.figure8_l - a.figure8_r).toFixed(1)}` : '–'}
                <span className="text-sm text-muted"> cm</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Figure-8 verschil</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="num font-display text-2xl font-bold text-ink">
                {a.balance_l ?? '–'}/{a.balance_r ?? '–'}
                <span className="text-sm text-muted"> s</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Balans dicht L/R</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="num font-display text-2xl font-bold text-ink">
                {a.ktw_l ?? '–'}/{a.ktw_r ?? '–'}
                <span className="text-sm text-muted"> cm</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Knee-to-wall L/R</div>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
          <span className="font-display text-sm font-bold text-ink">Wekelijkse enkelcheck · +{XP.ANKLE_CHECK} XP</span>
          <ChevronDown size={18} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="mt-2">
            <Stepper label="Figure-8 links" value={f.figure8_l} onChange={(v: any) => set('figure8_l', v)} step={0.1} unit="cm" />
            <Stepper label="Figure-8 rechts" value={f.figure8_r} onChange={(v: any) => set('figure8_r', v)} step={0.1} unit="cm" />
            <Stepper label="Knee-to-wall links" value={f.ktw_l} onChange={(v: any) => set('ktw_l', v)} step={0.5} unit="cm" />
            <Stepper label="Knee-to-wall rechts" value={f.ktw_r} onChange={(v: any) => set('ktw_r', v)} step={0.5} unit="cm" />
            <Stepper label="Balans dicht links" value={f.balance_l} onChange={(v: any) => set('balance_l', v)} step={1} unit="sec" />
            <Stepper label="Balans dicht rechts" value={f.balance_r} onChange={(v: any) => set('balance_r', v)} step={1} unit="sec" />
            <Stepper label="Heel raises links" value={f.heel_raises_l} onChange={(v: any) => set('heel_raises_l', v)} step={1} unit="reps" />
            <Stepper label="Heel raises rechts" value={f.heel_raises_r} onChange={(v: any) => set('heel_raises_r', v)} step={1} unit="reps" />
            <Slider label="Pijn deze week" value={f.pain_week} onChange={(v: any) => set('pain_week', v)} min={0} color="#E25A48" />
            <Slider label="Instabiliteitsgevoel" value={f.instability} onChange={(v: any) => set('instability', v)} min={0} color="#E0873A" />
            <button onClick={saveCheck} disabled={busy} className="btn-primary mt-2 w-full py-3">
              {busy ? 'Opslaan…' : 'Enkelcheck opslaan'}
            </button>
          </div>
        )}
      </section>

      <button onClick={copyLine} className="btn-ghost flex w-full items-center justify-center gap-2">
        <Copy size={14} />
        {copied ? 'Gekopieerd ✓ — plak in je Claude-chat' : 'Kopieer weekcheck voor Claude'}
      </button>
      <div className="h-2" />
    </div>
  )
}

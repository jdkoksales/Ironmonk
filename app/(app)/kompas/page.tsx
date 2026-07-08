'use client'
// Kompas: eindprofiel ("Dengfeng-standaard"), voortgang per doel en koers-indicator.
// Puur rekenwerk in code (lib/kompas.ts) — geen AI-calls.
import Link from 'next/link'
import { useState } from 'react'
import { Compass, Info, Lock, FlaskConical } from 'lucide-react'
import { useApp } from '@/lib/store'
import { kompasSummary, COURSE_META, RETEST_DAYS } from '@/lib/kompas'

export default function Kompas() {
  const app = useApp()
  const [openInfo, setOpenInfo] = useState<string | null>(null)
  if (!app?.profile) return null

  const s = kompasSummary(app.targets || [], app.tests || [], app.profile)

  if (!s.rows.length)
    return (
      <div className="pt-4">
        <div className="card text-sm text-muted">
          Nog geen eindprofiel ingesteld — vraag je coach om targets te stellen.
        </div>
      </div>
    )

  const overall =
    s.stalled > 0 ? 'stalled' : s.behind > s.ahead ? 'behind' : s.ahead > 0 ? 'ahead' : 'on'

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">Dengfeng-standaard</p>
        <h1 className="font-display text-xl font-bold text-ink">Kompas</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Richtdoelen op basis van wat een Shaolin-maand fysiek vraagt, gekalibreerd op jouw nulmeting en tijd tot
          vertrek. Geen garanties — de coach stelt bij naarmate je voortgang binnenkomt.
        </p>
      </div>

      <section className="card">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{ background: `${COURSE_META[overall].color}1A`, color: COURSE_META[overall].color }}
          >
            <Compass size={20} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">
              {s.ahead} vóór · {s.on} op schema · {s.behind} achter{s.stalled ? ` · ${s.stalled} rood` : ''}
            </div>
            <div className="text-[11px] text-muted">
              {s.locked > 0 && `${s.locked} vergrendeld tot enkelfase-vrijgave · `}
              {s.pending > 0 && `${s.pending} wacht op nulmeting · `}
              {s.retests > 0 ? `${s.retests}× hertest nodig` : 'metingen actueel'}
            </div>
          </div>
        </div>
      </section>

      {s.retests > 0 && (
        <Link href="/testen" className="card flex items-center gap-3 border-amber/30">
          <FlaskConical size={18} className="shrink-0 text-amber" />
          <p className="flex-1 text-xs leading-relaxed text-amber">
            {s.retests} meting(en) ouder dan {RETEST_DAYS} dagen — tijd voor een hertest op de Testen-pagina.
          </p>
        </Link>
      )}

      <div className="space-y-3">
        {s.rows.map((r) => {
          const c = COURSE_META[r.course]
          const infoOpen = openInfo === r.target.id
          return (
            <section key={r.target.id} className="card">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <button onClick={() => setOpenInfo(infoOpen ? null : r.target.id)} className="flex items-center gap-1.5 text-left">
                  <span className="text-sm font-semibold text-ink">{r.label}</span>
                  <Info size={12} className="shrink-0 text-muted" />
                </button>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `${c.color}1A`, color: c.color }}
                >
                  {r.course === 'locked' && <Lock size={9} className="mr-0.5 inline" />}
                  {c.label}
                </span>
              </div>
              {infoOpen && r.target.rationale && (
                <p className="mb-2 rounded-lg bg-panel2 p-2.5 text-[11px] leading-relaxed text-muted">{r.target.rationale}</p>
              )}
              <div className="flex items-baseline justify-between text-[11px] text-muted">
                <span>
                  nul: <span className="num text-ink">{r.baseline ?? '—'}</span>
                </span>
                <span>
                  nu: <span className="num font-display text-sm font-bold text-ink">{r.current ?? '—'}</span>
                </span>
                <span>
                  doel: <span className="num text-ink">{r.target.target_value}</span> {r.unit}
                </span>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-panel2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${r.progress ?? 0}%`, background: c.color }}
                />
                {r.expected != null && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-ink/50"
                    style={{ left: `${r.expected}%` }}
                    title={`verwacht: ${r.expected}%`}
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>{r.progress != null ? `${r.progress}% (verwacht ${r.expected}%)` : c.label}</span>
                {r.daysSinceTest != null && (
                  <span className={r.needsRetest ? 'text-amber' : ''}>
                    meting {r.daysSinceTest} dgn geleden{r.needsRetest ? ' — hertest' : ''}
                  </span>
                )}
              </div>
            </section>
          )
        })}
      </div>
      <div className="h-2" />
    </div>
  )
}

'use client'
// De Mala — jouw gebedssnoer van 108 kralen. Elke kraal is verdiend met een
// échte daad: verschijnen, tillen, ademen, herstellen, koersvast blijven.
// Geen holle punten. Dit is het bewijsschrift van je reis.
import { useApp } from '@/lib/store'
import { malaState } from '@/lib/mala'
import { MalaRing } from '@/components/mala'

export default function Mala() {
  const app = useApp()
  if (!app?.profile) return null

  const { strands, lit, total, pct, guru } = malaState(app)

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="lbl">念珠 · Jouw Mala</p>
        <h1 className="font-display text-xl font-bold text-ink">108 kralen</h1>
        <p className="mt-1 text-xs text-muted">
          Elke kraal is verdiend met een echte daad. {pct}% van je snoer brandt.
        </p>
      </div>

      {/* De ring */}
      <div className="card !p-4">
        <MalaRing strands={strands} lit={lit} total={total} guru={guru} size={300} />
        <p className="mt-2 text-center text-[12px] italic leading-relaxed text-muted">
          {guru
            ? '„De guru-kraal brandt. Je bent klaar voor Dengfeng.”'
            : lit === 0
              ? '„Elke reis van duizend mijl begint met één kraal.”'
              : lit < 27
                ? '„Het snoer neemt vorm aan. Blijf verschijnen.”'
                : lit < 81
                  ? '„Meer dan de helft — je hand kent de kralen nu.”'
                  : '„Bijna rond. De guru-kraal wacht bovenaan de berg.”'}
        </p>
      </div>

      {/* Strengen per categorie */}
      <div className="space-y-2.5">
        {strands.map((s) => {
          const p = Math.round((s.lit / s.total) * 100)
          return (
            <section key={s.key} className="card !p-3.5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg"
                  style={{ background: `${s.color}22`, color: s.color }}
                >
                  {s.hanzi}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink">{s.label}</span>
                    <span className="num text-[12px] text-muted">
                      {s.lit}/{s.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p}%`, background: s.color, boxShadow: `0 0 10px ${s.color}66` }}
                    />
                  </div>
                  <p className="mt-1 text-[10.5px] text-muted">{s.hint}</p>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <p className="pb-2 text-center text-[11px] text-muted">
        De mala groeit vanzelf mee met je daden — er is niets te kopen of te forceren.
      </p>
    </div>
  )
}

'use client'
// Oefenscherm: demonstratie-animatie, spierkaart, techniek, fouten, ademhaling,
// tempo/rust en de tip van Meester Tiě Shān — alles in één sheet, geen YouTube nodig.
import { useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Wind, Timer, Hourglass } from 'lucide-react'
import { Figure } from './figure'
import { MasterSays, MASTER } from './master'
import type { Exercise, Muscle } from '@/lib/exercises'

const GOLD = '#d9b36a'
const COPPER = '#c0794e'
const BASE = '#241c10'

// ——— Spierkaart: voor- en achterkant, regio's licht op (goud=primair, koper=secundair) ———
function Body({ view, p, s }: { view: 'front' | 'back'; p: Muscle[]; s: Muscle[] }) {
  const fill = (m: Muscle) => (p.includes(m) ? GOLD : s.includes(m) ? COPPER : BASE)
  const op = (m: Muscle) => (p.includes(m) ? 1 : s.includes(m) ? 0.8 : 1)
  const F = view === 'front'
  return (
    <svg viewBox="0 0 90 190" width="76" height="160">
      {/* silhouet */}
      <circle cx="45" cy="14" r="9" fill={BASE} stroke="#3a2e1a" />
      <path d="M30 28 Q45 24 60 28 L62 84 Q45 90 28 84 Z" fill={BASE} stroke="#3a2e1a" />
      <path d="M30 86 L28 130 L40 130 L42 92 M48 92 L50 130 L62 130 L60 86" fill={BASE} stroke="#3a2e1a" />
      <path d="M28 132 L26 178 L38 178 L40 132 M50 132 L52 178 L64 178 L62 132" fill={BASE} stroke="#3a2e1a" />
      <path d="M28 28 L18 62 L24 66 L32 40 M62 28 L72 62 L66 66 L58 40" fill={BASE} stroke="#3a2e1a" />
      <path d="M18 63 L14 88 L20 90 L25 67 M72 63 L76 88 L70 90 L65 67" fill={BASE} stroke="#3a2e1a" />
      {/* schouders */}
      <ellipse cx="29" cy="31" rx="6.5" ry="5" fill={fill('schouders')} opacity={op('schouders')} />
      <ellipse cx="61" cy="31" rx="6.5" ry="5" fill={fill('schouders')} opacity={op('schouders')} />
      {F ? (
        <>
          {/* borst */}
          <path d="M33 34 Q45 32 57 34 L56 50 Q45 55 34 50 Z" fill={fill('borst')} opacity={op('borst')} />
          {/* biceps */}
          <path d="M24 38 L30 40 L27 56 L21 54 Z" fill={fill('biceps')} opacity={op('biceps')} />
          <path d="M66 38 L60 40 L63 56 L69 54 Z" fill={fill('biceps')} opacity={op('biceps')} />
          {/* buik + obliques */}
          <rect x="39" y="54" width="12" height="26" rx="3" fill={fill('buik')} opacity={op('buik')} />
          <path d="M33 54 L37 55 L37 80 L31 78 Z" fill={fill('obliques')} opacity={op('obliques')} />
          <path d="M57 54 L53 55 L53 80 L59 78 Z" fill={fill('obliques')} opacity={op('obliques')} />
          {/* heupbuigers */}
          <path d="M34 82 L44 88 L40 94 L33 88 Z" fill={fill('heupbuigers')} opacity={op('heupbuigers')} />
          <path d="M56 82 L46 88 L50 94 L57 88 Z" fill={fill('heupbuigers')} opacity={op('heupbuigers')} />
          {/* quadriceps + adductoren */}
          <path d="M29 96 L39 96 L38 126 L30 126 Z" fill={fill('quadriceps')} opacity={op('quadriceps')} />
          <path d="M51 96 L61 96 L60 126 L52 126 Z" fill={fill('quadriceps')} opacity={op('quadriceps')} />
          <path d="M41 94 L44 94 L43 112 L40 112 Z" fill={fill('adductoren')} opacity={op('adductoren')} />
          <path d="M46 94 L49 94 L50 112 L47 112 Z" fill={fill('adductoren')} opacity={op('adductoren')} />
          {/* scheenbeen */}
          <path d="M30 136 L36 136 L35 172 L31 172 Z" fill={fill('scheenbeen')} opacity={op('scheenbeen')} />
          <path d="M54 136 L60 136 L59 172 L55 172 Z" fill={fill('scheenbeen')} opacity={op('scheenbeen')} />
          {/* onderarmen */}
          <path d="M19 66 L24 68 L21 86 L16 84 Z" fill={fill('onderarmen')} opacity={op('onderarmen')} />
          <path d="M71 66 L66 68 L69 86 L74 84 Z" fill={fill('onderarmen')} opacity={op('onderarmen')} />
        </>
      ) : (
        <>
          {/* traps */}
          <path d="M36 27 Q45 24 54 27 L50 42 Q45 44 40 42 Z" fill={fill('traps')} opacity={op('traps')} />
          {/* lats */}
          <path d="M33 42 L41 46 L40 66 L32 60 Z" fill={fill('lats')} opacity={op('lats')} />
          <path d="M57 42 L49 46 L50 66 L58 60 Z" fill={fill('lats')} opacity={op('lats')} />
          {/* onderrug */}
          <rect x="40" y="62" width="10" height="16" rx="3" fill={fill('onderrug')} opacity={op('onderrug')} />
          {/* triceps */}
          <path d="M23 38 L29 40 L26 56 L20 54 Z" fill={fill('triceps')} opacity={op('triceps')} />
          <path d="M67 38 L61 40 L64 56 L70 54 Z" fill={fill('triceps')} opacity={op('triceps')} />
          {/* bilspieren */}
          <path d="M32 80 Q45 76 58 80 Q58 94 45 96 Q32 94 32 80 Z" fill={fill('bilspieren')} opacity={op('bilspieren')} />
          {/* hamstrings */}
          <path d="M30 98 L40 98 L39 126 L31 126 Z" fill={fill('hamstrings')} opacity={op('hamstrings')} />
          <path d="M50 98 L60 98 L59 126 L51 126 Z" fill={fill('hamstrings')} opacity={op('hamstrings')} />
          {/* kuiten */}
          <path d="M30 134 L37 134 L36 162 L31 162 Z" fill={fill('kuiten')} opacity={op('kuiten')} />
          <path d="M53 134 L60 134 L59 162 L54 162 Z" fill={fill('kuiten')} opacity={op('kuiten')} />
          {/* onderarmen (achter) */}
          <path d="M18 66 L23 68 L20 86 L15 84 Z" fill={fill('onderarmen')} opacity={op('onderarmen')} />
          <path d="M72 66 L67 68 L70 86 L75 84 Z" fill={fill('onderarmen')} opacity={op('onderarmen')} />
        </>
      )}
    </svg>
  )
}

export function ExerciseSheet({ ex, itemName, onClose }: { ex: Exercise; itemName?: string; onClose: () => void }) {
  const [variant, setVariant] = useState(-1) // -1 = basis
  const active = variant >= 0 && ex.varianten ? ex.varianten[variant] : null
  const pattern = active?.pattern || ex.pattern
  const hasMuscles = ex.spieren.p.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom),24px)]"
        style={{
          background: 'linear-gradient(170deg, rgba(42,33,20,0.95), rgba(14,11,7,0.98))',
          borderTop: '1px solid rgba(217,179,106,0.28)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -18px 60px rgba(0,0,0,0.55)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Demonstratie</p>
            <h3 className="font-display text-lg font-bold leading-tight text-ink">{ex.naam}</h3>
            {itemName && itemName.toLowerCase() !== ex.naam.toLowerCase() && (
              <p className="mt-0.5 text-[11px] text-muted">{itemName}</p>
            )}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted">
            <X size={15} />
          </button>
        </div>

        {/* demonstratie-loop */}
        <div className="rounded-2xl border border-line/60 bg-bg/40 py-2">
          <Figure pattern={pattern} size={230} />
        </div>

        {/* varianten */}
        {ex.varianten && ex.varianten.length > 0 && (
          <div className="mt-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setVariant(-1)}
                className={`rounded-full border px-3 py-1.5 text-xs ${variant === -1 ? 'border-neon bg-neon/10 text-neon' : 'border-line text-muted'}`}
              >
                Basis
              </button>
              {ex.varianten.map((v, i) => (
                <button
                  key={v.label}
                  onClick={() => setVariant(i)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${variant === i ? 'border-neon bg-neon/10 text-neon' : 'border-line text-muted'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {active && <p className="mt-2 rounded-lg bg-panel2/70 p-2.5 text-xs leading-relaxed text-ink/90">{active.note}</p>}
          </div>
        )}

        {/* spierkaart */}
        {hasMuscles && (
          <div className="card mt-3 !p-3">
            <p className="lbl mb-1">Spiergroepen</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <Body view="front" p={ex.spieren.p} s={ex.spieren.s} />
                <div className="text-[9px] uppercase tracking-widest text-muted">voor</div>
              </div>
              <div className="text-center">
                <Body view="back" p={ex.spieren.p} s={ex.spieren.s} />
                <div className="text-[9px] uppercase tracking-widest text-muted">achter</div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} />
                  <span className="text-ink">{ex.spieren.p.join(', ')}</span>
                </div>
                {ex.spieren.s.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COPPER }} />
                    <span className="text-muted">{ex.spieren.s.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* techniek */}
        <div className="card mt-3 !p-3.5">
          <p className="lbl mb-2">Techniek</p>
          <ul className="space-y-1.5">
            {ex.techniek.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-neon" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* fouten */}
        <div className="card mt-3 !p-3.5">
          <p className="lbl mb-2">Veelgemaakte fouten</p>
          <ul className="space-y-1.5">
            {ex.fouten.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink/90">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* adem / tempo / rust */}
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-panel2/70 px-3 py-2.5">
            <Wind size={15} className="shrink-0 text-jade" />
            <span className="text-[12px] leading-snug text-ink">{ex.adem}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-panel2/70 px-3 py-2.5">
              <Timer size={15} className="shrink-0 text-copper" />
              <span className="text-[12px] leading-snug text-ink">{ex.tempo}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-panel2/70 px-3 py-2.5">
              <Hourglass size={15} className="shrink-0 text-amber" />
              <span className="num text-[12px] text-ink">{ex.rust}</span>
            </div>
          </div>
        </div>

        {/* tip van de meester */}
        <div className="mt-3">
          <MasterSays label={`${MASTER.name} over deze oefening`}>{ex.tip}</MasterSays>
        </div>
      </div>
    </div>
  )
}

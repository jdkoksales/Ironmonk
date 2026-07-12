// Sessie-logica: hoe log je een oefening (kg×reps, reps, tijd of afvinken),
// hoeveel sets, PR-detectie en de deterministische coach-afsluiting.
// Geen AI-calls — de sessie-ervaring is altijd gratis en instant.

export type InputMode = 'load' | 'reps' | 'time' | 'check'

const BODYWEIGHT = /push-?up|pull-?up|chin-?up|dip\b|dips\b|beenheffing|leg raise|nordic|hop|sprong|jump|burpee/i
const TIMED = /plank|wall sit|hold|hang|ma bu|gong bu|xu bu|balans|stretch|split|straddle|mobilisatie|dead ?hang|squat hold|handstand/i
const HAS_TIME = /\d\s*(s\b|sec|min\b|minuten)/i

// Bepaal hoe dit schema-item gelogd wordt.
export function inputMode(blockType: string, name: string, detail: string): InputMode {
  if (blockType === 'meditation' || blockType === 'rest' || blockType === 'conditioning') return 'check'
  if (TIMED.test(name) || (blockType !== 'strength' && HAS_TIME.test(detail))) return 'time'
  if (blockType === 'strength') return BODYWEIGHT.test(name) ? 'reps' : 'load'
  if (blockType === 'core' || blockType === 'ankle') {
    if (TIMED.test(name) || HAS_TIME.test(detail)) return 'time'
    return 'reps'
  }
  if (blockType === 'stance') return 'time'
  return 'check'
}

// "3×8 @ RPE 7" → 3 sets; "4x6" → 4; anders 3.
export function targetSets(detail: string): number {
  const m = detail.match(/(\d+)\s*[×x]\s*\d/)
  const n = m ? parseInt(m[1]) : 3
  return Math.max(1, Math.min(6, n))
}
// "3×8" → 8 als rep-doel (voor prefill-placeholder)
export function targetReps(detail: string): number | null {
  const m = detail.match(/\d+\s*[×x]\s*(\d+)/)
  return m ? parseInt(m[1]) : null
}

export const restFor = (blockType: string) => (blockType === 'strength' ? 120 : 60)

// Geschatte 1RM (Epley) — de maat waarop kracht-PR's worden herkend.
export const e1rm = (weight: number, reps: number) => weight * (1 + reps / 30)

export type SetLog = { exercise: string; reps?: number | null; weight?: number | null; seconds?: number | null; date?: string }

// Beste historische prestatie voor een oefening, per modus.
export function bestFor(logs: SetLog[], exercise: string, mode: InputMode) {
  const rows = logs.filter((l) => l.exercise === exercise)
  if (!rows.length) return null
  if (mode === 'load') {
    let best = 0
    for (const r of rows) if (r.weight && r.reps) best = Math.max(best, e1rm(Number(r.weight), Number(r.reps)))
    return best || null
  }
  if (mode === 'reps') {
    let best = 0
    for (const r of rows) if (r.reps) best = Math.max(best, Number(r.reps))
    return best || null
  }
  if (mode === 'time') {
    let best = 0
    for (const r of rows) if (r.seconds) best = Math.max(best, Number(r.seconds))
    return best || null
  }
  return null
}

// Laatste sessie-prestatie (voor "vorige keer"-prefill).
export function lastFor(logs: SetLog[], exercise: string) {
  const rows = logs.filter((l) => l.exercise === exercise)
  return rows.length ? rows[0] : null // logs zijn nieuwste-eerst geladen
}

export function isPr(mode: InputMode, prev: number | null, entry: { reps?: number | null; weight?: number | null; seconds?: number | null }) {
  if (prev == null) return false // eerste log is een nulmeting, geen "record"
  if (mode === 'load' && entry.weight && entry.reps) return e1rm(Number(entry.weight), Number(entry.reps)) > prev + 0.01
  if (mode === 'reps' && entry.reps) return Number(entry.reps) > prev
  if (mode === 'time' && entry.seconds) return Number(entry.seconds) > prev
  return false
}

// Deterministische afsluiting in de stem van de coach — geen AI-call nodig.
export function sessionClosing(coachNaam: string, opts: { prs: number; sets: number; volume: number; minutes: number; complete: boolean }) {
  const { prs, sets, volume, minutes, complete } = opts
  const vol = volume >= 1000 ? `${(volume / 1000).toFixed(1)} ton` : `${Math.round(volume)} kg`
  if (prs >= 2)
    return `${prs} records in één sessie. Onthoud dit gevoel — zó klinkt vooruitgang. Eet, slaap, en kom terug. — ${coachNaam}`
  if (prs === 1)
    return `Een nieuw record vandaag. Niet door geluk, maar door alle sessies hiervóór. Morgen bouwen we verder. — ${coachNaam}`
  if (complete)
    return `Alles volbracht: ${sets} sets${volume > 0 ? `, ${vol} verplaatst` : ''} in ${minutes} minuten. Consistentie is het echte record. — ${coachNaam}`
  if (sets > 0)
    return `${sets} sets gelogd. Niet elke dag is een piek — de dagen dat je tóch komt, tellen dubbel. — ${coachNaam}`
  return `Sessie afgesloten. Rust is ook een beslissing — morgen staat de deur weer open. — ${coachNaam}`
}

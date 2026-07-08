import { PHASES } from './protocol'

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const daysUntil = (iso?: string | null) => {
  if (!iso) return null
  const ms = new Date(iso + 'T12:00:00').getTime() - new Date(todayISO() + 'T12:00:00').getTime()
  return Math.round(ms / 86400000)
}

export const LEVELS = [
  { xp: 0, rank: 'Leerling', hanzi: '学' },
  { xp: 250, rank: 'Novice', hanzi: '徒' },
  { xp: 600, rank: 'Discipel', hanzi: '弟' },
  { xp: 1100, rank: 'Vechter', hanzi: '武' },
  { xp: 1800, rank: 'Krijger', hanzi: '战' },
  { xp: 2700, rank: 'Monnik', hanzi: '僧' },
  { xp: 3800, rank: 'IJzeren Monnik', hanzi: '铁' },
  { xp: 5200, rank: 'Meester', hanzi: '师' },
  { xp: 7000, rank: 'Shifu', hanzi: '尊' },
  { xp: 9500, rank: 'Draak van Dengfeng', hanzi: '龙' },
]

export function levelFor(xp: number) {
  let i = 0
  for (let j = 0; j < LEVELS.length; j++) if (xp >= LEVELS[j].xp) i = j
  const cur = LEVELS[i]
  const next = LEVELS[i + 1] || null
  const pct = next ? Math.min(100, Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100)) : 100
  return { level: i + 1, rank: cur.rank, hanzi: cur.hanzi, xp, next, pct }
}

export const XP = { CHECKIN: 50, ANKLE_CHECK: 100, TEST: 15, MED_PER_MIN: 2, STANCE_PER_MIN: 2, PLAN_DAY_BONUS: 40 }

export function streakFrom(dates: string[]) {
  const set = new Set(dates)
  let day = todayISO()
  if (!set.has(day)) day = addDays(day, -1)
  let s = 0
  while (set.has(day)) {
    s++
    day = addDays(day, -1)
  }
  return s
}

export const streakMult = (s: number) => Math.min(2, 1 + 0.05 * s)

export function readiness(today: any, hist: any[]) {
  if (!today) return null
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  const base = hist.filter((c) => c.rhr != null && c.date !== today.date).slice(0, 14)
  const baseRhr = base.length >= 3 ? base.reduce((a, c) => a + Number(c.rhr), 0) / base.length : null
  const sleep = today.sleep_hours != null ? clamp((Number(today.sleep_hours) / 7.5) * 100) : null
  const hart =
    today.rhr != null ? (baseRhr ? clamp(100 - Math.max(0, Number(today.rhr) - baseRhr) * 6) : 75) : null
  const energie = today.energy != null ? clamp(Number(today.energy) * 10) : null
  const enkel =
    today.ankle_pain != null || today.ankle_stability != null
      ? clamp(100 - (today.ankle_pain ?? 0) * 8 - (10 - (today.ankle_stability ?? 10)) * 4)
      : null
  const weights: [number | null, number, string][] = [
    [sleep, 0.3, 'Slaap'],
    [hart, 0.25, 'Rust-HR'],
    [energie, 0.2, 'Energie'],
    [enkel, 0.25, 'Enkel'],
  ]
  let tw = 0
  let sum = 0
  const parts: { label: string; v: number }[] = []
  for (const [v, w, label] of weights) {
    if (v != null) {
      sum += v * w
      tw += w
      parts.push({ label, v: Math.round(v) })
    }
  }
  if (!tw) return null
  return { score: Math.round(sum / tw), parts }
}

export function badges(s: any) {
  const totMed = s.checkins.reduce((a: number, c: any) => a + (c.meditation_min || 0), 0)
  const streak = streakFrom(s.checkins.map((c: any) => c.date))
  const metP = (n: number) => {
    const ph = PHASES.find((p) => p.n === n)
    if (!ph) return false
    return ph.criteria.every((cr: any) =>
      s.criteria.some((x: any) => x.phase === n && x.criterion_key === cr.key && x.met)
    )
  }
  return [
    { icon: '🥋', label: 'Eerste stap', desc: 'Eerste check-in', on: s.checkins.length >= 1 },
    { icon: '🔥', label: 'Week één', desc: '7 dagen streak', on: streak >= 7 },
    { icon: '🌋', label: 'Onstuitbaar', desc: '21 dagen streak', on: streak >= 21 },
    { icon: '📊', label: 'Nulmeting', desc: '15+ testresultaten', on: s.tests.length >= 15 },
    { icon: '🧘', label: 'Stille geest', desc: '300 min meditatie', on: totMed >= 300 },
    { icon: '⛩️', label: 'Fase 1', desc: 'Alle criteria gehaald', on: metP(1) },
    { icon: '🐉', label: 'Fase 2', desc: 'Alle criteria gehaald', on: metP(2) },
    { icon: '🏮', label: 'Fase 3', desc: 'Alle criteria gehaald', on: metP(3) },
    { icon: '🏆', label: 'GO Dengfeng', desc: 'Vertrekcriteria gehaald', on: metP(4) },
    { icon: '📅', label: 'Dataworstelaar', desc: '30 check-ins', on: s.checkins.length >= 30 },
  ]
}

export function coachContext(s: any) {
  const p = s.profile || {}
  const lv = levelFor(p.xp || 0)
  const streak = streakFrom(s.checkins.map((c: any) => c.date))
  const dep = daysUntil(p.departure_date)
  const L: string[] = []
  L.push(
    `Naam: ${p.name || 'atleet'} | Level ${lv.level} (${lv.rank}) | ${p.xp || 0} XP | Streak ${streak} dgn | Enkelfase ${p.current_phase || 1} | Geblesseerde zijde: ${p.injured_side || '?'}`
  )
  if (dep != null) L.push(`Vertrek naar China over ${dep} dagen (${p.departure_date}).`)
  L.push('Laatste check-ins (nieuw → oud):')
  s.checkins.slice(0, 7).forEach((c: any) => {
    L.push(
      `${c.date}: slaap ${c.sleep_hours ?? '-'}u (kwal ${c.sleep_quality ?? '-'}), RHR ${c.rhr ?? '-'}, energie ${c.energy ?? '-'}, humeur ${c.mood ?? '-'}, enkelpijn ${c.ankle_pain ?? '-'}, stabiliteit ${c.ankle_stability ?? '-'}, water ${c.water_l ?? '-'}L, stappen ${c.steps ?? '-'}, meditatie ${c.meditation_min || 0}m, training: ${(c.training_types || []).join('+') || 'geen'}${c.notes ? ', notitie: ' + c.notes : ''}`
    )
  })
  const a = s.ankle[0]
  if (a)
    L.push(
      `Laatste enkelcheck (${a.week_date}): figure-8 ${a.figure8_l ?? '-'}/${a.figure8_r ?? '-'} cm, knee-to-wall ${a.ktw_l ?? '-'}/${a.ktw_r ?? '-'} cm, balans ${a.balance_l ?? '-'}/${a.balance_r ?? '-'} s, heel raises ${a.heel_raises_l ?? '-'}/${a.heel_raises_r ?? '-'}, weekpijn ${a.pain_week ?? '-'}, instabiliteit ${a.instability ?? '-'}`
    )
  const ph = PHASES.find((x: any) => x.n === (p.current_phase || 1))
  if (ph) {
    const met = ph.criteria.filter((cr: any) =>
      s.criteria.some((x: any) => x.phase === ph.n && x.criterion_key === cr.key && x.met)
    ).length
    L.push(`Fasecriteria fase ${ph.n} (${ph.title}): ${met}/${ph.criteria.length} afgevinkt.`)
  }
  if (s.tests.length) L.push(`Testresultaten in database: ${s.tests.length} metingen.`)
  return L.join('\n')
}

export function weekReport(s: any) {
  const week = s.checkins.slice(0, 7)
  const avg = (k: string) => {
    const v = week.filter((c: any) => c[k] != null)
    return v.length ? (v.reduce((a: number, c: any) => a + Number(c[k]), 0) / v.length).toFixed(1) : '-'
  }
  const a = s.ankle[0]
  const p = s.profile || {}
  const lines = [
    `📊 IRON MONK — WEEKRAPPORT ${todayISO()}`,
    a
      ? `ENKEL WK: figure-8 L/R: ${a.figure8_l ?? '-'}/${a.figure8_r ?? '-'} | knee-to-wall L/R: ${a.ktw_l ?? '-'}/${a.ktw_r ?? '-'} | balans dicht L/R: ${a.balance_l ?? '-'}/${a.balance_r ?? '-'} | heel raises L/R: ${a.heel_raises_l ?? '-'}/${a.heel_raises_r ?? '-'} | pijn week: ${a.pain_week ?? '-'} | instabiliteit: ${a.instability ?? '-'} | fase: ${a.phase ?? p.current_phase ?? '-'}`
      : 'ENKEL WK: nog geen enkelcheck ingevuld',
    `Check-ins: ${week.length}/7 | Slaap gem: ${avg('sleep_hours')}u | RHR gem: ${avg('rhr')} | Energie gem: ${avg('energy')} | Enkelpijn gem: ${avg('ankle_pain')}`,
    `Meditatie deze week: ${week.reduce((x: number, c: any) => x + (c.meditation_min || 0), 0)} min | Gewicht laatst: ${week.find((c: any) => c.weight != null)?.weight ?? '-'} kg`,
    `Trainingen: ${week.flatMap((c: any) => c.training_types || []).join(', ') || '-'}`,
  ]
  return lines.join('\n')
}

// IRON MONK — Kompas: eindprofiel (targets), voortgang en koers-indicator.
// Puur rekenwerk in code — geen AI-calls. "Richtdoelen, geen garanties."

import { todayISO } from './game'

export type Target = {
  id: string
  test_key: string
  side: string | null
  target_value: number
  direction: 'higher_better' | 'lower_better'
  baseline_value: number | null
  active: boolean
  rationale: string | null
  depends_on_ankle_phase: number | null
  created_at: string
}

export type Course = 'ahead' | 'on' | 'behind' | 'stalled' | 'pending' | 'locked'

export type TargetProgress = {
  target: Target
  label: string
  unit: string
  baseline: number | null
  current: number | null
  lastTestedAt: string | null
  daysSinceTest: number | null
  needsRetest: boolean
  progress: number | null // 0-100
  expected: number | null // 0-100
  course: Course
}

const MARGIN = 12 // procentpunt speling rond de verwachte lijn
export const RETEST_DAYS = 28

const dayDiff = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)

// Labels/units voor test_keys die in targets voorkomen (subset van TEST_GROUPS).
export const KEY_META: Record<string, { label: string; unit: string }> = {
  pushups: { label: 'Push-ups max', unit: 'reps' },
  pullups: { label: 'Pull-ups max', unit: 'reps' },
  chinups: { label: 'Chin-ups max', unit: 'reps' },
  dips: { label: 'Dips max', unit: 'reps' },
  deadhang: { label: 'Dead hang', unit: 'sec' },
  plank: { label: 'Plank', unit: 'sec' },
  squats2: { label: 'Squats 2 min', unit: 'reps' },
  wallsit: { label: 'Wall sit', unit: 'sec' },
  squathold: { label: 'Diepe squat hold', unit: 'sec' },
  heelraise: { label: 'Heel raises', unit: 'reps' },
  ktw: { label: 'Knee-to-wall', unit: 'cm' },
  balance_closed: { label: 'Balans ogen dicht', unit: 'sec' },
  sitreach: { label: 'Sit-and-reach', unit: 'cm' },
  frontsplit: { label: 'Front split (bekken-vloer)', unit: 'cm' },
  straddle: { label: 'Straddle (bekken-vloer)', unit: 'cm' },
  run5k: { label: '5 km hardlopen', unit: 'sec' },
  row2k: { label: '2000 m roeien', unit: 'sec' },
  sprint30: { label: '30 m sprint', unit: 'sec' },
  jumph: { label: 'Spronghoogte', unit: 'cm' },
}

function seriesFor(tests: any[], key: string, side: string | null) {
  return tests
    .filter((t: any) => t.test_key === key && (side ? t.side === side : t.side == null))
    .sort((a: any, b: any) => (a.tested_at < b.tested_at ? -1 : 1))
}

export function targetProgress(t: Target, tests: any[], profile: any): TargetProgress {
  const meta = KEY_META[t.test_key] || { label: t.test_key, unit: '' }
  const label = meta.label + (t.side ? ` (${t.side})` : '')
  const series = seriesFor(tests, t.test_key, t.side)
  const first = series[0] || null
  const last = series[series.length - 1] || null
  const baseline = t.baseline_value != null ? Number(t.baseline_value) : first ? Number(first.value) : null
  const current = last ? Number(last.value) : null
  const lastTestedAt = last ? last.tested_at : null
  const today = todayISO()
  const daysSinceTest = lastTestedAt ? dayDiff(lastTestedAt, today) : null
  const needsRetest = daysSinceTest != null && daysSinceTest > RETEST_DAYS

  // Vergrendeld zolang de enkelfase de test niet toelaat.
  const phase = profile?.current_phase || 1
  if (t.depends_on_ankle_phase && phase < t.depends_on_ankle_phase)
    return { target: t, label, unit: meta.unit, baseline, current, lastTestedAt, daysSinceTest, needsRetest: false, progress: null, expected: null, course: 'locked' }

  // Zonder nulmeting of vertrekdatum valt er geen koers te berekenen.
  const baseDate = first?.tested_at || t.created_at?.slice(0, 10) || today
  const dep = profile?.departure_date
  if (baseline == null || current == null || !dep)
    return { target: t, label, unit: meta.unit, baseline, current, lastTestedAt, daysSinceTest, needsRetest, progress: null, expected: null, course: 'pending' }

  const span = t.target_value - baseline
  let progress: number
  if (Math.abs(span) < 1e-9) progress = 100
  else progress = ((current - baseline) / span) * 100
  // direction zit al in het teken van span (bij lower_better is span negatief), maar
  // achteruitgang moet negatief tellen — clamp pas ná de koersvergelijking.
  const progressClamped = Math.max(0, Math.min(100, Math.round(progress)))

  const total = Math.max(1, dayDiff(baseDate, dep))
  const elapsed = Math.max(0, Math.min(total, dayDiff(baseDate, today)))
  const expected = Math.round((elapsed / total) * 100)

  let course: Course
  if (progress >= 100) course = 'ahead'
  else if (expected >= 20 && progress < 5) course = 'stalled' // vrijwel geen beweging of achteruitgang
  else if (progress >= expected + MARGIN) course = 'ahead'
  else if (progress >= expected - MARGIN) course = 'on'
  else course = 'behind'

  return { target: t, label, unit: meta.unit, baseline, current, lastTestedAt, daysSinceTest, needsRetest, progress: progressClamped, expected, course }
}

export function kompasSummary(targets: Target[], tests: any[], profile: any) {
  const rows = targets.filter((t) => t.active).map((t) => targetProgress(t, tests, profile))
  const count = (c: Course) => rows.filter((r) => r.course === c).length
  return {
    rows,
    ahead: count('ahead'),
    on: count('on'),
    behind: count('behind'),
    stalled: count('stalled'),
    pending: count('pending'),
    locked: count('locked'),
    retests: rows.filter((r) => r.needsRetest).length,
  }
}

export const COURSE_META: Record<Course, { label: string; color: string }> = {
  ahead: { label: 'vóór op schema', color: '#00E5A0' },
  on: { label: 'op schema', color: '#7FE8C4' },
  behind: { label: 'loopt achter', color: '#FFB020' },
  stalled: { label: 'aandacht nodig', color: '#FF4D5E' },
  pending: { label: 'wacht op meting', color: '#7A8B94' },
  locked: { label: 'na enkelfase-vrijgave', color: '#7A8B94' },
}

// Compacte tekst voor coachContext / briefing (geen AI nodig om te berekenen).
export function kompasContext(targets: Target[], tests: any[], profile: any) {
  const s = kompasSummary(targets, tests, profile)
  if (!s.rows.length) return 'Kompas: nog geen targets ingesteld.'
  const L = [`Kompas: ${s.ahead} vóór · ${s.on} op schema · ${s.behind} achter · ${s.stalled} rood · ${s.locked} vergrendeld (enkelfase).`]
  for (const r of s.rows) {
    const cur = r.current != null ? `${r.current}${r.unit}` : '—'
    const base = r.baseline != null ? `${r.baseline}${r.unit}` : '—'
    L.push(
      `- ${r.label}: ${base} → ${cur} (doel ${r.target.target_value}${r.unit}) · ${COURSE_META[r.course].label}${r.progress != null ? ` · ${r.progress}% (verwacht ${r.expected}%)` : ''}${r.needsRetest ? ' · HERTEST NODIG' : ''}`
    )
  }
  return L.join('\n')
}

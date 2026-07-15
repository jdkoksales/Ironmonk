// IRON MONK — de Mala (念珠): 108 kralen die je verdient met échte mijlpalen.
// Geen holle punten of grind — elke kraal staat voor iets wat je in de wereld
// hebt gedaan: een dag verschijnen, een record, stille minuten, een genezen enkel.
// Puur afgeleid van bestaande data (geen AI, geen aparte schrijfacties).
import { kompasSummary } from './kompas'
import { PHASES } from './protocol'

export type Strand = {
  key: string
  label: string
  hanzi: string
  color: string
  total: number
  lit: number
  unitOne: string
  unitMany: string
  hint: string
}

export const MALA_TOTAL = 108

// Elke streng is een aaneengesloten boog van gekleurde kralen die vollopen.
// 36 + 18 + 18 + 18 + 9 + 9 = 108.
export function malaStrands(app: any): Strand[] {
  const checkins = app?.checkins || []
  const plan = app?.plan || []
  const criteria = app?.criteria || []
  const sessions = app?.sessions || []
  const targets = app?.targets || []
  const tests = app?.tests || []

  const totalCheckins = checkins.length
  const totalMed = checkins.reduce((a: number, c: any) => a + (c.meditation_min || 0), 0)
  const totalPrs = sessions.reduce((a: number, s: any) => a + (s?.stats?.prs || 0), 0)
  const completedDays = plan.filter(
    (d: any) =>
      d.completed_at ||
      (d.done_keys?.length && d.done_keys.length >= (d.blocks || []).reduce((x: number, b: any) => x + b.items.length, 0))
  ).length
  const criteriaMet = criteria.filter((c: any) => c.met).length
  const ks = targets.length ? kompasSummary(targets, tests, app?.profile) : null
  const onCourse = ks ? ks.ahead + ks.on : 0

  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.floor(v)))

  return [
    {
      key: 'discipline',
      label: 'Discipline',
      hanzi: '恒',
      color: '#d9b36a',
      total: 36,
      lit: clamp(totalCheckins, 36),
      unitOne: 'check-in',
      unitMany: 'check-ins',
      hint: 'Eén kraal per dag dat je verschijnt.',
    },
    {
      key: 'kracht',
      label: 'Kracht',
      hanzi: '力',
      color: '#c0794e',
      total: 18,
      lit: clamp(totalPrs, 18),
      unitOne: 'record',
      unitMany: 'records',
      hint: 'Eén kraal per persoonlijk record.',
    },
    {
      key: 'geest',
      label: 'Geest',
      hanzi: '禅',
      color: '#6fae8f',
      total: 18,
      lit: clamp(totalMed / 20, 18),
      unitOne: '20 min meditatie',
      unitMany: '× 20 min meditatie',
      hint: 'Eén kraal per 20 minuten stilte.',
    },
    {
      key: 'lichaam',
      label: 'Lichaam',
      hanzi: '体',
      color: '#6d94c4',
      total: 18,
      lit: clamp(completedDays, 18),
      unitOne: 'voltooide dag',
      unitMany: 'voltooide dagen',
      hint: 'Eén kraal per volledig volbrachte trainingsdag.',
    },
    {
      key: 'enkel',
      label: 'Herstel',
      hanzi: '愈',
      color: '#a98cc8',
      total: 9,
      lit: clamp(criteriaMet, 9),
      unitOne: 'fasecriterium',
      unitMany: 'fasecriteria',
      hint: 'Eén kraal per behaald enkel-fasecriterium.',
    },
    {
      key: 'koers',
      label: 'Koers',
      hanzi: '道',
      color: '#d4a13a',
      total: 9,
      lit: clamp(onCourse, 9),
      unitOne: 'doel op koers',
      unitMany: 'doelen op koers',
      hint: 'Eén kraal per kompasdoel dat op of vóór koers ligt.',
    },
  ]
}

export type MalaState = {
  strands: Strand[]
  lit: number
  total: number
  pct: number
  guru: boolean // de meesterkraal: pas vol als het hele pad gelopen is
}

export function malaState(app: any): MalaState {
  const strands = malaStrands(app)
  const lit = strands.reduce((a, s) => a + s.lit, 0)
  // Guru-kraal: de vertrekcriteria (fase 4) volledig gehaald — klaar voor Dengfeng.
  const criteria = app?.criteria || []
  const ph4 = PHASES.find((p: any) => p.n === 4)
  const guru = ph4
    ? ph4.criteria.every((cr: any) => criteria.some((x: any) => x.phase === 4 && x.criterion_key === cr.key && x.met))
    : false
  return { strands, lit, total: MALA_TOTAL, pct: Math.round((lit / MALA_TOTAL) * 100), guru }
}

// Vlakke lijst van 108 kralen in strengvolgorde, met kleur en of ze branden.
export function malaBeads(strands: Strand[]) {
  const beads: { color: string; lit: boolean; strand: string }[] = []
  for (const s of strands) {
    for (let i = 0; i < s.total; i++) {
      beads.push({ color: s.color, lit: i < s.lit, strand: s.key })
    }
  }
  return beads
}

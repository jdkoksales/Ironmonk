// IRON MONK — 12-weken trainingsschema als STRUCTURED DATA (geen AI per dag).
// Deterministische generator: dezelfde input → hetzelfde schema. De wekelijkse
// coach-evaluatie past daarna losse dagen in de database aan (gewicht/reps).
//
// Opbouw: PPL-backbone met Shaolin-focus (benen, taille, schouders, stances,
// flexibiliteit, conditie) + evidence-based enkelrevalidatie die IMPACT pas
// vrijgeeft als de enkelfase het toelaat (fasecriteria zijn heilig).

export type PlanItem = { key: string; name: string; detail: string; xp: number }
export type PlanBlock = { type: BlockType; label: string; note?: string; items: PlanItem[] }
export type BlockType =
  | 'strength' | 'ankle' | 'mobility' | 'conditioning' | 'stance' | 'core' | 'meditation' | 'rest'
export type PlanDay = {
  date: string
  week_no: number
  day_no: number // 1=ma .. 7=zo
  phase_target: number
  title: string
  subtitle: string
  is_rest: boolean
  blocks: PlanBlock[]
}

export const PROGRAM_WEEKS = 12
export const PLAN_START = '2026-07-13' // maandag — week 1 dag 1

export const phaseForWeek = (w: number) => (w <= 3 ? 1 : w <= 6 ? 2 : w <= 9 ? 3 : 4)
const weekInPhase = (w: number) => ((w - 1) % 3) + 1
export const isDeload = (w: number) => w === 6
export const isTaper = (w: number) => w === 12
// Ijkpunten: elke ~4 weken de testbatterij herhalen (koppelt aan het Kompas).
export const RETEST_WEEKS = [4, 8, 12]

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDays = (startISO: string, n: number) => {
  const d = new Date(startISO + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}

// ---------- KRACHT: set/rep-schema per week (RPE-autoregulatie) ----------
function strMain(week: number): string {
  if (isTaper(week)) return '2×5 @ RPE 6 — taper, hou het fris voor vertrek'
  if (isDeload(week)) return '3×6 @ RPE 6 — deload, techniek & snelheid'
  const wip = weekInPhase(week)
  if (wip === 1) return '3×8 @ RPE 7'
  if (wip === 2) return '4×6 @ RPE 8'
  return '4×5 @ RPE 8,5 — meer gewicht dan vorige week'
}
const strAcc = (week: number) => (isTaper(week) ? '2×10 rustig' : isDeload(week) ? '2×12' : '3×10-12 @ RPE 8')

// Exercise-pools per dagtype. main=zwaar (RPE-schema), rest=accessoire.
type Ex = { slug: string; name: string; main?: boolean; xp?: number }
const PUSH_A: Ex[] = [
  { slug: 'bench', name: 'Barbell bench press', main: true },
  { slug: 'ohp', name: 'Overhead press (staand, strikt)', main: true },
  { slug: 'wdip', name: 'Dip (met gewicht indien mogelijk)' },
  { slug: 'incdb', name: 'Incline dumbbell press' },
  { slug: 'lat', name: 'Lateral raise' },
  { slug: 'tri', name: 'Triceps pushdown' },
]
const PUSH_B: Ex[] = [
  { slug: 'ohp2', name: 'Overhead press', main: true },
  { slug: 'hspush', name: 'Handstand-hold aan de muur', xp: 8 },
  { slug: 'arnold', name: 'Arnold press' },
  { slug: 'lat2', name: 'Lateral raise (drop-set laatste set)' },
  { slug: 'pushmax', name: 'Push-ups — AMRAP (nulmeting: 40)', xp: 8 },
  { slug: 'tri2', name: 'Overhead triceps extension' },
]
const PULL: Ex[] = [
  { slug: 'pullup', name: 'Pull-ups (met gewicht als het kan; nulmeting: 8)', main: true },
  { slug: 'row', name: 'Barbell / Pendlay row', main: true },
  { slug: 'pulldown', name: 'Lat pulldown' },
  { slug: 'facepull', name: 'Face pull (achterste schouder — houding)' },
  { slug: 'curl', name: 'Biceps curl' },
  { slug: 'hlr', name: 'Hangende beenheffing', xp: 8 },
]
const LEGS_A: Ex[] = [
  { slug: 'squat', name: 'Back squat (diep, gecontroleerd)', main: true },
  { slug: 'legpress', name: 'Leg press' },
  { slug: 'splitsq', name: 'Split squat (eenbenig — start rechts)' },
  { slug: 'legext', name: 'Leg extension' },
]
const LEGS_B: Ex[] = [
  { slug: 'rdl', name: 'Romanian deadlift (heupscharnier)', main: true },
  { slug: 'bss', name: 'Bulgarian split squat (eenbenig)' },
  { slug: 'hamcurl', name: 'Hamstring curl / Nordic' },
  { slug: 'hipthrust', name: 'Hip thrust (bilkracht — glute max)' },
]

function strengthBlock(week: number, label: string, pool: Ex[]): PlanBlock {
  return {
    type: 'strength',
    label,
    items: pool.map((e, i) => ({
      key: `str${i}`,
      name: e.name,
      detail: e.main ? strMain(week) : strAcc(week),
      xp: e.xp ?? (e.main ? 10 : 8),
    })),
  }
}

// ---------- ENKEL-REHA per fase ----------
function ankleBlock(week: number): PlanBlock {
  const ph = phaseForWeek(week)
  const injured = 'let op rechts (geblesseerd)'
  let note = ''
  let items: { name: string; detail: string }[] = []
  if (ph === 1) {
    note = `Fase 1 — géén impact. Doel: zwelling weg, dorsiflexie symmetrisch (knee-to-wall), kuit­uithouding, balans. ${injured}.`
    items = [
      { name: 'Knee-to-wall dorsiflexie-mobilisatie', detail: `3×10/kant — ${injured}` },
      { name: 'Kuit heffen dubbelbenig, langzaam tempo (3s op/3s neer)', detail: `3×${15 + week * 2}` },
      { name: 'Zittende kuit (soleus)', detail: '3×20' },
      { name: 'Tibialis raises (voorkant scheenbeen)', detail: '3×20' },
      { name: 'Elastiek: enkel in/uit- & op/neer', detail: '3×15/richting' },
      { name: 'Eenbenige balans — ogen open→dicht, evt. kussen', detail: '3×30s/kant' },
    ]
  } else if (ph === 2) {
    note = `Fase 2 — eenbenige kracht & symmetrie. Doel: heel raises ≥20 & ≥90% symmetrie, balans ≥30s. ${injured}.`
    items = [
      { name: 'Eenbenige kuit heffen mét gewicht', detail: '3×12/kant — jaag symmetrie na' },
      { name: 'Excentrische hieldaling van opstapje', detail: '3×12/kant' },
      { name: 'Step-down gecontroleerd', detail: '3×10/kant' },
      { name: 'Y-balance / star reach', detail: '3×5/richting' },
      { name: 'Bilaterale pogo-hops laag (impact-intro)', detail: '3×20 — alleen pijnvrij' },
      { name: 'Balans ogen dicht op foam', detail: '3×30s/kant' },
    ]
  } else if (ph === 3) {
    note = `Fase 3 — plyometrie & symmetrie ≥90%. Alleen als fase 2 gehaald is; anders bij fase-2-blok blijven.`
    items = [
      { name: 'Single hop for distance — meet L vs R', detail: '4×5/kant — ≥90% symmetrie = doel' },
      { name: 'Triple hop / bounding', detail: '4×3/kant' },
      { name: 'Zijwaartse hops (side hop)', detail: '3×20s/kant' },
      { name: 'Box jumps + zachte landing', detail: '4×5' },
      { name: 'Afrem- & landingsdrills', detail: '3×6' },
    ]
  } else {
    note = `Fase 4 — volledige belasting & go/no-go. Alleen als fase 3 gehaald is.`
    items = [
      { name: 'Hop-batterij: single/triple/crossover/6m — test symmetrie', detail: '≥95% = GO' },
      { name: 'Reactieve sprongen / depth jumps', detail: '4×4' },
      { name: 'Agility: figure-8, carioca, 5-10-5 op snelheid', detail: '4 rondes' },
      { name: 'Trapvolume op pads (front/side/roundhouse)', detail: '5×10/kant' },
    ]
  }
  return {
    type: 'ankle',
    label: `Enkel-reha — fase ${ph}`,
    note,
    items: items.map((it, i) => ({ key: `ank${i}`, name: it.name, detail: it.detail, xp: 6 })),
  }
}

// ---------- CONDITIE per fase (impact-gated) ----------
function conditioningBlock(week: number, long: boolean): PlanBlock {
  const ph = phaseForWeek(week)
  let note = ''
  let items: { name: string; detail: string }[] = []
  if (ph === 1) {
    note = 'Fase 1 — géén impact. Alleen fiets/roeier/ski-erg/incline-walk.'
    items = long
      ? [{ name: 'Zone 2 fiets of roeier', detail: `${25 + week * 3} min rustig (kunt praten)` }]
      : [{ name: 'Intervallen fiets/roeier', detail: '6×2 min hard / 1 min rust' }]
  } else if (ph === 2) {
    const jog = Math.min(30, 8 + (week - 4) * 6)
    note = 'Fase 2 — hardloop-opbouw. Alleen starten als je 45 min pijnvrij kunt wandelen (fase-1-criterium).'
    items = long
      ? [{ name: 'Wandel-jog → aaneengesloten joggen', detail: `richt op ${jog} min joggen, pijnvrij, dag erna groen` }]
      : [{ name: 'Wandel-jog intervallen 50/50', detail: '6×(2 min jog / 2 min wandel) op vlak' }]
  } else if (ph === 3) {
    note = 'Fase 3 — hardlopen & intervallen. Alleen als fase 2 gehaald is.'
    items = long
      ? [{ name: 'Tempoloop', detail: '20-25 min gestaag, comfortabel-zwaar' }]
      : [{ name: 'Baanintervallen', detail: '6×400 m @ 5k-tempo / 90s rust' }]
  } else {
    note = 'Fase 4 — Shaolin-conditie. Alleen als fase 3 gehaald is.'
    items = long
      ? [{ name: '5 km hardlopen', detail: 'gestaag — go/no-go-meting, dag erna groen' }]
      : [
          {
            name: 'Martial conditioning circuit',
            detail: '5 rondes: 20 burpees · 40 touwtje · 20 shadow-kicks/kant · 20s sprint',
          },
        ]
  }
  return {
    type: 'conditioning',
    label: 'Conditie',
    note,
    items: items.map((it, i) => ({ key: `con${i}`, name: it.name, detail: it.detail, xp: 12 })),
  }
}

// ---------- STANCES / Ma Bu ----------
function stanceBlock(week: number): PlanBlock {
  const holdA = 30 + (week - 1) * 12 // ma bu horse stance, s
  const items = [
    { name: 'Ma Bu (paardstand) — statisch houden', detail: `3×${holdA}s — rug recht, dijen parallel` },
    { name: 'Gong Bu (booghouding) wisselen', detail: '3×30s/kant' },
    ...(week >= 4 ? [{ name: 'Xu Bu (lege stand) balans', detail: '3×20s/kant' }] : []),
    { name: 'Wall sit (accessoire, nulmeting 85s)', detail: `2× zo lang mogelijk` },
  ]
  return {
    type: 'stance',
    label: 'Stances (Shaolin-basis)',
    items: items.map((it, i) => ({ key: `stn${i}`, name: it.name, detail: it.detail, xp: 10 })),
  }
}

// ---------- MOBILITEIT / SPAGAAT ----------
function mobilityBlock(week: number, deep: boolean): PlanBlock {
  const pnf = deep ? 'PNF: 30s rek → 6s aanspannen → dieper, ×4' : 'rustig 3×40s vasthouden'
  const base = [
    { name: 'Front split-progressie (voorwaartse spagaat)', detail: `beide kanten — ${pnf}` },
    { name: 'Side split / straddle-progressie', detail: pnf },
    { name: 'Heupbuigers (couch stretch)', detail: '3×40s/kant' },
    { name: 'Hamstrings PNF', detail: '3×40s/kant' },
    { name: 'Diepe squat hold (Shaolin)', detail: `${60 + week * 5}s totaal` },
  ]
  const extra = deep
    ? [
        { name: '90/90 heuprotaties', detail: '3×8/kant' },
        { name: 'Thoracale rotatie + schouder-dislocates', detail: '2×10' },
      ]
    : []
  const kicks =
    phaseForWeek(week) >= 2
      ? [{ name: 'Trap-hoogte drills (front/side) — gecontroleerd', detail: '3×8/kant, pijnvrije enkel' }]
      : []
  const items = [...base, ...extra, ...kicks]
  return {
    type: 'mobility',
    label: deep ? 'Mobiliteit & flexibiliteit (diep)' : 'Mobiliteit (kort)',
    items: items.map((it, i) => ({ key: `mob${i}`, name: it.name, detail: it.detail, xp: 5 })),
  }
}

// ---------- CORE / taille ----------
function coreBlock(week: number): PlanBlock {
  const items = [
    { name: 'Plank (nulmeting 120s)', detail: `2× zo lang mogelijk` },
    { name: 'Hangende beenheffing', detail: '3×10-15' },
    { name: 'Pallof press (anti-rotatie)', detail: '3×12/kant' },
    { name: 'Ab-wheel of hollow hold', detail: '3× tot RPE 8' },
  ]
  return {
    type: 'core',
    label: 'Core & taille',
    items: items.map((it, i) => ({ key: `cor${i}`, name: it.name, detail: it.detail, xp: 6 })),
  }
}

// ---------- MEDITATIE ----------
function meditationBlock(week: number): PlanBlock {
  const min = week <= 2 ? 10 : week <= 4 ? 12 : week <= 8 ? 15 : 20
  return {
    type: 'meditation',
    label: 'Meditatie & ademwerk',
    items: [
      { key: 'med0', name: `Zitmeditatie`, detail: `${min} min`, xp: min },
      { key: 'med1', name: 'Box-ademhaling 4·4·4·4', detail: '3 min', xp: 4 },
    ],
  }
}

// ---------- WEEK-TEMPLATE ----------
function buildDay(week: number, dayNo: number, date: string): PlanDay {
  const ph = phaseForWeek(week)
  const tag = isTaper(week) ? ' · taper' : isDeload(week) ? ' · deload' : ''
  const mk = (title: string, subtitle: string, blocks: PlanBlock[]): PlanDay => ({
    date,
    week_no: week,
    day_no: dayNo,
    phase_target: ph,
    title,
    subtitle: subtitle + tag,
    is_rest: false,
    blocks: [...blocks, meditationBlock(week)],
  })

  switch (dayNo) {
    case 1: // ma — Push + core + Ma Bu
      return mk('Push + Core + Stance', 'Borst · schouders · triceps · taille', [
        strengthBlock(week, 'Kracht — Push', PUSH_A),
        coreBlock(week),
        stanceBlock(week),
        ankleBlock(week),
      ])
    case 2: // di — Benen A + enkel
      return mk('Benen A + Enkel', 'Quads · eenbenige kracht · enkel-reha', [
        strengthBlock(week, 'Kracht — Benen (quad-focus)', LEGS_A),
        ankleBlock(week),
        mobilityBlock(week, false),
      ])
    case 3: // wo — Pull + conditie
      return mk('Pull + Conditie', 'Rug · biceps · grip · conditie', [
        strengthBlock(week, 'Kracht — Pull', PULL),
        conditioningBlock(week, false),
        ankleBlock(week),
      ])
    case 4: // do — mobiliteit + balans (actief herstel)
      return mk('Mobiliteit + Balans', 'Spagaat · trap-flexibiliteit · balans · sauna', [
        mobilityBlock(week, true),
        ankleBlock(week),
        { type: 'conditioning', label: 'Herstel', note: 'Laag intensief', items: [
          { key: 'sauna', name: 'Sauna', detail: '2×12-15 min — na de mobiliteit', xp: 6 },
          { key: 'walk', name: 'Rustige wandeling', detail: '20-30 min, pijnvrij', xp: 6 },
        ] },
      ])
    case 5: // vr — Push/schouders + core + Ma Bu
      return mk('Push (schouders) + Core + Stance', 'Schouder-uithouding · handstand · taille', [
        strengthBlock(week, 'Kracht — Push (schouder-focus)', PUSH_B),
        coreBlock(week),
        stanceBlock(week),
        ankleBlock(week),
      ])
    case 6: // za — Benen B + conditie + spagaat
      return mk('Benen B + Conditie', 'Achterketen · bilkracht · conditie · spagaat', [
        strengthBlock(week, 'Kracht — Benen (achterketen)', LEGS_B),
        conditioningBlock(week, true),
        mobilityBlock(week, true),
      ])
    default: // zo — rust
      return {
        date,
        week_no: week,
        day_no: dayNo,
        phase_target: ph,
        title: 'Rustdag',
        subtitle: 'Herstel · meditatie · sauna' + tag,
        is_rest: true,
        blocks: [
          {
            type: 'rest',
            label: 'Actief herstel',
            note: 'Vandaag draait om herstel — je enkel en zenuwstelsel bouwen nú op.',
            items: [
              { key: 'r0', name: 'Lichte mobiliteit / lopen', detail: '15-20 min los', xp: 6 },
              { key: 'r1', name: 'Sauna', detail: '2×15 min', xp: 6 },
              { key: 'r2', name: 'Enkel-mobiliteit (knee-to-wall, elastiek)', detail: '2×10/kant', xp: 6 },
            ],
          },
          meditationBlock(week),
        ],
      }
  }
}

// ---------- PUBLIEKE GENERATOR ----------
export function buildPlan(startISO: string = PLAN_START): PlanDay[] {
  const days: PlanDay[] = []
  for (let w = 1; w <= PROGRAM_WEEKS; w++) {
    for (let d = 1; d <= 7; d++) {
      const offset = (w - 1) * 7 + (d - 1)
      days.push(buildDay(w, d, plusDays(startISO, offset)))
    }
  }
  return days
}

// Rijen klaar om in Supabase 'plan_days' te inserten (self-seed bij eerste load).
export function planRows(userId: string, startISO: string = PLAN_START) {
  return buildPlan(startISO).map((d) => ({
    user_id: userId,
    date: d.date,
    week_no: d.week_no,
    day_no: d.day_no,
    phase_target: d.phase_target,
    title: d.title,
    subtitle: d.subtitle,
    is_rest: d.is_rest,
    blocks: d.blocks,
  }))
}

// Totaal XP dat een volledige dag oplevert (voor de dag-bonus).
export const dayMaxXp = (day: PlanDay) =>
  day.blocks.reduce((a, b) => a + b.items.reduce((x, i) => x + i.xp, 0), 0)

export const PLAN_DAY_BONUS = 40 // bonus als je álles van een dag afvinkt

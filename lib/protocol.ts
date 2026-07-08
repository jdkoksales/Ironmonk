export const PHASES = [
  {
    n: 1,
    title: 'Fundament',
    goal: 'Zwelling weg, volledige beweeglijkheid, basiskracht & balans',
    criteria: [
      { key: 'f8', label: 'Figure-8 verschil < 1 cm', auto: 'f8' },
      { key: 'ktw', label: 'Knee-to-wall verschil < 1,5 cm', auto: 'ktw' },
      { key: 'heel', label: '≥15 heel raises én ≥80% van gezonde kant', auto: 'heel80' },
      { key: 'bal', label: 'Balans ogen dicht ≥20 s (geblesseerde been)', auto: 'bal20' },
      { key: 'walk', label: '45 min stevig wandelen pijnvrij (ook dag erna)' },
      { key: 'stab', label: '7 dagen zonder instabiliteitsmoment' },
    ],
  },
  {
    n: 2,
    title: 'Kracht & loopopbouw',
    goal: 'Eenbenige kracht, dynamische balans, 30 min joggen',
    criteria: [
      { key: 'jog30', label: '30 min aaneen joggen, groen + dag erna' },
      { key: 'heel90', label: 'Heel raises ≥20 én ≥90% symmetrie', auto: 'heel90' },
      { key: 'bal30', label: 'Balans ogen dicht ≥30 s beide benen', auto: 'bal30' },
      { key: 'ybal', label: 'Y-balance verschil < 4 cm per richting' },
      { key: 'cod', label: 'Geen instabiliteit bij carioca & bochten' },
    ],
  },
  {
    n: 3,
    title: 'Plyometrie & sportspecifiek',
    goal: 'Springen, landen, sprint 90%, trappen op pads',
    criteria: [
      { key: 'hop1', label: 'Single hop ≥90% symmetrie', auto: 'hop_single_90' },
      { key: 'hop3', label: 'Triple hop ≥90% symmetrie', auto: 'hop_triple_90' },
      { key: 'hops', label: 'Side hop ≥90% symmetrie', auto: 'hop_side_90' },
      { key: 'plyo', label: '2 wk plyo & pads groen (ook dag erna)' },
      { key: 'sprint', label: 'Sprint 90% zonder reactie' },
    ],
  },
  {
    n: 4,
    title: 'GO / NO-GO — vertrek',
    goal: 'Volledige belasting + Shaolin-simulatie',
    criteria: [
      { key: 'hop95', label: 'Single + triple hop ≥95% symmetrie', auto: 'hop_95' },
      { key: 'hops90', label: 'Side hop ≥90%', auto: 'hop_side_90' },
      { key: 'run5', label: '5 km zonder reactie de dag erna' },
      { key: 'full', label: '2 wk 100% training klachtenvrij' },
      { key: 'conf', label: 'Vertrouwen in enkel ≥ 9/10' },
    ],
  },
]

export const TEST_GROUPS = [
  {
    title: 'Baseline — weekgemiddelden',
    tests: [
      { key: 'rhr_avg', label: 'Rusthartslag (5-dgn gem.)', unit: 'bpm' },
      { key: 'weight_avg', label: 'Gewicht (5-dgn gem.)', unit: 'kg' },
    ],
  },
  {
    title: 'Omtrekken',
    tests: [
      { key: 'waist', label: 'Taille', unit: 'cm' },
      { key: 'chest', label: 'Borst', unit: 'cm' },
      { key: 'thigh', label: 'Bovenbeen', unit: 'cm', sides: true },
      { key: 'arm', label: 'Bovenarm', unit: 'cm', sides: true },
      { key: 'f8', label: 'Figure-8 enkel', unit: 'cm', sides: true },
    ],
  },
  {
    title: 'Dag 1 — Kracht, grip & core',
    tests: [
      { key: 'pushups', label: 'Push-ups max', unit: 'reps' },
      { key: 'pullups', label: 'Pull-ups max', unit: 'reps' },
      { key: 'dips', label: 'Dips max', unit: 'reps' },
      { key: 'deadhang', label: 'Dead hang', unit: 'sec' },
      { key: 'plank', label: 'Plank', unit: 'sec' },
      { key: 'grip', label: 'Grip (dynamometer)', unit: 'kg', sides: true },
    ],
  },
  {
    title: 'Dag 2 — Conditie & benen',
    tests: [
      { key: 'row2k', label: '2000 m roeien', unit: 'sec' },
      { key: 'bike10', label: 'Fiets 10 min', unit: 'm' },
      { key: 'wallsit', label: 'Wall sit', unit: 'sec' },
      { key: 'squats2', label: 'Squats 2 min', unit: 'reps' },
      { key: 'splitsq', label: 'Split squat 60 s', unit: 'reps', sides: true },
    ],
  },
  {
    title: 'Dag 3 — Mobiliteit & balans',
    tests: [
      { key: 'chinups', label: 'Chin-ups max', unit: 'reps' },
      { key: 'balance_closed', label: 'Balans ogen dicht', unit: 'sec', sides: true },
      { key: 'ktw', label: 'Knee-to-wall', unit: 'cm', sides: true },
      { key: 'heelraise', label: 'Heel raises max', unit: 'reps', sides: true },
      { key: 'sitreach', label: 'Sit-and-reach', unit: 'cm' },
      { key: 'backscratch', label: 'Back-scratch', unit: 'cm', sides: true },
      { key: 'armfloor', label: 'Liggende armheffing (pols-vloer)', unit: 'cm' },
      { key: 'butterfly', label: 'Butterfly knie-vloer', unit: 'cm', sides: true },
      { key: 'squathold', label: 'Diepe squat hold', unit: 'sec' },
      { key: 'frontsplit', label: 'Front split (bekken-vloer)', unit: 'cm', sides: true },
      { key: 'straddle', label: 'Straddle (bekken-vloer)', unit: 'cm' },
    ],
  },
  {
    title: 'Fase 3–4 — uitgestelde testen',
    note: 'Pas afnemen als je fase 3-criteria in zicht zijn. Dit zijn óók je go/no-go-metingen.',
    tests: [
      { key: 'sprint30', label: '30 m sprint', unit: 'sec' },
      { key: 'jumph', label: 'Spronghoogte', unit: 'cm' },
      { key: 'broadjump', label: 'Verspringen uit stand', unit: 'cm' },
      { key: 'run5k', label: '5 km hardlopen', unit: 'sec' },
      { key: 'hop_single', label: 'Single hop for distance', unit: 'cm', sides: true },
      { key: 'hop_triple', label: 'Triple hop', unit: 'cm', sides: true },
      { key: 'hop_side', label: 'Side hop 30 s', unit: 'reps', sides: true },
    ],
  },
]

export const TRAINING_TYPES = ['Kracht', 'Conditie', 'Enkelroutine', 'Kungfu', 'Mobiliteit', 'Rustdag']

export const PROVERBS = [
  '不怕慢，只怕站 — Wees niet bang om langzaam te gaan, alleen om stil te staan.',
  '千里之行，始於足下 — Een reis van duizend mijl begint onder je voeten.',
  '滴水穿石 — Druppelend water slijt de steen.',
  'Ik vrees niet de man die 10.000 trappen één keer oefende, maar de man die één trap 10.000 keer oefende.',
  'De meester heeft vaker gefaald dan de leerling heeft geprobeerd.',
  '师父领进门，修行在个人 — De meester opent de deur; naar binnen gaan doe je zelf.',
  'Discipline is kiezen tussen wat je nú wilt en wat je het méést wilt.',
]

export const proverbOfDay = () => PROVERBS[Math.floor(Date.now() / 86400000) % PROVERBS.length]

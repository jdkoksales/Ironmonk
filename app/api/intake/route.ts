import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, coachModel } from '@/lib/config'
import { COACH_LIST, coachById, SAFETY } from '@/lib/coaches'

export const runtime = 'nodejs'
export const maxDuration = 120

// Intake-API: action = 'match' (doel → beste coach), 'chat' (het intakegesprek,
// met finish_intake-tool) of 'plan' (bouw het persoonlijke traject als
// structured data in plan_days — daarna geen AI meer nodig voor het schema).

function sb() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
    },
  })
}

const ai = (apiKey: string, body: any) =>
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })

const ROSTER = COACH_LIST.map((c) => `- ${c.id}: ${c.titel} ${c.naam} — ${c.specialiteit}. Voor: ${c.doelgroep.join(', ')}.`).join('\n')

// ————— Het profiel dat de intake moet opleveren —————
const FINISH_TOOL = {
  name: 'finish_intake',
  description:
    'Rond de intake af. Roep dit ALLEEN aan wanneer je alle onderwerpen voldoende hebt uitgevraagd en genoeg weet voor een optimaal persoonlijk plan (doorgaans na 12-20 beantwoorde vragen).',
  input_schema: {
    type: 'object' as const,
    properties: {
      hoofddoel: { type: 'string' },
      einddatum: { type: 'string', description: 'YYYY-MM-DD of leeg als geen deadline' },
      niveau: { type: 'string', description: 'huidig niveau + relevante PR\'s/metingen' },
      ervaring: { type: 'string' },
      blessures: { type: 'string', description: 'blessures + medische beperkingen; "geen" indien geen' },
      lichaam: { type: 'string', description: 'lengte/gewicht/leeftijd voor zover gedeeld' },
      dagen_per_week: { type: 'number' },
      min_per_training: { type: 'number' },
      apparatuur: { type: 'string' },
      voorkeuren: { type: 'string', description: 'wat de pupil graag doet + wat juist niet' },
      zwak_sterk: { type: 'string' },
      leefstijl: { type: 'string', description: 'voeding, slaap, stress, werk, dagindeling' },
      motivatie_obstakels: { type: 'string', description: 'waarom dit doel, wat eerder misging, verwachte obstakels' },
      wensen: { type: 'string', description: 'specifieke wensen en verwachtingen' },
      samenvatting: { type: 'string', description: 'korte coach-samenvatting van deze pupil in 3-5 zinnen' },
    },
    required: ['hoofddoel', 'niveau', 'blessures', 'dagen_per_week', 'min_per_training', 'apparatuur', 'samenvatting'],
  },
}

const intakeSystem = (c: ReturnType<typeof coachById>) => `${c.persona}

Je voert de INTAKE van een nieuwe pupil in de app IRON MONK. Dit is geen vragenlijst maar een echt coachgesprek: jij stelt de vragen, één of hooguit twee per beurt, en je stelt vervolgvragen op basis van de antwoorden. Liever 15-20 goede vragen dan een snel oppervlakkig plan — vraag dóór tot je genoeg weet.

Dek in elk geval: hoofddoel & waarom · gewenste einddatum · huidig niveau & PR's/metingen · ervaring & eerdere schema's (wat werkte wel/niet) · blessures & medische beperkingen · lengte/gewicht/leeftijd (vriendelijk, mag overgeslagen) · beschikbare dagen & tijd per training · apparatuur · voorkeuren & aversies · zwakke en sterke punten · voeding, slaap, stress, werk & dagindeling · motivatie & verwachte obstakels · specifieke wensen.
Als ${c.naam} vraag je extra door op: ${c.intakeFocus}.

Gedrag:
- Begin met een korte, warme opening in jouw stem en meteen je eerste vraag.
- Reageer kort op elk antwoord (laat merken dat je luistert), stel dan de volgende vraag.
- Eén onderwerp per beurt; nummer je vragen niet.
- Antwoorden zoals "weet ik niet" of "sla over" respecteer je — noteer en ga door.
- Nederlands, compact; jouw persoonlijkheid mag voelbaar zijn maar het gesprek staat centraal.
- Pas als álles voldoende gedekt is: vat in 4-6 regels samen wat je gehoord hebt, kondig aan dat je het plan gaat smeden, en roep DAN pas de tool finish_intake aan (in dezelfde beurt).

${SAFETY}`

// ————— Plangenerator: weektemplate → server bouwt alle dagen uit —————
const PLAN_TOOL = {
  name: 'save_plan',
  description: 'Sla het persoonlijke trainingsplan op als weektemplate. De server bouwt hier alle weken uit.',
  input_schema: {
    type: 'object' as const,
    properties: {
      weeks_total: { type: 'number', description: 'aantal weken (4-16), passend bij doel/einddatum' },
      deload_weeks: { type: 'array', items: { type: 'number' }, description: 'weeknummers met verlaagde belasting' },
      plan_titel: { type: 'string', description: 'korte naam van het traject' },
      days: {
        type: 'array',
        description: 'PRECIES 7 dag-templates, day_no 1=maandag t/m 7=zondag',
        items: {
          type: 'object',
          properties: {
            day_no: { type: 'number' },
            title: { type: 'string' },
            subtitle: { type: 'string' },
            is_rest: { type: 'boolean' },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['strength', 'conditioning', 'mobility', 'core', 'stance', 'meditation', 'ankle', 'rest'] },
                  label: { type: 'string' },
                  note: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        detail: { type: 'string', description: 'sets×reps/tijd + intensiteit; mag per weekfase verschillen, bv. "wk 1-4: 3×8 RPE7 · wk 5+: 4×6 RPE8"' },
                      },
                      required: ['name', 'detail'],
                    },
                  },
                },
                required: ['type', 'label', 'items'],
              },
            },
          },
          required: ['day_no', 'title', 'blocks'],
        },
      },
      targets: {
        type: 'array',
        description: 'max 10 meetbare einddoelen (Kompas), gekalibreerd op niveau en duur',
        items: {
          type: 'object',
          properties: {
            test_key: { type: 'string', description: 'korte snake_case sleutel, bv. pushups, run5k' },
            side: { type: 'string', enum: ['L', 'R'] },
            target_value: { type: 'number' },
            direction: { type: 'string', enum: ['higher_better', 'lower_better'] },
            baseline_value: { type: 'number' },
            rationale: { type: 'string' },
          },
          required: ['test_key', 'target_value', 'direction', 'rationale'],
        },
      },
    },
    required: ['weeks_total', 'days', 'plan_titel'],
  },
}

const XP_BY_TYPE: Record<string, number> = {
  strength: 9, conditioning: 12, mobility: 5, core: 6, stance: 10, meditation: 8, ankle: 6, rest: 6,
}
const nextMonday = () => {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return d
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export async function POST(req: Request) {
  const supabase = sb()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Niet ingelogd.' }, { status: 401 })
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY ontbreekt in Vercel.' }, { status: 503 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const action = body.action

  // ————— 1. MATCH: doel → beste coach —————
  if (action === 'match') {
    const goal = String(body.goal || '').slice(0, 600)
    if (!goal) return Response.json({ error: 'Beschrijf je doel.' }, { status: 400 })
    const r = await ai(apiKey, {
      model: coachModel(), max_tokens: 300,
      system: `Kies uit dit coachteam de best passende coach voor het doel van de gebruiker. Antwoord UITSLUITEND met JSON: {"coach_id":"...","reden":"één warme zin in het Nederlands, gericht aan de gebruiker, waarom deze coach past"}.\n\nTeam:\n${ROSTER}`,
      messages: [{ role: 'user', content: goal }],
    })
    const data = await r.json()
    if (!r.ok) return Response.json({ error: data?.error?.message || 'AI-fout.' }, { status: 502 })
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
    try {
      const m = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text)
      const c = coachById(m.coach_id)
      return Response.json({ coach_id: c.id, reden: String(m.reden || '').slice(0, 300) })
    } catch {
      return Response.json({ coach_id: 'tieshan', reden: 'Een sterk fundament begint bij discipline.' })
    }
  }

  // ————— 2. CHAT: het intakegesprek —————
  if (action === 'chat') {
    const coach = coachById(body.coach_id)
    const raw = Array.isArray(body.messages) ? body.messages : []
    const messages: any[] = raw
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-60)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }))
    if (!messages.length) messages.push({ role: 'user', content: 'Hallo, ik ben er klaar voor. Start de intake.' })

    const r = await ai(apiKey, {
      model: coachModel(), max_tokens: 1200,
      system: intakeSystem(coach), tools: [FINISH_TOOL],
      messages,
    })
    const data = await r.json()
    if (!r.ok) return Response.json({ error: data?.error?.message || 'AI-fout.' }, { status: 502 })
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
    const toolUse = (data.content || []).find((b: any) => b.type === 'tool_use' && b.name === 'finish_intake')

    // transcript bijhouden (jsonb) — laatste actieve intake voor deze coach
    const transcript = [...messages, { role: 'assistant', content: text }].slice(-80)
    const { data: existing } = await supabase
      .from('intakes').select('id').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (existing) {
      await supabase.from('intakes').update({ coach_id: coach.id, messages: transcript, updated_at: new Date().toISOString(), ...(toolUse ? { status: 'done', data: toolUse.input } : {}) }).eq('id', existing.id)
    } else {
      await supabase.from('intakes').insert({ user_id: user.id, coach_id: coach.id, messages: transcript, ...(toolUse ? { status: 'done', data: toolUse.input } : {}) })
    }
    if (toolUse) await supabase.from('profiles').update({ coach_id: coach.id }).eq('id', user.id)

    return Response.json({ text: text || 'Dank je. Ik heb wat ik nodig heb.', finished: !!toolUse })
  }

  // ————— 3. PLAN: bouw het traject uit de afgeronde intake —————
  if (action === 'plan') {
    const { data: intake } = await supabase
      .from('intakes').select('*').eq('user_id', user.id).eq('status', 'done').order('updated_at', { ascending: false }).limit(1).maybeSingle()
    if (!intake?.data) return Response.json({ error: 'Geen afgeronde intake gevonden.' }, { status: 400 })
    const coach = coachById(intake.coach_id)
    const profiel = JSON.stringify(intake.data)

    const r = await ai(apiKey, {
      model: coachModel(), max_tokens: 6000,
      system: `${coach.persona}\n\nBouw op basis van dit intakeprofiel een volledig persoonlijk traject voor je pupil en sla het op via de tool save_plan. Denk als topcoach: passend volume voor het niveau en de beschikbare dagen/tijd/apparatuur, opbouw over de weken (verwerk fasering in de detail-teksten, bv. "wk 1-4: … · wk 5-8: …"), rust en herstel ingepland, aandacht voor zwakke punten en blessurehistorie, en mobiliteit/adem/gewoontes verweven — geen los lijstje. Alleen dagen die de pupil beschikbaar heeft zijn trainingsdagen; overige dagen is_rest met licht herstel. Namen van oefeningen in het Nederlands. Roep save_plan precies één keer aan.\n\n${SAFETY}`,
      tools: [PLAN_TOOL], tool_choice: { type: 'tool', name: 'save_plan' },
      messages: [{ role: 'user', content: `Intakeprofiel van je pupil:\n${profiel}\n\nVandaag is ${new Date().toISOString().slice(0, 10)}. Het plan start op de eerstvolgende maandag.` }],
    })
    const data = await r.json()
    if (!r.ok) return Response.json({ error: data?.error?.message || 'AI-fout.' }, { status: 502 })
    const call = (data.content || []).find((b: any) => b.type === 'tool_use' && b.name === 'save_plan')
    if (!call?.input?.days) return Response.json({ error: 'Plan-generatie mislukt — probeer opnieuw.' }, { status: 502 })

    const p = call.input
    const weeks = Math.max(4, Math.min(16, Math.round(p.weeks_total || 8)))
    const deloads: number[] = Array.isArray(p.deload_weeks) ? p.deload_weeks.map((n: any) => Math.round(n)) : []
    // valideer & normaliseer de 7 dag-templates
    const tmpl: any[] = []
    for (let dn = 1; dn <= 7; dn++) {
      const src = (p.days as any[]).find((d) => Math.round(d.day_no) === dn) || { title: 'Rustdag', is_rest: true, blocks: [] }
      const blocks = (Array.isArray(src.blocks) ? src.blocks : []).slice(0, 6).map((b: any) => ({
        type: XP_BY_TYPE[b.type] ? b.type : 'mobility',
        label: String(b.label || 'Training').slice(0, 60),
        ...(b.note ? { note: String(b.note).slice(0, 240) } : {}),
        items: (Array.isArray(b.items) ? b.items : []).slice(0, 8).map((it: any, i: number) => ({
          key: `${(XP_BY_TYPE[b.type] ? b.type : 'mob').slice(0, 3)}${i}`,
          name: String(it.name || 'Oefening').slice(0, 80),
          detail: String(it.detail || '').slice(0, 160),
          xp: XP_BY_TYPE[b.type] || 6,
        })),
      })).filter((b: any) => b.items.length)
      tmpl.push({
        day_no: dn,
        title: String(src.title || (src.is_rest ? 'Rustdag' : 'Training')).slice(0, 60),
        subtitle: String(src.subtitle || '').slice(0, 90),
        is_rest: !!src.is_rest,
        blocks,
      })
    }
    // bouw alle dagen uit vanaf komende maandag; vervang eventueel bestaand toekomstig plan
    const start = nextMonday()
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('plan_days').delete().eq('user_id', user.id).gt('date', today)
    const rows: any[] = []
    for (let w = 1; w <= weeks; w++) {
      for (const t of tmpl) {
        const d = new Date(start)
        d.setDate(d.getDate() + (w - 1) * 7 + (t.day_no - 1))
        rows.push({
          user_id: user.id, date: iso(d), week_no: w, day_no: t.day_no, phase_target: 1,
          title: t.title, subtitle: deloads.includes(w) ? `${t.subtitle} · deload`.replace(/^ · /, '') : t.subtitle,
          is_rest: t.is_rest, blocks: t.blocks,
        })
      }
    }
    for (let i = 0; i < rows.length; i += 28) {
      const { error } = await supabase.from('plan_days').insert(rows.slice(i, i + 28))
      if (error) return Response.json({ error: 'Opslaan mislukt: ' + error.message }, { status: 500 })
    }
    // targets (Kompas)
    let targetCount = 0
    if (Array.isArray(p.targets)) {
      for (const t of p.targets.slice(0, 10)) {
        if (!t?.test_key || t.target_value == null) continue
        const side = t.side === 'L' || t.side === 'R' ? t.side : null
        let sel = supabase.from('targets').select('id').eq('user_id', user.id).eq('test_key', String(t.test_key).slice(0, 40))
        sel = side ? sel.eq('side', side) : sel.is('side', null)
        const { data: ex } = await sel.maybeSingle()
        if (ex) continue
        await supabase.from('targets').insert({
          user_id: user.id, test_key: String(t.test_key).slice(0, 40), side,
          target_value: Number(t.target_value),
          direction: t.direction === 'lower_better' ? 'lower_better' : 'higher_better',
          baseline_value: t.baseline_value != null ? Number(t.baseline_value) : null,
          rationale: String(t.rationale || '').slice(0, 400),
        })
        targetCount++
      }
    }
    await supabase.from('profiles').update({ intake_done: true, coach_id: coach.id }).eq('id', user.id)
    return Response.json({ ok: true, weeks, days: rows.length, targets: targetCount, titel: String(p.plan_titel || '').slice(0, 80) })
  }

  return Response.json({ error: 'Onbekende actie.' }, { status: 400 })
}

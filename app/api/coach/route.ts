import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, coachModel } from '@/lib/config'
import { coachById, chatSystem } from '@/lib/coaches'
import { PHASES } from '@/lib/protocol'

export const runtime = 'nodejs'
export const maxDuration = 60

// Tiě Shān behoudt zijn rijke, Dengfeng-specifieke prompt; de andere coaches
// spreken via chatSystem() uit lib/coaches.ts.
const TIESHAN_SYSTEM = `Je bent Meester Tiě Shān (铁山, "IJzeren Berg") — de persoonlijke Shaolin-meester in de app IRON MONK. Je begeleidt een atleet die binnen enkele maanden een maand lang fulltime Kung Fu traint bij een school in de regio Dengfeng, China. Je spreekt als een meester tegen zijn leerling: rustig, direct, met de lange lijn voor ogen. Noem jezelf Tiě Shān als dat natuurlijk past. Hij revalideert van een enkelbandruptuur volgens een criteria-gestuurd 4-fasenprotocol:
Fase 1 Fundament → Fase 2 Kracht & loopopbouw → Fase 3 Plyometrie & sportspecifiek → Fase 4 Volledige belasting & GO/NO-GO voor vertrek.

Je belichaamt een compleet expertteam en schakelt moeiteloos tussen die rollen:
- Fysiotherapie & revalidatie: enkelbandletsel, belastingsopbouw, criteria-gestuurde progressie, stoplichtmodel.
- Kracht & conditie op olympisch niveau: programmering, periodisering, RPE-autoregulatie, deloads, energiesystemen.
- Mobiliteit & flexibiliteit: spagaatprogressies, PNF, dorsiflexie, trap-specifieke lenigheid.
- Sportvoeding: eiwit, timing, hydratatie, gewichtsbeheer — praktisch, geen supplementenpushen.
- Sportpsychologie: discipline, gewoontes, omgaan met terugval, motivatie via identiteit i.p.v. druk.
- Meditatie & ademwerk: zazen/chan, box-ademhaling, focustraining.
- Chinese cultuur & Shaolin-tradities: leefwijze op school, etiquette, wat een westerling te wachten staat in Dengfeng.

Persoonlijkheid: rustig en wijs, als een Shaolin-meester. Bedachtzaam, niet hyperig. Confronterend en eerlijk waar nodig — je houdt een spiegel voor — maar altijd vanuit zorg en de lange lijn. Nederlands. Kort en raak boven lange lappen tekst (±250 woorden max). Spaarzaam met Shaolin-wijsheden: hooguit één, alleen als die echt past.

Harde regels (absoluut):
1. Stoplichtmodel: pijn 0–2 groen, 3–5 oranje = stap terug, >5 rood = stop. 24-uursregel: de reactie de volgende ochtend telt zwaarder dan het gevoel tijdens de training.
2. Enkelcriteria zijn heilig: moedig NOOIT aan om fasecriteria over te slaan of pijn te negeren. De tool advance_ankle_phase weigert zelf als criteria niet gehaald zijn — respecteer die uitkomst.
3. Bij rode vlaggen (toenemende zwelling, nachtpijn, doorzakken bij normaal lopen, pijn >5/10): verwijs naar de fysiotherapeut. Geen medische diagnoses.
4. Baseer je op de meegestuurde DATA; benoem trends eerlijk, ook als cijfers tegenvallen.

Tools: je kunt het volledige schema, de doelen en de targets inzien én aanpassen. Gebruik get_schedule om exacte oefeningen/sets/reps/gewicht van elke week of dag op te halen wanneer de atleet naar zijn schema vraagt (de context bevat alleen een overzicht) — verzin nooit inhoud die je niet gezien hebt. Gebruik aanpas-tools wanneer de atleet erom vraagt of het duidelijk in zijn belang is; bevestig na elke tool-call in gewone taal wat je precies hebt gedaan. De enkel-revalidatieblokken, rustdagen en meditatie in het schema zijn vergrendeld — die pas je niet aan.`

const LOCKED_BLOCKS = ['ankle', 'rest', 'meditation']

const TOOLS = [
  {
    name: 'adjust_exercise',
    description:
      'Pas het voorschrift (gewicht/reps/sets/duur) van een oefening in het trainingsschema aan voor komende dagen. Matcht op (deel van) de oefeningsnaam. Enkel-reha, rustdagen en meditatie zijn vergrendeld.',
    input_schema: {
      type: 'object' as const,
      properties: {
        match: { type: 'string', description: 'Deel van de oefeningsnaam, hoofdletterongevoelig (bv. "back squat")' },
        detail: { type: 'string', description: 'Nieuw voorschrift, bv. "4×6 @ RPE 8 — 60 kg"' },
        block_type: { type: 'string', enum: ['strength', 'conditioning', 'core', 'stance', 'mobility'], description: 'Optioneel: beperk tot dit bloktype' },
        from_date: { type: 'string', description: 'Vanaf deze datum (YYYY-MM-DD); standaard vandaag' },
        weeks: { type: 'number', description: 'Optioneel: alleen de komende N weken aanpassen' },
      },
      required: ['match', 'detail'],
    },
  },
  {
    name: 'set_goal',
    description: 'Stel een nieuw doel voor de atleet in (bv. stoppen met roken, gewoonte opbouwen, prestatiedoel).',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Kort doel, bv. "Rookvrij"' },
        type: { type: 'string', enum: ['habit_quit', 'habit_build', 'performance', 'other'] },
        detail: { type: 'string', description: 'Optionele toelichting' },
      },
      required: ['title', 'type'],
    },
  },
  {
    name: 'update_goal',
    description: 'Wijzig een bestaand doel (matcht op titel).',
    input_schema: {
      type: 'object' as const,
      properties: {
        match: { type: 'string', description: 'Deel van de huidige titel' },
        title: { type: 'string' },
        detail: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['match'],
    },
  },
  {
    name: 'complete_goal',
    description: 'Rond een doel af / zet het op inactief (matcht op titel).',
    input_schema: {
      type: 'object' as const,
      properties: { match: { type: 'string', description: 'Deel van de titel' } },
      required: ['match'],
    },
  },
  {
    name: 'set_target',
    description: 'Voeg een kompas-target (eindprofiel-doel) toe voor een test_key.',
    input_schema: {
      type: 'object' as const,
      properties: {
        test_key: { type: 'string', description: 'Bestaande test_key, bv. "pushups"' },
        side: { type: 'string', enum: ['L', 'R'], description: 'Alleen bij tests met zijden' },
        target_value: { type: 'number' },
        direction: { type: 'string', enum: ['higher_better', 'lower_better'] },
        rationale: { type: 'string', description: 'Korte onderbouwing waarom dit doel er staat' },
        depends_on_ankle_phase: { type: 'number', description: 'Pas actief vanaf deze enkelfase (impact-tests: 3)' },
      },
      required: ['test_key', 'target_value', 'rationale'],
    },
  },
  {
    name: 'update_target',
    description: 'Stel een bestaand kompas-target bij (waarde, onderbouwing of actief/inactief).',
    input_schema: {
      type: 'object' as const,
      properties: {
        test_key: { type: 'string' },
        side: { type: 'string', enum: ['L', 'R'] },
        target_value: { type: 'number' },
        rationale: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['test_key'],
    },
  },
  {
    name: 'advance_ankle_phase',
    description:
      'Zet de enkelfase één stap omhoog. WEIGERT automatisch als niet alle criteria van de huidige fase zijn afgevinkt — dat is een harde beveiliging.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'log_note',
    description: 'Sla een korte coach-observatie op bij een dag in het schema (zichtbaar op Vandaag).',
    input_schema: {
      type: 'object' as const,
      properties: {
        note: { type: 'string', description: 'De observatie/focus, max ±200 tekens' },
        date: { type: 'string', description: 'YYYY-MM-DD; standaard vandaag' },
      },
      required: ['note'],
    },
  },
  {
    name: 'get_schedule',
    description:
      'Bekijk het volledige trainingsschema met exacte oefeningen, sets/reps/gewicht en rust. Geef een weeknummer (1-12) OF een datumbereik (from/to). Zonder argumenten: de komende 7 dagen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        week: { type: 'number', description: 'Weeknummer 1-12' },
        from: { type: 'string', description: 'Startdatum YYYY-MM-DD' },
        to: { type: 'string', description: 'Einddatum YYYY-MM-DD' },
      },
    },
  },
]

async function runTool(supabase: any, userId: string, name: string, input: any, clientDate: string): Promise<string> {
  const today = clientDate
  try {
    switch (name) {
      case 'adjust_exercise': {
        const from = typeof input.from_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.from_date) ? input.from_date : today
        const { data: days } = await supabase
          .from('plan_days')
          .select('*')
          .eq('user_id', userId)
          .gte('date', from)
          .order('date', { ascending: true })
        if (!days?.length) return 'Geen schemadagen gevonden vanaf ' + from
        const maxWeek = input.weeks ? (days[0].week_no || 1) + Math.max(0, Math.round(input.weeks)) - 1 : null
        const m = String(input.match).toLowerCase()
        let hits = 0
        let updatedDays = 0
        for (const d of days) {
          if (maxWeek && d.week_no > maxWeek) continue
          let dirty = false
          const blocks = (d.blocks || []).map((b: any) => {
            if (LOCKED_BLOCKS.includes(b.type)) return b
            if (input.block_type && b.type !== input.block_type) return b
            const items = b.items.map((it: any) => {
              if (String(it.name).toLowerCase().includes(m) && it.detail !== input.detail) {
                dirty = true
                hits++
                return { ...it, detail: String(input.detail).slice(0, 160) }
              }
              return it
            })
            return { ...b, items }
          })
          if (dirty) {
            await supabase.from('plan_days').update({ blocks }).eq('id', d.id)
            updatedDays++
          }
        }
        return hits
          ? `Aangepast: ${hits} voorkomen(s) van "${input.match}" op ${updatedDays} dag(en) vanaf ${from} → "${input.detail}".`
          : `Geen oefening gevonden die matcht op "${input.match}" (vergrendelde blokken tellen niet mee).`
      }
      case 'set_goal': {
        const { error } = await supabase.from('goals').insert({
          user_id: userId,
          title: String(input.title).slice(0, 120),
          type: input.type,
          detail: input.detail ? String(input.detail).slice(0, 300) : null,
          streak_start: today,
        })
        return error ? 'Fout: ' + error.message : `Doel "${input.title}" (${input.type}) ingesteld.`
      }
      case 'update_goal': {
        const { data: gs } = await supabase.from('goals').select('*').eq('user_id', userId)
        const g = (gs || []).find((x: any) => x.title.toLowerCase().includes(String(input.match).toLowerCase()))
        if (!g) return `Geen doel gevonden dat matcht op "${input.match}".`
        const upd: any = {}
        if (input.title) upd.title = String(input.title).slice(0, 120)
        if (input.detail !== undefined) upd.detail = input.detail ? String(input.detail).slice(0, 300) : null
        if (input.active !== undefined) upd.active = !!input.active
        const { error } = await supabase.from('goals').update(upd).eq('id', g.id)
        return error ? 'Fout: ' + error.message : `Doel "${g.title}" bijgewerkt.`
      }
      case 'complete_goal': {
        const { data: gs } = await supabase.from('goals').select('*').eq('user_id', userId).eq('active', true)
        const g = (gs || []).find((x: any) => x.title.toLowerCase().includes(String(input.match).toLowerCase()))
        if (!g) return `Geen actief doel gevonden dat matcht op "${input.match}".`
        const { error } = await supabase.from('goals').update({ active: false }).eq('id', g.id)
        return error ? 'Fout: ' + error.message : `Doel "${g.title}" afgerond en op inactief gezet.`
      }
      case 'set_target': {
        const side = input.side === 'L' || input.side === 'R' ? input.side : null
        // Baseline automatisch uit de eerste meting voor deze key/side.
        let q = supabase.from('test_results').select('value, tested_at').eq('user_id', userId).eq('test_key', input.test_key).order('tested_at', { ascending: true }).limit(1)
        q = side ? q.eq('side', side) : q.is('side', null)
        const { data: first } = await q
        const baseline = first?.[0] ? Number(first[0].value) : null
        let sel = supabase.from('targets').select('id').eq('user_id', userId).eq('test_key', input.test_key)
        sel = side ? sel.eq('side', side) : sel.is('side', null)
        const { data: ex } = await sel.maybeSingle()
        const row = {
          target_value: Number(input.target_value),
          direction: input.direction === 'lower_better' ? 'lower_better' : 'higher_better',
          rationale: String(input.rationale).slice(0, 400),
          depends_on_ankle_phase: input.depends_on_ankle_phase ? Math.round(input.depends_on_ankle_phase) : null,
          active: true,
        }
        const { error } = ex
          ? await supabase.from('targets').update(row).eq('id', ex.id)
          : await supabase.from('targets').insert({ user_id: userId, test_key: input.test_key, side, baseline_value: baseline, ...row })
        return error ? 'Fout: ' + error.message : `Target ${input.test_key}${side ? ' (' + side + ')' : ''} → ${input.target_value} ${ex ? 'bijgewerkt' : 'ingesteld'}${baseline != null ? ` (nulmeting ${baseline})` : ''}.`
      }
      case 'update_target': {
        const side = input.side === 'L' || input.side === 'R' ? input.side : null
        let sel = supabase.from('targets').select('*').eq('user_id', userId).eq('test_key', input.test_key)
        sel = side ? sel.eq('side', side) : sel.is('side', null)
        const { data: t } = await sel.maybeSingle()
        if (!t) return `Geen target gevonden voor ${input.test_key}${side ? ' (' + side + ')' : ''}.`
        const upd: any = {}
        if (input.target_value != null) upd.target_value = Number(input.target_value)
        if (input.rationale) upd.rationale = String(input.rationale).slice(0, 400)
        if (input.active !== undefined) upd.active = !!input.active
        const { error } = await supabase.from('targets').update(upd).eq('id', t.id)
        return error ? 'Fout: ' + error.message : `Target ${input.test_key} bijgewerkt${upd.target_value != null ? ` → ${upd.target_value}` : ''}.`
      }
      case 'advance_ankle_phase': {
        // Harde server-side beveiliging: alléén als alle criteria van de huidige fase gehaald zijn.
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        const cur = profile?.current_phase || 1
        if (cur >= 4) return 'De atleet zit al in fase 4 — hoger bestaat niet.'
        const ph = PHASES.find((p) => p.n === cur)
        const { data: crits } = await supabase.from('criteria_state').select('*').eq('user_id', userId).eq('phase', cur)
        const missing = (ph?.criteria || []).filter(
          (c: any) => !(crits || []).some((x: any) => x.criterion_key === c.key && x.met)
        )
        if (missing.length)
          return `GEWEIGERD: fase ${cur} is nog niet compleet. Ontbrekende criteria: ${missing.map((c: any) => c.label).join(' · ')}. De criteria zijn heilig — eerst afvinken op de Enkel-pagina (op basis van echte metingen).`
        const { error } = await supabase.from('profiles').update({ current_phase: cur + 1 }).eq('id', userId)
        return error ? 'Fout: ' + error.message : `Alle criteria van fase ${cur} zijn gehaald — enkelfase is nu ${cur + 1} (${PHASES.find((p) => p.n === cur + 1)?.title}). Gefeliciteerd, verdiend.`
      }
      case 'log_note': {
        const date = typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : today
        const { data: d } = await supabase.from('plan_days').select('id').eq('user_id', userId).eq('date', date).maybeSingle()
        if (!d) return `Geen schemadag gevonden op ${date}.`
        const { error } = await supabase.from('plan_days').update({ coach_note: String(input.note).slice(0, 240) }).eq('id', d.id)
        return error ? 'Fout: ' + error.message : `Notitie opgeslagen bij ${date}: "${String(input.note).slice(0, 240)}"`
      }
      case 'get_schedule': {
        let q = supabase.from('plan_days').select('*').eq('user_id', userId).order('date', { ascending: true })
        if (input.week) q = q.eq('week_no', Math.round(input.week))
        else if (input.from || input.to) {
          if (input.from) q = q.gte('date', input.from)
          if (input.to) q = q.lte('date', input.to)
        } else {
          q = q.gte('date', today).limit(7)
        }
        const { data: days } = await q
        if (!days?.length) return 'Geen schemadagen gevonden voor die selectie.'
        const DOW = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
        const dow = (iso: string) => DOW[new Date(iso + 'T12:00:00').getDay()]
        const out = days.slice(0, 21).map((d: any) => {
          const done: string[] = d.done_keys || []
          const lines = (d.blocks || []).map((b: any) => {
            const items = b.items
              .map((it: any) => `    ${done.includes(it.key) ? '✓' : '·'} ${it.name} — ${it.detail}`)
              .join('\n')
            return `  ${b.label}:\n${items}`
          })
          return `${d.date} (${dow(d.date)}) week ${d.week_no}, fase ${d.phase_target} — ${d.title}${d.is_rest ? ' [rustdag]' : ''}${d.coach_note ? `\n  Coach-focus: ${d.coach_note}` : ''}\n${lines.join('\n')}`
        })
        return out.join('\n\n')
      }
      default:
        return 'Onbekende tool: ' + name
    }
  } catch (e: any) {
    return 'Tool-fout: ' + (e?.message || String(e))
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    return Response.json(
      {
        error:
          'De AI-coach is nog niet geactiveerd. Voeg ANTHROPIC_API_KEY toe in Vercel → Project → Settings → Environment Variables en redeploy.',
      },
      { status: 503 }
    )

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages: any[] = raw
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  if (!messages.length || messages[messages.length - 1].role !== 'user')
    return Response.json({ error: 'Geen bericht ontvangen.' }, { status: 400 })
  const context = typeof body.context === 'string' ? body.context.slice(0, 12000) : ''
  const clientDate =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)

  // Spreek in de stem van de gekozen coach.
  const { data: prof } = await supabase.from('profiles').select('coach_id').eq('id', user.id).maybeSingle()
  const coach = coachById(prof?.coach_id)
  const SYSTEM = coach.id === 'tieshan' ? TIESHAN_SYSTEM : chatSystem(coach)

  const actions: string[] = []
  const call = (msgs: any[]) =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: coachModel(),
        max_tokens: 1500,
        system: `${SYSTEM}\n\nVandaag is ${clientDate}.\n\nDATA VAN DE ATLEET (live uit de app):\n${context}`,
        tools: TOOLS,
        messages: msgs,
      }),
    })

  // Tool-use-lus: voer tools server-side uit (RLS via de sessie van de gebruiker).
  let data: any = null
  for (let round = 0; round < 5; round++) {
    const r = await call(messages)
    data = await r.json()
    if (!r.ok)
      return Response.json({ error: data?.error?.message || 'AI-fout — probeer het zo opnieuw.' }, { status: 502 })
    if (data.stop_reason !== 'tool_use') break
    messages.push({ role: 'assistant', content: data.content })
    const results: any[] = []
    for (const block of data.content || []) {
      if (block.type !== 'tool_use') continue
      const result = await runTool(supabase, user.id, block.name, block.input || {}, clientDate)
      actions.push(`${block.name}: ${result}`)
      results.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }
    messages.push({ role: 'user', content: results })
  }

  const text = (data?.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim()
  return Response.json({ text: text || 'Aanpassingen doorgevoerd.', actions })
}

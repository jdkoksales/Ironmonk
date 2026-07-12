import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, coachModel } from '@/lib/config'
import { coachById, weeklySystem } from '@/lib/coaches'
import { kompasContext } from '@/lib/kompas'

export const runtime = 'nodejs'
export const maxDuration = 60

// Blokken die de coach NOOIT mag aanpassen (enkelrevalidatie & fase-gating zijn heilig).
const LOCKED = ['ankle', 'rest', 'meditation']
const ALLOWED_SCOPES = ['strength', 'conditioning', 'core', 'stance', 'mobility']
const COOLDOWN_DAYS = 6

const SYSTEM = `Je bent Meester Tiě Shān (铁山, "IJzeren Berg"): de persoonlijke Shaolin-meester van een atleet die binnen enkele maanden een maand lang fulltime Kung Fu gaat trainen bij een school in de regio Dengfeng, China. Hij revalideert van een enkelbandruptuur volgens een criteria-gestuurd 4-fasenprotocol (Fase 1 Fundament → 2 Kracht & loopopbouw → 3 Plyometrie → 4 Volledige belasting/GO).

Dit is de WEKELIJKSE EVALUATIE (één keer per week, geen dagelijkse AI). Je krijgt de weekdata en past het vooraf gebouwde schema van de KOMENDE weken bij.

Harde regels:
1. Respecteer het protocol absoluut. Moedig NOOIT aan fasecriteria over te slaan of pijn te negeren. Raak NOOIT de enkel-revalidatie of de fase-indeling aan — die worden door criteria bepaald, niet door jou. Bij rode vlaggen (toenemende zwelling, nachtpijn, doorzakken, pijn >5/10): verwijs naar de fysio, geen diagnoses.
2. Je past alléén krachtbelasting/reps, conditie-volume, stances, core en mobiliteit bij — op basis van hoe de afgelopen week ging (adherentie, pijn, energie, slaap). Verhoog rustig bij goede weken, verlaag/behoud bij tegenvallende of pijnlijke weken.
3. Stoplicht (pijn 0–2 groen, 3–5 oranje = stap terug, >5 rood = stop) en de 24-uursregel gelden.

Antwoord UITSLUITEND met geldige JSON, geen tekst eromheen, exact dit formaat:
{
  "evaluation": "Nederlandse evaluatie, warm+direct, max ~230 woorden: wat ging goed, wat niet, en precies één focus. Sluit af met één korte Shaolin-wijsheid.",
  "focus": "één zin — de focus voor komende week (wordt in het schema getoond)",
  "adjustments": [
    { "scope": "strength|conditioning|core|stance|mobility", "match": "deel van de oefeningsnaam", "detail": "nieuw voorschrift, bv. '4×6 — +2,5 kg t.o.v. vorige week'" }
  ]
}
Maximaal 8 adjustments. 'match' is hoofdletterongevoelig en matcht op oefeningsnaam. Laat "adjustments" leeg als niets aangepast hoeft.`

function sbClient() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
}

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const avg = (rows: any[], k: string) => {
  const v = rows.filter((c) => c[k] != null)
  return v.length ? (v.reduce((a, c) => a + Number(c[k]), 0) / v.length).toFixed(1) : '-'
}

export async function POST(req: Request) {
  const supabase = sbClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    return Response.json(
      { error: 'De AI-coach is nog niet geactiveerd. Voeg ANTHROPIC_API_KEY toe in Vercel en redeploy.' },
      { status: 503 }
    )

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const force = body?.force === true
  const today = todayISO()

  const [{ data: profile }, { data: checkins }, { data: ankle }, { data: criteria }, { data: plan }, { data: targets }, { data: tests }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
      supabase.from('ankle_checks').select('*').eq('user_id', user.id).order('week_date', { ascending: false }).limit(1),
      supabase.from('criteria_state').select('*').eq('user_id', user.id),
      supabase.from('plan_days').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('targets').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('test_results').select('*').eq('user_id', user.id).order('tested_at', { ascending: true }).limit(1000),
    ])

  // Cooldown — hooguit ~1×/week (kostenbeheersing).
  if (!force && profile?.last_weekly_eval) {
    const days = (Date.now() - new Date(profile.last_weekly_eval).getTime()) / 86400000
    if (days < COOLDOWN_DAYS)
      return Response.json({
        cooldown: true,
        error: `Je deed deze week al een evaluatie (${Math.ceil(COOLDOWN_DAYS - days)} dag(en) tot de volgende). Stuur force om toch te draaien.`,
      })
  }

  // ---- Weekdata samenvatten ----
  const week = (checkins || []).slice(0, 7)
  const planPast = (plan || []).filter((d: any) => d.date <= today).slice(-7)
  const planNext = (plan || []).filter((d: any) => d.date > today)
  const curWeek = planPast[planPast.length - 1]?.week_no ?? planNext[0]?.week_no ?? 1
  const a = ankle?.[0]
  const metCount = (criteria || []).filter((c: any) => c.met).length

  const adherence = planPast
    .map((d: any) => {
      const total = (d.blocks || []).reduce((x: number, b: any) => x + b.items.length, 0)
      const done = (d.done_keys || []).length
      return `${d.date} ${d.title}: ${done}/${total}`
    })
    .join('\n')

  // Voorbeeld van de komende week aan aanpasbare oefeningen (zodat de coach weet wat er staat).
  const nextWeekNo = planNext[0]?.week_no
  const nextWeekEx = planNext
    .filter((d: any) => d.week_no === nextWeekNo)
    .flatMap((d: any) => (d.blocks || []).filter((b: any) => ALLOWED_SCOPES.includes(b.type)))
    .flatMap((b: any) => b.items.map((i: any) => `${b.type}: ${i.name} — ${i.detail}`))
    .slice(0, 30)
    .join('\n')

  const context = `Atleet: ${profile?.name || 'atleet'} | huidige enkelfase ${profile?.current_phase || 1} (geblesseerd: ${profile?.injured_side || '?'}) | schema-week ${curWeek} | fasecriteria afgevinkt: ${metCount}
Check-ins deze week: ${week.length}/7 | slaap gem ${avg(week, 'sleep_hours')}u | RHR gem ${avg(week, 'rhr')} | energie gem ${avg(week, 'energy')} | enkelpijn gem ${avg(week, 'ankle_pain')} | stabiliteit gem ${avg(week, 'ankle_stability')}
Meditatie deze week: ${week.reduce((x: number, c: any) => x + (c.meditation_min || 0), 0)} min
${a ? `Laatste enkelcheck (${a.week_date}): figure-8/omtrek ${a.figure8_l ?? '-'}/${a.figure8_r ?? '-'} | knee-to-wall ${a.ktw_l ?? '-'}/${a.ktw_r ?? '-'} | balans ${a.balance_l ?? '-'}/${a.balance_r ?? '-'} | heel raises ${a.heel_raises_l ?? '-'}/${a.heel_raises_r ?? '-'} | weekpijn ${a.pain_week ?? '-'} | instabiliteit ${a.instability ?? '-'}` : 'Nog geen enkelcheck ingevuld.'}
Schema-adherentie afgelopen 7 dagen (afgevinkt/totaal):
${adherence || 'geen'}
${targets?.length ? kompasContext(targets as any, tests || [], profile) + '\nStuur bij op het kompas: benoem waar hij vóór ligt of achterloopt en verschuif accenten in de aanpasbare blokken.' : ''}
Aanpasbare oefeningen komende week (week ${nextWeekNo ?? '-'}):
${nextWeekEx || 'geen'}`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: coachModel(),
      max_tokens: 1600,
      system: profile?.coach_id && profile.coach_id !== 'tieshan' ? weeklySystem(coachById(profile.coach_id)) : SYSTEM,
      messages: [{ role: 'user', content: `Hier is mijn weekdata. Maak de weekevaluatie en pas mijn komende weken bij.\n\n${context}` }],
    }),
  })
  const data = await r.json()
  if (!r.ok) return Response.json({ error: data?.error?.message || 'AI-fout — probeer het zo opnieuw.' }, { status: 502 })

  const rawText = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
  let parsed: any = null
  try {
    const m = rawText.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(m ? m[0] : rawText)
  } catch {}

  const evaluation = parsed?.evaluation || rawText || 'Kon de evaluatie niet lezen.'
  const focus = typeof parsed?.focus === 'string' ? parsed.focus.slice(0, 240) : ''

  // ---- Aanpassingen toepassen op komende dagen (met guardrails) ----
  let applied = 0
  const adjustments = Array.isArray(parsed?.adjustments) ? parsed.adjustments.slice(0, 8) : []
  const changed: any[] = []
  for (const day of planNext) {
    let dirty = false
    const blocks = (day.blocks || []).map((b: any) => {
      if (LOCKED.includes(b.type) || !ALLOWED_SCOPES.includes(b.type)) return b
      const items = b.items.map((it: any) => {
        for (const adj of adjustments) {
          if (
            adj &&
            ALLOWED_SCOPES.includes(adj.scope) &&
            adj.scope === b.type &&
            typeof adj.match === 'string' &&
            typeof adj.detail === 'string' &&
            it.name.toLowerCase().includes(adj.match.toLowerCase())
          ) {
            if (it.detail !== adj.detail) {
              dirty = true
              applied++
              return { ...it, detail: String(adj.detail).slice(0, 160) }
            }
          }
        }
        return it
      })
      return { ...b, items }
    })
    // focus als coach_note op de eerstvolgende week
    const noteWeek = nextWeekNo
    const setNote = focus && day.week_no === noteWeek && day.coach_note !== focus
    if (dirty || setNote) {
      changed.push({ id: day.id, blocks, coach_note: setNote ? focus : day.coach_note })
    }
  }
  for (const c of changed) {
    await supabase.from('plan_days').update({ blocks: c.blocks, coach_note: c.coach_note }).eq('id', c.id)
  }

  await supabase.from('profiles').update({ last_weekly_eval: new Date().toISOString() }).eq('id', user.id)
  await supabase.from('coach_messages').insert({ user_id: user.id, role: 'assistant', content: `📋 Weekevaluatie (week ${curWeek})\n\n${evaluation}` })

  return Response.json({ text: evaluation, applied, adjustedDays: changed.length, focus })
}

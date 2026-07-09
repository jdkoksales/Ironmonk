import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, briefingModel } from '@/lib/config'
import { goalStreak, streakFrom, readiness, daysUntil } from '@/lib/game'
import { kompasContext } from '@/lib/kompas'

export const runtime = 'nodejs'
export const maxDuration = 60

// Ochtendbriefing: max 1 AI-call per dag, afgevangen via daily_briefings.
// Gebruikt bewust een licht/goedkoop model (Haiku-klasse); de chat en de
// wekelijkse evaluatie draaien op het sterkere model.
const SYSTEM = `Je bent Shifu, de rustige, wijze coach van IRON MONK — een atleet die zich in 12 weken voorbereidt op een maand fulltime Shaolin-training in Dengfeng, terwijl hij revalideert van een enkelbandruptuur (criteria-gestuurd 4-fasenprotocol; stoplichtmodel; 24-uursregel; fasecriteria zijn heilig).

Schrijf de OCHTENDBRIEFING van vandaag. Toon: bedachtzame Shaolin-meester. Eerlijk — houd een spiegel voor, maar altijd vanuit zorg en de lange lijn. Nederlands. Kort en raak.

Structuur (max ~150 woorden, geen kopjes, gewoon vloeiende korte alinea's):
1. Korte groet.
2. Hoe hij ervoor staat — eerlijk, op basis van de data (slaap, readiness, enkel, streak).
3. De focus voor vandaag (uit het geplande schema).
4. Eén zin over zijn belangrijkste doel of waar het kompas aandacht vraagt.
Hooguit één korte Shaolin-wijsheid, alleen als die echt past. Geen medische diagnoses; bij rode vlaggen: rust en fysiotherapeut.`

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

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  // Client stuurt zijn lokale datum mee zodat de dag-grens bij de gebruiker ligt, niet bij de server.
  const date =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)

  // Al een briefing vandaag? Toon die — geen nieuwe AI-call.
  const { data: existing } = await supabase
    .from('daily_briefings')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()
  if (existing) return Response.json({ text: existing.content, cached: true, date })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY ontbreekt in Vercel.' }, { status: 503 })

  const [{ data: profile }, { data: checkins }, { data: plan }, { data: goals }, { data: goalLogs }, { data: targets }, { data: tests }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(15),
      supabase.from('plan_days').select('*').eq('user_id', user.id).eq('date', date),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('goal_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200),
      supabase.from('targets').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('test_results').select('*').eq('user_id', user.id).order('tested_at', { ascending: true }).limit(1000),
    ])

  const cs = checkins || []
  const last = cs.find((c: any) => c.date === date) || cs[0] || null
  const rd = last ? readiness(last, cs) : null
  const streak = streakFrom(cs.map((c: any) => c.date))
  const dep = daysUntil(profile?.departure_date)
  const day = plan?.[0]

  const L: string[] = []
  L.push(`Datum: ${date} | Enkelfase ${profile?.current_phase || 1} | Streak ${streak} dgn${dep != null ? ` | Nog ${dep} dagen tot Dengfeng` : ''}`)
  if (last)
    L.push(
      `Laatste check-in (${last.date}): slaap ${last.sleep_hours ?? '-'}u, RHR ${last.rhr ?? '-'}, energie ${last.energy ?? '-'}, enkelpijn ${last.ankle_pain ?? '-'}, stabiliteit ${last.ankle_stability ?? '-'}${rd ? ` | Readiness ${rd.score}` : ''}`
    )
  else L.push('Nog geen check-in ingevuld.')
  if (day) {
    const items = (day.blocks || []).map((b: any) => b.label).join(', ')
    L.push(`Training vandaag (week ${day.week_no}): ${day.title} — blokken: ${items}.${day.coach_note ? ' Weekfocus: ' + day.coach_note : ''}`)
  }
  if (goals?.length)
    L.push(
      'Doelen: ' + goals.map((g: any) => `${g.title}${g.type.startsWith('habit') ? ` (streak ${goalStreak(g.id, goalLogs || [])} dgn)` : ''}`).join(' · ')
    )
  if (targets?.length) L.push(kompasContext(targets as any, tests || [], profile))

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: briefingModel(),
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Data van vanochtend:\n${L.join('\n')}` }],
    }),
  })
  const data = await r.json()
  if (!r.ok) return Response.json({ error: data?.error?.message || 'AI-fout.' }, { status: 502 })
  const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
  if (!text) return Response.json({ error: 'Lege briefing.' }, { status: 502 })

  // Opslaan; unique(user_id,date) vangt dubbele gelijktijdige calls af.
  const { error: insErr } = await supabase.from('daily_briefings').insert({ user_id: user.id, date, content: text })
  if (insErr) {
    const { data: raced } = await supabase
      .from('daily_briefings')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()
    if (raced) return Response.json({ text: raced.content, cached: true, date })
  }
  return Response.json({ text, cached: false, date })
}

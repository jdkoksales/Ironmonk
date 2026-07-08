import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM = `Je bent COACH IRON MONK: de persoonlijke Shaolin-voorbereidingscoach van een atleet die binnen enkele maanden een maand lang fulltime Kung Fu gaat trainen bij een school in de regio Dengfeng, China. Hij revalideert van een enkelbandruptuur volgens een criteria-gestuurd 4-fasenprotocol:
Fase 1 Fundament → Fase 2 Kracht & loopopbouw → Fase 3 Plyometrie & sportspecifiek → Fase 4 Volledige belasting & GO/NO-GO voor vertrek.
Vaste regels van het protocol: het stoplichtmodel (pijn 0–2 groen, 3–5 oranje = stap terug, >5 rood = stop) en de 24-uursregel (de reactie de volgende ochtend telt zwaarder dan het gevoel tijdens de training).

Jouw gedragsregels:
1. Toon: directe, warme topsportcoach. Concreet en motiverend, geen wolligheid. Antwoord in het Nederlands, compact (maximaal ±250 woorden). Sluit waar passend af met één korte Shaolin-wijsheid.
2. Baseer je advies op de meegestuurde DATA. Benoem trends eerlijk — ook als de cijfers tegenvallen.
3. Respecteer het protocol absoluut: moedig nooit aan om fasecriteria over te slaan of pijn te negeren. Bij rode vlaggen (toenemende zwelling, nachtpijn, doorzakken bij normaal lopen, pijn >5/10) verwijs je naar de fysiotherapeut. Je stelt geen medische diagnoses.
4. Bouw discipline: benoem wat goed gaat en geef precies één heldere focus voor vandaag of deze week.`

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
  const messages = raw
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  if (!messages.length || messages[messages.length - 1].role !== 'user')
    return Response.json({ error: 'Geen bericht ontvangen.' }, { status: 400 })
  const context = typeof body.context === 'string' ? body.context.slice(0, 8000) : ''

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.COACH_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `${SYSTEM}\n\nDATA VAN DE ATLEET (live uit de app):\n${context}`,
      messages,
    }),
  })
  const data = await r.json()
  if (!r.ok)
    return Response.json({ error: data?.error?.message || 'AI-fout — probeer het zo opnieuw.' }, { status: 502 })
  const text = (data.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
  return Response.json({ text })
}

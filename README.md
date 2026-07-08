# IRON MONK 铁

Whoop-stijl trainingsdashboard voor Julians Shaolin-voorbereiding: dagelijkse check-ins met readiness-score, het 4-fasen enkelprotocol met go/no-go-criteria, de volledige testbatterij, XP/levels/streaks met Shaolin-rangen, een meditatie- en Ma Bu-timer, media-kluis voor testvideo's en een AI-coach (Claude) die je live data kent.

## Stack

Next.js 14 (App Router) · Tailwind CSS · Supabase (auth, Postgres met RLS, storage) · Anthropic API (coach) · PWA (installeerbaar op je homescherm) · Vercel

## Status

- ✅ Supabase-project `lxrnubswclcufovsidpa` (eu-west-1) — schema toegepast via migration `iron_monk_init`: 7 tabellen + RLS-policies + `media` storage-bucket + auto-profieltrigger
- ✅ Publieke Supabase-gegevens staan als fallback in `lib/config.ts` (de anon key is bedoeld om publiek te zijn; row-level security beschermt de data)
- ⬜ `ANTHROPIC_API_KEY` als environment variable in Vercel (nodig voor de AI-coach)
- ⬜ E-mailbevestiging uitzetten in Supabase (zie hieronder)

## Eenmalige instellingen (2 minuten)

**1. Supabase — directe login zonder bevestigingsmail (aanrader)**
Dashboard → jouw project → **Authentication → Sign In / Providers → Email** → zet **Confirm email** uit → Save.
Wil je bevestiging aan laten staan? Zet dan bij **Authentication → URL Configuration** de *Site URL* op je app-URL, anders wijzen de bevestigingslinks naar localhost.

**2. Vercel — AI-coach activeren**
Project → **Settings → Environment Variables** → voeg toe:

| Naam | Waarde |
|---|---|
| `ANTHROPIC_API_KEY` | jouw key van console.anthropic.com (geheim houden!) |
| `COACH_MODEL` | optioneel, standaard `claude-sonnet-4-6` |

Daarna **Redeploy**. Zonder key werkt de hele app; alleen de coach toont dan een nette melding.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul evt. ANTHROPIC_API_KEY in
npm run dev
```

## Deployen naar Vercel (indien handmatig nodig)

```bash
npx vercel        # eerste keer: login + project koppelen
npx vercel --prod
```

Of push naar GitHub en importeer op vercel.com/new.

## Installeren op je telefoon

Open de app-URL in Safari/Chrome → Deel → **Zet op beginscherm**. De app draait dan fullscreen als PWA.

## Structuur

```
app/(app)/vandaag    dashboard: readiness-ring, quick tools, fase, streak
app/(app)/checkin    dagelijkse check-in (+50 XP × streak-multiplier)
app/(app)/enkel      4 fases, criteria met automatische data-checks, wekelijkse enkelcheck (+100 XP)
app/(app)/testen     testbatterij per testdag, deltas t.o.v. nulmeting, media-kluis
app/(app)/trends     sparklines, trainingsweken, totalen
app/(app)/coach      AI-coach met live datacontext + weekrapport-export
app/(app)/profiel    naam, vertrekdatum, badges, rangenladder
app/api/coach        server-route → Anthropic API (key blijft server-side)
lib/protocol.ts      fases, criteria, testdefinities — hier pas je het protocol aan
lib/game.ts          XP, levels, streaks, readiness-algoritme, badges
supabase/migrations  volledig databaseschema (al toegepast)
```

## XP-systeem

Check-in 50 XP × streak-multiplier (max ×2) · enkelcheck 100 · testmeting 15 · meditatie 2/min · stance 2/min. Rangen: 学 Leerling → 龙 Draak van Dengfeng (10 levels).

## Veiligheid

Alle tabellen hebben row-level security (`auth.uid()`-policies); de storage-bucket is privé per gebruiker. De Anthropic-key staat alleen server-side in Vercel. Deel je API-key nooit in chats of code.

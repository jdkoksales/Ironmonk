export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxrnubswclcufovsidpa.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4cm51YnN3Y2xjdWZvdnNpZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTk5MzksImV4cCI6MjA5ODU3NTkzOX0.OtEKxioqAcNfz1t0ZZoUFVJs4fuH4iO6P9bTRDEMpL4'

// Modelkeuze centraal. Verouderde/ongeldige waarden uit oude configuratie
// (bijv. het niet-bestaande "claude-sonnet-4-6" uit de eerste .env.example)
// worden genegeerd zodat een stale env var de coach niet stilletjes breekt.
const LEGACY_MODELS = new Set(['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-3-5-sonnet'])
const clean = (v?: string) => {
  const m = (v || '').trim()
  return m && !LEGACY_MODELS.has(m) ? m : ''
}
// Sterker model voor interactieve chat + wekelijkse evaluatie.
export const coachModel = () => clean(process.env.COACH_MODEL) || 'claude-sonnet-5'
// Goedkoper/lichter model voor de dagelijkse ochtendbriefing.
export const briefingModel = () => clean(process.env.BRIEFING_MODEL) || 'claude-haiku-4-5-20251001'

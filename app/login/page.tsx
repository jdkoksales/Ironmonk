'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'
import { Atmosphere } from '@/components/atmosphere'

export default function Login() {
  const supabase = sb()
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const google = async () => {
    setErr('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error)
      setErr(
        error.message?.includes('not enabled')
          ? 'Google-login is nog niet geactiveerd — gebruik e-mail, of activeer de Google-provider in Supabase.'
          : error.message
      )
  }

  const go = async () => {
    setErr('')
    setInfo('')
    setBusy(true)
    if (mode === 'up') {
      const { data, error } = await supabase.auth.signUp({ email, password: pw })
      setBusy(false)
      if (error) return setErr(error.message)
      if (!data.session) {
        const retry = await supabase.auth.signInWithPassword({ email, password: pw })
        if (retry.error) return setInfo('Account aangemaakt — log nu in met dezelfde gegevens.')
      }
      router.replace('/tempel')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      setBusy(false)
      if (error)
        return setErr(error.message === 'Invalid login credentials' ? 'Onjuiste inloggegevens.' : error.message)
      router.replace('/tempel')
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <Atmosphere intensity="full" />
      <div className="w-full max-w-sm">
        <div className="animate-fadeUp mb-8 text-center">
          <div
            className="animate-breathe mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full font-display text-5xl text-neon"
            style={{
              background: 'radial-gradient(60% 60% at 50% 40%, rgba(217,179,106,0.14), rgba(11,9,7,0.4))',
              border: '1px solid rgba(217,179,106,0.45)',
              boxShadow: '0 0 60px rgba(217,179,106,0.25), inset 0 1px 0 rgba(241,232,212,0.15)',
            }}
          >
            铁
          </div>
          <h1 className="title-gold font-display text-3xl font-bold tracking-[0.22em]">IRON MONK</h1>
          <p className="mt-2 text-sm text-muted">De tempelpoort staat open. Je meester wacht.</p>
        </div>
        <div className="card space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="inp"
            autoComplete="email"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Wachtwoord (min. 6 tekens)"
            className="inp"
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            onKeyDown={(e) => e.key === 'Enter' && go()}
          />
          {err && <p className="text-sm text-danger">{err}</p>}
          {info && <p className="text-sm text-neon">{info}</p>}
          <button onClick={go} disabled={busy || !email || pw.length < 6} className="btn-primary w-full py-3">
            {busy ? 'De poort opent…' : mode === 'in' ? 'Betreed de tempel' : 'Begin je pad'}
          </button>
          <div className="flex items-center gap-3 py-0.5">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] uppercase tracking-widest text-muted">of</span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <button onClick={google} className="btn-ghost flex w-full items-center justify-center gap-2.5 py-3 !text-ink">
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z" />
            </svg>
            Verdergaan met Google
          </button>
          <button
            onClick={() => {
              setMode((m) => (m === 'in' ? 'up' : 'in'))
              setErr('')
              setInfo('')
            }}
            className="w-full text-center text-xs text-muted"
          >
            {mode === 'in' ? 'Nog geen account? Maak er een aan →' : 'Al een account? Log in →'}
          </button>
        </div>
      </div>
    </main>
  )
}

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

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'

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
      router.replace('/vandaag')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      setBusy(false)
      if (error)
        return setErr(error.message === 'Invalid login credentials' ? 'Onjuiste inloggegevens.' : error.message)
      router.replace('/vandaag')
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl border border-neon/40 bg-neon/5 font-display text-4xl text-neon shadow-[0_0_40px_rgba(0,229,160,.25)]">
            铁
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.22em] text-ink">IRON MONK</h1>
          <p className="mt-1 text-sm text-muted">12 weken. Eén missie. Dengfeng.</p>
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
            {busy ? 'Bezig…' : mode === 'in' ? 'Inloggen' : 'Account aanmaken'}
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

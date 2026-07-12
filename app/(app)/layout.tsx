'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppProvider, useApp } from '@/lib/store'
import { Header, BottomNav } from '@/components/nav'
import { Atmosphere } from '@/components/atmosphere'

// Onboarding-gate: zonder gekozen coach eerst door de intake.
function IntakeGate({ children }: { children: React.ReactNode }) {
  const app = useApp()
  const path = usePathname()
  const router = useRouter()
  const needsIntake = app?.profile && !app.profile.coach_id
  useEffect(() => {
    if (needsIntake && !path?.startsWith('/intake')) router.replace('/intake')
  }, [needsIntake, path, router])
  if (needsIntake && !path?.startsWith('/intake')) return null
  return <>{children}</>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const full = path?.startsWith('/tempel')
  const intake = path?.startsWith('/intake')
  return (
    <AppProvider>
      <Atmosphere intensity={full || intake ? 'full' : 'subtle'} />
      {!full && !intake && <Header />}
      <main className="mx-auto max-w-md px-4 pb-32">
        <IntakeGate>{children}</IntakeGate>
      </main>
      {!intake && <BottomNav />}
    </AppProvider>
  )
}

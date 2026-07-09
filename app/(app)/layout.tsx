'use client'
import { usePathname } from 'next/navigation'
import { AppProvider } from '@/lib/store'
import { Header, BottomNav } from '@/components/nav'
import { Atmosphere } from '@/components/atmosphere'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const full = path?.startsWith('/tempel')
  return (
    <AppProvider>
      <Atmosphere intensity={full ? 'full' : 'subtle'} />
      {!full && <Header />}
      <main className="mx-auto max-w-md px-4 pb-32">{children}</main>
      <BottomNav />
    </AppProvider>
  )
}

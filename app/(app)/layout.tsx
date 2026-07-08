'use client'
import { AppProvider } from '@/lib/store'
import { Header, BottomNav } from '@/components/nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Header />
      <main className="mx-auto max-w-md px-4 pb-32">{children}</main>
      <BottomNav />
    </AppProvider>
  )
}

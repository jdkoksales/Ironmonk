'use client'
// Cinematic page transition: elke route-wissel komt rustig omhoog uit de mist.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fadeUp">{children}</div>
}

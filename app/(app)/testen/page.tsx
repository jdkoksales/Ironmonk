'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, Upload, Trash2, PlayCircle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { todayISO, XP } from '@/lib/game'
import { TEST_GROUPS } from '@/lib/protocol'

export default function Testen() {
  const app = useApp()
  const [date, setDate] = useState(todayISO())
  const [openGroup, setOpenGroup] = useState<number | null>(0)
  const [vals, setVals] = useState<any>({})
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const loadFiles = async () => {
    if (!app?.user) return
    const { data } = await app.supabase.storage
      .from('media')
      .list(app.user.id, { limit: 60, sortBy: { column: 'created_at', order: 'desc' } })
    setFiles(data || [])
  }
  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.user])

  if (!app?.profile) return null

  const key = (k: string, s?: string) => `${k}__${s || 'X'}`
  const seriesFor = (k: string, s?: string) =>
    app.tests.filter((t: any) => t.test_key === k && (s ? t.side === s : t.side == null))
  const latest = (k: string, s?: string) => {
    const r = seriesFor(k, s)
    return r.length ? r[r.length - 1] : null
  }
  const first = (k: string, s?: string) => {
    const r = seriesFor(k, s)
    return r.length ? r[0] : null
  }

  const saveGroup = async (g: any) => {
    if (busy) return
    const rows: any[] = []
    for (const t of g.tests) {
      const sides = t.sides ? ['L', 'R'] : [undefined]
      for (const s of sides) {
        const raw = vals[key(t.key, s)]
        const n = raw == null || raw === '' ? NaN : parseFloat(String(raw).replace(',', '.'))
        if (!isNaN(n)) rows.push({ user_id: app.user.id, test_key: t.key, side: s || null, value: n, tested_at: date })
      }
    }
    if (!rows.length) return
    setBusy(true)
    const { error } = await app.supabase.from('test_results').insert(rows)
    if (error) alert('Opslaan mislukt: ' + error.message)
    else {
      await app.awardXp('test', rows.length * XP.TEST, { n: rows.length })
      setVals((v: any) => {
        const nv = { ...v }
        rows.forEach((r) => delete nv[key(r.test_key, r.side || undefined)])
        return nv
      })
      await app.refresh()
    }
    setBusy(false)
  }

  const upload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file || !app?.user) return
    setUploading(true)
    const path = `${app.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await app.supabase.storage.from('media').upload(path, file)
    setUploading(false)
    e.target.value = ''
    if (error) alert('Upload mislukt: ' + error.message)
    else loadFiles()
  }
  const openFile = async (name: string) => {
    const { data } = await app.supabase.storage.from('media').createSignedUrl(`${app.user.id}/${name}`, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }
  const delFile = async (name: string) => {
    await app.supabase.storage.from('media').remove([`${app.user.id}/${name}`])
    loadFiles()
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="lbl">Nulmeting & hertests</p>
          <h1 className="font-display text-xl font-bold text-ink">Testbatterij</h1>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-line bg-panel2 px-2 py-1.5 text-xs text-ink outline-none"
        />
      </div>

      {TEST_GROUPS.map((g: any, gi: number) => {
        const isOpen = openGroup === gi
        return (
          <section key={g.title} className="card">
            <button onClick={() => setOpenGroup(isOpen ? null : gi)} className="flex w-full items-center justify-between">
              <span className="text-left font-display text-sm font-bold text-ink">{g.title}</span>
              <ChevronDown size={18} className={`shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="mt-3 space-y-3">
                {g.note && (
                  <p className="rounded-lg border border-amber/30 bg-amber/10 p-2.5 text-xs leading-relaxed text-amber">
                    {g.note}
                  </p>
                )}
                {g.tests.map((t: any) => {
                  const sides = t.sides ? ['L', 'R'] : [undefined]
                  return (
                    <div key={t.key} className="rounded-xl bg-panel2 p-3">
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <span className="text-sm text-ink">{t.label}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted">{t.unit}</span>
                      </div>
                      <div className="flex gap-2">
                        {sides.map((s) => {
                          const lv = latest(t.key, s)
                          const fv = first(t.key, s)
                          const delta = lv && fv && lv.id !== fv.id ? Number(lv.value) - Number(fv.value) : null
                          return (
                            <div key={s || 'X'} className="flex-1">
                              <input
                                inputMode="decimal"
                                placeholder={s ? s : '–'}
                                value={vals[key(t.key, s)] ?? ''}
                                onChange={(e) => setVals((v: any) => ({ ...v, [key(t.key, s)]: e.target.value }))}
                                className="num w-full rounded-lg border border-line bg-bg px-2 py-2 text-center font-display text-base text-ink outline-none focus:border-neon"
                              />
                              <div className="mt-1 text-center text-[10px] text-muted">
                                {lv ? (
                                  <>
                                    laatst: <span className="text-ink">{Number(lv.value)}</span>
                                    {delta != null && delta !== 0 && (
                                      <span className={delta > 0 ? 'text-neon' : 'text-danger'}>
                                        {' '}
                                        ({delta > 0 ? '+' : ''}
                                        {Math.round(delta * 10) / 10})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  'nog geen data'
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                <button onClick={() => saveGroup(g)} disabled={busy} className="btn-primary w-full py-2.5">
                  {busy ? 'Opslaan…' : `Groep opslaan · +${XP.TEST} XP per meting`}
                </button>
              </div>
            )}
          </section>
        )
      })}

      <section className="card">
        <p className="lbl mb-1">Media-kluis</p>
        <p className="mb-3 text-xs text-muted">Testvideo's (squat, push-up, split) en progressiefoto's — privé opgeslagen.</p>
        <label className="btn-ghost flex w-full cursor-pointer items-center justify-center gap-2">
          <Upload size={15} />
          {uploading ? 'Uploaden…' : 'Video of foto uploaden'}
          <input type="file" accept="video/*,image/*" onChange={upload} className="hidden" />
        </label>
        <div className="mt-3 space-y-2">
          {files.map((f: any) => (
            <div key={f.name} className="flex items-center gap-2 rounded-xl bg-panel2 px-3 py-2">
              <button onClick={() => openFile(f.name)} className="flex flex-1 items-center gap-2 text-left">
                <PlayCircle size={16} className="shrink-0 text-neon" />
                <span className="truncate text-xs text-ink">{f.name.replace(/^\d+-/, '')}</span>
              </button>
              <button onClick={() => delFile(f.name)} className="shrink-0 text-muted">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!files.length && <p className="text-center text-xs text-muted">Nog niets geüpload</p>}
        </div>
      </section>
      <div className="h-2" />
    </div>
  )
}

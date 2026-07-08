'use client'
import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

let client: any = null

export function sb() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

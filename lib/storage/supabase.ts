import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'estacionando'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { persistSession: false },
      // Node 20 has no global WebSocket; supabase-js still constructs a Realtime
      // client eagerly even though we only use Storage here, so it needs one.
      realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
    })
  : null

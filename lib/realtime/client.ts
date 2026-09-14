'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Browser-side client using the public anon key (safe to expose, same as the Mapbox token).
 * It only ever talks to `change_events`, which carries no sensitive data — see lib/realtime/notify.ts.
 */
export const realtimeClient = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

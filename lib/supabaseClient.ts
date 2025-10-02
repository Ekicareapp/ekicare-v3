import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (supabaseUrl) {
  console.log('[Supabase] URL chargée:', supabaseUrl.substring(0, 10) + '...')
} else {
  console.warn('[Supabase] URL manquante !')
}
if (supabaseAnonKey) {
  console.log('[Supabase] Anon Key chargée:', supabaseAnonKey.substring(0, 10) + '...')
} else {
  console.warn('[Supabase] Anon Key manquante !')
}

let supabase: SupabaseClient | null = null
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase }

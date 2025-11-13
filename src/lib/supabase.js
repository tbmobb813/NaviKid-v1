import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Replace with your Supabase URL and anon key (from your Supabase dashboard)
const supabaseUrl = process.env.SUPABASE_URL || 'https://feqfhdwmwrolaafchldq.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Initialize Supabase client only when an anon key is provided; inject keys via env vars or secure storage in your build/deployment
let supabase = null
if (supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
} else {
  // eslint-disable-next-line no-console
  console.warn('SUPABASE_ANON_KEY is not set; Supabase client not initialized.')
}

export { supabase }
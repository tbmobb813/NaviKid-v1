import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Replace with your Supabase URL and anon key (from your Supabase dashboard)
const supabaseUrl = 'https://feqfhdwmwrolaafchldq.supabase.co.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcWZoZHdtd3JvbGFhZmNobGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDk4MzAsImV4cCI6MjA3ODM4NTgzMH0.tXP3q9HhTY4RtNxZ-uvSPqFQdK5DvBTD63fbVuNw9_0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          user_type: 'parent' | 'child'
          display_name: string | null
          avatar_url: string | null
          parent_id: string | null
          notification_preferences: Json
          created_at: string
        }
        Insert: {
          id: string
          email: string
          user_type: 'parent' | 'child'
          display_name?: string | null
          avatar_url?: string | null
          parent_id?: string | null
          notification_preferences?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: 'parent' | 'child'
          display_name?: string | null
          avatar_url?: string | null
          parent_id?: string | null
          notification_preferences?: Json
          created_at?: string
        }
      }
      safe_locations: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          location: unknown // PostGIS GEOGRAPHY type
          radius: number
          location_type: 'home' | 'school' | 'relative' | 'activity' | 'other'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          location: string // WKT format: 'POINT(lng lat)'
          radius: number
          location_type: 'home' | 'school' | 'relative' | 'activity' | 'other'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          location?: string
          radius?: number
          location_type?: 'home' | 'school' | 'relative' | 'activity' | 'other'
          created_at?: string
        }
      }
      location_history: {
        Row: {
          id: string
          user_id: string
          location: unknown
          recorded_at: string
          speed: number | null
          battery_level: number | null
          connection_status: string | null
          activity_type: string | null
        }
        Insert: {
          id?: string
          user_id: string
          location: string // WKT format
          recorded_at?: string
          speed?: number | null
          battery_level?: number | null
          connection_status?: string | null
          activity_type?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          location?: string
          recorded_at?: string
          speed?: number | null
          battery_level?: number | null
          connection_status?: string | null
          activity_type?: string | null
        }
      }
    }
    Functions: {
      get_latest_location: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          location: unknown
          accuracy: number
          speed: number
          battery_level: number
          connection_status: string
          activity_type: string
          recorded_at: string
        }[]
      }
      nearby_safe_locations: {
        Args: {
          user_id: string
          lat: number
          lng: number
          distance_meters: number
        }
        Returns: Database['public']['Tables']['safe_locations']['Row'][]
      }
    }
  }
}
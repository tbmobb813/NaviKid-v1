// src/features/realtime/realtimeService.js
import { supabase } from '../../lib/supabase'

export const realtimeService = {
  // Subscribe to child location updates (parent app)
  subscribeToChildLocation(childId, callback) {
    return supabase
      .from(`location_history:user_id=eq.${childId}`)
      .on('INSERT', payload => {
        callback(payload.new)
      })
      .subscribe()
  },
  
  // Subscribe to safety alerts
  subscribeToSafetyAlerts(userId, callback) {
    return supabase
      .from(`safety_alerts:user_id=eq.${userId}`)
      .on('INSERT', payload => {
        callback(payload.new)
      })
      .subscribe()
  },
  
  // Unsubscribe when components unmount
  unsubscribe(subscription) {
    supabase.removeSubscription(subscription)
  }
}
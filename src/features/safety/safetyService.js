// src/features/safety/safetyService.js
import { supabase } from '../../lib/supabase'

export const safetyService = {
  // Create a new safe location
  async createSafeLocation(name, latitude, longitude, radius, locationType) {
    const userId = (await supabase.auth.getUser()).data.user.id
    
    const { data, error } = await supabase.from('safe_locations').insert({
      user_id: userId,
      name,
      location: `POINT(${longitude} ${latitude})`,
      radius,
      location_type: locationType
    }).select()
    
    if (error) throw error
    return data[0]
  },
  
  // Create a safety alert
  async createSafetyAlert(userId, alertType, description, latitude, longitude) {
    const { data, error } = await supabase.from('safety_alerts').insert({
      user_id: userId,
      alert_type: alertType,
      description,
      location: latitude && longitude ? `POINT(${longitude} ${latitude})` : null
    }).select()
    
    if (error) throw error
    return data[0]
  },
  
  // Resolve a safety alert (for parent app)
  async resolveAlert(alertId) {
    const parentId = (await supabase.auth.getUser()).data.user.id
    
    const { data, error } = await supabase.from('safety_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: parentId
      })
      .eq('id', alertId)
      .select()
    
    if (error) throw error
    return data[0]
  }
}
// src/features/transit/transitService.js
import { supabase } from '../../lib/supabase'

export const transitService = {
  // Get nearby transit options
  async getNearbyTransit(latitude, longitude, radius = 500) {
    const { data, error } = await supabase.rpc('nearby_transit_stops', {
      lat: latitude,
      lng: longitude,
      radius_meters: radius
    })
    
    if (error) throw error
    return data
  },
  
  // Get transit route between two points
  async getTransitRoute(startLat, startLng, endLat, endLng) {
    // This could call an external API or your own routing engine
    // For NYC transit, you might use MTA's API
    
    // Store the route in Supabase for later use
    const route = await this.calculateRoute(startLat, startLng, endLat, endLng)
    
    const { data, error } = await supabase.from('saved_routes').insert({
      user_id: (await supabase.auth.getUser()).data.user.id,
      name: 'Route to destination',
      route_geom: route.geometry,
      distance: route.distance,
      estimated_time: route.duration,
      transit_info: route.transitInfo,
      safety_score: await this.calculateSafetyScore(route)
    }).select()
    
    if (error) throw error
    return data[0]
  },
  
  // Calculate a safety score for a route
  async calculateSafetyScore(route) {
    // Implement your safety rating algorithm
    // Consider factors like:
    // - Crime data for areas along route
    // - Time of day
    // - Transit options vs walking
    // - Street lighting
    // - Pedestrian crossings
    
    return 7 // Example score out of 10
  }
}
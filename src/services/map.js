// src/services/map.js
import { supabase } from '../lib/supabase'

export const mapService = {
  // Convert database safe locations to GeoJSON for MapLibre
  async getSafeLocationsGeoJSON(userId) {
    // Get safe locations from Supabase
    const { data, error } = await supabase
      .from('safe_locations')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Convert to GeoJSON
    return {
      type: 'FeatureCollection',
      features: data.map(location => {
        // Parse POINT(lng lat) format from PostGIS
        const pointStr = location.location.replace('POINT(', '').replace(')', '')
        const [lng, lat] = pointStr.split(' ').map(parseFloat)
        
        return {
          type: 'Feature',
          properties: {
            id: location.id,
            name: location.name,
            type: location.location_type,
            radius: location.radius
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }
      })
    }
  },
  
  // Create a safe location
  async createSafeLocation(name, locationType, lat, lng, radius) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not logged in')
    
    const { data, error } = await supabase
      .from('safe_locations')
      .insert({
        user_id: userData.user.id,
        name,
        location_type: locationType,
        location: `POINT(${lng} ${lat})`,
        radius
      })
      .select()
    
    if (error) throw error
    return data[0]
  },
  
  // Create a route
  async saveRoute(name, coordinates, transitInfo = {}) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not logged in')
    
    // Convert coordinates to LineString
    const linestring = `LINESTRING(${coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`
    
    // Calculate approximate distance (this is simplified)
    const distance = this.calculateRouteDistance(coordinates)
    
    // Calculate safety score (this would be more complex in a real app)
    const safetyScore = this.calculateSafetyScore(coordinates, transitInfo)
    
    const { data, error } = await supabase
      .from('routes')
      .insert({
        user_id: userData.user.id,
        name,
        route_path: linestring,
        distance,
        safety_score: safetyScore,
        transit_info: transitInfo
      })
      .select()
    
    if (error) throw error
    return data[0]
  },
  
  // Helper to calculate route distance
  calculateRouteDistance(coordinates) {
    let distance = 0
    for (let i = 1; i < coordinates.length; i++) {
      const [lng1, lat1] = coordinates[i - 1]
      const [lng2, lat2] = coordinates[i]
      
      // Simplified distance calculation using Haversine formula
      const R = 6371e3 // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180
      const φ2 = lat2 * Math.PI / 180
      const Δφ = (lat2 - lat1) * Math.PI / 180
      const Δλ = (lng2 - lng1) * Math.PI / 180
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      
      distance += R * c
    }
    
    return Math.round(distance) // Return in meters
  },
  
  // Calculate a route safety score (simplified)
  calculateSafetyScore(coordinates, transitInfo) {
    // In a real app, this would consider:
    // - Proximity to safe locations
    // - Time of day
    // - Crime statistics for areas
    // - Types of roads (pedestrian vs major roads)
    // - Transit options
    
    // Simplified score between 1-10
    return Math.floor(Math.random() * 5) + 6 // Random 6-10 for testing
  }
}
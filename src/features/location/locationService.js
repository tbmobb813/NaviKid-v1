// src/features/location/locationService.js
import { supabase } from '../../lib/supabase'
import * as Location from 'expo-location'

export const locationService = {
  // Start tracking a child's location
  async startTracking(userId) {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Location permission denied')
    }
    
    // Subscribe to location updates
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // Update every 10 meters
        timeInterval: 5000,   // Or at least every 5 seconds
      },
      async (location) => {
        const { coords, timestamp } = location
        const { latitude, longitude, speed } = coords
        
        // Save location to Supabase
        await supabase.from('location_history').insert({
          user_id: userId,
          location: `POINT(${longitude} ${latitude})`,
          recorded_at: new Date(timestamp).toISOString(),
          speed: speed || 0,
          battery_level: await this.getBatteryLevel(),
          connection_status: await this.getConnectionStatus(),
          activity_type: await this.detectActivityType(coords)
        })
        
        // Check geofences
        await this.checkGeofences(userId, { latitude, longitude })
      }
    )
  },
  
  // Check if user is within any saved safe locations
  async checkGeofences(userId, coordinates) {
    const { latitude, longitude } = coordinates
    
    const { data: safeLocations } = await supabase.rpc('nearby_safe_locations', {
      user_id: userId,
      lat: latitude,
      lng: longitude,
      distance_meters: 500 // Check locations within 500m
    })
    
    // Process safe locations and generate alerts if needed
    // ...
  },
  
  // Helper methods for device info
  async getBatteryLevel() {
    // Implementation depends on your device info library
    return 100
  },
  
  async getConnectionStatus() {
    // Check network connectivity
    return 'connected'
  },
  
  async detectActivityType(coords) {
    // Simple activity detection based on speed
    if (coords.speed > 5) return 'vehicle'
    if (coords.speed > 1) return 'walking'
    return 'stationary'
  }
}
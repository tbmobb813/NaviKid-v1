// src/services/location.js
import { supabase } from '../lib/supabase'
import * as Location from 'expo-location'
import * as Battery from 'expo-battery'
import NetInfo from '@react-native-community/netinfo'

export const locationService = {
  // Start location tracking
  locationSubscription: null,
  
  async startTracking() {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Location permission denied')
    }
    
    // Get user ID
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not logged in')
    
    // Start watching position
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10, // Update every 10 meters
        timeInterval: 5000,   // Or every 5 seconds
      },
      async (location) => {
        const { coords, timestamp } = location
        const { latitude, longitude, accuracy, speed } = coords
        
        // Get additional device info
        const batteryLevel = await Battery.getBatteryLevelAsync()
        const networkState = await NetInfo.fetch()
        
        // Save to Supabase
        await supabase.from('location_history').insert({
          user_id: userData.user.id,
          location: `POINT(${longitude} ${latitude})`,
          accuracy,
          speed,
          battery_level: Math.round(batteryLevel * 100),
          connection_status: networkState.isConnected ? 'connected' : 'disconnected',
          activity_type: this.determineActivityType(speed),
          recorded_at: new Date(timestamp).toISOString()
        })
      }
    )
    
    return this.locationSubscription
  },
  
  // Stop tracking
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove()
      this.locationSubscription = null
    }
  },
  
  // Helper to determine activity type based on speed
  determineActivityType(speed) {
    if (speed === null || speed === undefined) return 'unknown'
    // Speed is in m/s
    if (speed < 0.5) return 'stationary'
    if (speed < 2) return 'walking'
    if (speed < 4) return 'running'
    if (speed < 10) return 'cycling'
    return 'vehicle'
  },
  
  // Get location history for a user
  async getLocationHistory(userId, limit = 100) {
    const { data, error } = await supabase
      .from('location_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },
  
  // Get latest location for a user
  async getLatestLocation(userId) {
    const { data, error } = await supabase
      .from('location_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
    return data
  }
}
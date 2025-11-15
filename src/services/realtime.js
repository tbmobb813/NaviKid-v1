// src/services/realtime.js
import { supabase } from '../lib/supabase'

export const realtimeService = {
  // Subscriptions store
  subscriptions: {},
  
  // Subscribe to a child's location updates
  subscribeToChildLocation(childId, callback) {
    // Cancel existing subscription if any
    if (this.subscriptions[`child-${childId}`]) {
      this.subscriptions[`child-${childId}`].unsubscribe()
    }
    
    // Create new subscription
    const subscription = supabase
      .channel(`public:location_history:user_id=eq.${childId}`)
      .on('INSERT', payload => {
        callback(payload.new)
      })
      .subscribe()
    
    // Store subscription
    this.subscriptions[`child-${childId}`] = subscription
    
    return subscription
  },
  
  // Get all children's last known locations
  async getChildrenLocations() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return []
    
    // First get all children for this parent
    const { data: children, error: childrenError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('parent_id', userData.user.id)
    
    if (childrenError) throw childrenError
    
    // Get latest location for each child
    const locations = await Promise.all(
      children.map(async (child) => {
        const { data: locationData } = await supabase
          .rpc('get_latest_location', { user_id_param: child.id })
        
        return {
          childId: child.id,
          childName: child.display_name,
          location: locationData || null
        }
      })
    )
    
    return locations
  },
  
  // Clean up subscriptions when component unmounts
  unsubscribeAll() {
    Object.values(this.subscriptions).forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions = {}
  }
}
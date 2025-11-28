// src/features/offline/offlineService.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../../lib/supabase'
import { logger } from '@/utils/logger'

export const offlineService = {
  // Queue for storing operations when offline
  queue: [],
  
  // Initialize offline support
  async init() {
    // Load any pending operations from storage
    try {
      const queueString = await AsyncStorage.getItem('offline_queue')
      if (queueString) {
        this.queue = JSON.parse(queueString)
        this.processQueue()
      }
    } catch (error) {
      logger.error('Failed to load offline queue', error)
    }
    
    // Subscribe to connection changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.queue.length > 0) {
        this.processQueue()
      }
    })
  },
  
  // Add operation to queue
  async addToQueue(operation) {
    this.queue.push(operation)
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue))
  },
  
  // Process pending operations
  async processQueue() {
    const networkState = await NetInfo.fetch()
    if (!networkState.isConnected) return
    
    const operations = [...this.queue]
    this.queue = []
    
    for (const op of operations) {
      try {
        if (op.type === 'INSERT') {
          await supabase.from(op.table).insert(op.data)
        } else if (op.type === 'UPDATE') {
          await supabase.from(op.table).update(op.data).eq('id', op.id)
        }
        // Process other operation types as needed
      } catch (error) {
        logger.error('Failed to process offline operation', error)
        this.queue.push(op)
      }
    }
    
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue))
  }
}
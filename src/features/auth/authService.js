// src/features/auth/authService.js
import { supabase } from '../../lib/supabase'
import { randomBytes } from 'crypto';

export const authService = {
  // Register a parent user
  async registerParent(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create profile
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      display_name: displayName,
      user_type: 'parent'
    })
    
    return data
  },
  
  // Add a child account
  async addChild(parentId, displayName) {
    // Generate a random email/password for the child account
    const randomEmailStr = randomBytes(8).toString('hex');
    const email = `child_${randomEmailStr}@navikid.internal`;
    const password = randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create profile
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      display_name: displayName,
      user_type: 'child',
      parent_id: parentId
    })
    
    return data
  },
  
  // Login
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },
  
  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
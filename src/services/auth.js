// src/services/auth.js
import { supabase } from '../lib/supabase'

export const authService = {
  // Register a parent
  async registerParent(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        display_name: displayName,
        user_type: 'parent'
      })
    
    if (profileError) throw profileError
    return data
  },
  
  // Add a child account (parent must be logged in)
  async addChildAccount(childName) {
    const parent = await supabase.auth.getUser()
    
    if (!parent.data.user) throw new Error('Parent must be logged in')
    
    // Create a unique email for the child (not used for login)
    const childEmail = `child_${Math.random().toString(36).substring(2)}@navikid.internal`
    
    // Create auth account for child
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: childEmail,
      password: Math.random().toString(36).substring(2),
      email_confirm: true
    })
    
    if (authError) throw authError
    
    // Create child profile linked to parent
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: childEmail,
        display_name: childName,
        user_type: 'child',
        parent_id: parent.data.user.id
      })
    
    if (profileError) throw profileError
    return authData
  },
  
  // Get user profile
  async getProfile() {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()
    
    if (error) throw error
    return data
  },
  
  // Get child profiles (for parent account)
  async getChildProfiles() {
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) return []
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', user.user.id)
    
    if (error) throw error
    return data || []
  }
}
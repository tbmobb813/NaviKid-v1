-- NaviKid Database Schema
-- Migration: 001_initial_schema
-- Created: 2025-11-10

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- USER RELATIONSHIPS (Parent-Child Links)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'parent-child',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE INDEX idx_relationships_parent ON user_relationships(parent_id);
CREATE INDEX idx_relationships_child ON user_relationships(child_id);
CREATE INDEX idx_relationships_status ON user_relationships(status);

-- =====================================================
-- REFRESH TOKENS (for JWT refresh)
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- =====================================================
-- LOCATION HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS location_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  altitude_accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_location_user_timestamp ON location_history(user_id, timestamp DESC);
CREATE INDEX idx_location_timestamp ON location_history(timestamp);
CREATE INDEX idx_location_created_at ON location_history(created_at);

-- Partitioning for location_history (optional but recommended for scale)
-- This can be enabled later when data volume grows
COMMENT ON TABLE location_history IS 'Stores user location history with 30-day retention policy';

-- =====================================================
-- SAFE ZONES (Geofences)
-- =====================================================
CREATE TABLE IF NOT EXISTS safe_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius DOUBLE PRECISION NOT NULL CHECK (radius > 0),
  is_active BOOLEAN DEFAULT TRUE,
  notify_on_entry BOOLEAN DEFAULT TRUE,
  notify_on_exit BOOLEAN DEFAULT TRUE,
  schedule_enabled BOOLEAN DEFAULT FALSE,
  schedule_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safe_zones_parent ON safe_zones(parent_id);
CREATE INDEX idx_safe_zones_child ON safe_zones(child_id);
CREATE INDEX idx_safe_zones_active ON safe_zones(is_active);
CREATE INDEX idx_safe_zones_location ON safe_zones(latitude, longitude);

-- =====================================================
-- GEOFENCE EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS geofence_events (
  id BIGSERIAL PRIMARY KEY,
  safe_zone_id UUID NOT NULL REFERENCES safe_zones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('entry', 'exit')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geofence_events_zone ON geofence_events(safe_zone_id);
CREATE INDEX idx_geofence_events_user ON geofence_events(user_id);
CREATE INDEX idx_geofence_events_timestamp ON geofence_events(timestamp DESC);
CREATE INDEX idx_geofence_events_type ON geofence_events(event_type);

-- =====================================================
-- PASSWORD RESET TOKENS
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

-- =====================================================
-- EMAIL VERIFICATION TOKENS
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_verification_user ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_token ON email_verification_tokens(token);

-- =====================================================
-- AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_relationships_updated_at BEFORE UPDATE ON user_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safe_zones_updated_at BEFORE UPDATE ON safe_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR DATA RETENTION
-- =====================================================

-- Clean up old location history (30 days)
CREATE OR REPLACE FUNCTION cleanup_old_location_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM location_history
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up old geofence events (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_geofence_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM geofence_events
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() OR revoked = TRUE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used = TRUE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up old audit logs (1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR CONVENIENCE
-- =====================================================

-- Active parent-child relationships with user details
CREATE OR REPLACE VIEW active_parent_child_relationships AS
SELECT
  ur.id,
  ur.parent_id,
  p.email AS parent_email,
  p.first_name AS parent_first_name,
  p.last_name AS parent_last_name,
  ur.child_id,
  c.email AS child_email,
  c.first_name AS child_first_name,
  c.last_name AS child_last_name,
  ur.status,
  ur.created_at
FROM user_relationships ur
JOIN users p ON ur.parent_id = p.id
JOIN users c ON ur.child_id = c.id
WHERE ur.status = 'active'
  AND p.is_active = TRUE
  AND c.is_active = TRUE;

-- Recent location history (last 24 hours)
CREATE OR REPLACE VIEW recent_locations AS
SELECT
  lh.*,
  u.email,
  u.first_name,
  u.last_name,
  u.role
FROM location_history lh
JOIN users u ON lh.user_id = u.id
WHERE lh.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY lh.timestamp DESC;

-- Active safe zones with event counts
CREATE OR REPLACE VIEW safe_zones_with_stats AS
SELECT
  sz.*,
  p.email AS parent_email,
  c.email AS child_email,
  COUNT(DISTINCT ge.id) AS total_events,
  COUNT(DISTINCT CASE WHEN ge.event_type = 'entry' THEN ge.id END) AS entry_events,
  COUNT(DISTINCT CASE WHEN ge.event_type = 'exit' THEN ge.id END) AS exit_events,
  MAX(ge.timestamp) AS last_event_at
FROM safe_zones sz
JOIN users p ON sz.parent_id = p.id
JOIN users c ON sz.child_id = c.id
LEFT JOIN geofence_events ge ON sz.id = ge.safe_zone_id
WHERE sz.is_active = TRUE
GROUP BY sz.id, p.email, c.email;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE users IS 'User accounts (parents and children)';
COMMENT ON TABLE user_relationships IS 'Parent-child account linkages';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE location_history IS 'User location tracking history (30-day retention)';
COMMENT ON TABLE safe_zones IS 'Geofenced safe zones created by parents';
COMMENT ON TABLE geofence_events IS 'Log of safe zone entry/exit events';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens for account recovery';
COMMENT ON TABLE email_verification_tokens IS 'Email verification tokens for new accounts';
COMMENT ON TABLE audit_log IS 'Audit trail for security and compliance';

-- =====================================================
-- INITIAL DATA RETENTION SETUP
-- =====================================================
-- Note: In production, these should be run via cron or pg_cron extension
-- Example cron schedule: 0 2 * * * (daily at 2 AM)

-- Grant necessary permissions (adjust for your production user)
-- GRANT EXECUTE ON FUNCTION cleanup_old_location_history() TO navikid_app;
-- GRANT EXECUTE ON FUNCTION cleanup_old_geofence_events() TO navikid_app;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_refresh_tokens() TO navikid_app;

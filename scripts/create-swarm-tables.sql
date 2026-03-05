-- Swarm Database Schema - Mechanic Helper
-- Created: 2026-03-05
-- Purpose: Store repair cases, procedures, outcomes, and RSI metrics

-- ============================================================
-- TABLE 1: repair_cases
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_cases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vehicle_make VARCHAR(50) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  error_code VARCHAR(20),
  error_system VARCHAR(50),
  error_description TEXT,
  symptoms JSON,
  repair_action VARCHAR(255),
  repair_performed TEXT,
  repair_time_hours DECIMAL(5,2),
  repair_cost_estimate DECIMAL(10,2),
  repair_cost_actual DECIMAL(10,2),
  tools_used JSON,
  parts_needed JSON,
  repair_outcome ENUM('success', 'partial', 'failed', 'unknown') DEFAULT 'unknown',
  confidence DECIMAL(3,2),
  source_url VARCHAR(500),
  source_domain VARCHAR(100),
  source_type ENUM('forum', 'reddit', 'manual', 'obd', 'blog', 'video') DEFAULT 'forum',
  evidence_snippets JSON,
  evidence_quality DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'en',
  canonical_key VARCHAR(255),
  cluster_id VARCHAR(100),
  merged_count INT DEFAULT 1,
  source_count INT DEFAULT 1,
  raw_json LONGTEXT,
  content_hash VARCHAR(64),
  normalized_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vehicle (vehicle_make, vehicle_model, vehicle_year),
  INDEX idx_error_code (error_code),
  INDEX idx_source (source_domain),
  INDEX idx_confidence (confidence),
  INDEX idx_canonical (canonical_key),
  INDEX idx_created (created_at),
  UNIQUE KEY unique_canonical (canonical_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 2: service_procedures
-- ============================================================
CREATE TABLE IF NOT EXISTS service_procedures (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vehicle_make VARCHAR(50) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  system_type VARCHAR(100),
  procedure_name VARCHAR(255) NOT NULL,
  procedure_description TEXT,
  repair_steps JSON NOT NULL,
  tools_required JSON,
  torque_specs JSON,
  estimated_time_hours DECIMAL(5,2),
  difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
  confidence DECIMAL(3,2),
  source_url VARCHAR(500),
  source_domain VARCHAR(100),
  source_type ENUM('manual', 'forum', 'blog', 'video') DEFAULT 'manual',
  evidence_snippets JSON,
  evidence_quality DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'en',
  canonical_key VARCHAR(255),
  raw_json LONGTEXT,
  content_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vehicle (vehicle_make, vehicle_model),
  INDEX idx_system (system_type),
  INDEX idx_source (source_domain),
  INDEX idx_confidence (confidence),
  INDEX idx_created (created_at),
  UNIQUE KEY unique_canonical (canonical_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 3: torque_specifications
-- ============================================================
CREATE TABLE IF NOT EXISTS torque_specifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vehicle_make VARCHAR(50) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  system_type VARCHAR(100),
  component_name VARCHAR(255) NOT NULL,
  torque_value_nm DECIMAL(8,2) NOT NULL,
  torque_value_ftlb DECIMAL(8,2),
  torque_sequence VARCHAR(255),
  torque_pattern VARCHAR(255),
  cold_torque DECIMAL(8,2),
  warm_torque DECIMAL(8,2),
  notes TEXT,
  confidence DECIMAL(3,2),
  source_url VARCHAR(500),
  source_domain VARCHAR(100),
  evidence_snippet TEXT,
  evidence_quality DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'en',
  canonical_key VARCHAR(255),
  raw_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vehicle (vehicle_make, vehicle_model, engine_code),
  INDEX idx_component (component_name),
  INDEX idx_system (system_type),
  INDEX idx_torque (torque_value_nm),
  INDEX idx_source (source_domain),
  INDEX idx_created (created_at),
  UNIQUE KEY unique_canonical (canonical_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 4: tools_required
-- ============================================================
CREATE TABLE IF NOT EXISTS tools_required (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tool_name VARCHAR(255) NOT NULL,
  tool_category VARCHAR(100),
  tool_type ENUM('socket', 'wrench', 'screwdriver', 'diagnostic', 'specialized', 'other') DEFAULT 'other',
  tool_size VARCHAR(50),
  tool_description TEXT,
  tool_brand VARCHAR(100),
  tool_cost_estimate DECIMAL(10,2),
  alternative_tools JSON,
  usage_frequency INT DEFAULT 1,
  source_url VARCHAR(500),
  source_domain VARCHAR(100),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (tool_category),
  INDEX idx_type (tool_type),
  INDEX idx_name (tool_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 5: source_registry
-- ============================================================
CREATE TABLE IF NOT EXISTS source_registry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source_url VARCHAR(500) NOT NULL UNIQUE,
  source_domain VARCHAR(100) NOT NULL,
  source_type ENUM('forum', 'reddit', 'manual', 'obd', 'blog', 'video', 'other') DEFAULT 'forum',
  source_category VARCHAR(100),
  source_name VARCHAR(255),
  accessibility_score DECIMAL(3,2),
  relevance_score DECIMAL(3,2),
  quality_score DECIMAL(3,2),
  extraction_score DECIMAL(3,2),
  legal_risk_score DECIMAL(3,2),
  overall_score DECIMAL(3,2),
  pages_scanned INT DEFAULT 0,
  unique_records INT DEFAULT 0,
  duplicate_rate DECIMAL(5,2) DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  yield_score DECIMAL(5,2),
  last_scanned TIMESTAMP,
  cooldown_until TIMESTAMP,
  blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason VARCHAR(255),
  discovered_from VARCHAR(255),
  discovery_query VARCHAR(255),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_domain (source_domain),
  INDEX idx_type (source_type),
  INDEX idx_score (overall_score),
  INDEX idx_yield (yield_score),
  INDEX idx_blacklisted (blacklisted),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 6: repair_outcomes (RSI - Repair Success Intelligence)
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_outcomes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vehicle_make VARCHAR(50) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  error_code VARCHAR(20) NOT NULL,
  error_system VARCHAR(50),
  repair_action VARCHAR(255) NOT NULL,
  success ENUM('true', 'false', 'unknown') DEFAULT 'unknown',
  repair_time_hours DECIMAL(5,2),
  repair_cost DECIMAL(10,2),
  source_domain VARCHAR(100),
  source_url VARCHAR(500),
  confidence DECIMAL(3,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- RSI Aggregation Fields
  success_rate DECIMAL(5,2),
  total_cases INT DEFAULT 1,
  avg_repair_time DECIMAL(5,2),
  avg_repair_cost DECIMAL(10,2),
  cost_std_dev DECIMAL(10,2),
  time_std_dev DECIMAL(5,2),
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  
  INDEX idx_vehicle (vehicle_make, vehicle_model, engine_code),
  INDEX idx_error_code (error_code),
  INDEX idx_repair_action (repair_action),
  INDEX idx_success_rate (success_rate),
  INDEX idx_timestamp (timestamp),
  INDEX idx_composite (vehicle_make, vehicle_model, error_code, repair_action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 7: repair_feedback (User Feedback Loop)
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  diagnostic_id VARCHAR(100),
  user_id VARCHAR(100),
  mechanic_id VARCHAR(100),
  vehicle_make VARCHAR(50),
  vehicle_model VARCHAR(100),
  vehicle_year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  error_code VARCHAR(20),
  repair_action VARCHAR(255),
  success ENUM('true', 'false', 'partial') DEFAULT 'unknown',
  repair_time_hours DECIMAL(5,2),
  repair_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  cost_variance DECIMAL(10,2),
  feedback_text TEXT,
  rating INT,
  issues_found JSON,
  improvements_suggested JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_mechanic (mechanic_id),
  INDEX idx_diagnostic (diagnostic_id),
  INDEX idx_error_code (error_code),
  INDEX idx_success (success),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 8: beta_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS beta_invites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  mechanic_name VARCHAR(100),
  mechanic_shop VARCHAR(100),
  invited_by VARCHAR(100),
  status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  INDEX idx_code (invite_code),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 9: beta_users
-- ============================================================
CREATE TABLE IF NOT EXISTS beta_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  mechanic_name VARCHAR(100),
  mechanic_shop VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  specialties JSON,
  certifications JSON,
  experience_years INT,
  diagnostics_count INT DEFAULT 0,
  feedback_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_joined (joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Composite indexes for common queries
ALTER TABLE repair_cases ADD INDEX idx_vehicle_error (vehicle_make, vehicle_model, error_code);
ALTER TABLE repair_outcomes ADD INDEX idx_rsi_query (vehicle_make, vehicle_model, engine_code, error_code, repair_action, success_rate);
ALTER TABLE service_procedures ADD INDEX idx_procedure_search (vehicle_make, vehicle_model, system_type);

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Show all created tables
SHOW TABLES LIKE '%repair%';
SHOW TABLES LIKE '%service%';
SHOW TABLES LIKE '%torque%';
SHOW TABLES LIKE '%tools%';
SHOW TABLES LIKE '%source%';
SHOW TABLES LIKE '%beta%';

-- ============================================================
-- END OF SCHEMA
-- ============================================================

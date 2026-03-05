-- ============================================================================
-- PRODUCT-ORCHESTRATOR SCHEMA FOR SUPABASE POSTGRESQL
-- ============================================================================
-- This schema is for the separate PostgreSQL database (NOT the MySQL app DB)
-- Purpose: Vector search, embeddings, and product orchestration data
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. CASES TABLE (Product/Service Cases)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cases (
  id BIGSERIAL PRIMARY KEY,
  case_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Case metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  category VARCHAR(100),
  
  -- Vehicle/Product context
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INT,
  vehicle_vin VARCHAR(17),
  
  -- Error codes and symptoms
  error_codes TEXT[], -- Array of DTC codes (P0011, P0171, etc.)
  symptoms TEXT[], -- Array of symptoms
  
  -- Assignment and tracking
  assigned_to VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metrics
  resolution_time_minutes INT,
  customer_satisfaction_score DECIMAL(3,2), -- 0.00 to 5.00
  
  -- Indexing
  CONSTRAINT cases_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT cases_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_vehicle ON cases(vehicle_make, vehicle_model);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);

-- ============================================================================
-- 2. FEEDBACK TABLE (User Feedback & Ratings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  feedback_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Feedback context
  case_id UUID REFERENCES cases(case_id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  feedback_type VARCHAR(50) NOT NULL, -- diagnostic_accuracy, repair_cost, time_estimate, ui_ux, other
  
  -- Rating and text
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Detailed feedback
  was_solution_helpful BOOLEAN,
  was_estimate_accurate BOOLEAN,
  would_recommend BOOLEAN,
  
  -- Tags for analysis
  tags TEXT[], -- Array of tags for categorization
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT feedback_type_check CHECK (feedback_type IN ('diagnostic_accuracy', 'repair_cost', 'time_estimate', 'ui_ux', 'other'))
);

CREATE INDEX idx_feedback_case_id ON feedback(case_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);

-- ============================================================================
-- 3. TELEMETRY TABLE (System Metrics & Performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemetry (
  id BIGSERIAL PRIMARY KEY,
  
  -- Agent/Worker identification
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50), -- scout, extractor, normalizer, verifier, etc.
  
  -- Operation metrics
  operation VARCHAR(100) NOT NULL, -- api_call, data_extraction, deduplication, etc.
  duration_ms INT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  
  -- LLM metrics
  model_name VARCHAR(100),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 6),
  
  -- Data metrics
  records_processed INT,
  records_created INT,
  records_updated INT,
  duplicates_found INT,
  
  -- System metrics
  memory_usage_mb DECIMAL(10, 2),
  cpu_usage_percent DECIMAL(5, 2),
  
  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_id VARCHAR(100),
  iteration INT
);

CREATE INDEX idx_telemetry_agent_id ON telemetry(agent_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_operation ON telemetry(operation);
CREATE INDEX idx_telemetry_agent_type ON telemetry(agent_type);
CREATE INDEX idx_telemetry_batch_id ON telemetry(batch_id);

-- ============================================================================
-- 4. PARTS_OFFERS TABLE (Supplier Parts & Pricing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS parts_offers (
  id BIGSERIAL PRIMARY KEY,
  offer_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Part information
  part_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  oem_number VARCHAR(100),
  category VARCHAR(100), -- engine, transmission, suspension, etc.
  
  -- Vehicle compatibility
  compatible_makes TEXT[], -- Array of vehicle makes
  compatible_models TEXT[], -- Array of vehicle models
  compatible_years INT[], -- Array of years
  
  -- Supplier information
  supplier_id UUID NOT NULL,
  supplier_name VARCHAR(255),
  supplier_country VARCHAR(100),
  
  -- Pricing
  price_usd DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  stock_quantity INT,
  lead_time_days INT,
  
  -- Quality metrics
  quality_rating DECIMAL(3, 2), -- 0.00 to 5.00
  reviews_count INT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_price_check TIMESTAMP WITH TIME ZONE,
  
  -- Indexing
  CONSTRAINT parts_offers_price_check CHECK (price_usd > 0)
);

CREATE INDEX idx_parts_offers_part_number ON parts_offers(part_number);
CREATE INDEX idx_parts_offers_supplier_id ON parts_offers(supplier_id);
CREATE INDEX idx_parts_offers_category ON parts_offers(category);
CREATE INDEX idx_parts_offers_price ON parts_offers(price_usd);
CREATE INDEX idx_parts_offers_stock ON parts_offers(stock_quantity);

-- ============================================================================
-- 5. SUPPLIERS TABLE (Supplier Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  supplier_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Company information
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  website VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Supplier metrics
  reliability_score DECIMAL(3, 2), -- 0.00 to 5.00
  average_delivery_time_days DECIMAL(5, 2),
  return_rate_percent DECIMAL(5, 2),
  
  -- Integration
  api_endpoint VARCHAR(255),
  api_key VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT suppliers_score_check CHECK (reliability_score >= 0 AND reliability_score <= 5)
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_country ON suppliers(country);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_reliability_score ON suppliers(reliability_score DESC);

-- ============================================================================
-- 6. EMBEDDINGS_PROCEDURES TABLE (Vector Search for Repair Procedures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS embeddings_procedures (
  id BIGSERIAL PRIMARY KEY,
  procedure_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Procedure information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- engine, transmission, electrical, etc.
  difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
  
  -- Vehicle context
  vehicle_makes TEXT[], -- Array of compatible makes
  vehicle_models TEXT[], -- Array of compatible models
  vehicle_years INT[], -- Array of compatible years
  
  -- Procedure details
  estimated_time_minutes INT,
  tools_required TEXT[], -- Array of tools
  parts_required TEXT[], -- Array of parts
  safety_warnings TEXT[], -- Array of warnings
  
  -- Steps (stored as JSONB for flexibility)
  steps JSONB, -- Array of {step: int, action: string, notes: string}
  
  -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata
  source_url VARCHAR(255),
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT embeddings_procedures_difficulty_check CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
);

-- Vector index for similarity search (cosine distance)
CREATE INDEX idx_embeddings_procedures_embedding ON embeddings_procedures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Other indexes
CREATE INDEX idx_embeddings_procedures_category ON embeddings_procedures(category);
CREATE INDEX idx_embeddings_procedures_difficulty ON embeddings_procedures(difficulty_level);
CREATE INDEX idx_embeddings_procedures_created_at ON embeddings_procedures(created_at DESC);

-- ============================================================================
-- 7. RATE_LIMIT_TRACKER TABLE (Global Kimi API Rate Limiting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
  id BIGSERIAL PRIMARY KEY,
  
  -- Rate limit window (1 minute)
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Request tracking
  agent_id VARCHAR(100) NOT NULL,
  request_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  
  -- Status
  is_throttled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(window_start, agent_id)
);

CREATE INDEX idx_rate_limit_tracker_window ON rate_limit_tracker(window_start DESC);
CREATE INDEX idx_rate_limit_tracker_agent_id ON rate_limit_tracker(agent_id);
CREATE INDEX idx_rate_limit_tracker_is_throttled ON rate_limit_tracker(is_throttled);

-- ============================================================================
-- 8. API_CALL_LOG TABLE (Detailed LLM API Logging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_call_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Call identification
  call_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) NOT NULL,
  
  -- API details
  api_provider VARCHAR(50) NOT NULL, -- kimi, openai, anthropic
  model_name VARCHAR(100),
  endpoint VARCHAR(255),
  
  -- Request/Response
  prompt_text TEXT,
  response_text TEXT,
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  
  -- Cost tracking
  cost_usd DECIMAL(10, 6),
  
  -- Performance
  latency_ms INT,
  
  -- Status
  status_code INT,
  error_message TEXT,
  success BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_id VARCHAR(100)
);

CREATE INDEX idx_api_call_log_agent_id ON api_call_log(agent_id);
CREATE INDEX idx_api_call_log_timestamp ON api_call_log(timestamp DESC);
CREATE INDEX idx_api_call_log_api_provider ON api_call_log(api_provider);
CREATE INDEX idx_api_call_log_batch_id ON api_call_log(batch_id);
CREATE INDEX idx_api_call_log_success ON api_call_log(success);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Daily API cost summary
CREATE OR REPLACE VIEW v_daily_api_costs AS
SELECT
  DATE(timestamp) as date,
  api_provider,
  COUNT(*) as call_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(latency_ms) as avg_latency_ms
FROM api_call_log
WHERE success = TRUE
GROUP BY DATE(timestamp), api_provider
ORDER BY date DESC, total_cost_usd DESC;

-- Agent performance summary
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT
  agent_id,
  COUNT(*) as total_calls,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(latency_ms) as avg_latency_ms,
  MAX(timestamp) as last_call
FROM api_call_log
GROUP BY agent_id
ORDER BY total_cost_usd DESC;

-- Case resolution metrics
CREATE OR REPLACE VIEW v_case_metrics AS
SELECT
  status,
  COUNT(*) as case_count,
  AVG(resolution_time_minutes) as avg_resolution_time_minutes,
  AVG(customer_satisfaction_score) as avg_satisfaction_score,
  COUNT(CASE WHEN customer_satisfaction_score >= 4 THEN 1 END) as satisfied_count
FROM cases
GROUP BY status;

-- ============================================================================
-- GRANTS (for application user - adjust as needed)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

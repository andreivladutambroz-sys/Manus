-- ============================================================================
-- MECHANIC HELPER - NORMALIZED AUTOMOTIVE DIAGNOSTIC DATABASE SCHEMA
-- Professional PostgreSQL schema similar to Autodata/Mitchell
-- ============================================================================

-- ============================================================================
-- 1. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  generation VARCHAR(50),
  year_from INT NOT NULL,
  year_to INT,
  engine_code VARCHAR(50),
  displacement_cc INT,
  fuel_type VARCHAR(50), -- Petrol, Diesel, Hybrid, Electric, etc.
  induction VARCHAR(50), -- Naturally Aspirated, Turbocharged, Supercharged, etc.
  drivetrain VARCHAR(50), -- FWD, RWD, AWD, etc.
  
  -- Canonical identity key for deduplication
  canonical_key VARCHAR(255) GENERATED ALWAYS AS (
    CONCAT(make, '|', model, '|', year_from, '|', engine_code, '|', displacement_cc, '|', fuel_type)
  ) STORED UNIQUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT vehicles_year_range CHECK (year_from <= year_to OR year_to IS NULL),
  INDEX idx_vehicles_make_model (make, model),
  INDEX idx_vehicles_year (year_from, year_to),
  INDEX idx_vehicles_engine (engine_code),
  INDEX idx_vehicles_canonical (canonical_key)
);

-- ============================================================================
-- 2. DTC CODES TABLE (Diagnostic Trouble Codes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dtc_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE, -- P0011, P0171, etc.
  system VARCHAR(100) NOT NULL, -- Engine, Transmission, ABS, Electrical, etc.
  description TEXT NOT NULL,
  generic_or_oem VARCHAR(20), -- Generic or OEM-specific
  severity VARCHAR(50), -- Info, Warning, Critical, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_dtc_code (code),
  INDEX idx_dtc_system (system)
);

-- ============================================================================
-- 3. SYMPTOMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  aliases TEXT, -- JSON array of alternative names
  category VARCHAR(100), -- Engine, Transmission, Electrical, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_symptoms_name (name),
  INDEX idx_symptoms_category (category)
);

-- ============================================================================
-- 4. COMPONENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system VARCHAR(100) NOT NULL, -- Engine, Transmission, Electrical, etc.
  name VARCHAR(255) NOT NULL,
  aliases TEXT, -- JSON array of alternative names
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT components_unique UNIQUE (system, name),
  INDEX idx_components_system (system),
  INDEX idx_components_name (name)
);

-- ============================================================================
-- 5. PROCEDURES TABLE (Repair procedures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  dtc_id UUID REFERENCES dtc_codes(id) ON DELETE SET NULL,
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50), -- Easy, Intermediate, Hard, Expert
  estimated_time_minutes INT,
  confidence DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  
  -- Canonical key for deduplication
  canonical_key VARCHAR(255) GENERATED ALWAYS AS (
    CONCAT(vehicle_id, '|', dtc_id, '|', component_id, '|', title)
  ) STORED UNIQUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_procedures_vehicle (vehicle_id),
  INDEX idx_procedures_dtc (dtc_id),
  INDEX idx_procedures_component (component_id),
  INDEX idx_procedures_confidence (confidence),
  INDEX idx_procedures_canonical (canonical_key)
);

-- ============================================================================
-- 6. PROCEDURE STEPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedure_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  expected_result TEXT,
  safety_note TEXT,
  tools_required TEXT, -- JSON array
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT step_order UNIQUE (procedure_id, step_number),
  INDEX idx_steps_procedure (procedure_id, step_number)
);

-- ============================================================================
-- 7. TORQUE SPECIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS torque_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
  fastener VARCHAR(255) NOT NULL, -- Bolt name/description
  value_nm DECIMAL(8, 2) NOT NULL, -- Torque value in Newton-meters
  conditions TEXT, -- Special conditions (cold, warm, etc.)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_torque_vehicle (vehicle_id),
  INDEX idx_torque_component (component_id),
  INDEX idx_torque_fastener (fastener)
);

-- ============================================================================
-- 8. SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL, -- vwvortex.com, manualslib.com, etc.
  url TEXT NOT NULL,
  source_type VARCHAR(50), -- Forum, Manual, Database, GitHub, etc.
  retrieved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT sources_unique UNIQUE (domain, url),
  INDEX idx_sources_domain (domain),
  INDEX idx_sources_type (source_type)
);

-- ============================================================================
-- 9. EVIDENCE TABLE (Tracks source attribution)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- vehicle, dtc_code, procedure, torque_spec
  entity_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  confidence DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT evidence_unique UNIQUE (entity_type, entity_id, source_id),
  INDEX idx_evidence_entity (entity_type, entity_id),
  INDEX idx_evidence_source (source_id),
  INDEX idx_evidence_confidence (confidence)
);

-- ============================================================================
-- 10. SYMPTOM-TO-DTC MAPPING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS symptom_dtc_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  dtc_id UUID NOT NULL REFERENCES dtc_codes(id) ON DELETE CASCADE,
  likelihood VARCHAR(50), -- Likely, Possible, Rare
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT symptom_dtc_unique UNIQUE (symptom_id, dtc_id),
  INDEX idx_symptom_dtc_mapping (symptom_id, dtc_id)
);

-- ============================================================================
-- 11. DEDUPLICATION LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS deduplication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- vehicle, procedure, etc.
  original_id UUID NOT NULL,
  duplicate_id UUID,
  merge_reason TEXT,
  confidence_increase DECIMAL(3, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_dedup_entity (entity_type),
  INDEX idx_dedup_original (original_id),
  INDEX idx_dedup_date (created_at)
);

-- ============================================================================
-- 12. INGESTION TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingestion_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file VARCHAR(255) NOT NULL,
  record_hash VARCHAR(255) NOT NULL UNIQUE,
  entity_type VARCHAR(50),
  entity_id UUID,
  status VARCHAR(50), -- Success, Duplicate, Error, Skipped
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ingestion_file (source_file),
  INDEX idx_ingestion_hash (record_hash),
  INDEX idx_ingestion_status (status),
  INDEX idx_ingestion_date (created_at)
);

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Find all procedures for a vehicle
CREATE INDEX idx_vehicle_procedures ON procedures(vehicle_id, confidence DESC);

-- Find all procedures for a DTC code
CREATE INDEX idx_dtc_procedures ON procedures(dtc_id, confidence DESC);

-- Find all torque specs for a vehicle
CREATE INDEX idx_vehicle_torque ON torque_specs(vehicle_id);

-- Find evidence by entity
CREATE INDEX idx_evidence_lookup ON evidence(entity_type, entity_id, confidence DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- View: Vehicle-DTC-Procedure mapping
CREATE OR REPLACE VIEW vehicle_dtc_procedures AS
SELECT 
  v.id as vehicle_id,
  v.make,
  v.model,
  v.year_from,
  v.year_to,
  d.id as dtc_id,
  d.code,
  d.description,
  p.id as procedure_id,
  p.title,
  p.difficulty,
  p.estimated_time_minutes,
  p.confidence
FROM vehicles v
LEFT JOIN procedures p ON v.id = p.vehicle_id
LEFT JOIN dtc_codes d ON p.dtc_id = d.id
WHERE p.id IS NOT NULL;

-- View: Symptom-to-repair path
CREATE OR REPLACE VIEW symptom_repair_path AS
SELECT 
  s.id as symptom_id,
  s.name as symptom,
  d.id as dtc_id,
  d.code,
  d.description,
  p.id as procedure_id,
  p.title,
  p.difficulty,
  p.confidence
FROM symptoms s
LEFT JOIN symptom_dtc_mapping sdm ON s.id = sdm.symptom_id
LEFT JOIN dtc_codes d ON sdm.dtc_id = d.id
LEFT JOIN procedures p ON d.id = p.dtc_id
WHERE p.id IS NOT NULL;

-- ============================================================================
-- GRANTS (if using Supabase)
-- ============================================================================
-- Uncomment if using Supabase with RLS policies
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

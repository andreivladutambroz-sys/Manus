-- ============================================================================
-- POSTGRESQL KNOWLEDGE BASE SCHEMA WITH PGVECTOR
-- ============================================================================
-- Separate from MySQL app database
-- Purpose: Normalized KB, embeddings, vector search
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. VEHICLES TABLE (Normalized)
-- ============================================================================
CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  generation VARCHAR(50),
  body_type VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(make, model, year)
);

CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);

-- ============================================================================
-- 2. ENGINES TABLE (Normalized)
-- ============================================================================
CREATE TABLE engines (
  id BIGSERIAL PRIMARY KEY,
  engine_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  engine_code VARCHAR(50) NOT NULL,
  engine_name VARCHAR(255),
  displacement_cc INT,
  power_kw INT,
  power_hp INT,
  torque_nm INT,
  fuel_type VARCHAR(50), -- Petrol, Diesel, Hybrid, Electric
  transmission VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(vehicle_id, engine_code)
);

CREATE INDEX idx_engines_vehicle_id ON engines(vehicle_id);
CREATE INDEX idx_engines_fuel_type ON engines(fuel_type);

-- ============================================================================
-- 3. DTC_CODES TABLE (Error Codes)
-- ============================================================================
CREATE TABLE dtc_codes (
  id BIGSERIAL PRIMARY KEY,
  code_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  code VARCHAR(10) NOT NULL UNIQUE, -- P0011, P0171, etc.
  system VARCHAR(100), -- Fuel System, Ignition, etc.
  description TEXT,
  severity VARCHAR(20), -- info, warning, critical
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dtc_codes_code ON dtc_codes(code);
CREATE INDEX idx_dtc_codes_system ON dtc_codes(system);

-- ============================================================================
-- 4. SYMPTOMS TABLE
-- ============================================================================
CREATE TABLE symptoms (
  id BIGSERIAL PRIMARY KEY,
  symptom_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100), -- engine, transmission, electrical, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_symptoms_category ON symptoms(category);

-- ============================================================================
-- 5. COMPONENTS TABLE (Parts/Components)
-- ============================================================================
CREATE TABLE components (
  id BIGSERIAL PRIMARY KEY,
  component_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name, category)
);

CREATE INDEX idx_components_category ON components(category);

-- ============================================================================
-- 6. PROCEDURES TABLE (Repair Procedures)
-- ============================================================================
CREATE TABLE procedures (
  id BIGSERIAL PRIMARY KEY,
  procedure_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
  estimated_time_minutes INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_procedures_category ON procedures(category);
CREATE INDEX idx_procedures_difficulty ON procedures(difficulty_level);

-- ============================================================================
-- 7. PROCEDURE_STEPS TABLE (Detailed Steps)
-- ============================================================================
CREATE TABLE procedure_steps (
  id BIGSERIAL PRIMARY KEY,
  step_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  procedure_id BIGINT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  
  step_number INT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  safety_warning TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(procedure_id, step_number)
);

CREATE INDEX idx_procedure_steps_procedure_id ON procedure_steps(procedure_id);

-- ============================================================================
-- 8. TORQUE_SPECS TABLE (Torque Specifications)
-- ============================================================================
CREATE TABLE torque_specs (
  id BIGSERIAL PRIMARY KEY,
  spec_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  
  component_name VARCHAR(255),
  value_nm DECIMAL(10, 2) NOT NULL,
  value_ft_lbs DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_torque_specs_vehicle_id ON torque_specs(vehicle_id);
CREATE INDEX idx_torque_specs_component_id ON torque_specs(component_id);

-- ============================================================================
-- 9. SOURCES TABLE (Data Sources & Attribution)
-- ============================================================================
CREATE TABLE sources (
  id BIGSERIAL PRIMARY KEY,
  source_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  url VARCHAR(500) NOT NULL UNIQUE,
  title VARCHAR(255),
  domain VARCHAR(100),
  source_type VARCHAR(50), -- forum, manual, database, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sources_domain ON sources(domain);
CREATE INDEX idx_sources_source_type ON sources(source_type);

-- ============================================================================
-- 10. EVIDENCE TABLE (Source Attribution & Confidence)
-- ============================================================================
CREATE TABLE evidence (
  id BIGSERIAL PRIMARY KEY,
  evidence_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  -- What is being evidenced
  entity_type VARCHAR(50) NOT NULL, -- dtc_code, procedure, torque_spec, etc.
  entity_id BIGINT NOT NULL,
  
  -- Source
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  
  -- Confidence
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  verified BOOLEAN DEFAULT FALSE,
  verification_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, source_id)
);

CREATE INDEX idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX idx_evidence_source_id ON evidence(source_id);
CREATE INDEX idx_evidence_confidence ON evidence(confidence_score DESC);
CREATE INDEX idx_evidence_verified ON evidence(verified);

-- ============================================================================
-- 11. EMBEDDINGS_PROCEDURES TABLE (Vector Search)
-- ============================================================================
CREATE TABLE embeddings_procedures (
  id BIGSERIAL PRIMARY KEY,
  embedding_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  procedure_id BIGINT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  
  -- Text content for embedding
  content_text TEXT NOT NULL,
  
  -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  embedding_timestamp TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vector index for cosine similarity search
CREATE INDEX idx_embeddings_procedures_vector ON embeddings_procedures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_embeddings_procedures_procedure_id ON embeddings_procedures(procedure_id);

-- ============================================================================
-- 12. KNOWLEDGE_GRAPH TABLE (Relationships)
-- ============================================================================
CREATE TABLE knowledge_graph (
  id BIGSERIAL PRIMARY KEY,
  
  -- From entity
  from_type VARCHAR(50) NOT NULL, -- vehicle, dtc, symptom, component, procedure
  from_id BIGINT NOT NULL,
  
  -- Relationship
  relationship VARCHAR(100) NOT NULL, -- has_engine, produces_error, fixed_by, etc.
  
  -- To entity
  to_type VARCHAR(50) NOT NULL,
  to_id BIGINT NOT NULL,
  
  -- Confidence
  confidence_score DECIMAL(3, 2) DEFAULT 0.5,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(from_type, from_id, relationship, to_type, to_id)
);

CREATE INDEX idx_knowledge_graph_from ON knowledge_graph(from_type, from_id);
CREATE INDEX idx_knowledge_graph_to ON knowledge_graph(to_type, to_id);
CREATE INDEX idx_knowledge_graph_relationship ON knowledge_graph(relationship);

-- ============================================================================
-- 13. INGESTION_LOG TABLE (Track JSONL Ingestion)
-- ============================================================================
CREATE TABLE ingestion_log (
  id BIGSERIAL PRIMARY KEY,
  
  batch_id UUID NOT NULL,
  source_file VARCHAR(255),
  
  records_processed INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  errors INT DEFAULT 0,
  
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,
  
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  UNIQUE(batch_id)
);

CREATE INDEX idx_ingestion_log_batch_id ON ingestion_log(batch_id);
CREATE INDEX idx_ingestion_log_status ON ingestion_log(status);
CREATE INDEX idx_ingestion_log_started_at ON ingestion_log(started_at DESC);

-- ============================================================================
-- VIEWS FOR ANALYTICS & QUERIES
-- ============================================================================

-- Find all procedures for a specific vehicle + DTC code
CREATE OR REPLACE VIEW v_vehicle_dtc_procedures AS
SELECT DISTINCT
  v.make,
  v.model,
  v.year,
  dc.code,
  dc.description,
  p.title as procedure_title,
  p.difficulty_level,
  p.estimated_time_minutes,
  COUNT(DISTINCT e.source_id) as source_count,
  AVG(e.confidence_score) as avg_confidence
FROM vehicles v
JOIN knowledge_graph kg1 ON kg1.from_type = 'vehicle' AND kg1.from_id = v.id
JOIN dtc_codes dc ON dc.id = kg1.to_id AND kg1.to_type = 'dtc'
JOIN knowledge_graph kg2 ON kg2.from_type = 'dtc' AND kg2.from_id = dc.id AND kg2.relationship = 'fixed_by'
JOIN procedures p ON p.id = kg2.to_id AND kg2.to_type = 'procedure'
LEFT JOIN evidence e ON e.entity_type = 'procedure' AND e.entity_id = p.id
GROUP BY v.id, v.make, v.model, v.year, dc.id, dc.code, dc.description, p.id, p.title, p.difficulty_level, p.estimated_time_minutes;

-- Find torque specs for a vehicle
CREATE OR REPLACE VIEW v_vehicle_torque_specs AS
SELECT
  v.make,
  v.model,
  v.year,
  ts.component_name,
  ts.value_nm,
  ts.value_ft_lbs,
  COUNT(DISTINCT e.source_id) as source_count
FROM vehicles v
JOIN torque_specs ts ON ts.vehicle_id = v.id
LEFT JOIN evidence e ON e.entity_type = 'torque_spec' AND e.entity_id = ts.id
GROUP BY v.id, v.make, v.model, v.year, ts.id, ts.component_name, ts.value_nm, ts.value_ft_lbs;

-- Symptoms linked to DTC codes
CREATE OR REPLACE VIEW v_symptom_dtc_mapping AS
SELECT
  s.name as symptom,
  dc.code,
  dc.description,
  COUNT(DISTINCT e.source_id) as source_count,
  AVG(e.confidence_score) as avg_confidence
FROM symptoms s
JOIN knowledge_graph kg ON kg.from_type = 'symptom' AND kg.from_id = s.id AND kg.to_type = 'dtc'
JOIN dtc_codes dc ON dc.id = kg.to_id
LEFT JOIN evidence e ON e.entity_type = 'dtc_code' AND e.entity_id = dc.id
GROUP BY s.id, s.name, dc.id, dc.code, dc.description;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

/*
-- Find procedures for Toyota Camry 2015 with P0171 error
SELECT * FROM v_vehicle_dtc_procedures
WHERE make = 'Toyota' AND model = 'Camry' AND year = 2015 AND code = 'P0171';

-- Find all torque specs for a vehicle
SELECT * FROM v_vehicle_torque_specs
WHERE make = 'BMW' AND model = '3 Series' AND year = 2020;

-- Semantic search for procedures (using pgvector)
SELECT
  p.title,
  p.description,
  1 - (ep.embedding <=> $1) as similarity_score
FROM embeddings_procedures ep
JOIN procedures p ON p.id = ep.procedure_id
ORDER BY similarity_score DESC
LIMIT 5;

-- Find high-confidence evidence
SELECT
  e.entity_type,
  e.entity_id,
  s.url,
  e.confidence_score,
  e.verification_count
FROM evidence e
JOIN sources s ON s.id = e.source_id
WHERE e.confidence_score >= 0.8 AND e.verified = TRUE
ORDER BY e.confidence_score DESC;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

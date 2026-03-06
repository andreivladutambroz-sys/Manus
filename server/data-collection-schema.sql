-- ============================================================================
-- DATA COLLECTION SWARM - DATABASE SCHEMA
-- ============================================================================
-- This schema supports the 8-layer data collection pipeline:
-- 1. Web Scraper (raw HTML)
-- 2. HTML Parser (extracted data)
-- 3. Data Validator (quality scoring)
-- 4. Data Normalizer (cleaned data)
-- 5. AI Enricher (enriched data)
-- 6. Data Linker (relationships)
-- 7. Deduplicator (unique records)
-- 8. Database Writer (final storage)
-- ============================================================================

-- LAYER 1: RAW DATA STORAGE (Web Scraper Output)
-- ============================================================================

CREATE TABLE IF NOT EXISTS raw_scrape_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(50) UNIQUE NOT NULL,
  source_site VARCHAR(100) NOT NULL,  -- epiesa.ro, autodoc.ro, etc.
  target_url VARCHAR(2000) NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  total_urls INT DEFAULT 0,
  successful_urls INT DEFAULT 0,
  failed_urls INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS raw_html_storage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(50) NOT NULL,
  source_url VARCHAR(2000) NOT NULL UNIQUE,
  source_site VARCHAR(100) NOT NULL,
  html_content LONGBLOB NOT NULL,
  html_size_bytes INT,
  status_code INT,
  headers JSON,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processing_status ENUM('pending', 'parsing', 'parsed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES raw_scrape_jobs(job_id),
  INDEX idx_source_site (source_site),
  INDEX idx_processing_status (processing_status),
  INDEX idx_scraped_at (scraped_at)
);

-- LAYER 2: PARSED DATA STORAGE (HTML Parser Output)
-- ============================================================================

CREATE TABLE IF NOT EXISTS parsed_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  html_storage_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Extracted fields
  brand_raw VARCHAR(100),
  model_raw VARCHAR(100),
  year_raw VARCHAR(20),
  engine_raw VARCHAR(200),
  power_raw VARCHAR(50),
  displacement_raw VARCHAR(50),
  fuel_type_raw VARCHAR(50),
  transmission_raw VARCHAR(50),
  
  -- Raw JSON for reference
  raw_json JSON,
  
  -- Processing
  parsing_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
  parsing_error TEXT,
  parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (html_storage_id) REFERENCES raw_html_storage(id),
  INDEX idx_source_site (source_site),
  INDEX idx_parsing_status (parsing_status),
  INDEX idx_parsed_at (parsed_at)
);

CREATE TABLE IF NOT EXISTS parsed_parts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  html_storage_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Extracted fields
  oem_code_raw VARCHAR(100),
  part_name_raw VARCHAR(200),
  price_raw VARCHAR(50),
  currency_raw VARCHAR(10),
  stock_raw VARCHAR(50),
  supplier_raw VARCHAR(100),
  
  -- Raw JSON
  raw_json JSON,
  
  -- Processing
  parsing_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
  parsing_error TEXT,
  parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (html_storage_id) REFERENCES raw_html_storage(id),
  INDEX idx_source_site (source_site),
  INDEX idx_parsing_status (parsing_status)
);

CREATE TABLE IF NOT EXISTS parsed_listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  html_storage_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Extracted fields
  brand_raw VARCHAR(100),
  model_raw VARCHAR(100),
  year_raw VARCHAR(20),
  engine_raw VARCHAR(200),
  mileage_raw VARCHAR(50),
  price_raw VARCHAR(50),
  currency_raw VARCHAR(10),
  condition_raw VARCHAR(50),
  defect_description_raw TEXT,
  
  -- Raw JSON
  raw_json JSON,
  
  -- Processing
  parsing_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
  parsing_error TEXT,
  parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (html_storage_id) REFERENCES raw_html_storage(id),
  INDEX idx_source_site (source_site),
  INDEX idx_parsing_status (parsing_status)
);

-- LAYER 3 & 4: VALIDATED & NORMALIZED DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS validated_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parsed_vehicle_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Normalized fields
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  engine VARCHAR(200) NOT NULL,
  power_hp INT,
  displacement_cc INT,
  fuel_type ENUM('petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'cng', 'unknown'),
  transmission ENUM('manual', 'automatic', 'cvt', 'dct', 'unknown'),
  
  -- Quality metrics
  quality_score INT,  -- 0-100
  field_completeness DECIMAL(3,2),  -- 0.00-1.00
  data_validity DECIMAL(3,2),  -- 0.00-1.00
  validation_status ENUM('approved', 'rejected', 'manual_review') DEFAULT 'approved',
  validation_errors JSON,
  validation_warnings JSON,
  
  -- Metadata
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parsed_vehicle_id) REFERENCES parsed_vehicles(id),
  INDEX idx_brand_model (brand, model),
  INDEX idx_year (year),
  INDEX idx_quality_score (quality_score),
  INDEX idx_validation_status (validation_status)
);

CREATE TABLE IF NOT EXISTS validated_parts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parsed_part_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Normalized fields
  oem_code VARCHAR(100) NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  part_category VARCHAR(100),  -- engine, transmission, suspension, etc.
  price_eur DECIMAL(10,2),
  stock_quantity INT,
  supplier_name VARCHAR(100),
  
  -- Quality metrics
  quality_score INT,
  validation_status ENUM('approved', 'rejected', 'manual_review') DEFAULT 'approved',
  validation_errors JSON,
  
  -- Metadata
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parsed_part_id) REFERENCES parsed_parts(id),
  INDEX idx_oem_code (oem_code),
  INDEX idx_part_category (part_category),
  INDEX idx_quality_score (quality_score)
);

CREATE TABLE IF NOT EXISTS validated_listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parsed_listing_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  
  -- Normalized fields
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  engine VARCHAR(200),
  mileage_km INT,
  price_eur DECIMAL(10,2),
  condition ENUM('new', 'excellent', 'good', 'fair', 'poor', 'unknown'),
  defect_description TEXT,
  
  -- Quality metrics
  quality_score INT,
  validation_status ENUM('approved', 'rejected', 'manual_review') DEFAULT 'approved',
  
  -- Metadata
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parsed_listing_id) REFERENCES parsed_listings(id),
  INDEX idx_brand_model_year (brand, model, year),
  INDEX idx_quality_score (quality_score)
);

-- LAYER 5: ENRICHED DATA (AI Enricher Output)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enriched_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  validated_vehicle_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  
  -- Original normalized data
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  engine VARCHAR(200) NOT NULL,
  
  -- AI-enriched fields
  generation VARCHAR(50),  -- E90, W205, etc.
  generation_years_from INT,
  generation_years_to INT,
  engine_code VARCHAR(50),  -- N46B20, OM651, etc.
  power_hp INT,
  displacement_cc INT,
  torque_nm INT,
  fuel_type VARCHAR(50),
  transmission VARCHAR(50),
  
  -- Enrichment metadata
  enrichment_status ENUM('pending', 'enriched', 'failed') DEFAULT 'pending',
  enrichment_confidence DECIMAL(3,2),  -- 0.00-1.00
  enrichment_model VARCHAR(50),  -- kimi-256k, etc.
  enrichment_timestamp TIMESTAMP,
  enrichment_prompt_tokens INT,
  enrichment_completion_tokens INT,
  
  -- Enriched insights
  common_defects JSON,  -- [{"defect": "...", "frequency": 0.89}, ...]
  reliability_score DECIMAL(3,2),  -- 0.00-1.00
  parts_availability_score DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (validated_vehicle_id) REFERENCES validated_vehicles(id),
  INDEX idx_generation (generation),
  INDEX idx_enrichment_status (enrichment_status),
  INDEX idx_reliability_score (reliability_score)
);

CREATE TABLE IF NOT EXISTS enriched_parts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  validated_part_id INT NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  
  -- Original normalized data
  oem_code VARCHAR(100) NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  
  -- AI-enriched fields
  part_category VARCHAR(100),
  part_subcategory VARCHAR(100),
  part_description TEXT,
  manufacturer_name VARCHAR(100),
  quality_tier ENUM('oem', 'aftermarket', 'compatible', 'unknown'),
  
  -- Alternative parts
  alternative_parts JSON,  -- [{"oem_code": "...", "price": 100, "supplier": "..."}, ...]
  
  -- Enrichment metadata
  enrichment_status ENUM('pending', 'enriched', 'failed') DEFAULT 'pending',
  enrichment_confidence DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (validated_part_id) REFERENCES validated_parts(id),
  INDEX idx_part_category (part_category),
  INDEX idx_enrichment_status (enrichment_status)
);

-- LAYER 6: DATA LINKING (Relationships)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_part_compatibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  part_id INT NOT NULL,
  compatibility_score DECIMAL(3,2),  -- 0.00-1.00
  is_compatible BOOLEAN,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vehicle_id) REFERENCES enriched_vehicles(id),
  FOREIGN KEY (part_id) REFERENCES enriched_parts(id),
  UNIQUE KEY unique_vehicle_part (vehicle_id, part_id),
  INDEX idx_compatibility_score (compatibility_score)
);

CREATE TABLE IF NOT EXISTS vehicle_defect_patterns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  defect_description VARCHAR(500),
  defect_severity ENUM('critical', 'high', 'medium', 'low'),
  frequency_percentage DECIMAL(5,2),  -- 0.00-100.00
  source_count INT,  -- How many sources reported this
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vehicle_id) REFERENCES enriched_vehicles(id),
  INDEX idx_defect_severity (defect_severity),
  INDEX idx_frequency_percentage (frequency_percentage)
);

-- LAYER 7: DEDUPLICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_deduplication_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  data_type ENUM('vehicle', 'part', 'listing') NOT NULL,
  original_id INT NOT NULL,
  duplicate_ids JSON,  -- Array of IDs that were duplicates
  kept_id INT,  -- Which one was kept
  reason_for_selection TEXT,
  quality_score_original INT,
  quality_scores_duplicates JSON,
  deduped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_data_type (data_type),
  INDEX idx_deduped_at (deduped_at)
);

-- LAYER 8: FINAL STORAGE (Production Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_name VARCHAR(100) UNIQUE NOT NULL,
  country_origin VARCHAR(50),
  founded_year INT,
  popularity_score DECIMAL(3,2),
  logo_url VARCHAR(500),
  website VARCHAR(500),
  source_count INT DEFAULT 1,  -- How many sources reported this
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_brand_name (brand_name)
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  body_type ENUM('sedan', 'suv', 'coupe', 'hatchback', 'wagon', 'van', 'truck', 'other'),
  segment VARCHAR(50),
  first_year INT,
  last_year INT,
  popularity_score DECIMAL(3,2),
  image_url VARCHAR(500),
  source_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id),
  UNIQUE KEY unique_brand_model (brand_id, model_name),
  INDEX idx_brand_id (brand_id),
  INDEX idx_model_name (model_name)
);

CREATE TABLE IF NOT EXISTS vehicle_generations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  model_id INT NOT NULL,
  generation_code VARCHAR(50),  -- E90, W205, etc.
  generation_name VARCHAR(100),
  year_from INT,
  year_to INT,
  production_count INT,
  popularity_score DECIMAL(3,2),
  source_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (model_id) REFERENCES vehicle_models(id),
  UNIQUE KEY unique_generation (model_id, generation_code),
  INDEX idx_model_id (model_id)
);

CREATE TABLE IF NOT EXISTS vehicle_engines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  generation_id INT NOT NULL,
  engine_code VARCHAR(50),  -- N46B20, OM651, etc.
  engine_name VARCHAR(100),
  displacement_cc INT,
  power_hp INT,
  torque_nm INT,
  fuel_type VARCHAR(50),
  transmission_type VARCHAR(50),
  emission_standard VARCHAR(20),
  year_from INT,
  year_to INT,
  production_count INT,
  popularity_score DECIMAL(3,2),
  source_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (generation_id) REFERENCES vehicle_generations(id),
  UNIQUE KEY unique_engine (generation_id, engine_code),
  INDEX idx_generation_id (generation_id),
  INDEX idx_displacement_cc (displacement_cc)
);

CREATE TABLE IF NOT EXISTS parts_catalog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  oem_code VARCHAR(100) UNIQUE NOT NULL,
  part_name VARCHAR(200) NOT NULL,
  part_category VARCHAR(100),
  part_subcategory VARCHAR(100),
  manufacturer_name VARCHAR(100),
  quality_tier ENUM('oem', 'aftermarket', 'compatible'),
  description TEXT,
  source_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_oem_code (oem_code),
  INDEX idx_part_category (part_category),
  INDEX idx_manufacturer_name (manufacturer_name)
);

CREATE TABLE IF NOT EXISTS parts_pricing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  part_id INT NOT NULL,
  supplier_name VARCHAR(100),
  supplier_url VARCHAR(500),
  price_eur DECIMAL(10,2),
  currency VARCHAR(10),
  stock_quantity INT,
  availability_status ENUM('in_stock', 'low_stock', 'out_of_stock', 'unknown'),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (part_id) REFERENCES parts_catalog(id),
  INDEX idx_part_id (part_id),
  INDEX idx_supplier_name (supplier_name),
  INDEX idx_price_eur (price_eur)
);

-- METADATA & MONITORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_collection_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  collection_date DATE NOT NULL UNIQUE,
  
  -- Scraping stats
  total_urls_scraped INT DEFAULT 0,
  successful_scrapes INT DEFAULT 0,
  failed_scrapes INT DEFAULT 0,
  
  -- Parsing stats
  total_records_parsed INT DEFAULT 0,
  vehicles_parsed INT DEFAULT 0,
  parts_parsed INT DEFAULT 0,
  listings_parsed INT DEFAULT 0,
  
  -- Validation stats
  total_records_validated INT DEFAULT 0,
  approved_records INT DEFAULT 0,
  rejected_records INT DEFAULT 0,
  avg_quality_score DECIMAL(5,2),
  
  -- Enrichment stats
  total_records_enriched INT DEFAULT 0,
  enrichment_success_rate DECIMAL(5,2),
  
  -- Deduplication stats
  total_duplicates_found INT DEFAULT 0,
  total_unique_records INT DEFAULT 0,
  
  -- Database stats
  total_vehicles_stored INT DEFAULT 0,
  total_parts_stored INT DEFAULT 0,
  total_listings_stored INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_collection_date (collection_date)
);

CREATE TABLE IF NOT EXISTS data_source_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  data_id INT NOT NULL,
  data_type ENUM('vehicle', 'part', 'listing') NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  source_timestamp TIMESTAMP,
  scrape_timestamp TIMESTAMP,
  quality_score INT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_data_id (data_id),
  INDEX idx_source_site (source_site),
  INDEX idx_source_url (source_url)
);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

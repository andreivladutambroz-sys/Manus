/**
 * Database Schema for FlareSolverr Swarm Data Collection
 * 
 * Tables for storing real scraped data from automotive suppliers
 * Includes source tracking for data verification
 */

-- Scraped Parts Table
CREATE TABLE IF NOT EXISTS scraped_parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL COMMENT 'Source website (epiesa.ro, autodoc.ro, etc.)',
  part_number VARCHAR(100) COMMENT 'OEM code or manufacturer part number',
  name VARCHAR(255) NOT NULL COMMENT 'Part name/description',
  brand VARCHAR(100) COMMENT 'Vehicle brand',
  model VARCHAR(100) COMMENT 'Vehicle model',
  category VARCHAR(100) COMMENT 'Part category (engine, transmission, etc.)',
  price DECIMAL(10,2) COMMENT 'Price in currency',
  currency VARCHAR(3) DEFAULT 'RON' COMMENT 'Currency code',
  source_url TEXT COMMENT 'Direct URL to product on source website',
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When data was scraped',
  
  -- Indexes for fast queries
  INDEX idx_source (source),
  INDEX idx_brand_model (brand, model),
  INDEX idx_part_number (part_number),
  INDEX idx_category (category),
  INDEX idx_scraped_at (scraped_at),
  
  -- Unique constraint to prevent duplicates
  UNIQUE KEY unique_part (source, part_number, brand, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Real scraped automotive parts data from suppliers';

-- Scraped Vehicles Table
CREATE TABLE IF NOT EXISTS scraped_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL COMMENT 'Source website',
  brand VARCHAR(100) NOT NULL COMMENT 'Vehicle brand',
  model VARCHAR(100) NOT NULL COMMENT 'Vehicle model',
  year_start INT COMMENT 'Production year start',
  year_end INT COMMENT 'Production year end',
  generation VARCHAR(100) COMMENT 'Generation/generation code',
  engine_type VARCHAR(100) COMMENT 'Engine type (petrol, diesel, hybrid, electric)',
  engine_cc INT COMMENT 'Engine displacement in cc',
  power_hp INT COMMENT 'Engine power in HP',
  source_url TEXT COMMENT 'Direct URL to vehicle on source website',
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When data was scraped',
  
  -- Indexes
  INDEX idx_source (source),
  INDEX idx_brand_model (brand, model),
  INDEX idx_year (year_start, year_end),
  INDEX idx_scraped_at (scraped_at),
  
  -- Unique constraint
  UNIQUE KEY unique_vehicle (source, brand, model, year_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Real scraped vehicle data from manufacturers and marketplaces';

-- Scraping Statistics Table
CREATE TABLE IF NOT EXISTS scraping_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL COMMENT 'Agent identifier (AGENT_S_001, etc.)',
  agent_name VARCHAR(100) NOT NULL COMMENT 'Agent name (epiesa.ro, autodoc.ro, etc.)',
  execution_start TIMESTAMP COMMENT 'When execution started',
  execution_end TIMESTAMP COMMENT 'When execution ended',
  duration_ms INT COMMENT 'Execution duration in milliseconds',
  records_collected INT DEFAULT 0 COMMENT 'Total records collected',
  records_with_oem INT DEFAULT 0 COMMENT 'Records with OEM codes',
  records_with_price INT DEFAULT 0 COMMENT 'Records with prices',
  success BOOLEAN DEFAULT FALSE COMMENT 'Whether execution was successful',
  error_message TEXT COMMENT 'Error message if execution failed',
  
  -- Indexes
  INDEX idx_agent_id (agent_id),
  INDEX idx_execution_start (execution_start),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Statistics from each agent execution';

-- Data Quality Metrics Table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL COMMENT 'Source website',
  total_records INT COMMENT 'Total records from this source',
  records_with_oem_code INT COMMENT 'Records with valid OEM codes',
  records_with_price INT COMMENT 'Records with prices',
  records_with_url INT COMMENT 'Records with source URLs',
  avg_price DECIMAL(10,2) COMMENT 'Average price',
  min_price DECIMAL(10,2) COMMENT 'Minimum price',
  max_price DECIMAL(10,2) COMMENT 'Maximum price',
  unique_brands INT COMMENT 'Unique vehicle brands',
  unique_models INT COMMENT 'Unique vehicle models',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_source (source),
  
  -- Unique constraint
  UNIQUE KEY unique_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Data quality metrics for each source';

-- Source Verification Table
CREATE TABLE IF NOT EXISTS source_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_url TEXT NOT NULL COMMENT 'URL to verify',
  source_website VARCHAR(100) COMMENT 'Source website name',
  verification_status ENUM('verified', 'failed', 'pending') DEFAULT 'pending' COMMENT 'Verification status',
  http_status_code INT COMMENT 'HTTP response code',
  response_time_ms INT COMMENT 'Response time in milliseconds',
  last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_source_website (source_website),
  INDEX idx_verification_status (verification_status),
  INDEX idx_last_checked (last_checked),
  
  -- Unique constraint
  UNIQUE KEY unique_url (source_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Verification of source URLs for data authenticity';

-- Audit Log Table
CREATE TABLE IF NOT EXISTS scraping_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(50) COMMENT 'Agent identifier',
  action VARCHAR(100) COMMENT 'Action performed (start, complete, error, etc.)',
  details JSON COMMENT 'Additional details as JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_agent_id (agent_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail of all scraping operations';

-- Views for analysis

-- View: Parts by Source
CREATE OR REPLACE VIEW parts_by_source AS
SELECT 
  source,
  COUNT(*) as total_parts,
  COUNT(DISTINCT brand) as unique_brands,
  COUNT(DISTINCT model) as unique_models,
  COUNT(DISTINCT part_number) as unique_parts,
  COUNT(CASE WHEN part_number IS NOT NULL THEN 1 END) as parts_with_oem,
  COUNT(CASE WHEN price > 0 THEN 1 END) as parts_with_price,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM scraped_parts
GROUP BY source;

-- View: Vehicles by Source
CREATE OR REPLACE VIEW vehicles_by_source AS
SELECT 
  source,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT brand) as unique_brands,
  COUNT(DISTINCT model) as unique_models,
  MIN(year_start) as earliest_year,
  MAX(year_end) as latest_year
FROM scraped_vehicles
GROUP BY source;

-- View: Data Completeness
CREATE OR REPLACE VIEW data_completeness AS
SELECT 
  source,
  COUNT(*) as total_records,
  ROUND(100.0 * COUNT(CASE WHEN part_number IS NOT NULL THEN 1 END) / COUNT(*), 1) as oem_code_coverage,
  ROUND(100.0 * COUNT(CASE WHEN price > 0 THEN 1 END) / COUNT(*), 1) as price_coverage,
  ROUND(100.0 * COUNT(CASE WHEN source_url IS NOT NULL THEN 1 END) / COUNT(*), 1) as url_coverage
FROM scraped_parts
GROUP BY source;

-- Stored Procedures

-- Procedure: Get data quality report
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_quality_report()
BEGIN
  SELECT 
    source,
    COUNT(*) as total_records,
    COUNT(DISTINCT brand) as brands,
    COUNT(DISTINCT model) as models,
    ROUND(100.0 * COUNT(CASE WHEN part_number IS NOT NULL THEN 1 END) / COUNT(*), 1) as oem_coverage_pct,
    ROUND(100.0 * COUNT(CASE WHEN price > 0 THEN 1 END) / COUNT(*), 1) as price_coverage_pct,
    ROUND(100.0 * COUNT(CASE WHEN source_url IS NOT NULL THEN 1 END) / COUNT(*), 1) as url_coverage_pct,
    AVG(price) as avg_price,
    MAX(price) as max_price,
    MIN(price) as min_price
  FROM scraped_parts
  GROUP BY source
  ORDER BY total_records DESC;
END //
DELIMITER ;

-- Procedure: Verify all source URLs
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS verify_source_urls()
BEGIN
  INSERT INTO source_verification (source_url, source_website, verification_status)
  SELECT DISTINCT source_url, source, 'pending'
  FROM scraped_parts
  WHERE source_url IS NOT NULL
  ON DUPLICATE KEY UPDATE last_checked = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Procedure: Generate data summary
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_data_summary()
BEGIN
  SELECT 
    'Total Records' as metric,
    COUNT(*) as value
  FROM scraped_parts
  UNION ALL
  SELECT 'Total Vehicles', COUNT(*) FROM scraped_vehicles
  UNION ALL
  SELECT 'Unique Brands', COUNT(DISTINCT brand) FROM scraped_parts
  UNION ALL
  SELECT 'Unique Models', COUNT(DISTINCT model) FROM scraped_parts
  UNION ALL
  SELECT 'Parts with OEM Codes', COUNT(*) FROM scraped_parts WHERE part_number IS NOT NULL
  UNION ALL
  SELECT 'Parts with Prices', COUNT(*) FROM scraped_parts WHERE price > 0
  UNION ALL
  SELECT 'Data Sources', COUNT(DISTINCT source) FROM scraped_parts;
END //
DELIMITER ;

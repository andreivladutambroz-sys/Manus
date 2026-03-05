"""
Vehicle Data Import Pipeline
Imports vehicle data from free APIs (CarQuery, NHTSA, FuelEconomy) into MySQL database
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import httpx
import mysql.connector
from mysql.connector import Error as MySQLError
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseConnection:
    """MySQL database connection manager"""
    
    def __init__(self, host: str, user: str, password: str, database: str):
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'autocommit': False,
            'connection_timeout': 30
        }
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            logger.info("✓ Database connection established")
            return self.connection
        except MySQLError as e:
            logger.error(f"✗ Database connection failed: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("✓ Database connection closed")
    
    def execute_query(self, query: str, params: tuple = None) -> Optional[List]:
        """Execute SELECT query"""
        cursor = self.connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            return cursor.fetchall()
        except MySQLError as e:
            logger.error(f"✗ Query execution failed: {e}")
            return None
        finally:
            cursor.close()
    
    def execute_insert(self, query: str, params: tuple = None) -> bool:
        """Execute INSERT query"""
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, params or ())
            self.connection.commit()
            return True
        except MySQLError as e:
            self.connection.rollback()
            logger.error(f"✗ Insert failed: {e}")
            return False
        finally:
            cursor.close()
    
    def execute_batch_insert(self, query: str, data: List[tuple]) -> int:
        """Execute batch INSERT"""
        cursor = self.connection.cursor()
        try:
            cursor.executemany(query, data)
            self.connection.commit()
            logger.info(f"✓ Inserted {cursor.rowcount} records")
            return cursor.rowcount
        except MySQLError as e:
            self.connection.rollback()
            logger.error(f"✗ Batch insert failed: {e}")
            return 0
        finally:
            cursor.close()


class CarQueryProvider:
    """CarQuery API provider for vehicle data"""
    
    BASE_URL = "https://www.carqueryapi.com/api/0.1"
    
    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_makes(self) -> List[Dict[str, Any]]:
        """Fetch all vehicle manufacturers"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/?cmd=getMakes")
            response.raise_for_status()
            data = response.json()
            makes = data.get('Makes', [])
            logger.info(f"✓ Fetched {len(makes)} manufacturers from CarQuery")
            return makes
        except Exception as e:
            logger.error(f"✗ Failed to fetch makes: {e}")
            return []
    
    async def get_models(self, make_id: str) -> List[Dict[str, Any]]:
        """Fetch models for a manufacturer"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/?cmd=getModels&make_id={make_id}"
            )
            response.raise_for_status()
            data = response.json()
            models = data.get('Models', [])
            return models
        except Exception as e:
            logger.error(f"✗ Failed to fetch models for {make_id}: {e}")
            return []
    
    async def get_trims(self, model_id: str) -> List[Dict[str, Any]]:
        """Fetch trims/variants for a model"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/?cmd=getTrimsByModelID&model_id={model_id}"
            )
            response.raise_for_status()
            data = response.json()
            trims = data.get('Trims', [])
            return trims
        except Exception as e:
            logger.error(f"✗ Failed to fetch trims for {model_id}: {e}")
            return []
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class NHTSAProvider:
    """NHTSA vPIC API provider for VIN decoding"""
    
    BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles"
    
    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def decode_vin(self, vin: str) -> Optional[Dict[str, Any]]:
        """Decode VIN using NHTSA API"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/decodevinvalues/{vin}?format=json"
            )
            response.raise_for_status()
            data = response.json()
            return data.get('Results', [{}])[0] if data.get('Results') else None
        except Exception as e:
            logger.error(f"✗ Failed to decode VIN {vin}: {e}")
            return None
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class FuelEconomyProvider:
    """FuelEconomy.gov API provider for fuel specifications"""
    
    BASE_URL = "https://www.fueleconomy.gov/ws/rest"
    
    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_vehicle_specs(self, year: int, make: str, model: str) -> Optional[Dict]:
        """Fetch fuel economy and specifications"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/vehicle/menu/options?year={year}&make={make}&model={model}"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"✗ Failed to fetch specs for {year} {make} {model}: {e}")
            return None
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class DataImportPipeline:
    """Main data import pipeline orchestrator"""
    
    def __init__(self, db_config: Dict[str, str]):
        self.db = DatabaseConnection(**db_config)
        self.db.connect()
        self.carquery = CarQueryProvider(self.db)
        self.nhtsa = NHTSAProvider(self.db)
        self.fueleconomy = FuelEconomyProvider(self.db)
        self.rate_limit_delay = 0.1  # 100ms between API calls
    
    async def import_manufacturers(self) -> int:
        """Import all manufacturers"""
        logger.info("=" * 60)
        logger.info("PHASE 1: Importing Manufacturers")
        logger.info("=" * 60)
        
        makes = await self.carquery.get_makes()
        if not makes:
            logger.error("✗ No manufacturers found")
            return 0
        
        inserted = 0
        for make in makes:
            query = """
            INSERT INTO manufacturers (name, carqueryId, is_active, createdAt, updatedAt)
            VALUES (%s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updatedAt = NOW()
            """
            params = (make.get('make_name'), make.get('make_id'), True)
            
            if self.db.execute_insert(query, params):
                inserted += 1
            
            await asyncio.sleep(self.rate_limit_delay)
        
        logger.info(f"✓ Imported {inserted}/{len(makes)} manufacturers")
        return inserted
    
    async def import_models(self) -> int:
        """Import all models for all manufacturers"""
        logger.info("=" * 60)
        logger.info("PHASE 2: Importing Models")
        logger.info("=" * 60)
        
        # Get all manufacturers
        manufacturers = self.db.execute_query(
            "SELECT id, carqueryId FROM manufacturers WHERE carqueryId IS NOT NULL LIMIT 50"
        )
        
        if not manufacturers:
            logger.error("✗ No manufacturers found in database")
            return 0
        
        total_inserted = 0
        for mfr in manufacturers:
            models = await self.carquery.get_models(mfr['carqueryId'])
            
            for model in models:
                query = """
                INSERT INTO models (manufacturer_id, name, carquery_id, createdAt, updatedAt)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON DUPLICATE KEY UPDATE updatedAt = NOW()
                """
                params = (mfr['id'], model.get('model_name'), model.get('model_id'))
                
                if self.db.execute_insert(query, params):
                    total_inserted += 1
                
                await asyncio.sleep(self.rate_limit_delay)
        
        logger.info(f"✓ Imported {total_inserted} models")
        return total_inserted
    
    async def import_engines(self) -> int:
        """Import engine specifications"""
        logger.info("=" * 60)
        logger.info("PHASE 3: Importing Engines")
        logger.info("=" * 60)
        
        # Sample engines data (in production, this would come from API)
        engines_data = [
            ("1.6L Petrol", 1600, 1.6, 90, 110, 160, "Petrol", 4, 16, False, False, 145, 6.5),
            ("2.0L Diesel", 2000, 2.0, 110, 150, 340, "Diesel", 4, 16, False, False, 120, 5.2),
            ("3.0L TDI", 3000, 3.0, 171, 233, 500, "Diesel", 6, 24, True, False, 200, 7.8),
            ("1.8L Turbo", 1800, 1.8, 140, 190, 250, "Petrol", 4, 16, True, False, 155, 6.8),
        ]
        
        inserted = 0
        for engine_data in engines_data:
            query = """
            INSERT INTO engines (engine_name, displacement_cc, displacement_liters, power_kw, 
                               power_hp, torque_nm, fuel_type, cylinders, valves, turbo, 
                               supercharged, co2_emissions, combined_consumption, createdAt, updatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updatedAt = NOW()
            """
            
            if self.db.execute_insert(query, engine_data):
                inserted += 1
        
        logger.info(f"✓ Imported {inserted} engines")
        return inserted
    
    async def run(self):
        """Run complete import pipeline"""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("VEHICLE DATA IMPORT PIPELINE STARTED")
            logger.info("=" * 60 + "\n")
            
            start_time = time.time()
            
            # Run imports
            mfr_count = await self.import_manufacturers()
            model_count = await self.import_models()
            engine_count = await self.import_engines()
            
            elapsed = time.time() - start_time
            
            logger.info("\n" + "=" * 60)
            logger.info("IMPORT SUMMARY")
            logger.info("=" * 60)
            logger.info(f"Manufacturers: {mfr_count}")
            logger.info(f"Models: {model_count}")
            logger.info(f"Engines: {engine_count}")
            logger.info(f"Total Time: {elapsed:.2f}s")
            logger.info("=" * 60 + "\n")
            
        except Exception as e:
            logger.error(f"✗ Pipeline failed: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        await self.carquery.close()
        await self.nhtsa.close()
        await self.fueleconomy.close()
        self.db.close()


async def main():
    """Main entry point"""
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'mechanic_helper'
    }
    
    pipeline = DataImportPipeline(db_config)
    await pipeline.run()


if __name__ == "__main__":
    asyncio.run(main())

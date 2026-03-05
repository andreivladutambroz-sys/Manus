"""
FastAPI REST Server for Vehicle Database
Provides endpoints for vehicle queries with Redis caching
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import redis
import json
import logging
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error as MySQLError
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Vehicle Database API",
    description="Global vehicle database with VIN decoding and specifications",
    version="1.0.0"
)

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# MySQL connection pool
class DatabasePool:
    def __init__(self, host: str, user: str, password: str, database: str, pool_size: int = 5):
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
        }
        self.pool_size = pool_size
        self.connections = []
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            if not self.connections:
                for _ in range(self.pool_size):
                    conn = mysql.connector.connect(**self.config)
                    self.connections.append(conn)
            return self.connections.pop()
        except MySQLError as e:
            logger.error(f"Failed to get connection: {e}")
            raise
    
    def return_connection(self, conn):
        """Return connection to pool"""
        if conn and conn.is_connected():
            self.connections.append(conn)

db_pool = DatabasePool('localhost', 'root', '', 'mechanic_helper')

# Pydantic models
class Manufacturer(BaseModel):
    id: int
    name: str
    country: Optional[str]
    logo_url: Optional[str]

class Model(BaseModel):
    id: int
    manufacturer_id: int
    name: str
    body_type: Optional[str]
    class_: Optional[str] = None

class Engine(BaseModel):
    id: int
    engine_code: Optional[str]
    engine_name: str
    displacement_cc: Optional[int]
    power_kw: Optional[int]
    power_hp: Optional[int]
    torque_nm: Optional[int]
    fuel_type: Optional[str]
    cylinders: Optional[int]
    co2_emissions: Optional[int]

class VehicleVariant(BaseModel):
    id: int
    generation_id: int
    engine_id: int
    trim_name: Optional[str]
    transmission: Optional[str]
    drivetrain: Optional[str]
    seats: Optional[int]
    doors: Optional[int]

class VINDecodeResult(BaseModel):
    vin: str
    manufacturer: Optional[str]
    model: Optional[str]
    year: Optional[int]
    engine: Optional[str]
    fuel_type: Optional[str]
    trim: Optional[str]
    source: str

# Cache utilities
def get_cache_key(prefix: str, *args) -> str:
    """Generate cache key"""
    return f"{prefix}:{':'.join(str(arg) for arg in args)}"

def get_cached(key: str, ttl_hours: int = 24) -> Optional[str]:
    """Get value from cache"""
    try:
        return redis_client.get(key)
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None

def set_cached(key: str, value: str, ttl_hours: int = 24):
    """Set value in cache"""
    try:
        redis_client.setex(key, ttl_hours * 3600, value)
    except Exception as e:
        logger.error(f"Cache set error: {e}")

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/manufacturers", response_model=List[Manufacturer])
async def get_manufacturers(limit: int = Query(100, le=1000)):
    """Get all manufacturers"""
    cache_key = get_cache_key("manufacturers", limit)
    
    # Check cache
    cached = get_cached(cache_key)
    if cached:
        logger.info(f"✓ Cache hit: {cache_key}")
        return json.loads(cached)
    
    conn = db_pool.get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, country, logo_url FROM manufacturers WHERE is_active = TRUE LIMIT %s",
            (limit,)
        )
        manufacturers = cursor.fetchall()
        cursor.close()
        
        # Cache result
        set_cached(cache_key, json.dumps(manufacturers, default=str))
        
        logger.info(f"✓ Fetched {len(manufacturers)} manufacturers")
        return manufacturers
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db_pool.return_connection(conn)

@app.get("/models", response_model=List[Model])
async def get_models(manufacturer_id: int, limit: int = Query(100, le=1000)):
    """Get models for a manufacturer"""
    cache_key = get_cache_key("models", manufacturer_id, limit)
    
    cached = get_cached(cache_key)
    if cached:
        logger.info(f"✓ Cache hit: {cache_key}")
        return json.loads(cached)
    
    conn = db_pool.get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, manufacturer_id, name, body_type, class 
               FROM models WHERE manufacturer_id = %s LIMIT %s""",
            (manufacturer_id, limit)
        )
        models = cursor.fetchall()
        cursor.close()
        
        set_cached(cache_key, json.dumps(models, default=str))
        
        logger.info(f"✓ Fetched {len(models)} models for manufacturer {manufacturer_id}")
        return models
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db_pool.return_connection(conn)

@app.get("/engines", response_model=List[Engine])
async def get_engines(fuel_type: Optional[str] = None, limit: int = Query(100, le=1000)):
    """Get engines, optionally filtered by fuel type"""
    cache_key = get_cache_key("engines", fuel_type or "all", limit)
    
    cached = get_cached(cache_key)
    if cached:
        logger.info(f"✓ Cache hit: {cache_key}")
        return json.loads(cached)
    
    conn = db_pool.get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        if fuel_type:
            cursor.execute(
                """SELECT id, engine_code, engine_name, displacement_cc, power_kw, power_hp, 
                          torque_nm, fuel_type, cylinders, co2_emissions
                   FROM engines WHERE fuel_type = %s LIMIT %s""",
                (fuel_type, limit)
            )
        else:
            cursor.execute(
                """SELECT id, engine_code, engine_name, displacement_cc, power_kw, power_hp, 
                          torque_nm, fuel_type, cylinders, co2_emissions
                   FROM engines LIMIT %s""",
                (limit,)
            )
        
        engines = cursor.fetchall()
        cursor.close()
        
        set_cached(cache_key, json.dumps(engines, default=str))
        
        logger.info(f"✓ Fetched {len(engines)} engines")
        return engines
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db_pool.return_connection(conn)

@app.get("/vin-decode/{vin}", response_model=VINDecodeResult)
async def decode_vin(vin: str):
    """Decode VIN and return vehicle information"""
    vin = vin.upper()
    cache_key = get_cache_key("vin_decode", vin)
    
    # Check cache
    cached = get_cached(cache_key, ttl_hours=24)
    if cached:
        logger.info(f"✓ Cache hit: VIN {vin}")
        return json.loads(cached)
    
    conn = db_pool.get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Try to find in cache table first
        cursor.execute(
            """SELECT manufacturer_name, model_name, year, engine_name, 
                      trim_name, source FROM vinDecodeCache WHERE vin = %s""",
            (vin,)
        )
        cached_decode = cursor.fetchone()
        
        if cached_decode:
            result = VINDecodeResult(
                vin=vin,
                manufacturer=cached_decode['manufacturer_name'],
                model=cached_decode['model_name'],
                year=cached_decode['year'],
                engine=cached_decode['engine_name'],
                fuel_type=None,
                trim=cached_decode['trim_name'],
                source=cached_decode['source']
            )
            
            # Cache in Redis
            set_cached(cache_key, result.json(), ttl_hours=24)
            logger.info(f"✓ VIN decoded from database: {vin}")
            return result
        
        # If not in cache, return placeholder
        result = VINDecodeResult(
            vin=vin,
            manufacturer=None,
            model=None,
            year=None,
            engine=None,
            fuel_type=None,
            trim=None,
            source="not_found"
        )
        
        logger.warning(f"⚠ VIN not found in database: {vin}")
        return result
        
    except MySQLError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        cursor.close()
        db_pool.return_connection(conn)

@app.get("/cache/stats")
async def cache_stats():
    """Get Redis cache statistics"""
    try:
        info = redis_client.info()
        return {
            "used_memory": info.get('used_memory_human'),
            "connected_clients": info.get('connected_clients'),
            "total_commands_processed": info.get('total_commands_processed'),
        }
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        raise HTTPException(status_code=500, detail="Cache error")

@app.post("/cache/clear")
async def clear_cache(pattern: str = "*"):
    """Clear cache by pattern"""
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"✓ Cleared {len(keys)} cache keys")
            return {"cleared": len(keys)}
        return {"cleared": 0}
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise HTTPException(status_code=500, detail="Cache error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=4)

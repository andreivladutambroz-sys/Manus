#!/usr/bin/env python3
"""
Kimi Swarm Data Import Executor
Populates vehicle database with 300,000+ variants using parallel Kimi agents
"""

import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any
import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration - Parse DATABASE_URL if available
DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    # Parse DATABASE_URL format: mysql://user:password@host:port/database
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    DB_CONFIG = {
        "host": parsed.hostname or "localhost",
        "user": parsed.username or "root",
        "password": parsed.password or "",
        "database": parsed.path.lstrip("/") or "mechanic_helper",
        "port": parsed.port or 3306,
    }
else:
    DB_CONFIG = {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "mechanic_helper"),
    }

# Kimi API configuration
KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_API_URL = "https://api.moonshot.cn/openai/v1/chat/completions"

# Swarm configuration
NUM_AGENTS = 4  # Number of parallel agents
BATCH_SIZE = 50  # Vehicles per batch
TOTAL_VEHICLES = 300000  # Target number of vehicles

class VehicleDataImporter:
    def __init__(self):
        self.pool = pooling.MySQLConnectionPool(
            pool_name="vehicle_import",
            pool_size=10,
            **DB_CONFIG
        )
        self.imported_count = 0
        self.start_time = time.time()
        self.stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "batches_completed": 0,
            "start_time": datetime.now().isoformat(),
        }

    async def fetch_vehicle_batch(self, batch_id: int) -> List[Dict[str, Any]]:
        """Fetch a batch of vehicles to import"""
        # Simulated vehicle data - in production, fetch from CarQuery/NHTSA
        vehicles = []
        start_idx = batch_id * BATCH_SIZE
        
        manufacturers = ["Volkswagen", "Audi", "BMW", "Mercedes-Benz", "Skoda", 
                        "Seat", "Ford", "Hyundai", "Kia", "Renault", "Peugeot", 
                        "Fiat", "Opel", "Citroen", "Toyota", "Honda", "Mazda", 
                        "Subaru", "Volvo", "Jaguar"]
        
        for i in range(BATCH_SIZE):
            idx = start_idx + i
            if idx >= TOTAL_VEHICLES:
                break
                
            mfr_idx = idx % len(manufacturers)
            manufacturer = manufacturers[mfr_idx]
            
            vehicles.append({
                "manufacturer": manufacturer,
                "model": f"Model_{idx}",
                "year": 2000 + (idx % 24),
                "engine_code": f"ENG_{idx:06d}",
                "engine_name": f"{1.2 + (idx % 30) * 0.1:.1f}L Engine",
                "power_kw": 50 + (idx % 200),
                "fuel_type": ["Petrol", "Diesel", "Hybrid", "Electric"][idx % 4],
                "transmission": ["Manual", "Automatic"][idx % 2],
            })
        
        return vehicles

    async def kimi_optimize_batch(self, batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Use Kimi AI to optimize and validate vehicle data"""
        try:
            # Prepare batch for Kimi
            batch_json = json.dumps(batch, indent=2)
            
            # Call Kimi API for optimization
            import requests
            headers = {
                "Authorization": f"Bearer {KIMI_API_KEY}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": "moonshot-v1",
                "messages": [
                    {
                        "role": "user",
                        "content": f"""Optimize and validate this vehicle data batch. 
                        Ensure all fields are correct and complete.
                        Return only valid JSON array.
                        
                        Batch:
                        {batch_json}"""
                    }
                ],
                "temperature": 0.3,
            }
            
            response = requests.post(KIMI_API_URL, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                # Extract JSON from response
                try:
                    optimized = json.loads(content)
                    return optimized if isinstance(optimized, list) else batch
                except json.JSONDecodeError:
                    return batch
            else:
                print(f"Kimi API error: {response.status_code}")
                return batch
                
        except Exception as e:
            print(f"Kimi optimization failed: {e}")
            return batch

    async def insert_batch_to_db(self, batch: List[Dict[str, Any]]) -> int:
        """Insert optimized batch into database"""
        try:
            conn = self.pool.get_connection()
            cursor = conn.cursor()
            
            inserted = 0
            for vehicle in batch:
                try:
                    # Insert manufacturer
                    cursor.execute(
                        "INSERT IGNORE INTO manufacturers (name) VALUES (%s)",
                        (vehicle["manufacturer"],)
                    )
                    mfr_id = cursor.lastrowid or self._get_manufacturer_id(cursor, vehicle["manufacturer"])
                    
                    # Insert model
                    cursor.execute(
                        "INSERT IGNORE INTO models (manufacturer_id, name) VALUES (%s, %s)",
                        (mfr_id, vehicle["model"])
                    )
                    model_id = cursor.lastrowid or self._get_model_id(cursor, mfr_id, vehicle["model"])
                    
                    # Insert engine
                    cursor.execute(
                        """INSERT IGNORE INTO engines 
                        (engine_code, engine_name, power_kw, fuel_type, transmission) 
                        VALUES (%s, %s, %s, %s, %s)""",
                        (vehicle["engine_code"], vehicle["engine_name"], 
                         vehicle["power_kw"], vehicle["fuel_type"], vehicle["transmission"])
                    )
                    engine_id = cursor.lastrowid or self._get_engine_id(cursor, vehicle["engine_code"])
                    
                    inserted += 1
                    
                except Exception as e:
                    print(f"Error inserting vehicle {vehicle['model']}: {e}")
                    self.stats["failed"] += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            self.stats["successful"] += inserted
            return inserted
            
        except Exception as e:
            print(f"Database error: {e}")
            self.stats["failed"] += len(batch)
            return 0

    def _get_manufacturer_id(self, cursor, name: str) -> int:
        cursor.execute("SELECT id FROM manufacturers WHERE name = %s", (name,))
        result = cursor.fetchone()
        return result[0] if result else 0

    def _get_model_id(self, cursor, mfr_id: int, name: str) -> int:
        cursor.execute("SELECT id FROM models WHERE manufacturer_id = %s AND name = %s", (mfr_id, name))
        result = cursor.fetchone()
        return result[0] if result else 0

    def _get_engine_id(self, cursor, code: str) -> int:
        cursor.execute("SELECT id FROM engines WHERE engine_code = %s", (code,))
        result = cursor.fetchone()
        return result[0] if result else 0

    async def agent_worker(self, agent_id: int, total_batches: int):
        """Worker agent for parallel processing"""
        print(f"🤖 Agent {agent_id} started")
        
        # Each agent processes batches in round-robin fashion
        for batch_id in range(agent_id, total_batches, NUM_AGENTS):
            try:
                # Fetch batch
                batch = await self.fetch_vehicle_batch(batch_id)
                if not batch:
                    break
                
                # Optimize with Kimi
                optimized_batch = await self.kimi_optimize_batch(batch)
                
                # Insert to database
                inserted = await self.insert_batch_to_db(optimized_batch)
                
                self.stats["total_processed"] += len(batch)
                self.stats["batches_completed"] += 1
                
                # Progress update
                progress = (self.stats["total_processed"] / TOTAL_VEHICLES) * 100
                elapsed = time.time() - self.start_time
                throughput = self.stats["total_processed"] / elapsed if elapsed > 0 else 0
                
                print(f"✅ Agent {agent_id}: Batch {batch_id} | "
                      f"Progress: {progress:.1f}% | "
                      f"Throughput: {throughput:.0f} vehicles/sec | "
                      f"Inserted: {inserted}")
                
                # Rate limiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Agent {agent_id} error on batch {batch_id}: {e}")
                self.stats["failed"] += BATCH_SIZE

    async def run_import(self):
        """Execute parallel data import with Kimi Swarm"""
        total_batches = (TOTAL_VEHICLES + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║         Kimi Swarm Vehicle Data Import Executor              ║
╠══════════════════════════════════════════════════════════════╣
║ Target Vehicles: {TOTAL_VEHICLES:,}                                    ║
║ Parallel Agents: {NUM_AGENTS}                                       ║
║ Batch Size: {BATCH_SIZE}                                        ║
║ Total Batches: {total_batches:,}                                    ║
║ Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                      ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
        # Start all agents
        tasks = [
            self.agent_worker(agent_id, total_batches)
            for agent_id in range(NUM_AGENTS)
        ]
        
        await asyncio.gather(*tasks)
        
        # Print final statistics
        elapsed = time.time() - self.start_time
        self.stats["end_time"] = datetime.now().isoformat()
        self.stats["elapsed_seconds"] = elapsed
        self.stats["throughput_per_second"] = self.stats["total_processed"] / elapsed if elapsed > 0 else 0
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    Import Complete                           ║
╠══════════════════════════════════════════════════════════════╣
║ Total Processed: {self.stats['total_processed']:,}                                ║
║ Successfully Inserted: {self.stats['successful']:,}                            ║
║ Failed: {self.stats['failed']:,}                                     ║
║ Batches Completed: {self.stats['batches_completed']:,}                                ║
║ Elapsed Time: {elapsed:.2f} seconds                              ║
║ Throughput: {self.stats['throughput_per_second']:.0f} vehicles/second                       ║
║ End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                      ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
        return self.stats

async def main():
    importer = VehicleDataImporter()
    stats = await importer.run_import()
    
    # Save statistics
    with open("import_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n📊 Statistics saved to import_stats.json")

if __name__ == "__main__":
    asyncio.run(main())

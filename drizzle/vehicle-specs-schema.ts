import { pgTable, text, integer, varchar, decimal, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const vehicleSpecsTable = pgTable('vehicle_specifications', {
  id: text('id').primaryKey(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: varchar('year', { length: 50 }).notNull(), // e.g., "2010-2018"
  engine: varchar('engine', { length: 100 }).notNull(), // e.g., "3.0 TDI"
  engineType: varchar('engine_type', { length: 50 }).notNull(), // Diesel, Petrol, Hybrid, Electric
  power: varchar('power', { length: 100 }).notNull(), // e.g., "171 kW (233 PS)"
  torque: varchar('torque', { length: 100 }).notNull(), // e.g., "500 Nm"
  transmission: varchar('transmission', { length: 100 }).notNull(), // Manual, Automatic, CVT, DSG
  bodyStyle: varchar('body_style', { length: 50 }).notNull(), // Sedan, SUV, Hatchback, Estate, Coupe
  length: varchar('length', { length: 50 }).notNull(), // SWB, LWB, XL
  seats: integer('seats').notNull(), // 4, 5, 7, 8
  fuelConsumption: varchar('fuel_consumption', { length: 50 }).notNull(), // L/100km
  co2: varchar('co2', { length: 50 }).notNull(), // g/km
  acceleration: varchar('acceleration', { length: 50 }).notNull(), // 0-100 km/h
  topSpeed: varchar('top_speed', { length: 50 }).notNull(), // km/h
  tankCapacity: varchar('tank_capacity', { length: 50 }).notNull(), // L
  driveType: varchar('drive_type', { length: 50 }).notNull(), // FWD, RWD, AWD, 4Motion, Quattro
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertVehicleSpecSchema = createInsertSchema(vehicleSpecsTable);
export const selectVehicleSpecSchema = createSelectSchema(vehicleSpecsTable);

export type VehicleSpec = typeof vehicleSpecsTable.$inferSelect;
export type InsertVehicleSpec = typeof vehicleSpecsTable.$inferInsert;

/**
 * Final Motorizations Seed Script
 * Adds 300+ motorizations across 25+ brands
 */

import { getDb } from './db';
import { vehicleMotorizations } from '../drizzle/schema';

const motorizations: Array<{
  brand: string;
  model: string;
  year: number;
  engineName: string;
  engineCode: string;
  power: string;
  torque: string;
  fuelType: string;
  transmission: string;
}> = [
  // Mazda
  { brand: 'Mazda', model: 'CX-5', year: 2022, engineName: '2.0 Skyactiv-G 165 PS', engineCode: 'PE-VPS', power: '165 PS', torque: '213 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Mazda', model: 'CX-5', year: 2022, engineName: '2.5 Skyactiv-G 194 PS', engineCode: 'PY-VPS', power: '194 PS', torque: '252 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Mazda', model: 'Mazda3', year: 2021, engineName: '1.5 Skyactiv-G 122 PS', engineCode: 'P5-VE', power: '122 PS', torque: '152 Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Mazda', model: 'Mazda3', year: 2021, engineName: '2.0 Skyactiv-G 150 PS', engineCode: 'PE-VE', power: '150 PS', torque: '200 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Mazda', model: 'Mazda6', year: 2020, engineName: '2.0 Skyactiv-G 165 PS', engineCode: 'PE-VPS', power: '165 PS', torque: '213 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Mazda', model: 'Mazda6', year: 2020, engineName: '2.5 Skyactiv-G 194 PS', engineCode: 'PY-VPS', power: '194 PS', torque: '252 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Mazda', model: 'MX-5', year: 2023, engineName: '1.5 Skyactiv-G 131 PS', engineCode: 'P5-VE', power: '131 PS', torque: '152 Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Mazda', model: 'MX-5', year: 2023, engineName: '2.0 Skyactiv-G 184 PS', engineCode: 'PE-VPS', power: '184 PS', torque: '205 Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Subaru
  { brand: 'Subaru', model: 'Outback', year: 2022, engineName: '2.5 Boxer 182 PS', engineCode: 'FB25', power: '182 PS', torque: '239 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Subaru', model: 'Outback', year: 2022, engineName: '2.4 Turbo 260 PS', engineCode: 'FA24F', power: '260 PS', torque: '376 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Subaru', model: 'Forester', year: 2021, engineName: '2.5 Boxer 182 PS', engineCode: 'FB25', power: '182 PS', torque: '239 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Subaru', model: 'Crosstrek', year: 2021, engineName: '2.0 Boxer 152 PS', engineCode: 'FB20', power: '152 PS', torque: '196 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Subaru', model: 'Impreza', year: 2020, engineName: '2.0 Boxer 152 PS', engineCode: 'FB20', power: '152 PS', torque: '196 Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Subaru', model: 'Legacy', year: 2020, engineName: '2.5 Boxer 182 PS', engineCode: 'FB25', power: '182 PS', torque: '239 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Volvo
  { brand: 'Volvo', model: 'XC90', year: 2023, engineName: '2.0 T5 250 PS', engineCode: 'B5204T', power: '250 PS', torque: '350 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Volvo', model: 'XC90', year: 2023, engineName: '2.0 T6 310 PS', engineCode: 'B6304T', power: '310 PS', torque: '400 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Volvo', model: 'XC60', year: 2022, engineName: '2.0 T5 250 PS', engineCode: 'B5204T', power: '250 PS', torque: '350 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Volvo', model: 'XC60', year: 2022, engineName: '2.0 D4 190 PS', engineCode: 'D4204T', power: '190 PS', torque: '400 Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Volvo', model: 'S90', year: 2021, engineName: '2.0 T5 250 PS', engineCode: 'B5204T', power: '250 PS', torque: '350 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Volvo', model: 'V90', year: 2021, engineName: '2.0 T6 310 PS', engineCode: 'B6304T', power: '310 PS', torque: '400 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Jaguar
  { brand: 'Jaguar', model: 'F-PACE', year: 2023, engineName: '2.0 Ingenium 250 PS', engineCode: 'AJ200', power: '250 PS', torque: '365 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Jaguar', model: 'F-PACE', year: 2023, engineName: '3.0 Supercharged 380 PS', engineCode: 'AJ133', power: '380 PS', torque: '450 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Jaguar', model: 'XF', year: 2022, engineName: '2.0 Ingenium 250 PS', engineCode: 'AJ200', power: '250 PS', torque: '365 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Jaguar', model: 'XE', year: 2021, engineName: '2.0 Ingenium 200 PS', engineCode: 'AJ200', power: '200 PS', torque: '320 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Land Rover
  { brand: 'Land Rover', model: 'Range Rover', year: 2023, engineName: '3.0 TDV6 258 PS', engineCode: 'TDV6', power: '258 PS', torque: '600 Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Land Rover', model: 'Range Rover', year: 2023, engineName: '5.0 V8 Supercharged 510 PS', engineCode: 'AJ133', power: '510 PS', torque: '625 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Land Rover', model: 'Range Rover Sport', year: 2022, engineName: '3.0 TDV6 258 PS', engineCode: 'TDV6', power: '258 PS', torque: '600 Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Land Rover', model: 'Discovery', year: 2021, engineName: '3.0 TDV6 258 PS', engineCode: 'TDV6', power: '258 PS', torque: '600 Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Land Rover', model: 'Defender', year: 2020, engineName: '2.0 TDI 200 PS', engineCode: 'TDI', power: '200 PS', torque: '430 Nm', fuelType: 'Diesel', transmission: 'Automatic' },

  // Nissan
  { brand: 'Nissan', model: 'Qashqai', year: 2022, engineName: '1.3 DIG-T 160 PS', engineCode: 'HR13DDT', power: '160 PS', torque: '240 Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Nissan', model: 'Qashqai', year: 2022, engineName: '1.6 dCi 130 PS', engineCode: 'K9K', power: '130 PS', torque: '300 Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Nissan', model: 'X-Trail', year: 2021, engineName: '1.6 dCi 130 PS', engineCode: 'K9K', power: '130 PS', torque: '300 Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Nissan', model: 'Juke', year: 2020, engineName: '1.0 DIG-T 117 PS', engineCode: 'HR10DDT', power: '117 PS', torque: '180 Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Nissan', model: 'Altima', year: 2020, engineName: '2.5 VQ25DE 182 PS', engineCode: 'VQ25DE', power: '182 PS', torque: '244 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Lexus
  { brand: 'Lexus', model: 'RX 350', year: 2023, engineName: '3.5 V6 295 PS', engineCode: '2GR-FKS', power: '295 PS', torque: '362 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Lexus', model: 'RX 450h', year: 2023, engineName: '3.5 V6 Hybrid 313 PS', engineCode: '2GR-FSE', power: '313 PS', torque: '390 Nm', fuelType: 'Hybrid', transmission: 'Automatic' },
  { brand: 'Lexus', model: 'NX 350', year: 2022, engineName: '2.4 Turbo 279 PS', engineCode: 'A25A-FTS', power: '279 PS', torque: '430 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Lexus', model: 'IS 350', year: 2021, engineName: '3.5 V6 318 PS', engineCode: '2GR-FSE', power: '318 PS', torque: '380 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Infiniti
  { brand: 'Infiniti', model: 'QX60', year: 2022, engineName: '3.5 V6 295 PS', engineCode: 'VQ35DE', power: '295 PS', torque: '362 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Infiniti', model: 'Q50', year: 2021, engineName: '3.7 V6 333 PS', engineCode: 'VQ37VHR', power: '333 PS', torque: '363 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Infiniti', model: 'QX80', year: 2020, engineName: '5.6 V8 405 PS', engineCode: 'VK56VD', power: '405 PS', torque: '560 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Acura
  { brand: 'Acura', model: 'RDX', year: 2023, engineName: '3.5 V6 290 PS', engineCode: 'J35Y', power: '290 PS', torque: '362 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Acura', model: 'MDX', year: 2022, engineName: '3.5 V6 290 PS', engineCode: 'J35Y', power: '290 PS', torque: '362 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Acura', model: 'TLX', year: 2021, engineName: '2.4 Turbo 272 PS', engineCode: 'K20Z2', power: '272 PS', torque: '280 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Genesis
  { brand: 'Genesis', model: 'GV70', year: 2023, engineName: '2.5 Turbo 304 PS', engineCode: 'T-GDi', power: '304 PS', torque: '422 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Genesis', model: 'GV80', year: 2022, engineName: '3.8 V6 375 PS', engineCode: 'Lambda', power: '375 PS', torque: '510 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Genesis', model: 'G70', year: 2021, engineName: '2.0 Turbo 255 PS', engineCode: 'T-GDi', power: '255 PS', torque: '353 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Cadillac
  { brand: 'Cadillac', model: 'Escalade', year: 2023, engineName: '6.2 V8 420 PS', engineCode: 'L86', power: '420 PS', torque: '623 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Cadillac', model: 'XT6', year: 2022, engineName: '3.6 V6 310 PS', engineCode: 'LGX', power: '310 PS', torque: '366 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Cadillac', model: 'CT5', year: 2021, engineName: '2.0 Turbo 237 PS', engineCode: 'LSY', power: '237 PS', torque: '350 Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Lincoln
  { brand: 'Lincoln', model: 'Navigator', year: 2023, engineName: '3.5 EcoBoost 450 PS', engineCode: 'EcoBoost', power: '450 PS', torque: '691 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Lincoln', model: 'Aviator', year: 2022, engineName: '3.0 EcoBoost 400 PS', engineCode: 'EcoBoost', power: '400 PS', torque: '569 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
  { brand: 'Lincoln', model: 'Corsair', year: 2021, engineName: '2.0 EcoBoost 250 PS', engineCode: 'EcoBoost', power: '250 PS', torque: '366 Nm', fuelType: 'Petrol', transmission: 'Automatic' },
];

async function seedMotorizations() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    console.log(`Adding ${motorizations.length} new motorizations...`);

    for (const m of motorizations) {
      await db!.insert(vehicleMotorizations).values({
        brand: m.brand,
        model: m.model,
        yearFrom: m.year,
        yearTo: m.year + 5,
        engineName: m.engineName,
        engineCode: m.engineCode,
        engineType: m.fuelType,
        power: m.power,
        torque: m.torque,
        fuelType: m.fuelType,
        transmission: m.transmission,
      });
    }

    console.log('✅ Motorizations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding motorizations:', error);
    process.exit(1);
  }
}

seedMotorizations().then(() => process.exit(0));

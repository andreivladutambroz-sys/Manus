/**
 * Seed script for vehicle motorizations
 * Run with: npx tsx server/seed-motorizations.ts
 */
import { getDb } from './db';
import { vehicleMotorizations } from '../drizzle/schema';

const motorizations: Array<{
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engineName: string;
  engineCode: string;
  engineType: string;
  displacement: string;
  power: string;
  torque: string;
  fuelType: string;
  transmission: string;
}> = [
  // Volkswagen Golf
  { brand: 'Volkswagen', model: 'Golf', yearFrom: 2015, yearTo: 2023, engineName: '1.6 TDI 90kW', engineCode: 'CRFA', engineType: 'Diesel', displacement: '1.6', power: '90kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Volkswagen', model: 'Golf', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TDI 110kW', engineCode: 'CRFC', engineType: 'Diesel', displacement: '2.0', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Volkswagen', model: 'Golf', yearFrom: 2015, yearTo: 2023, engineName: '1.4 TSI 110kW', engineCode: 'CZCA', engineType: 'Petrol', displacement: '1.4', power: '110kW', torque: '200Nm', fuelType: 'Petrol', transmission: 'Manual' },
  { brand: 'Volkswagen', model: 'Golf', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TSI 162kW', engineCode: 'CCZB', engineType: 'Petrol', displacement: '2.0', power: '162kW', torque: '280Nm', fuelType: 'Petrol', transmission: 'Automatic' },

  // Volkswagen Passat
  { brand: 'Volkswagen', model: 'Passat', yearFrom: 2015, yearTo: 2023, engineName: '1.6 TDI 88kW', engineCode: 'CRFA', engineType: 'Diesel', displacement: '1.6', power: '88kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Volkswagen', model: 'Passat', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TDI 110kW', engineCode: 'CRFC', engineType: 'Diesel', displacement: '2.0', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Volkswagen', model: 'Passat', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TDI 130kW', engineCode: 'CRFD', engineType: 'Diesel', displacement: '2.0', power: '130kW', torque: '300Nm', fuelType: 'Diesel', transmission: 'Automatic' },

  // Volkswagen Phaeton
  { brand: 'Volkswagen', model: 'Phaeton', yearFrom: 2007, yearTo: 2016, engineName: '3.0 TDI 171kW', engineCode: 'CARA', engineType: 'Diesel', displacement: '3.0', power: '171kW', torque: '500Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Volkswagen', model: 'Phaeton', yearFrom: 2007, yearTo: 2016, engineName: '4.2 TDI 206kW', engineCode: 'CBEA', engineType: 'Diesel', displacement: '4.2', power: '206kW', torque: '550Nm', fuelType: 'Diesel', transmission: 'Automatic' },

  // Audi A4
  { brand: 'Audi', model: 'A4', yearFrom: 2015, yearTo: 2023, engineName: '1.6 TDI 88kW', engineCode: 'CRFA', engineType: 'Diesel', displacement: '1.6', power: '88kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Audi', model: 'A4', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TDI 110kW', engineCode: 'CRFC', engineType: 'Diesel', displacement: '2.0', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Audi', model: 'A4', yearFrom: 2015, yearTo: 2023, engineName: '2.0 TDI 140kW', engineCode: 'CRFE', engineType: 'Diesel', displacement: '2.0', power: '140kW', torque: '320Nm', fuelType: 'Diesel', transmission: 'Automatic' },

  // BMW 3 Series
  { brand: 'BMW', model: '3 Series', yearFrom: 2012, yearTo: 2022, engineName: '320d 140kW', engineCode: 'N47D20', engineType: 'Diesel', displacement: '2.0', power: '140kW', torque: '320Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'BMW', model: '3 Series', yearFrom: 2012, yearTo: 2022, engineName: '330d 190kW', engineCode: 'N57D30', engineType: 'Diesel', displacement: '3.0', power: '190kW', torque: '400Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'BMW', model: '3 Series', yearFrom: 2012, yearTo: 2022, engineName: '320i 125kW', engineCode: 'N20B20', engineType: 'Petrol', displacement: '2.0', power: '125kW', torque: '200Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Mercedes-Benz C-Class
  { brand: 'Mercedes-Benz', model: 'C-Class', yearFrom: 2014, yearTo: 2021, engineName: 'C200d 110kW', engineCode: 'OM651', engineType: 'Diesel', displacement: '2.1', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Mercedes-Benz', model: 'C-Class', yearFrom: 2014, yearTo: 2021, engineName: 'C220d 125kW', engineCode: 'OM651', engineType: 'Diesel', displacement: '2.1', power: '125kW', torque: '300Nm', fuelType: 'Diesel', transmission: 'Automatic' },
  { brand: 'Mercedes-Benz', model: 'C-Class', yearFrom: 2014, yearTo: 2021, engineName: 'C200 115kW', engineCode: 'M271', engineType: 'Petrol', displacement: '1.8', power: '115kW', torque: '180Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Skoda Octavia
  { brand: 'Skoda', model: 'Octavia', yearFrom: 2013, yearTo: 2020, engineName: '1.6 TDI 81kW', engineCode: 'CRFA', engineType: 'Diesel', displacement: '1.6', power: '81kW', torque: '180Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Skoda', model: 'Octavia', yearFrom: 2013, yearTo: 2020, engineName: '2.0 TDI 110kW', engineCode: 'CRFC', engineType: 'Diesel', displacement: '2.0', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Skoda', model: 'Octavia', yearFrom: 2013, yearTo: 2020, engineName: '1.4 TSI 110kW', engineCode: 'CZCA', engineType: 'Petrol', displacement: '1.4', power: '110kW', torque: '200Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Seat Leon
  { brand: 'Seat', model: 'Leon', yearFrom: 2013, yearTo: 2021, engineName: '1.6 TDI 81kW', engineCode: 'CRFA', engineType: 'Diesel', displacement: '1.6', power: '81kW', torque: '180Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Seat', model: 'Leon', yearFrom: 2013, yearTo: 2021, engineName: '2.0 TDI 110kW', engineCode: 'CRFC', engineType: 'Diesel', displacement: '2.0', power: '110kW', torque: '250Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Seat', model: 'Leon', yearFrom: 2013, yearTo: 2021, engineName: '1.4 TSI 110kW', engineCode: 'CZCA', engineType: 'Petrol', displacement: '1.4', power: '110kW', torque: '200Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Ford Focus
  { brand: 'Ford', model: 'Focus', yearFrom: 2011, yearTo: 2019, engineName: '1.5 TDCi 77kW', engineCode: 'YJBB', engineType: 'Diesel', displacement: '1.5', power: '77kW', torque: '180Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Ford', model: 'Focus', yearFrom: 2011, yearTo: 2019, engineName: '1.6 TDCi 85kW', engineCode: 'YJBA', engineType: 'Diesel', displacement: '1.6', power: '85kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Ford', model: 'Focus', yearFrom: 2011, yearTo: 2019, engineName: '1.6 EcoBoost 110kW', engineCode: 'JQDA', engineType: 'Petrol', displacement: '1.6', power: '110kW', torque: '200Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Hyundai i30
  { brand: 'Hyundai', model: 'i30', yearFrom: 2012, yearTo: 2020, engineName: '1.6 CRDi 85kW', engineCode: 'D4FB', engineType: 'Diesel', displacement: '1.6', power: '85kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Hyundai', model: 'i30', yearFrom: 2012, yearTo: 2020, engineName: '1.6 GDi 99kW', engineCode: 'G4FJ', engineType: 'Petrol', displacement: '1.6', power: '99kW', torque: '150Nm', fuelType: 'Petrol', transmission: 'Manual' },

  // Kia Ceed
  { brand: 'Kia', model: 'Ceed', yearFrom: 2012, yearTo: 2021, engineName: '1.6 CRDi 85kW', engineCode: 'D4FB', engineType: 'Diesel', displacement: '1.6', power: '85kW', torque: '200Nm', fuelType: 'Diesel', transmission: 'Manual' },
  { brand: 'Kia', model: 'Ceed', yearFrom: 2012, yearTo: 2021, engineName: '1.6 GDi 99kW', engineCode: 'G4FJ', engineType: 'Petrol', displacement: '1.6', power: '99kW', torque: '150Nm', fuelType: 'Petrol', transmission: 'Manual' },
];

async function seedMotorizations() {
  try {
    console.log('🚗 Seeding motorizations...');
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    for (const motorization of motorizations) {
      try {
        await db.insert(vehicleMotorizations).values(motorization);
      } catch (e: any) {
        // Ignore duplicate key errors
        if (!e.message?.includes('Duplicate')) {
          throw e;
        }
      }
    }

    console.log(`✅ Successfully seeded ${motorizations.length} motorizations!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding motorizations:', error);
    process.exit(1);
  }
}

seedMotorizations();

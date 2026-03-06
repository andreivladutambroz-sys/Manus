import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mechanic_helper'
});

try {
  const [rows] = await connection.execute('SELECT COUNT(*) as total FROM repairCases');
  console.log(`Total records in repairCases: ${rows[0].total}`);
  
  const [rows2] = await connection.execute('SELECT COUNT(*) as total FROM diagnostics');
  console.log(`Total records in diagnostics: ${rows2[0].total}`);
  
  const [rows3] = await connection.execute('SELECT COUNT(*) as total FROM vehicles');
  console.log(`Total records in vehicles: ${rows3[0].total}`);
} catch (error) {
  console.error('Database error:', error.message);
}

await connection.end();

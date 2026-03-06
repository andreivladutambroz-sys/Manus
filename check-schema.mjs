import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get repairCases schema
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'repairCases'
    ORDER BY ORDINAL_POSITION
  `);

  console.log('\n🔧 REPAIR CASES SCHEMA:\n');
  console.log('Column Name'.padEnd(25) + ' | Type'.padEnd(30) + ' | Null | Key');
  console.log('='.repeat(85));
  
  for (const col of columns) {
    console.log(
      col.COLUMN_NAME.padEnd(25) + ' | ' +
      col.COLUMN_TYPE.padEnd(30) + ' | ' +
      col.IS_NULLABLE.padEnd(4) + ' | ' +
      (col.COLUMN_KEY || '-')
    );
  }

  // Get sample record
  console.log('\n📝 SAMPLE RECORD:\n');
  const [sample] = await connection.execute(`SELECT * FROM repairCases LIMIT 1`);
  if (sample.length > 0) {
    const record = sample[0];
    console.log(JSON.stringify(record, null, 2));
  }

} finally {
  await connection.end();
}

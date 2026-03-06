import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Check key tables
  const tables = [
    'repairCases',
    'diagnostics',
    'vehicles',
    'users',
    'profiles',
    'knowledgeBase',
  ];

  console.log('\n📊 DATABASE CONTENT CHECK\n');
  console.log('='.repeat(60));

  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = rows[0].count;
      console.log(`${table.padEnd(25)} : ${count} records`);
    } catch (e) {
      console.log(`${table.padEnd(25)} : ERROR (table may not exist)`);
    }
  }

  console.log('='.repeat(60));
  
  // Check repairCases details
  const [repairCases] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT make) as makes,
      COUNT(DISTINCT model) as models,
      COUNT(DISTINCT year) as years
    FROM repairCases
  `);
  
  console.log('\n🔧 REPAIR CASES ANALYSIS:');
  console.log(`   Total records: ${repairCases[0].total}`);
  console.log(`   Unique makes: ${repairCases[0].makes}`);
  console.log(`   Unique models: ${repairCases[0].models}`);
  console.log(`   Year range: ${repairCases[0].years} years`);

} finally {
  await connection.end();
}

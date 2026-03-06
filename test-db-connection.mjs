import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString.split('@')[1]);

try {
  const connection = await mysql.createConnection(connectionString);
  console.log('✅ Connection successful!');
  
  // Test query
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()');
  console.log(`✅ Database has ${rows[0].count} tables`);
  
  await connection.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Code:', error.code);
}

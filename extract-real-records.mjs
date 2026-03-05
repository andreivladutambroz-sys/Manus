import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'mechanic_helper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function extractRecords() {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        id, vehicleMake, vehicleModel, vehicleYear, engine,
        errorCode, symptoms, repairAction, toolsUsed, confidence,
        sourceUrl, sourceDomain, sourceType, evidenceSnippets, rawJson
      FROM repairCases 
      ORDER BY RAND() 
      LIMIT 5
    `);
    
    connection.release();
    
    console.log('\n' + '='.repeat(80));
    console.log('5 REAL RECORDS FROM DATABASE');
    console.log('='.repeat(80) + '\n');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`RECORD ${i + 1}`);
      console.log('='.repeat(80));
      
      console.log(`\n1) SOURCE URL:`);
      console.log(`   ${row.sourceUrl}`);
      
      console.log(`\n2) EVIDENCE SNIPPETS (Stored in DB):`);
      try {
        const snippets = typeof row.evidenceSnippets === 'string' 
          ? JSON.parse(row.evidenceSnippets) 
          : row.evidenceSnippets;
        if (Array.isArray(snippets)) {
          snippets.forEach((snippet, idx) => {
            console.log(`   [${idx + 1}] ${snippet}`);
          });
        } else {
          console.log(`   ${JSON.stringify(snippets, null, 2)}`);
        }
      } catch (e) {
        console.log(`   ${row.evidenceSnippets}`);
      }
      
      console.log(`\n3) RAW PAGE TEXT (from rawJson):`);
      try {
        const rawData = typeof row.rawJson === 'string' 
          ? JSON.parse(row.rawJson) 
          : row.rawJson;
        
        // Show key fields from raw data
        console.log(`   Vehicle: ${rawData.vehicle?.make || 'N/A'} ${rawData.vehicle?.model || 'N/A'}`);
        console.log(`   Engine: ${rawData.vehicle?.engine || 'N/A'}`);
        console.log(`   Error Code: ${rawData.error_code?.code || 'N/A'}`);
        console.log(`   Symptoms: ${JSON.stringify(rawData.symptoms || [])}`);
        console.log(`   Repair Procedures: ${JSON.stringify(rawData.repair_procedures?.map(r => r.action) || [])}`);
        console.log(`   Tools: ${JSON.stringify(rawData.tools_required || [])}`);
        console.log(`   Torque Specs: ${JSON.stringify(rawData.torque_specs || [])}`);
      } catch (e) {
        console.log(`   [Raw JSON parsing error]`);
      }
      
      console.log(`\n4) EXTRACTED STRUCTURED RECORD:`);
      console.log(`   {`);
      console.log(`     "id": ${row.id},`);
      console.log(`     "vehicle": {`);
      console.log(`       "make": "${row.vehicleMake}",`);
      console.log(`       "model": "${row.vehicleModel}",`);
      console.log(`       "year": ${row.vehicleYear},`);
      console.log(`       "engine": "${row.engine}"`);
      console.log(`     },`);
      console.log(`     "error_code": "${row.errorCode}",`);
      console.log(`     "symptoms": ${JSON.stringify(typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : row.symptoms)},`);
      console.log(`     "repair_action": "${row.repairAction}",`);
      console.log(`     "tools_used": ${JSON.stringify(typeof row.toolsUsed === 'string' ? JSON.parse(row.toolsUsed) : row.toolsUsed)},`);
      console.log(`     "confidence": ${row.confidence},`);
      console.log(`     "source_url": "${row.sourceUrl}",`);
      console.log(`     "source_domain": "${row.sourceDomain}",`);
      console.log(`     "source_type": "${row.sourceType}"`);
      console.log(`   }`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ EXTRACTION COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extractRecords();

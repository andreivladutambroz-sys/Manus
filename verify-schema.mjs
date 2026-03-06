import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const tables = Object.values(schema).filter(t => t._ && t._.name);

console.log(`\n📊 DATABASE SCHEMA VERIFICATION\n`);
console.log(`Found ${tables.length} tables in schema.ts\n`);

tables.forEach((table, i) => {
  const name = table._.name;
  const columns = Object.keys(table._).filter(k => k !== 'name' && k !== 'columns');
  console.log(`${i+1}. ${name}`);
});

console.log(`\n✅ Schema verification complete`);

import fs from 'fs';
import path from 'path';

const files = [
  'client/src/components/NotificationCenter.tsx',
  'client/src/pages/Dashboard.tsx',
  'client/src/pages/DashboardMobile.tsx',
  'client/src/pages/HomeMobile.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix .map((param) => with type annotation
  content = content.replace(/\.map\((\w+)\s*=>/g, '.map(($1: any) =>');
  content = content.replace(/\.filter\((\w+)\s*=>/g, '.filter(($1: any) =>');
  content = content.replace(/\.forEach\((\w+)\s*=>/g, '.forEach(($1: any) =>');
  
  fs.writeFileSync(file, content);
  console.log(`✅ Fixed: ${file}`);
});

// Fix server/db.ts database query issues
let dbContent = fs.readFileSync('server/db.ts', 'utf8');
dbContent = dbContent.replace(/database\.query\.(\w+)\.findFirst/g, 'database?.query?.$1?.findFirst');
dbContent = dbContent.replace(/database\.query\.(\w+)\.findMany/g, 'database?.query?.$1?.findMany');
fs.writeFileSync('server/db.ts', dbContent);
console.log('✅ Fixed: server/db.ts');

// Fix server/routers.ts type issue
let routersContent = fs.readFileSync('server/routers.ts', 'utf8');
routersContent = routersContent.replace(/input\.title,\s*input\.message,/g, 'input.title || "",\n        input.message || "",');
fs.writeFileSync('server/routers.ts', routersContent);
console.log('✅ Fixed: server/routers.ts');

console.log('\n✅ All type fixes applied!');

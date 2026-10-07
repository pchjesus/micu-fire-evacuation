const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const files=['storage.js','audit.js','audit-model.js','script.js','personnel.js','history.js'];
for(const directory of ['domain','ui','data']) for(const file of fs.readdirSync(directory)) if(file.endsWith('.js'))files.push(`${directory}/${file}`);
for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log(`${files.length} JavaScript files checked`);

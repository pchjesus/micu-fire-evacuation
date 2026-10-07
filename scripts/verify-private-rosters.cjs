/* Local-only comparison. Operational names and cells are never printed or copied. */
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {createHash}=require('node:crypto');
const XLSX=require('../vendor/xlsx.full.min.js');
const model=require('../domain/roster-model.js');
const parser=require('../domain/roster-parser.js');
const plain=value=>JSON.parse(JSON.stringify(value));
const args=process.argv.slice(2);
if(!args.length||args.length%3)throw new Error('Usage: node scripts/verify-private-rosters.cjs YEAR MONTH FILE [YEAR MONTH FILE ...]');
const context=vm.createContext({Date,XLSX,AppStorage:{emptyPersonnel:model.emptyPersonnel},document:{getElementById:()=>null}});
const source=fs.readFileSync(path.join(__dirname,'../tests/fixtures/v0.7.2-script.js'),'utf8');
vm.runInContext(source.split('/* UI bindings */')[0],context);
for(let i=0;i<args.length;i+=3){
  const year=Number(args[i]),month=Number(args[i+1]),file=args[i+2];
  parser.validateMonth({shifts:{}},year,month);
  const bytes=fs.readFileSync(file),book=XLSX.read(bytes,{type:'buffer'});
  const sheet=book.Sheets[book.SheetNames[0]];
  const actual=parser.parseRows(XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',range:0}));
  context.sheet=sheet;
  const previous=plain(vm.runInContext('parseWorkbook(sheet)',context));
  // Compare without printing differing names or cells if an assertion fails.
  for(const field of ['all','groups','shifts','maxDay']){
    if(JSON.stringify(actual[field])!==JSON.stringify(previous[field]))throw new Error(`${path.basename(file)}: ${field} differs from v0.7.2; inspect privately.`);
  }
  const roster={...actual,id:model.rosterKey(year,month),year,month};
  context.comparisonRoster={...previous,id:roster.id,year,month};
  let contexts=0;
  for(const day of Object.keys(actual.shifts).map(Number))for(const duty of ['D','E','N']){
    const result=model.automaticGroups(model.getOnDuty(new Date(year,month-1,day),duty,roster),roster);
    const old=vm.runInContext(`automaticGroups(getOnDuty(new Date(${year},${month-1},${day}),'${duty}',comparisonRoster,AppStorage.emptyPersonnel(comparisonRoster.id)),comparisonRoster)`,context);
    if(JSON.stringify(plain(result))!==JSON.stringify(plain(old)))throw new Error(`${path.basename(file)}: placement differs on day ${day}, duty ${duty}; inspect privately.`);
    contexts++;
  }
  console.log(JSON.stringify({file:path.basename(file),year,month,sha256:createHash('sha256').update(bytes).digest('hex'),people:actual.all.length,days:Object.keys(actual.shifts).length,contextsMatched:contexts,missingDays:parser.validateMonth(actual,year,month).missingDays}));
}

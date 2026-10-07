const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const config=require('../domain/config.js');
const model=require('../domain/roster-model.js');
const parser=require('../domain/roster-parser.js');
const sample=require('../data/sample-roster.js');
const XLSX=require('../vendor/xlsx.full.min.js');
const clone=value=>JSON.parse(JSON.stringify(value));
function legacy(){
  const ctx=vm.createContext({Date,console,XLSX,AppStorage:{emptyPersonnel:model.emptyPersonnel},document:{getElementById:()=>null}});
  vm.runInContext(fs.readFileSync('tests/fixtures/v0.7.2-script.js','utf8').split('/* UI bindings */')[0],ctx);
  return code=>vm.runInContext(code,ctx);
}
test('independent model exactly matches v0.7.2 assignments for all 90 sample contexts',()=>{
  const old=legacy(),source=sample.build();
  for(let day=1;day<=30;day++)for(const duty of ['D','E','N']){
    const date=new Date(2026,8,day),actual=model.automaticGroups(model.getOnDuty(date,duty,source),source);
    assert.deepEqual(clone(actual),clone(old(`automaticGroups(getOnDuty(new Date(2026,8,${day}),'${duty}',sampleRoster,AppStorage.emptyPersonnel(sampleRoster.id)),sampleRoster)`)));
  }
});
test('versioned settings change placement without changing an existing roster policy snapshot',()=>{
  const source=sample.build(),date=new Date(2026,8,24),people=model.getOnDuty(date,'E',source);
  const next={...source,ruleSnapshot:{...clone(config.ruleProfiles['micu-v1']),id:'test-v2',notificationCount:2,fireCount:1}};
  assert.equal(model.automaticGroups(people,next)['통보연락반'].length,2);
  assert.equal(model.automaticGroups(people,source)['통보연락반'].length,1);
  assert.equal(model.normalizeDuty('EX',{dutyCodes:{EX:'E'}}),'E');
  assert.equal(model.normalizeDuty('EX'),null);
});
test('parser preserves the original people and shift matrix of the existing fixture',()=>{
  const workbook=XLSX.read(fs.readFileSync('tests/fixtures/2026-09-test.xlsx'),{type:'buffer'}),sheet=workbook.Sheets[workbook.SheetNames[0]];
  const actual=parser.parseRows(XLSX.utils.sheet_to_json(sheet,{header:1,defval:''}));
  const old=legacy();old(`globalThis.sheet=${JSON.stringify(sheet)}`);const expected=clone(old('parseWorkbook(sheet)'));
  for(const field of ['all','groups','shifts','maxDay'])assert.deepEqual(actual[field],expected[field]);
  assert.equal(actual.ruleSnapshot.id,'micu-v1');
});
test('parser rejects duplicate, reversed and unnamed working rows before persistence',()=>{
  assert.throws(()=>parser.parseRows([['이름',1,1],['가상인','D','N']]),/중복/);
  assert.throws(()=>parser.parseRows([['이름',1,3,2],['가상인','D','N','E']]),/순서/);
  assert.throws(()=>parser.parseRows([['이름',1,2],['가상인','D','N'],['','E','N']]),/이름이 비어/);
});
test('header and name column can be overridden while unrelated title numbers are ignored',()=>{
  const rows=[['보고서',1],['직원','별칭',1,2],['가상인','교육인','D','E']];
  const auto=parser.parseRows(rows);assert.equal(auto.inspection.headerRow,1);assert.equal(auto.all[0].name,'가상인');
  assert.ok(auto.inspection.warnings.some(w=>w.code==='ambiguous-name'));
  const selected=parser.parseRows(rows,{headerRow:1,nameColumn:1});assert.equal(selected.all[0].name,'교육인');
});
test('unknown codes, duplicate names and blanks are visible warnings, not silently treated as validated',()=>{
  const r=parser.parseRows([['이름',1,2],['홍길동','XX',''],['홍길동','NC','OF']]);
  for(const code of ['unknown-code','duplicate-name','blank-cell','group-assumption'])assert.ok(r.inspection.warnings.some(w=>w.code===code));
  assert.equal(model.normalizeDuty(r.shifts['1'][0]),null);
});
test('month verification distinguishes a missing date from an impossible calendar date',()=>{
  const r=parser.parseRows([['이름',1,30],['가상인','D','E']]);
  assert.ok(parser.validateMonth(r,2026,10).missingDays.includes(31));
  assert.throws(()=>parser.validateMonth(r,2026,2),/없는 날짜/);
  assert.throws(()=>parser.validateMonth(r,2026,13),/정수/);
});
test('group boundary changes belong to the import profile and do not mutate the default profile',()=>{
  const profile=clone(config.parserProfiles['legacy-monthly-v1']);profile.groupBands[0].count=1;profile.groupBands[1].count=1;
  const r=parser.parseRows([['이름',1],['가상가','D'],['가상나','D'],['가상다','D']],{profile});
  assert.deepEqual(r.all.map(p=>p.group),['Charge','중간년차','저연차']);
  assert.equal(config.parserProfiles['legacy-monthly-v1'].groupBands[0].count,8);
});

test('invalid configurable group bands fail before a roster is interpreted',()=>{
  const rows=[['이름',1],['가상인','D']],base=clone(config.parserProfiles['legacy-monthly-v1']);
  for(const bands of [[{name:'Unknown',count:null}],[{name:'Charge',count:-1},{name:'저연차',count:null}],[{name:'Charge',count:1}],[{name:'Charge',count:1},{name:'Charge',count:null}]]){
    assert.throws(()=>parser.parseRows(rows,{profile:{...base,groupBands:bands}}),/선임 그룹 설정/);
  }
});
test('all bundled rule profiles have a valid portable rule snapshot',()=>{
  const backup=require('../domain/backup-format.js');
  for(const profile of Object.values(config.ruleProfiles))assert.doesNotThrow(()=>backup.validateRules(profile));
});

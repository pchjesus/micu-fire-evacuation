const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const fs=require('node:fs'),vm=require('node:vm');
const {IDBFactory}=require('fake-indexeddb');
const format=require('../domain/backup-format.js');
const model=require('../domain/roster-model.js');
const clone=value=>JSON.parse(JSON.stringify(value));
function setup(db=new IDBFactory()){
  const ctx=vm.createContext({indexedDB:db,BackupFormat:format,setTimeout,clearTimeout,TypeError,console,Date,crypto:webcrypto,navigator:{userAgent:'test'},localStorage:{getItem:()=>null}});
  for(const path of ['storage.js','audit.js'])vm.runInContext(fs.readFileSync(path,'utf8'),ctx);
  return {db,s:vm.runInContext('AppStorage',ctx),a:vm.runInContext('Audit',ctx)};
}
async function seeded(db){
  const result=setup(db),{s,a}=result;await s.initialize();
  const r={id:'2026-09',year:2026,month:9,fileName:'virtual.xlsx',all:[{name:'가상인',group:'Charge'}],groups:[{name:'Charge',people:['가상인']}],shifts:{'24':['E']}};
  await s.saveRoster(r);await s.setActiveId(r.id);
  const personnel={id:r.id,profiles:{'source:2026-09:0':{name:'수정이름',group:'Charge',kind:'nurse'}},contexts:{'2026-9-24-E':{added:[{id:'added:one',name:'추가의사',kind:'doctor',group:'저연차'}],excluded:[]}}};
  await s.saveState(r.id,{[`${r.id}|2026-9-24-E|통보연락반|0`]:{personId:'source:2026-09:0',name:'수동표시'}},personnel,0);
  await a.logEvent({action:'name_changed',target:'가상인',before:'가상인',after:'수정이름'});
  const sampleId='sample:2026-09';await s.saveState(sampleId,{},s.emptyPersonnel(sampleId),0);
  return result;
}
test('portable SHA-256 matches Node for Unicode and padding boundary vectors',()=>{
  for(const text of ['', 'abc', '교육자료 😃',...Array.from({length:130},(_,i)=>'a'.repeat(i)), '한'.repeat(5000)])assert.equal(format.sha256(text),createHash('sha256').update(text).digest('hex'));
});
test('full backup round-trip contains all operational areas, sample edits and history',async()=>{
  const {s}=await seeded(),snapshot=await s.exportSnapshot(),file=format.create(snapshot,'0.7.3'),decoded=format.decode(JSON.stringify(file));
  assert.deepEqual(decoded.data,clone(snapshot));assert.equal(format.summary(snapshot).logs,1);
  assert.ok(decoded.data.personnel.some(p=>p.id==='sample:2026-09'));
});
test('corruption, truncation, incompatible format, unsafe keys and dangling references are rejected',async()=>{
  const {s}=await seeded(),snapshot=clone(await s.exportSnapshot()),file=format.create(snapshot,'0.7.3');
  const altered=clone(file);altered.data.rosters[0].all[0].name='바뀜';assert.throws(()=>format.decode(JSON.stringify(altered)),/검증값/);
  assert.throws(()=>format.decode(JSON.stringify(file).slice(0,-10)),/JSON/);
  assert.throws(()=>format.decode(JSON.stringify({...file,formatVersion:99})),/지원/);
  assert.throws(()=>format.decode('{"__proto__":{}}'),/속성/);
  const broken=clone(snapshot);broken.overrides[0].value.personId='missing';assert.throws(()=>format.validateSnapshot(broken),/인원 ID/);
  broken.overrides=[];broken.meta.find(r=>r.id==='activeRosterId').value='missing';assert.throws(()=>format.validateSnapshot(broken),/활성/);
  const duplicate=clone(snapshot);duplicate.logs.push(duplicate.logs[0]);assert.throws(()=>format.validateSnapshot(duplicate),/중복/);
});
test('invalid rule snapshots and malformed personnel contexts cannot enter through backup',async()=>{
  const {s}=await seeded(),snapshot=clone(await s.exportSnapshot());
  snapshot.rosters[0].ruleSnapshot={...clone(model.rulesFor()),notificationCount:-1};assert.throws(()=>format.validateSnapshot(snapshot),/인원 규칙/);
  delete snapshot.rosters[0].ruleSnapshot;snapshot.personnel.find(p=>p.id==='2026-09').contexts['2026-9-24-E'].excluded=['source:missing:1'];assert.throws(()=>format.validateSnapshot(snapshot),/원본 ID/);
});
test('restoring into a new database preserves all data while advancing conflict markers',async()=>{
  const original=await seeded(),snapshot=await original.s.exportSnapshot();
  const target=setup();await target.s.initialize();const before=await target.s.exportSnapshot();
  await target.s.restoreSnapshot(snapshot,before);
  const restored=clone(await target.s.exportSnapshot());
  for(const store of ['rosters','personnel','overrides','logs'])assert.deepEqual(restored[store],clone(snapshot[store]));
  assert.equal(await target.s.getActiveId(),'2026-09');assert.equal((await target.s.readState('2026-09')).revision,2);
  const reopened=setup(target.db);await reopened.s.initialize();assert.deepEqual(clone(await reopened.s.exportSnapshot()),restored);
});
test('restore aborts if another tab changes data after the preview',async()=>{
  const {s}=await seeded(),preview=await s.exportSnapshot();await s.setActiveId(null);const latest=await s.exportSnapshot();
  await assert.rejects(s.restoreSnapshot(preview,preview),/복원/);assert.deepEqual(clone(await s.exportSnapshot()),clone(latest));
});
test('stale tabs cannot overwrite restored data or append stale logs',async()=>{
  const primary=await seeded(),other=setup(primary.db);await other.s.initialize();
  const snapshot=await primary.s.exportSnapshot();await primary.s.restoreSnapshot(snapshot,snapshot);
  await assert.rejects(other.s.setActiveId(null),/다른 탭에서 전체/);
  await assert.rejects(other.s.deleteRoster('2026-09'),/다른 탭에서 전체/);
  await assert.rejects(other.s.appendLogs([{id:'fake',timestamp:new Date().toISOString(),action:'test',appVersion:'0.7.3'}]),/다른 탭에서 전체/);
  assert.equal(await primary.s.getActiveId(),'2026-09');
  await other.s.initialize();await other.s.setActiveId(null);assert.equal(await primary.s.getActiveId(),null);
});
test('restore failure inside a transaction leaves every old store unchanged',async()=>{
  const {s}=await seeded(),before=await s.exportSnapshot(),incoming=clone(before);incoming.rosters[0].all[0].name='교체값';
  const db=await s.openDB(),original=db.transaction.bind(db);
  db.transaction=(...args)=>{
    const tx=original(...args),get=tx.objectStore.bind(tx);
    if(args[1]==='readwrite')tx.objectStore=name=>{
      const store=get(name);if(name==='logs')store.put=()=>{throw Error('quota injection');};return store;
    };
    return tx;
  };
  await assert.rejects(s.restoreSnapshot(incoming,before),/quota/);
  db.transaction=original;assert.deepEqual(clone(await s.exportSnapshot()),clone(before));
});
test('malformed restore data never clears current data',async()=>{
  const {s}=await seeded(),before=await s.exportSnapshot(),invalid=clone(before);invalid.personnel[0].id='missing';
  await assert.rejects(s.restoreSnapshot(invalid,before),/형식 오류/);assert.deepEqual(clone(await s.exportSnapshot()),clone(before));
});
test('restore verification failure reports committed uncertainty instead of safe rollback',async()=>{
  const {s}=await seeded(),before=await s.exportSnapshot();const db=await s.openDB(),original=db.transaction.bind(db);let committed=false;
  db.transaction=(...args)=>{
    if(committed&&args[1]==='readonly')throw Error('read injection');
    const tx=original(...args);if(args[1]==='readwrite')tx.addEventListener('complete',()=>committed=true);return tx;
  };
  await assert.rejects(s.restoreSnapshot(before,before),error=>error.restoreCommitted===true);
  db.transaction=original;assert.equal((await s.readState('2026-09')).revision,2);
});

const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),{IDBFactory}=require('fake-indexeddb');
const Model=require('../domain/roster-model.js'),Format=require('../domain/backup-format.js');
const plain=value=>JSON.parse(JSON.stringify(value));
function session(db=new IDBFactory()){
 const ctx=vm.createContext({indexedDB:db,BackupFormat:Format,setTimeout,clearTimeout,console,TypeError,crypto:webcrypto,Date,localStorage:{getItem:()=>null}});
 for(const file of ['storage.js','audit.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {db,s:vm.runInContext('AppStorage',ctx),a:vm.runInContext('Audit',ctx)};
}
function roster(month=10){return {id:`2026-${month}`,year:2026,month,fileName:'virtual.xlsx',all:Array.from({length:5},(_,i)=>({name:`가상${i}`,group:i===0?'Charge':'중간년차'})),groups:[{name:'Charge'},{name:'중간년차'}],shifts:{'9':Array(5).fill('D'),'10':['NC','N','N','N','OF']},maxDay:31};}
const key='2026-10|2026-10-9-D|통보연락반|0';
test('replacement rejects personnel or assignment writes made after the confirmation snapshot',async()=>{
 const {s}=session();await s.initialize();const r=roster();await s.saveRoster(r);
 const expected={record:await s.getRoster(r.id),revision:(await s.readState(r.id)).revision};
 await s.saveState(r.id,{[key]:{personId:'source:2026-10:0',name:'승자'}},s.emptyPersonnel(r.id),0);
 await assert.rejects(s.saveRoster({...r,fileName:'교체.xlsx'},true,expected),/다른 탭/);
 assert.equal((await s.getRoster(r.id)).fileName,r.fileName);assert.equal((await s.readState(r.id)).assignments[key].name,'승자');
});
test('delete rejects personnel writes made while confirmation was open and preserves the active roster',async()=>{
 const {s}=session();await s.initialize();const r=roster();await s.saveRoster(r);await s.setActiveId(r.id);
 const expected={record:r,revision:0};await s.saveState(r.id,{[key]:'승자'},s.emptyPersonnel(r.id),0);
 await assert.rejects(s.deleteRoster(r.id,expected),/다른 탭/);
 assert.equal(await s.getActiveId(),r.id);assert.equal((await s.readState(r.id)).assignments[key],'승자');
});
test('delete rejects a changed source even when its newer revision has been read',async()=>{
 const {s}=session();await s.initialize();const r=roster();await s.saveRoster(r);
 await s.saveRoster({...r,fileName:'새원본.xlsx'},true);
 await assert.rejects(s.deleteRoster(r.id,{record:r,revision:1}),/다른 탭/);
 assert.equal((await s.getRoster(r.id)).fileName,'새원본.xlsx');
});
test('guarded roster replacement and deletion succeed when record and revision still match',async()=>{
 const {s}=session();await s.initialize();const r=roster();await s.saveRoster(r);const next={...r,fileName:'교체.xlsx'};
 await s.saveRoster(next,true,{record:r,revision:0});assert.equal((await s.readState(r.id)).revision,1);
 await s.deleteRoster(r.id,{record:next,revision:1});assert.equal(await s.getRoster(r.id),null);
});
test('continuous personnel, rank, override, duty, restart, audit and backup workflow preserves its contracts',async()=>{
 const original=session(),{s,a}=original;await s.initialize();const r=roster(),other=roster(11);
 await s.saveRoster(r);await s.saveRoster(other);await s.setActiveId(r.id);
 const people=s.emptyPersonnel(r.id),ctx='2026-10-9-D',id='source:2026-10:0';
 people.contexts[ctx]={added:[{id:'added:doctor',name:'가상의사',kind:'doctor',group:'저연차'}],excluded:['source:2026-10:4']};
 const before={[key]:{personId:id,name:'수동이름'}};
 await a.perform({rosterId:r.id,context:ctx,operation:'통합 저장'},[{action:'manual_override',target:id}],()=>s.saveState(r.id,before,people,0));
 people.profiles[id]={name:'이름수정',kind:'nurse',group:'저연차'};
 const rekeyed=Model.rekeyAssignments(before,r,people);
 const migrated=`${r.id}|${ctx}|대피유도반|0`;assert.equal(rekeyed[migrated].personId,id);
 await a.perform({rosterId:r.id,context:ctx,operation:'선임 변경'},[{action:'role_changed',target:id}],()=>s.saveState(r.id,rekeyed,people,1));
 const date=new Date(2026,9,9),staff=Model.getOnDuty(date,'D',r,people),groups=Model.automaticGroups(staff,r);
 assert.equal(staff.length,5);assert.equal(staff.find(p=>p.id===id).name,'이름수정');assert.equal(groups.대피유도반.at(-1).id,'added:doctor');
 assert.equal(Model.getOnDuty(date,'E',r,people).length,0);assert.equal(Model.getOnDuty(new Date(2026,9,10),'N',r,people).length,4);
 assert.equal((await s.readState(other.id)).revision,0);await s.setActiveId(other.id);await s.setActiveId(r.id);
 const reopened=session(original.db);await reopened.s.initialize();const saved=await reopened.s.readState(r.id);
 assert.deepEqual(plain(saved.personnel),plain(people));assert.deepEqual(plain(saved.assignments),plain(rekeyed));assert.equal(saved.revision,2);
 const snapshot=await reopened.s.exportSnapshot(),backup=Format.decode(JSON.stringify(Format.create(snapshot,'0.7.4')));
 const restored=session();await restored.s.initialize();await restored.s.restoreSnapshot(backup.data,await restored.s.exportSnapshot());
 for(const area of ['rosters','personnel','overrides','logs'])assert.deepEqual(plain((await restored.s.exportSnapshot())[area]),plain(snapshot[area]));
 assert.equal(await restored.s.getActiveId(),r.id);assert.equal((await restored.s.readState(r.id)).assignments[migrated].personId,id);
 const logs=await restored.s.listLogs();assert.equal(logs.length,4);assert.equal(new Set(logs.map(x=>x.operationId)).size,2);
});

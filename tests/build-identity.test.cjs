const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('build-info.js','utf8');
function render(src){
 const el={textContent:''};
 const root={document:{getElementById:id=>id==='buildCommit'?el:null}};
 vm.runInNewContext(src,{globalThis:root});
 return {el,root};
}
test('direct source does not invent a commit',()=>{
 const {el,root}=render(code);
 assert.equal(root.MICU_BUILD_COMMIT,null);
 assert.match(el.textContent,/커밋 미확인/);
});
test('packaged source uses the complete valid SHA and visible short SHA',()=>{
 const sha='a'.repeat(40);
 assert.equal(code.split('const revision = null;').length,2);
 const {el,root}=render(code.replace('const revision = null;', "const revision = '"+sha+"';"));
 assert.equal(root.MICU_BUILD_COMMIT,sha);
 assert.match(el.textContent,/Git a{12}/);
});
test('build identification loads before application state',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/id="buildCommit"/);
 assert.ok(html.indexOf('src="build-info.js"') < html.indexOf('src="storage.js?v=0.7.5-db4"'));
});

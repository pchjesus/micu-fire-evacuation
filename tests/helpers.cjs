const fs = require('node:fs');
const vm = require('node:vm');
function loadDomain(context) {
  for (const path of ['domain/config.js','domain/roster-model.js','domain/roster-parser.js','domain/change-events.js','data/sample-roster.js']) {
    vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
  }
}
module.exports = {loadDomain};

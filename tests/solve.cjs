// Refresh reviewed solutions explicitly. CI never rewrites its expected fixtures.
const fs = require('node:fs');
const search = require('./search.cjs');
const results = Array.from({length:12}, (_, i) => {
  const result = search(i);
  if (!result.solution) throw Error(`No solution for level ${i+1}`);
  const noBlocks = search(i, {noBlocks:true});
  if (noBlocks.solution || !noBlocks.exhausted) throw Error(`Block-free search not closed for level ${i+1}`);
  const row = {level:i+1, ...result, noBlockStates:noBlocks.states};
  console.log(JSON.stringify(row)); return row;
});
fs.writeFileSync('docs/solutions.json', JSON.stringify(results,null,2)+'\n');

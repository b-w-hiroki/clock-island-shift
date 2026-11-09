// Enumerate legal builds and settled actions using the actual runtime, not a second physics model.
const harness = require('./harness.cjs');
function search(level, { noBlocks = false, omit = null, maxStates = 10000 } = {}) {
  const h = harness();
  h.run(`startLevel(${level});`);
  if (omit) h.run(`LEVELS[levelIdx].tools=LEVELS[levelIdx].tools.filter(t=>t!==${JSON.stringify(omit)});` + (omit === 'wind' ? 'LEVELS[levelIdx].wind=0;' : '') + (omit === 'warp' ? 'LEVELS[levelIdx].portals=null;' : ''));
  h.run(`globalThis.pack=()=>JSON.stringify({s:{...S,terrain:[...S.terrain].sort(),stones:[...S.stones].sort(),cracks:[...S.cracks].sort(),blocks:[...S.blocks].sort()},gravMode,lastDx,fastFall});
    globalThis.unpack=raw=>{reset();const d=JSON.parse(raw);S=d.s;for(const k of ['terrain','stones','cracks','blocks'])S[k]=new Set(S[k]);gravMode=d.gravMode;lastDx=d.lastDx;fastFall=d.fastFall;};`);
  const L = JSON.parse(h.run('JSON.stringify(LEVELS[levelIdx])'));
  const distributions = [];
  function build(i, counts) {
    if (i === L.wells.length) { if (counts.reduce((a,b)=>a+b,0) <= L.blockCount) distributions.push(counts); return; }
    for (let n = 0; n <= (noBlocks ? 0 : L.wellCap); n++) build(i + 1, [...counts, n]);
  }
  build(0, []);
  const queue = [], seen = new Set();
  for (const counts of distributions) {
    const path = counts.flatMap((n, i) => Array(n).fill(`onCellTap(${L.wells[i]},0)`));
    h.run('reset();' + path.join(';'));
    const state = h.run('pack()');
    seen.add(state); queue.push({ state, path, counts });
  }
  const actions = ['rotate(1)', 'rotate(-1)', 'move(1)', 'move(-1)', 'toggleGravity()', 'moveFree(0,1)', 'moveFree(0,-1)', 'toggleFast()'];
  for (let i = 0; i < queue.length; i++) {
    if (i >= maxStates) return { solution:null, states:seen.size, exhausted:false };
    const { state, path, counts } = queue[i];
    for (const action of actions) {
      h.run(`unpack(${JSON.stringify(state)});${action}`);
      if (h.flush(100)) throw Error(`Level ${level + 1}: timers did not settle`);
      if (h.run('S.result') === 'クリア！') return { solution:[...path,action], counts, states:seen.size, exhausted:false };
      if (h.run('S.done')) continue;
      const next = h.run('pack()');
      if (!seen.has(next)) { seen.add(next); queue.push({state:next,path:[...path,action],counts}); }
    }
  }
  return { solution:null, states:seen.size, exhausted:true };
}
module.exports = search;

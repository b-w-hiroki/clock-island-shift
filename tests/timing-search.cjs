// Bounded timer-interleaving regression. Does not claim proof over real browser scheduling.
const harness = require('./harness.cjs');
module.exports = function timingSearch(level, maxStates = 5000) {
  const h = harness();
  const dump = `JSON.stringify({s:{...S,terrain:[...S.terrain].sort(),stones:[...S.stones].sort(),cracks:[...S.cracks].sort(),blocks:[...S.blocks].sort()},gravMode,lastDx,fastFall,fallMomentum,falling,animating,bouncing,bounceChain,queuedDx,transform:boardWrap.style.transform})`;
  function replay(path) {h.run('startLevel('+level+')');for(const action of path){if(action==='tick')h.flush(1);else h.run(action)}}
  const queue=[[]], seen=new Set();
  const actions=['tick','rotate(1)','rotate(-1)','move(1)','move(-1)','toggleGravity()','toggleFast()','moveFree(0,1)','moveFree(0,-1)'];
  for(let i=0;i<queue.length;i++){
    if(i>=maxStates)return{solution:null,states:seen.size,closed:false};
    const path=queue[i];
    for(const action of actions){
      const next=[...path,action];replay(next);
      if(h.run('S.result')==='クリア！')return{solution:next,states:seen.size,closed:false};
      if(h.run('S.done'))continue;
      const state=h.run(dump);
      if(!seen.has(state)){seen.add(state);queue.push(next)}
    }
  }
  return{solution:null,states:seen.size,closed:true};
};
if(require.main===module)for(let i=0;i<12;i++)console.log(i+1,module.exports(i));

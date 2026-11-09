// Search uses the actual game functions with deterministic timers; not a substitute for human play.
const harness=require('./harness.cjs');
const actions=['rotate(1)','rotate(-1)','move(1)','move(-1)','toggleGravity()'];
const dump=`JSON.stringify({s:{...S,terrain:[...S.terrain],stones:[...S.stones],cracks:[...S.cracks],blocks:[...S.blocks]},gravMode,lastDx,fastFall})`;
const results=[];
for(let level=0;level<12;level++){
 const h=harness();h.run(`startLevel(${level})`);
 const queue=[[h.run(dump),[]]],seen=new Set(); let solution=null;
 for(let i=0;i<queue.length&&i<20000&&!solution;i++){
  const [raw,path]=queue[i]; if(path.length>20)continue;
  for(const action of actions){
   h.run(`reset();constRestore=${JSON.stringify(raw)}`.replace('constRestore=','globalThis.restoreRaw='));
   h.run(`{const d=JSON.parse(restoreRaw);S=d.s; for(const k of ['terrain','stones','cracks','blocks'])S[k]=new Set(S[k]);gravMode=d.gravMode;lastDx=d.lastDx;fastFall=d.fastFall;}`);
   h.run(action); if(h.flush(100))throw Error('timer did not settle');
   if(h.run('S.result')==='クリア！'){solution=[...path,action];break}
   if(h.run('S.done'))continue;
   const next=h.run(dump); if(!seen.has(next)){seen.add(next);queue.push([next,[...path,action]])}
  }
 }
 results.push({level:level+1,solution,states:seen.size});console.log(JSON.stringify(results.at(-1)));
}
require('node:fs').writeFileSync('docs/solutions.json',JSON.stringify(results,null,2)+'\n');

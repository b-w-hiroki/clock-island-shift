const test=require('node:test'); const assert=require('node:assert/strict'); const harness=require('./harness.cjs');
test('all 12 level definitions initialize in bounds',()=>{const h=harness(); for(let i=0;i<12;i++){h.run(`startLevel(${i})`);assert.equal(h.run('S.done'),false);assert.equal(h.run('S.player.x>=0&&S.player.x<N&&S.player.y>=0&&S.player.y<N'),true)}});
test('reset cancels pending rotation',()=>{const h=harness();h.run('startLevel(0);rotate(1);reset()');h.flush();assert.equal(h.run('S.rot'),0);assert.equal(h.run('animating'),false)});
test('rewind cancels pending rotation and restores blocks',()=>{const h=harness();h.run('startLevel(0);onCellTap(4,0);rotate(1);rewind()');h.flush();assert.equal(h.run('S.rot'),0);assert.equal(h.run('S.blocks.size'),1)});
test('completion progress survives reload',()=>{const h=harness();h.run('startLevel(0);onCleared()');const reload=harness(h.storage.value);assert.equal(reload.run('progress.unlocked'),2);assert.equal(reload.run('continueIdx()'),1)});
test('malformed progress cannot create invalid level index',()=>{for(const raw of ['{','null','{"unlocked":1.5,"cleared":[true]}','{"unlocked":"12","cleared":["yes"]}']){const h=harness(raw);assert.equal(h.run('Number.isInteger(progress.unlocked)'),true)}});
for(const {level,solution} of require('../docs/solutions.json')) test(`level ${level}: recorded solution reaches goal`,()=>{assert.ok(solution);const h=harness();h.run(`startLevel(${level-1})`);for(const action of solution){h.run(action);assert.equal(h.flush(100),0)}assert.equal(h.run('S.result'),'クリア！')});

const search = require('./search.cjs');
const timingSearch = require('./timing-search.cjs');
for(let i=0;i<12;i++) {
  test(`level ${i+1}: no block-free settled route`,()=>{
    const result=search(i,{noBlocks:true});assert.equal(result.solution,null);assert.equal(result.exhausted,true);
  });
  test(`level ${i+1}: no block-free route in timer-interleaving model`,()=>{
    const result=timingSearch(i);assert.equal(result.solution,null);assert.equal(result.closed,true);
  });
}
for(const [level,tool] of [[5,'fast'],[6,'reverse'],[7,'bounce'],[8,'wind'],[9,'zero'],[10,'ghost'],[11,'warp'],[12,'warp'],[12,'reverse']]) {
  test(`level ${level}: ${tool} is necessary in settled model`,()=>{
    const result=search(level-1,{omit:tool});assert.equal(result.solution,null);assert.equal(result.exhausted,true);
  });
}
test('all stages have a learning goal, sufficient legal build, and visible shift budget',()=>{
  const h=harness();for(let i=0;i<12;i++){
    h.run(`startLevel(${i})`);
    assert.equal(h.run('Boolean(LEVELS[levelIdx].name && LEVELS[levelIdx].hint)'),true);
    assert.match(h.nodes.get('blocksLeft').textContent,/回転 あと[12]回/);
  }
});
test('unintroduced tools are guarded at keyboard and function entry, not merely hidden',()=>{
  const h=harness();h.run('startLevel(0)');
  for(const key of ['g','f','t','ArrowUp','ArrowDown'])h.press(key);
  h.run('toggleGravity();toggleFast();toggleTime();moveFree(1,0)');
  assert.equal(h.run('gravMode'), 'down');assert.equal(h.run('fastFall || timeStopped'),false);
  assert.equal(h.run('JSON.stringify(S.player)'),'{"x":1,"y":5}');
  for(const id of ['gravBtn','stopBtn','ffBtn'])assert.equal(h.nodes.get(id).hidden,true);
  h.run('rotate(1)');h.flush();assert.equal(h.run('S.ghost'),null);
});
test('shift budget prevents an extra keyboard rotation and rewind refunds the used shift',()=>{
  const h=harness();h.run('startLevel(0);rotate(1)');h.flush();h.press(' ','Space');h.flush();
  assert.equal(h.run('S.rot'),1);assert.equal(h.run('S.shiftsUsed'),1);
  h.run('rewind()');assert.equal(h.run('S.shiftsUsed'),0);assert.equal(h.run('S.rot'),0);
});
test('build taps cannot change the board during rotation',()=>{
  const h=harness();h.run('startLevel(0);rotate(1);onCellTap(4,0)');assert.equal(h.run('S.blocks.size'),0);h.flush();
});
test('gravity needs a landing and never exposes zero gravity on reverse-only island',()=>{
  const h=harness();h.run('startLevel(5);toggleGravity()');assert.equal(h.run('gravMode'),'down');
  h.run('rotate(1)');h.flush(1);assert.equal(h.run('falling'),true);
  h.run('toggleGravity()');assert.equal(h.run('gravMode'),'down');h.flush();
  h.run('toggleGravity()');h.flush();assert.equal(h.run('gravMode'),'up');
  h.run('toggleGravity()');h.flush();assert.equal(h.run('gravMode'),'down');
});
test('rewind restores stone coordinates, momentum control, direction and consumed crate',()=>{
  const h=harness();h.run('startLevel(4);for(let i=0;i<4;i++)onCellTap(3,0);rotate(1)');h.flush();
  const before=h.run('JSON.stringify({player:S.player,blocks:[...S.blocks],stones:[...S.stones],lastDx,fastFall})');
  h.run('move(1)');h.flush();h.run('toggleFast();rewind()');h.flush();
  assert.equal(h.run('JSON.stringify({player:S.player,blocks:[...S.blocks],stones:[...S.stones],lastDx,fastFall})'),before);
});
test('time stop, resume, rewind and reset leave no stale fall running',()=>{
  const h=harness();h.run('startLevel(3);rotate(1)');h.flush(1);
  h.run('toggleTime()');const position=h.run('JSON.stringify(S.player)');h.flush(3);
  assert.equal(h.run('JSON.stringify(S.player)'),position);
  h.run('toggleTime()');assert.equal(h.flush(100),0);
  h.run('rewind();reset()');assert.equal(h.flush(100),0);assert.equal(h.run('S.shiftsUsed'),0);
});
test('rewinding an interrupted airborne rotation resumes falling rather than creating a platform',()=>{
  const h=harness();h.run('startLevel(9);rotate(1)');h.flush(1);
  assert.equal(h.run('falling'),true);h.run('rotate(1);rewind()');assert.equal(h.run('falling'),true);
  assert.equal(h.flush(100),0);
});
test('rotated stones and shift counter return to their exact build state on rewind',()=>{
  const h=harness();h.run('startLevel(1)');const stones=h.run('JSON.stringify([...S.stones])');
  h.run('rotate(-1)');h.flush();assert.notEqual(h.run('JSON.stringify([...S.stones])'),stones);
  h.run('rewind()');assert.equal(h.run('JSON.stringify([...S.stones])'),stones);assert.equal(h.run('S.shiftsUsed'),0);
});
test('ghost island has exactly two shifts, with no budget bypass through keyboard',()=>{
  const h=harness();const solution=require('../docs/solutions.json')[9].solution;
  h.run('startLevel(9)');for(const action of solution.slice(0,-2)){h.run(action);h.flush()}
  assert.equal(h.run('S.shiftsUsed'),2);const rot=h.run('S.rot');h.press('q');h.flush();assert.equal(h.run('S.rot'),rot);
});
test('reset after the final clear cannot reopen a stale completion overlay',()=>{
  const h=harness();h.run("startLevel(11);S.done=true;S.result='クリア！';onCleared();reset()");h.flush();
  assert.equal(h.nodes.get('overlay').style.display,'none');
});

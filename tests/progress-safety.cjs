const test = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./harness.cjs');
const saved = JSON.stringify({unlocked: 7, cleared: [true,true,true]});
test('opening, repeated opening and cancelling preserve the exact old save', () => {
 const h=harness(saved); h.run('requestWipe(); requestWipe()');
 assert.equal(h.storage.value,saved);
 assert.equal(h.run("document.activeElement === document.getElementById('cancelWipeBtn')"),true);
 h.press('r'); h.press('z'); h.run('cancelWipe()');
 assert.equal(h.storage.value,saved);
 assert.equal(h.run("document.activeElement === document.getElementById('wipeBtn')"),true);
});
test('only an open confirmation clears progress; repeated confirmation is inert', () => {
 const h=harness(saved); h.run('confirmWipe()'); assert.equal(h.storage.value,saved);
 h.run('requestWipe(); confirmWipe()');
 assert.equal(h.storage.value,JSON.stringify({unlocked:1,cleared:[]}));
 h.storage.value='sentinel'; h.run('confirmWipe()'); assert.equal(h.storage.value,'sentinel');
});
test('failure has visible recovery labels; undo and reset use existing mechanics', () => {
 const h=harness(saved); h.run('startLevel(0); snapshot(); fail(); render()');
 assert.match(h.nodes.get('rewindBtn').textContent,/1手戻す/);
 assert.match(h.nodes.get('retryBtn').textContent,/やり直す/);
 h.run('rewind()'); assert.equal(h.run('S.done'),false);
 h.run('fail(); render(); reset()'); assert.equal(h.run('S.done'),false);
 assert.equal(h.nodes.get('rewindBtn').textContent,'↩');
 assert.equal(h.storage.value,saved);
});

test('storage refusal retains old progress and keeps confirmation cancellable', () => {
 const h=harness(saved);
 h.run('localStorage.setItem = () => { throw new Error("denied") }; requestWipe(); confirmWipe()');
 assert.equal(h.storage.value,saved);
 assert.equal(h.run('progress.unlocked'),7);
 assert.equal(h.run('wipeDialog.open'),true);
 assert.equal(h.nodes.get('wipeError').hidden,false);
 h.run('cancelWipe()'); assert.equal(h.storage.value,saved);
});

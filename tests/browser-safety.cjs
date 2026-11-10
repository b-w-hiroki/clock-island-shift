const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(); fs.mkdirSync('screenshots/safety',{recursive:true});
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:width===320?640:844}});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const saved=JSON.stringify({unlocked:7,cleared:[true,true,true]});
  await page.evaluate(s=>localStorage.setItem('tokeijima-shift-progress-v1',s),saved); await page.reload();
  const getSave=()=>page.evaluate(()=>localStorage.getItem('tokeijima-shift-progress-v1'));
  await page.locator('#wipeBtn').click();
  assert.equal(await page.locator('#cancelWipeBtn').evaluate(e=>e===document.activeElement),true);
  assert.equal(await getSave(),saved);
  await page.keyboard.press('Tab'); assert.equal(await page.locator('#confirmWipeBtn').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Tab'); assert.equal(await page.locator('#cancelWipeBtn').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape'); assert.equal(await getSave(),saved);
  assert.equal(await page.locator('#wipeBtn').evaluate(e=>e===document.activeElement),true);
  await page.locator('#wipeBtn').click(); await page.keyboard.press('Enter'); assert.equal(await getSave(),saved);
  await page.locator('#wipeBtn').dblclick();
  await page.screenshot({path:`screenshots/safety/confirm-${width}.png`});
  const bounds=await page.locator('#wipeDialog').boundingBox(); assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width);
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  assert.deepEqual(JSON.parse(await getSave()),{unlocked:1,cleared:[]});
  await page.locator('#startBtn').click();
  await page.evaluate(()=>{snapshot();fail();render()});
  await page.locator('#rewindBtn').getByText('1手戻す',{exact:false}).count();
  assert.match(await page.locator('#rewindBtn').innerText(),/1手戻す/);
  assert.match(await page.locator('#retryBtn').innerText(),/やり直す/);
  await page.screenshot({path:`screenshots/safety/failure-${width}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.keyboard.press('z'); assert.equal(await page.evaluate(()=>S.done),false);
  await page.evaluate(()=>{fail();render()}); await page.locator('#retryBtn').click();
  assert.equal(await page.evaluate(()=>S.done),false); await page.close();
 }
 await browser.close(); console.log('Browser safety passed: 320/390, keyboard, save/cancel/confirm, repeated clicks and recovery');
})().catch(e=>{console.error(e);process.exit(1)});

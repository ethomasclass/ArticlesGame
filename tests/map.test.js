const { chromium } = require('playwright');
const fs = require('fs');
const SHIM = require('./shim/supabase');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport:{width:1600,height:1100} });
  const errs = [];
  await SHIM.install(ctx);
  const T = await ctx.newPage();
  T.on('pageerror', e => errs.push('ERR ' + e.message));
  T.on('console', m => { if (m.type()==='error' && !/favicon/.test(m.text())) errs.push('CON ' + m.text()); });
  await T.goto('http://localhost:8899/teacher.html');
  await T.click('#create-btn');
  await T.waitForSelector('#lobby:not(.hidden)');
  await T.click('#begin-btn');
  await T.waitForSelector('#game:not(.hidden)');
  await T.waitForTimeout(700);
  console.log('map present:', await T.isVisible('.aoc-map'),
    '| shapes:', await T.$$eval('.aoc-map .st', e=>e.length),
    '| chips:', await T.$$eval('.aoc-map .chip', e=>e.length),
    '| inline labels:', await T.$$eval('.aoc-map .inlabel', e=>e.length));
  await T.screenshot({ path:'tests/out-map-waiting.png', fullPage:false });

  // advance to tally and watch the roll call
  await T.click('#next-btn'); await T.waitForTimeout(400);   // caucus
  await T.click('#next-btn'); await T.waitForTimeout(400);   // voting
  await T.screenshot({ path:'tests/out-map-voting.png' });
  await T.click('#next-btn');                                 // tally -> reveal animation
  await T.waitForTimeout(1400);
  const mid = await T.textContent('#t-yes');
  await T.screenshot({ path:'tests/out-map-midroll.png' });
  await T.waitForTimeout(5200);
  console.log('roll call: mid-count was', mid, '-> final',
    await T.textContent('#t-yes'), 'yes /', await T.textContent('#t-no'), 'no /',
    await T.textContent('#t-ab'), 'abstain |', await T.textContent('#t-verdict'));
  await T.screenshot({ path:'tests/out-map-tally.png' });

  // payment reveal
  const label = (await T.textContent('#next-btn')).trim();
  if (/pay/i.test(label)) {
    await T.click('#next-btn'); await T.waitForTimeout(900);
    await T.click('#next-btn'); await T.waitForTimeout(6000);
    console.log('payment reveal legend:', (await T.textContent('#map-legend')).replace(/\s+/g,' '));
    await T.screenshot({ path:'tests/out-map-payment.png' });
  }
  console.log('list view toggle:', await (async()=>{ await T.click('#tab-list'); await T.waitForTimeout(200);
    return 'seats visible=' + await T.isVisible('#seats') + ' map hidden=' + !(await T.isVisible('#map-view')); })());
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();

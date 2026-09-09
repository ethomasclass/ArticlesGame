/* A claimed state belongs to the group that claimed it: nobody else can take
   it, the list greys out live, the same group can return on another laptop,
   and the teacher can free one when they need to. */
const { chromium } = require('playwright');
const SHIM = require('./shim/supabase');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport:{width:1300,height:1000} });
  const errs = [];
  await SHIM.install(ctx);

  const T = await ctx.newPage();
  T.on('pageerror', e => errs.push('TEACHER ' + e.message));
  T.on('dialog', async d => { console.log('   teacher prompt:', d.message().split('\n')[0]); await d.accept('1'); });
  await T.goto('http://localhost:8899/teacher.html');
  await T.fill('#sess-label','Period 3');
  await T.click('#create-btn'); await T.waitForSelector('#lobby:not(.hidden)');
  const code = (await T.textContent('#game-code')).trim();

  async function open(names) {
    const P = await ctx.newPage();
    P.on('pageerror', e => errs.push(names + ' ' + e.message));
    await P.goto('http://localhost:8899/student.html');
    await P.evaluate(() => localStorage.removeItem('aoc_student'));
    await P.goto('http://localhost:8899/student.html');
    await P.fill('#names', names); await P.fill('#code', code); await P.click('#join-btn');
    await P.waitForSelector('#s-claim:not(.hidden)', { timeout: 15000 });
    return P;
  }
  const state = async (P) => P.$$eval('.claim', els => els.map(e => ({
    name: e.querySelector('.t').innerText.replace(/\s+/g,' ').trim(),
    disabled: e.disabled })));

  // --- group one takes Virginia ---
  const A = await open('Maya and Dev');
  const B = await open('Ana and Sam');           // already looking at the list
  await A.locator('.claim', { has: A.locator('.t', { hasText:/^Virginia$/ }) }).click();
  await A.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
  console.log('group A claimed :', await A.textContent('#p-name'));

  // --- group two must see it lock, live, without reloading ---
  await B.waitForFunction(() => {
    const el = [...document.querySelectorAll('.claim')].find(e => /Virginia/.test(e.innerText));
    return el && el.disabled;
  }, null, { timeout: 15000 });
  const bList = await state(B);
  const va = bList.find(x => /Virginia/.test(x.name));
  console.log('group B sees VA :', JSON.stringify(va));
  console.log('B note          :', (await B.textContent('#claim-note')).replace(/\s+/g,' ').slice(0,86) + '…');

  // clicking it must do nothing
  await B.locator('.claim', { has: B.locator('.t', { hasText:/Virginia/ }) }).click({ force: true });
  await B.waitForTimeout(900);
  console.log('B still on list :', await B.isVisible('#s-claim'), '(true = could not take it)');

  await B.locator('.claim', { has: B.locator('.t', { hasText:/^Georgia$/ }) }).click();
  await B.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
  console.log('group B claimed :', await B.textContent('#p-name'));

  // --- the same group returns on another laptop ---
  const A2 = await open('maya and dev');          // different case on purpose
  const a2 = await state(A2);
  const vaBack = a2.find(x => /Virginia/.test(x.name));
  console.log('returning group sees VA:', JSON.stringify(vaBack), '(disabled false = can reclaim)');
  await A2.locator('.claim', { has: A2.locator('.t', { hasText:/Virginia/ }) }).click();
  await A2.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
  // the rail starts with a placeholder, so wait for the real figure to land
  await A2.waitForFunction(() => {
    const t = document.getElementById('p-treas');
    return t && t.textContent.trim() !== '$0';
  }, null, { timeout: 15000 }).catch(() => {});
  console.log('reclaimed with treasury:', await A2.textContent('#p-treas'),
              '| interest', await A2.textContent('#p-int'));

  // --- a stranger still cannot ---
  const C = await open('Someone Else');
  const cList = await state(C);
  console.log('stranger sees VA:', JSON.stringify(cList.find(x => /Virginia/.test(x.name))));

  // --- teacher frees one ---
  await T.click('#release-btn');
  await T.waitForTimeout(1500);
  const after = await state(C);
  console.log('after release   :', JSON.stringify(after.find(x => !x.disabled && /Georgia|Virginia/.test(x.name)) || 'none freed'));

  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

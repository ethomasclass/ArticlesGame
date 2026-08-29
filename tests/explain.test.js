/* Every resolution must state, before any vote is cast: the question in one
   sentence, what a YES actually causes, what a NO actually causes, and a
   personal stake line even on the rounds with no bill to pay. */
const { chromium } = require('playwright');
const fs = require('fs');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport:{width:1500,height:1100} });
  const errs = [];
  await ctx.route('**/firebasejs/**/firebase-app.js', r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/shim/firebase-app.js','utf8')}));
  await ctx.route('**/firebasejs/**/firebase-firestore.js', r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/shim/firebase-firestore.js','utf8')}));

  const T = await ctx.newPage();
  T.on('pageerror', e => errs.push('TEACHER ' + e.message));
  await T.goto('http://localhost:8899/teacher.html');
  await T.selectOption('#cold-open', 'off');   // these suites test the 1786 rounds
  await T.click('#create-btn'); await T.waitForSelector('#lobby:not(.hidden)');
  const code = (await T.textContent('#game-code')).trim();

  const S = await ctx.newPage();
  S.on('pageerror', e => errs.push('STUDENT ' + e.message));
  await S.goto('http://localhost:8899/student.html');
  await S.fill('#names','Maya and Dev'); await S.fill('#code',code); await S.click('#join-btn');
  await S.waitForSelector('#s-claim:not(.hidden)');
  await S.locator('.claim',{has:S.locator('.t',{hasText:/^Virginia$/})}).click();
  await S.waitForSelector('#live:not(.hidden)');
  await T.click('#begin-btn'); await T.waitForSelector('#game:not(.hidden)');

  let ok = true;
  for (let round = 1; round <= 4; round++) {
    await T.waitForTimeout(700);
    const title = await T.textContent('#res-title');
    const q  = (await S.textContent('#r-question')).trim();
    const yp = (await S.textContent('#r-ifpass')).trim();
    const nf = (await S.textContent('#r-iffail')).trim();
    const cost = (await S.textContent('#p-cost')).replace(/\s+/g,' ').trim();
    const rule = (await S.textContent('#r-rule')).trim();
    const visible = await S.isVisible('#r-question') && await S.isVisible('#r-ifpass');
    const good = q.length > 15 && yp.length > 40 && nf.length > 40 && cost.length > 20 && visible;
    if (!good) ok = false;
    console.log(`R${round} ${title}`);
    console.log(`   rule     : ${rule}`);
    console.log(`   question : ${q}`);
    console.log(`   if passes: ${yp.slice(0,84)}...`);
    console.log(`   if fails : ${nf.slice(0,84)}...`);
    console.log(`   stake    : ${cost.slice(0,84)}...`);
    console.log(`   all four present before voting: ${good ? 'YES' : 'NO  <-- PROBLEM'}`);

    // advance a full round
    await T.click('#next-btn'); await T.waitForTimeout(300);
    await T.click('#next-btn'); await T.waitForTimeout(300);
    if (await S.isVisible('#vote-card')) { await S.click('#vote-card .btn-yes'); await S.waitForTimeout(400); }
    await T.click('#next-btn'); await T.waitForTimeout(6400);
    await T.click('#next-btn'); await T.waitForTimeout(800);
    if (await S.isVisible('#pay-card')) { await S.click('#pay-card .btn-no'); await S.waitForTimeout(400);
      await T.click('#next-btn'); await T.waitForTimeout(6400); }
    if (round < 4) { await T.click('#next-btn'); await T.waitForTimeout(800); }
  }
  console.log('\nALL RESOLUTIONS FULLY EXPLAINED:', ok);
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

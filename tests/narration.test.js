/* The read-aloud: appears for teacher and students at the brief, folds away
   after, and Round 4 speaks the live treasury balance. */
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
  await T.waitForTimeout(700);

  console.log('teacher dateline :', await T.textContent('#dsp-dateline'));
  console.log('read-time badge  :', await T.textContent('#dsp-badge'));
  console.log('opening line     :', (await T.$eval('#dsp-body p', e=>e.textContent)).slice(0,72) + '...');
  console.log('student follows  :', await S.isVisible('#dispatch'), '|', await S.textContent('#dsp-dateline'));
  console.log('student cue      :', await S.textContent('#cue'));

  await T.click('#dsp-big');
  console.log('presenter mode   :', await T.$eval('#dispatch', e=>e.classList.contains('big')),
    '| font', await T.$eval('#dsp-body p', e=>getComputedStyle(e).fontSize));
  await T.click('#dsp-done');
  console.log('folds away       :', !(await T.isVisible('#dispatch')), '| replay offered:', await T.isVisible('#dsp-again'));
  await T.click('#dsp-again');
  console.log('replays          :', await T.isVisible('#dispatch'));
  await T.click('#dsp-done');

  for (let r = 1; r <= 3; r++) {
    await T.click('#next-btn'); await T.waitForTimeout(350);
    await T.click('#next-btn'); await T.waitForTimeout(350);
    if (await S.isVisible('#vote-card')) { await S.click('#vote-card .btn-yes'); await S.waitForTimeout(400); }
    await T.click('#next-btn'); await T.waitForTimeout(6500);
    await T.click('#next-btn'); await T.waitForTimeout(900);
    if (await S.isVisible('#pay-card')) { await S.click('#pay-card .btn-no'); await S.waitForTimeout(500);
      await T.click('#next-btn'); await T.waitForTimeout(6500); }
    await T.click('#next-btn'); await T.waitForTimeout(900);
  }
  await T.waitForTimeout(600);
  const r4 = await T.$$eval('#dsp-body p', e => e.map(x => x.textContent));
  const line = r4.find(l => /national treasury/i.test(l)) || '';
  console.log('R4 dateline      :', await T.textContent('#dsp-dateline'));
  console.log('R4 speaks live $ :', line);
  console.log('token substituted:', !/\{treasury\}/.test(line) && /\$/.test(line));
  await T.screenshot({ path:'tests/out-narration.png' });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

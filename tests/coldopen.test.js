/* The candy vote: class splits, some refuse to pay, and the reveal names the
   Articles weakness each of those facts demonstrates. */
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
  console.log('cold open default:', await T.inputValue('#co-q'));
  await T.click('#create-btn'); await T.waitForSelector('#lobby:not(.hidden)');
  const code = (await T.textContent('#game-code')).trim();

  async function join(names, state) {
    const P = await ctx.newPage();
    P.on('pageerror', e => errs.push(state + ' ' + e.message));
    await P.goto('http://localhost:8899/student.html');
    await P.evaluate(() => localStorage.removeItem('aoc_student'));
    await P.goto('http://localhost:8899/student.html');
    await P.fill('#names', names); await P.fill('#code', code); await P.click('#join-btn');
    await P.waitForSelector('#s-claim:not(.hidden)', { timeout: 15000 });
    await P.locator('.claim', { has: P.locator('.t', { hasText: new RegExp('^'+state+'$') }) }).click();
    await P.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
    return P;
  }
  const VA = await join('Maya and Dev', 'Virginia');
  const MA = await join('Ana and Sam', 'Massachusetts');

  await T.click('#begin-btn');
  await T.waitForSelector('#coldopen:not(.hidden)', { timeout: 15000 });
  await VA.waitForSelector('#co-card:not(.hidden)', { timeout: 15000 });
  console.log('question on student:', (await VA.textContent('#co-q')).slice(0,64) + '...');
  console.log('student cue        :', await VA.textContent('#cue'));
  const choices = await VA.$$eval('.optbtn', e => e.map(x => x.textContent.trim()));
  console.log('choices offered    :', choices.join(' | '));

  // two groups deliberately pick different things
  await VA.click('.optbtn:nth-of-type(1)');
  await MA.waitForSelector('.optbtn');
  await MA.click('#co-body button:nth-of-type(3)');
  await T.waitForTimeout(900);
  console.log('board after 2 votes:', (await T.textContent('#co-count')).trim());

  await T.click('#co-next');            // close vote -> pay
  await VA.waitForSelector('#co-body .btn-yes', { timeout: 12000 });
  console.log('pay cue            :', await VA.textContent('#cue'));
  await VA.click('#co-body .btn-no');   // Virginia refuses
  await MA.click('#co-body .btn-yes');
  await T.waitForTimeout(900);

  await T.click('#co-next');            // -> reveal
  await T.waitForSelector('#co-reveal:not(.hidden)', { timeout: 12000 });
  console.log('\nVERDICT :', await T.textContent('#co-verdict'));
  console.log('SUMMARY :', await T.textContent('#co-summary'));
  const lessons = await T.$$eval('#co-lessons .lesson', els => els.map(e => ({
    what: e.querySelector('.what').textContent.trim(),
    why: e.querySelector('.why').textContent.trim().slice(0,70) })));
  lessons.forEach(l => console.log('  • ' + l.what + '\n      -> ' + l.why + '...'));
  console.log('BRIDGE  :', await T.textContent('#co-bridge'));
  await T.screenshot({ path:'tests/out-coldopen.png', fullPage:true });

  await T.click('#co-next');            // into 1786
  await T.waitForSelector('#game:not(.hidden)', { timeout: 12000 });
  console.log('\nhands off to        :', await T.textContent('#res-title'));
  console.log('cold open cleared   :', !(await T.isVisible('#coldopen')), '| student:', !(await VA.isVisible('#co-card')));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

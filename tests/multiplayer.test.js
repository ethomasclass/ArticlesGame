const { chromium } = require('playwright');
const fs = require('fs');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = [];

async function stub(ctx) {
  await ctx.route('**/firebasejs/**/firebase-app.js', r =>
    r.fulfill({ contentType:'text/javascript', body: fs.readFileSync('tests/shim/firebase-app.js','utf8') }));
  await ctx.route('**/firebasejs/**/firebase-firestore.js', r =>
    r.fulfill({ contentType:'text/javascript', body: fs.readFileSync('tests/shim/firebase-firestore.js','utf8') }));
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  // ONE context => teacher and student tabs share localStorage => real sync
  const ctx = await b.newContext({ viewport:{width:1500,height:1050} });
  await stub(ctx);

  const T = await ctx.newPage();
  T.on('pageerror', e => log.push('TEACHER ERROR: ' + e.message));
  T.on('console', m => { if (m.type()==='error' && !/favicon/.test(m.text())) log.push('TEACHER: ' + m.text()); });
  await T.goto('http://localhost:8899/teacher.html');
  await T.click('#create-btn');
  await T.waitForSelector('#lobby:not(.hidden)', { timeout: 15000 });
  const code = (await T.textContent('#game-code')).trim();
  console.log('✔ session created, code =', code);

  const S = await ctx.newPage();
  await S.setViewportSize({ width: 900, height: 1150 });
  S.on('pageerror', e => log.push('STUDENT ERROR: ' + e.message));
  S.on('console', m => { if (m.type()==='error' && !/favicon/.test(m.text())) log.push('STUDENT: ' + m.text()); });
  await S.goto('http://localhost:8899/student.html');
  await S.fill('#names', 'Maya and Dev');
  await S.fill('#code', code);
  await S.click('#join-btn');
  await S.waitForSelector('#s-claim:not(.hidden)', { timeout: 15000 });
  console.log('✔ claimable states:', (await S.$$eval('.claim .t', e=>e.map(x=>x.textContent))).join(', '));
  await S.locator('.claim', { has: S.locator('.t', { hasText:/^Virginia$/ }) }).click();
  await S.waitForSelector('#s-dossier:not(.hidden)', { timeout: 15000 });
  console.log('✔ student is', await S.textContent('#dos-name'), '| objective:',
    (await S.textContent('#dos-obj')).slice(0,60) + '…');
  await T.waitForTimeout(1200);
  console.log('✔ teacher lobby says:', (await T.textContent('#joined-count')).trim());

  await T.click('#begin-btn');
  await T.waitForSelector('#game:not(.hidden)', { timeout: 15000 });
  await S.waitForSelector('#s-round:not(.hidden)', { timeout: 15000 });
  await T.waitForTimeout(600);
  console.log('✔ R1 teacher:', await T.textContent('#res-title'), '·', await T.textContent('#rule-pill'));
  console.log('✔ R1 student cost:', (await S.textContent('#cost-body')).replace(/\s+/g,' ').slice(0,88));

  // debate + deal
  await T.click('#next-btn');
  await S.waitForSelector('#deal-card:not(.hidden)', { timeout: 12000 });
  console.log('✔ timer showing:', await T.textContent('#timer'));
  await S.selectOption('#deal-target', 'Delaware');
  await S.selectOption('#deal-offer', 'pay50');
  await S.click('#deal-send');
  await S.waitForTimeout(1500);
  console.log('✔ deal reply →', (await S.textContent('#deal-log')).replace(/\s+/g,' ').slice(0,130));
  console.log('✔ teacher ticker →', (await T.textContent('#deal-ticker')).replace(/\s+/g,' ').slice(0,120));

  // vote
  await T.click('#next-btn');
  await S.waitForSelector('#vote-card:not(.hidden)', { timeout: 12000 });
  await S.click('button:has-text("YES")');
  await S.waitForTimeout(900);
  console.log('✔ votes in:', await T.textContent('#votes-in'));
  await T.click('#next-btn');
  await T.waitForTimeout(1600);
  console.log('✔ TALLY:', (await T.textContent('#result-headline')).trim(), '·', await T.textContent('#tally-pill'));
  console.log('✔ next button reads:', (await T.textContent('#next-btn')).trim());

  const passed = (await T.textContent('#result-headline')).includes('PASSED');
  await T.click('#next-btn');
  await T.waitForTimeout(1200);
  if (passed) {
    await S.waitForSelector('#pay-card:not(.hidden)', { timeout: 12000 });
    console.log('✔ student payment prompt:', (await S.textContent('#pay-owed')).replace(/\s+/g,' '));
    await S.click('button:has-text("PAY NOTHING")');
    await S.waitForTimeout(700);
    await T.click('#next-btn');
    await T.waitForTimeout(1800);
    console.log('✔ REVEAL: asked', await T.textContent('#asked-val'), '| got', await T.textContent('#got-val'),
      '(' + await T.textContent('#pct-val') + ') | stability', await T.textContent('#stab-val'),
      '| treasury', await T.textContent('#nat-treasury'));
    console.log('✔ student sees reveal:', (await S.textContent('#res-narr')).slice(0,90) + '…');
  }
  await T.screenshot({ path:'tests/out-teacher.png', fullPage:true });
  await S.screenshot({ path:'tests/out-student.png', fullPage:true });

  // run out the remaining rounds fast
  for (let r = 2; r <= 4; r++) {
    await T.click('#next-btn'); await T.waitForTimeout(700);   // next resolution
    await T.click('#next-btn'); await T.waitForTimeout(500);   // caucus
    await T.click('#next-btn'); await T.waitForTimeout(500);   // voting
    if (await S.isVisible('#vote-card')) { await S.click('button:has-text("YES")'); await S.waitForTimeout(500); }
    await T.click('#next-btn'); await T.waitForTimeout(1400);  // tally
    const head = (await T.textContent('#result-headline')).trim();
    await T.click('#next-btn'); await T.waitForTimeout(1000);
    if (await S.isVisible('#pay-card')) { await S.click('button:has-text("PAY HALF")'); await S.waitForTimeout(600);
      await T.click('#next-btn'); await T.waitForTimeout(1500); }
    console.log(`✔ R${r}: ${head}`);
  }
  await T.click('#next-btn'); await T.waitForTimeout(2000);
  await T.waitForSelector('#debrief:not(.hidden)', { timeout: 15000 });
  console.log('✔ DEBRIEF:', (await T.textContent('#debrief h1')).trim());
  console.log('✔ teacher gets discussion questions:', (await T.content()).includes('Discussion questions'));
  await S.waitForTimeout(1500);
  const sHasDebrief = await S.isVisible('#s-debrief');
  console.log('✔ student debrief visible:', sHasDebrief,
    sHasDebrief ? '| tier: ' + (await S.textContent('#s-debrief h1')).trim() : '');
  console.log('✔ student sees NO teacher questions:', !(await S.content()).includes('Discussion questions'));
  await T.screenshot({ path:'tests/out-debrief.png', fullPage:true });

  console.log('\nERRORS:', log.length ? log.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL:', e.message); console.log(log.join('\n')); process.exit(1); });

/* Two-day run: play part of a session, close every tab as if the bell went,
   then come back on different browsers and carry on with scores intact. */
const { chromium } = require('playwright');
const fs = require('fs');
const SHIM = require('./shim/supabase');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];

  // ---------------- DAY ONE ----------------
  const day1 = await b.newContext({ viewport:{width:1500,height:1000} });
  await SHIM.install(day1);
  const T1 = await day1.newPage();
  T1.on('pageerror', e => errs.push('D1 TEACHER ' + e.message));
  await T1.goto('http://localhost:8899/teacher.html');
  await T1.fill('#sess-label', 'Period 3');
  await T1.click('#create-btn'); await T1.waitForSelector('#lobby:not(.hidden)');
  const code = (await T1.textContent('#game-code')).trim();
  console.log('DAY 1  session "Period 3" =', code, '| label shown:', await T1.textContent('#code-label'));

  const S1 = await day1.newPage();
  S1.on('pageerror', e => errs.push('D1 STUDENT ' + e.message));
  await S1.goto('http://localhost:8899/student.html');
  await S1.fill('#names','Maya and Dev'); await S1.fill('#code',code); await S1.click('#join-btn');
  await S1.waitForSelector('#s-claim:not(.hidden)');
  await S1.locator('.claim',{has:S1.locator('.t',{hasText:/^Virginia$/})}).click();
  await S1.waitForSelector('#live:not(.hidden)');

  await T1.click('#begin-btn'); await T1.waitForSelector('#game:not(.hidden)');
  await T1.click('#next-btn'); await T1.waitForTimeout(1100);           // caucus
  await T1.click('#next-btn');                                          // voting
  await S1.waitForSelector('#vote-card:not(.hidden)', { timeout: 10000 });
  await S1.click('#vote-card .btn-yes'); await S1.waitForTimeout(1000);
  await T1.click('#next-btn'); await T1.waitForTimeout(6500);           // tally
  await T1.click('#next-btn'); await T1.waitForTimeout(1000);           // payment
  await S1.waitForSelector('#pay-card:not(.hidden)', { timeout: 8000 });
  await S1.click('#pay-card .btn-no'); await S1.waitForTimeout(900);
  await T1.click('#next-btn'); await T1.waitForTimeout(6500);           // reveal

  const d1 = {
    treasury: await T1.textContent('#nat-treasury'),
    stability: await T1.textContent('#stab-val'),
    stuTreasury: await S1.textContent('#p-treas'),
    stuInterest: await S1.textContent('#p-int')
  };
  await T1.click('#pause-btn'); await T1.waitForTimeout(400);
  console.log('DAY 1  pause card:', (await T1.textContent('#pause-label')).trim(),
              '/', (await T1.textContent('#pause-code')).trim());
  console.log('DAY 1  stopped at:', (await T1.textContent('#pause-where')).trim());
  console.log('DAY 1  treasury', d1.treasury, '| stability', d1.stability,
              '| Virginia', d1.stuTreasury, 'interest', d1.stuInterest);

  await day1.close();   // the bell goes; every tab closes
  console.log('       ...all tabs closed, browsers gone...');

  // ---------------- DAY TWO: different browser profile entirely ----------------
  const day2 = await b.newContext({ viewport:{width:1500,height:1000} });
  await SHIM.install(day2);          // fresh localStorage, nothing remembered
  const T2 = await day2.newPage();
  T2.on('pageerror', e => errs.push('D2 TEACHER ' + e.message));
  await T2.goto('http://localhost:8899/teacher.html');
  await T2.waitForTimeout(900);

  const recent = await T2.$$eval('#recent-list tbody tr', rows => rows.map(r =>
    r.children[0].innerText.split('\n')[0] + ' / ' + r.children[1].innerText.trim() +
    ' / ' + r.children[2].innerText.trim()));
  console.log('DAY 2  recent sessions listed:');
  recent.forEach(r => console.log('         ' + r));

  await T2.fill('#resume-code', code.toLowerCase());   // typed in lower case on purpose
  await T2.click('#resume-btn');
  await T2.waitForSelector('#game:not(.hidden)', { timeout: 15000 });
  await T2.waitForTimeout(900);
  console.log('DAY 2  resumed:', await T2.textContent('#code-label'), await T2.textContent('#game-code'));
  console.log('DAY 2  treasury', await T2.textContent('#nat-treasury'),
              '| stability', await T2.textContent('#stab-val'),
              '| on resolution', await T2.textContent('#round-label'));

  // the group returns on a different laptop and takes its state back
  const S2 = await day2.newPage();
  S2.on('pageerror', e => errs.push('D2 STUDENT ' + e.message));
  S2.on('dialog', d => d.accept());
  await S2.goto('http://localhost:8899/student.html');
  await S2.fill('#names','Maya and Dev'); await S2.fill('#code',code); await S2.click('#join-btn');
  await S2.waitForSelector('#s-claim:not(.hidden)');
  const held = await S2.$$eval('.claim', els => els.filter(e => /held by/i.test(e.innerText))   // the pill renders uppercase
    .map(e => e.querySelector('.t').innerText.replace(/\s+/g,' ').trim()));
  console.log('DAY 2  states shown as held:', held.join(' | ') || '(none)');
  await S2.locator('.claim',{has:S2.locator('.t',{hasText:/Virginia/})}).click();
  await S2.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
  await S2.waitForTimeout(900);
  console.log('DAY 2  Virginia back with treasury', await S2.textContent('#p-treas'),
              'interest', await S2.textContent('#p-int'));

  console.log('\nSTATE CARRIED OVER:',
    (await T2.textContent('#nat-treasury')) === d1.treasury &&
    (await T2.textContent('#stab-val')) === d1.stability &&
    (await S2.textContent('#p-treas')) === d1.stuTreasury);

  // and day two can actually continue
  await T2.click('#next-btn'); await T2.waitForTimeout(1600);
  console.log('DAY 2  can continue:', (await T2.textContent('#res-title')).trim());
  // the round-1 entry is written when the teacher moves on, so check it here
  const rec = await S2.$$eval('#p-record .rec', e => e.map(x => x.textContent.replace(/\s+/g,' ').trim()));
  console.log('DAY 2  day-one record on their screen:', rec.join(' / ') || '(none)');
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

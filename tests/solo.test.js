const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await p.goto('http://localhost:8899/solo.html');
  await p.locator('.claim', { has: p.locator('.t', { hasText: /^Virginia$/ }) }).click();
  await p.waitForSelector('#s-play:not(.hidden)');
  console.log('picked Virginia; resolution =', await p.textContent('#r-title'));
  console.log('cost line   =', (await p.textContent('#cost-body')).replace(/\s+/g,' ').slice(0,110));

  for (let round = 1; round <= 4; round++) {
    const title = await p.textContent('#r-title');
    // make a deal each round to exercise that path
    if (await p.isVisible('#dsend') && !(await p.isDisabled('#dsend'))) {
      await p.selectOption('#dt', { index: 3 });
      await p.click('#dsend');
      await p.waitForTimeout(80);
    }
    const leans = await p.$$eval('#lean .seat .vt', els => els.map(e => e.textContent));
    await p.click('button:has-text("YES")');
    await p.waitForSelector('#seat-card:not(.hidden)');
    const head = await p.textContent('#seat-head');
    const pill = await p.textContent('#seat-pill');

    let payLine = '';
    if (await p.isVisible('#pay-card')) {
      await p.click('button:has-text("PAY NOTHING")');
      await p.waitForSelector('#out-card:not(.hidden)');
      payLine = ' | paid: NOTHING';
    }
    await p.waitForSelector('#out-card:not(.hidden)');
    const money = await p.isVisible('#out-money')
      ? ` | asked ${await p.textContent('#o-ask')} got ${await p.textContent('#o-got')} (${await p.textContent('#o-pct')})` : '';
    const stab = await p.textContent('#stats .stat:nth-child(3) .v');
    console.log(`R${round} ${title}\n   ${head} — ${pill}${payLine}${money} | stability ${stab}`);
    console.log('   leaning yes:', leans.filter(l=>l==='leaning yes').length,
                'no:', leans.filter(l=>l==='leaning no').length,
                'undecided:', leans.filter(l=>l==='undecided').length);
    await p.click('#next-btn');
    await p.waitForTimeout(250);
  }

  await p.waitForSelector('#s-end:not(.hidden)');
  const tier = await p.textContent('#s-end h1');
  const rows = await p.$$eval('#s-end table tbody tr', r => r.length);
  console.log('\nDEBRIEF tier:', tier, '| standings rows:', rows);
  console.log('has "two numbers" panel:', (await p.content()).includes('The whole problem, in two numbers'));
  await p.screenshot({ path: 'tests/out-solo-debrief.png', fullPage: true });
  console.log('\nERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();

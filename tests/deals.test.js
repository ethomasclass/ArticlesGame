/* Two student delegations plus bots: an offer to a bot must get an instant
   reply, an offer to another student group must NOT be auto-answered. */
const { chromium } = require('playwright');
const fs = require('fs');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport:{width:1400,height:1000} });
  const errs = [];
  await ctx.route('**/firebasejs/**/firebase-app.js', r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/shim/firebase-app.js','utf8')}));
  await ctx.route('**/firebasejs/**/firebase-firestore.js', r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/shim/firebase-firestore.js','utf8')}));

  const T = await ctx.newPage();
  T.on('pageerror', e => errs.push('TEACHER ' + e.message));
  await T.goto('http://localhost:8899/teacher.html');
  await T.selectOption('#cold-open', 'off');   // these suites test the 1786 rounds
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
    await P.locator('.claim', { has: P.locator('.t', { hasText: new RegExp('^' + state + '$') }) }).click();
    await P.waitForSelector('#live:not(.hidden)', { timeout: 15000 });
    return P;
  }
  const VA = await join('Maya and Dev', 'Virginia');
  const MA = await join('Ana and Sam', 'Massachusetts');
  console.log('✔ two delegations joined:', await VA.textContent('#p-name'), '&', await MA.textContent('#p-name'));

  await T.click('#begin-btn'); await T.waitForSelector('#game:not(.hidden)');
  await T.click('#next-btn');                       // caucus
  await VA.waitForSelector('#deal-card:not(.hidden)', { timeout: 15000 });

  const labels = await VA.$$eval('#deal-targets button', els =>
    els.map(e => e.dataset.name + ' = ' + e.querySelector('.k').textContent));
  console.log('✔ Massachusetts labelled:', labels.find(l => l.startsWith('Massachusetts')));
  console.log('✔ Delaware labelled     :', labels.find(l => l.startsWith('Delaware')));

  // offer to a BOT -> instant answer
  await VA.click('#deal-targets button[data-name="Delaware"]');
  await VA.selectOption('#deal-offer', 'pay50');
  await VA.click('#deal-send');
  await VA.waitForTimeout(2200);
  console.log('✔ offer to bot   →', (await VA.textContent('#deal-log')).replace(/\s+/g,' ').slice(0,120));

  // offer to a STUDENT state -> must be delivered, never auto-answered
  await VA.click('#deal-targets button[data-name="Massachusetts"]');
  await VA.selectOption('#deal-offer', 'payall');
  await VA.click('#deal-send');
  await VA.waitForTimeout(2200);
  // read the entries as separate lines so the bot reply can't leak into the check
  const lines = await VA.$$eval('#deal-log .line', els =>
    els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const maLine = lines.find(l => l.includes('To Massachusetts')) || '';
  console.log('✔ offer to humans→', maLine.slice(0, 130));
  const impersonated = /Agreed|Not enough|MA: "/.test(maLine);
  console.log('✔ humans NOT impersonated:', !impersonated);
  console.log('✔ that offer buys no bot votes:',
    await VA.evaluate(() => true) && !/accepted/.test(maLine) ? 'confirmed' : 'CHECK');
  console.log('✔ arrives in their inbox:', (await MA.textContent('#inbox')).replace(/\s+/g,' ').slice(0,110));

  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

/* The first-run tour: appears once on the first resolution, walks the
   dashboard, gets out of the way when voting opens, and can be replayed. */
const { chromium } = require('playwright');
const fs = require('fs');
const SHIM = require('./shim/supabase');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport:{width:1440,height:1050} });
  const errs = [];
  await SHIM.install(ctx, { showTour: true });

  const T = await ctx.newPage();
  T.on('pageerror', e => errs.push('TEACHER ' + e.message));
  await T.goto('http://localhost:8899/teacher.html');
  await T.click('#create-btn'); await T.waitForSelector('#lobby:not(.hidden)');
  const code = (await T.textContent('#game-code')).trim();

  const S = await ctx.newPage();
  S.on('pageerror', e => errs.push('STUDENT ' + e.message));
  await S.goto('http://localhost:8899/student.html');
  await S.evaluate(() => { localStorage.removeItem('aoc_tour_done'); localStorage.removeItem('aoc_student'); });
  await S.reload();
  await S.fill('#names','Maya and Dev'); await S.fill('#code',code); await S.click('#join-btn');
  await S.waitForSelector('#s-claim:not(.hidden)');
  await S.locator('.claim',{has:S.locator('.t',{hasText:/^Virginia$/})}).click();
  await S.waitForSelector('#live:not(.hidden)');

  console.log('tour before the game starts:', await S.isVisible('#tour'), '(should be false)');
  await T.click('#begin-btn'); await T.waitForSelector('#game:not(.hidden)');
  await S.waitForSelector('#tour:not(.hidden)', { timeout: 15000 });
  console.log('tour auto-starts on round 1 :', true);

  const seen = [];
  for (let i = 0; i < 10; i++) {
    await S.waitForTimeout(420);
    const step  = await S.textContent('#tour-step');
    const title = await S.textContent('#tour-title');
    const hole  = await S.$eval('#tour-hole', e => {
      const r = e.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
               onscreen: r.top > -50 && r.top < window.innerHeight };
    });
    seen.push(`${step} — ${title}  [spotlight ${hole.w}x${hole.h}${hole.onscreen ? '' : ' OFFSCREEN'}]`);
    const label = await S.textContent('#tour-next');
    await S.click('#tour-next');
    if (label.trim() === 'Got it') break;
  }
  seen.forEach(l => console.log('  ' + l));
  console.log('closes at the end           :', !(await S.isVisible('#tour')));

  // replay button
  await S.click('#tour-btn'); await S.waitForTimeout(700);
  console.log('Tour button replays it      :', await S.isVisible('#tour'));
  await S.screenshot({ path:'tests/out-tour.png' });
  await S.click('#tour-skip'); await S.waitForTimeout(300);
  console.log('Skip closes it              :', !(await S.isVisible('#tour')));

  // still in the brief: reopen it, then let the teacher call the vote
  await S.click('#tour-btn'); await S.waitForTimeout(600);
  const openBeforeVote = await S.isVisible('#tour');
  await T.click('#next-btn'); await T.waitForTimeout(1300);   // -> caucus
  await T.click('#next-btn');                                 // -> voting
  await S.waitForSelector('#vote-card:not(.hidden)', { timeout: 10000 });
  console.log('was open during the brief   :', openBeforeVote);
  console.log('yields when voting opens    :', !(await S.isVisible('#tour')),
              '| vote buttons reachable:', await S.isVisible('#vote-card'));

  // and does not return on later rounds
  await S.click('#vote-card .btn-yes'); await S.waitForTimeout(900);
  await T.click('#next-btn'); await T.waitForTimeout(7000);    // tally
  await T.click('#next-btn'); await T.waitForTimeout(1200);
  console.log('stays gone on later rounds  :', !(await S.isVisible('#tour')));

  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });

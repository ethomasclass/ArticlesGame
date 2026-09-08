/* The connection test must name the actual broken link, not just fail. */
const { chromium } = require('playwright');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CFG = { backend:'supabase',
  supabase:{ url:'https://test.supabase.co', anonKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaaaaaaaaaaaaaaaaaa' },
  firebase:{} };

async function scenario(b, name, routes, cfg) {
  const ctx = await b.newContext({ viewport:{width:1200,height:900} });
  await ctx.route('**/assets/config.js', r => r.fulfill({ contentType:'application/javascript',
    body: 'window.AOC_CONFIG = ' + JSON.stringify(cfg || CFG) + ';' }));
  for (const [pattern, handler] of routes) await ctx.route(pattern, handler);
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/teacher.html');
  await p.click('#test-btn');
  await p.waitForFunction(() => {
    const d = document.getElementById('diag');
    return d && !d.classList.contains('hidden') && !/Testing…/.test(d.textContent);
  }, null, { timeout: 15000 });
  const lines = await p.$$eval('#diag div div > strong', els => els.map(e => e.textContent.trim()));
  const fixes = await p.$eval('#diag', el => {
    const t = el.innerText;
    const m = t.match(/Fix:[^\n]*/g);
    return m ? m.map(x => x.slice(0, 96)) : [];
  });
  console.log('\n=== ' + name + ' ===');
  console.log('  ' + lines.join('  |  '));
  fixes.forEach(f => console.log('  ' + f));
  await ctx.close();
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ok = (body) => (r) => r.fulfill({ status:200, contentType:'application/json', body });

  await scenario(b, 'Everything working', [
    ['https://test.supabase.co/rest/v1/', ok('{}')],
    ['https://test.supabase.co/rest/v1/aoc_games*', ok('[]')],
    ['https://test.supabase.co/rest/v1/rpc/*', ok('"empty"')],
  ]);

  await scenario(b, 'SQL never run (no tables)', [
    ['https://test.supabase.co/rest/v1/', ok('{}')],
    ['https://test.supabase.co/rest/v1/aoc_games*', r => r.fulfill({ status:404, body:'{"message":"relation does not exist"}' })],
    ['https://test.supabase.co/rest/v1/rpc/*', r => r.fulfill({ status:404, body:'{"message":"function not found"}' })],
  ]);

  await scenario(b, 'Bad key', [
    ['https://test.supabase.co/rest/v1/', ok('{}')],
    ['https://test.supabase.co/rest/v1/aoc_games*', r => r.fulfill({ status:401, body:'{"message":"invalid key"}' })],
    ['https://test.supabase.co/rest/v1/rpc/*', r => r.fulfill({ status:401, body:'{}' })],
  ]);

  await scenario(b, 'Cannot reach Supabase at all', [
    ['https://test.supabase.co/**', r => r.abort('connectionfailed')],
  ]);

  await scenario(b, 'Config still has placeholders', [], { backend:'supabase',
    supabase:{ url:'PASTE_YOUR_PROJECT_URL_HERE', anonKey:'PASTE_YOUR_ANON_PUBLIC_KEY_HERE' }, firebase:{} });

  await b.close();
})();

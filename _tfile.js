const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => console.log('PAGEERROR:', e.message));
  p.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text().slice(0,200)); });
  await p.goto('file://' + path.join(process.cwd(),'download','confederation-teacher.html'));
  await p.click('#test-btn');
  await p.waitForTimeout(45000);
  console.log('---diag---');
  console.log(await p.$eval('#diag', el => el.innerText.trim()).catch(e => 'no diag: ' + e.message));
  await b.close();
})();

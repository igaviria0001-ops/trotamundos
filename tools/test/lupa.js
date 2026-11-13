const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => TMD.UI.ir('juego_lupa', { modo: 'lupa', cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1200);
  const c = await p.locator('.lupa-lente').boundingBox();
  await p.mouse.move(c.x + 40, c.y + 60); await p.mouse.down();
  for (let i = 0; i < 12; i++) await p.mouse.move(c.x + 40 + i * 22, c.y + 60 + (i % 2) * 70, { steps: 3 });
  await p.mouse.up();
  await p.screenshot({ path: 'scratch/lupa-1.png' });
  await p.click('.opcion >> nth=0'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'scratch/lupa-2.png' });
  console.log('errores', errs);
  await b.close();
})();

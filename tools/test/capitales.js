const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width < 500 ? '' : '-pc';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => TMD.UI.ir('juego_capitales', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `scratch/cap-1${suf}.png` });
  // arrastra el primer país a la primera capital, y toca-toca los demás
  const a = await p.locator('.cap-item.pais').nth(0).boundingBox(), c = await p.locator('.cap-item.cap').nth(0).boundingBox();
  await p.mouse.move(a.x + a.width - 10, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(c.x + 20, c.y + c.height / 2, { steps: 8 });
  await p.screenshot({ path: `scratch/cap-2${suf}.png` });
  await p.mouse.up();
  for (let k = 1; k < 4; k++) { await p.locator('.cap-item.pais').nth(k).click(); await p.locator('.cap-item.cap').nth(k).click(); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: `scratch/cap-3${suf}.png` });
  await p.click('.ns-pie .btn'); await p.waitForTimeout(600);
  await p.screenshot({ path: `scratch/cap-4${suf}.png` });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `scratch/cap-5${suf}.png` });
  console.log('errores', errs);
  await b.close();
})();

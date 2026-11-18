const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width < 500 ? '' : '-pc';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => TMD.UI.ir('juego_lineatiempo', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1300); await p.click('.ns-pie .btn'); await p.waitForTimeout(2200);
  await p.screenshot({ path: `scratch/lt-2${suf}.png` });
  await p.evaluate(() => TMD.UI.ir('juego_rompepostal', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/rp2-1${suf}.png` });
  // arrastra una ficha a otra celda
  const f = await p.locator('.rp2-ficha').nth(0).boundingBox(), g = await p.locator('.rp2-ficha').nth(5).boundingBox();
  await p.mouse.move(f.x + f.width / 2, f.y + f.height / 2); await p.mouse.down(); await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2, { steps: 6 });
  await p.screenshot({ path: `scratch/rp2-2${suf}.png` }); await p.mouse.up(); await p.waitForTimeout(300);
  await p.click('.rp2-se'); await p.waitForTimeout(500);
  await p.screenshot({ path: `scratch/rp2-3${suf}.png` });
  // resolver por código para ver el final
  await p.evaluate(() => { const fs = [...document.querySelectorAll('.rp2-ficha')]; });
  await p.evaluate(() => TMD.UI.ir('juego_explorar'));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/ex-1${suf}.png` });
  await p.fill('.ex-buscar', 'machu'); await p.waitForTimeout(300);
  await p.screenshot({ path: `scratch/ex-2${suf}.png` });
  await p.click('.ex-res >> nth=0'); await p.waitForTimeout(1800);
  await p.screenshot({ path: `scratch/ex-3${suf}.png` });
  console.log('errores', errs);
  await b.close();
})();

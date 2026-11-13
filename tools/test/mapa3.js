const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width < 500 ? '' : '-pc';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  const tapIso = async (iso) => {
    const xy = await p.evaluate((iso) => { const g = TMD.globo; const q = g.pantalla(TMD.centroPais(iso)); const r = g.cv.getBoundingClientRect(); return [q[0] + r.left, q[1] + r.top]; }, iso);
    await p.mouse.click(xy[0], xy[1]);
  };
  // --- silueta ---
  await p.evaluate(() => TMD.UI.ir('juego_silueta', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/silueta-1${suf}.png` });
  const obj = await p.evaluate(() => TMD.ultimaSil = null);
  for (const iso of ['BR', 'IN', 'AU']) { await p.evaluate(() => TMD.globo.vuela([0, 20], 1, 10)); await p.waitForTimeout(100); await p.evaluate(iso => TMD.globo.vuela(TMD.centroPais(iso), 1, 10), iso); await p.waitForTimeout(150); await tapIso(iso); await p.waitForTimeout(200); await p.click('.accion .aqui'); await p.waitForTimeout(900); }
  await p.screenshot({ path: `scratch/silueta-2${suf}.png` });
  // --- brujula ---
  await p.evaluate(() => TMD.UI.ir('juego_brujula', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(2600);
  const c = await p.locator('.brujula-capa').boundingBox();
  await p.mouse.move(c.x + c.width * .7, c.y + c.height * .45); await p.mouse.down(); await p.mouse.move(c.x + c.width * .8, c.y + c.height * .35, { steps: 4 }); await p.mouse.up();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `scratch/brujula-1${suf}.png` });
  await p.click('.accion .aqui'); await p.waitForTimeout(700);
  await p.screenshot({ path: `scratch/brujula-2${suf}.png` });
  await p.waitForTimeout(3600);
  await p.screenshot({ path: `scratch/brujula-3${suf}.png` });
  // --- nortesur ---
  await p.evaluate(() => TMD.UI.ir('juego_nortesur', { cont: 'todo', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `scratch/nortesur-1${suf}.png` });
  const cs = await p.locator('.ns-carta').nth(0).boundingBox();
  await p.mouse.move(cs.x + cs.width / 2, cs.y + cs.height / 2); await p.mouse.down(); await p.mouse.move(cs.x + cs.width / 2, cs.y + cs.height * 2.2, { steps: 8 });
  await p.screenshot({ path: `scratch/nortesur-2${suf}.png` });
  await p.mouse.up(); await p.waitForTimeout(400);
  await p.click('.ns-pie .btn'); await p.waitForTimeout(2600);
  await p.screenshot({ path: `scratch/nortesur-3${suf}.png` });
  await p.click('.ns-pie .btn'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/nortesur-4${suf}.png` });
  console.log('errores', errs);
  await b.close();
})();

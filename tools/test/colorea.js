const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => TMD.UI.ir('tiquete', 'colorea'));
  await p.waitForTimeout(700);
  await p.click('.chip[data-v="EU"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'scratch/colorea-0.png' });
  await p.evaluate(() => TMD.UI.ir('juego_colorea', { cont: 'EU', nivel: '1', rondas: 5 }));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: 'scratch/colorea-1.png' });
  const tapIso = async (iso) => {
    const xy = await p.evaluate((iso) => { const g = TMD.globo; const q = g.pantalla(TMD.centroPais(iso)); const r = g.cv.getBoundingClientRect(); return [q[0] + r.left, q[1] + r.top]; }, iso);
    await p.mouse.click(xy[0], xy[1]);
  };
  const objetivo = async () => p.evaluate(() => document.querySelector('.orden-nombre').textContent);
  // falla una vez a propósito y luego acierta
  await tapIso('ES'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'scratch/colorea-2.png' });
  for (let k = 0; k < 8; k++) {
    const n = await objetivo();
    const iso = await p.evaluate(n => TMD.PAISES.find(x => x.n === n).iso, n);
    await tapIso(iso); await p.waitForTimeout(k === 2 ? 350 : 1500);
    if (k === 2) await p.screenshot({ path: 'scratch/colorea-3.png' });
  }
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'scratch/colorea-4.png' });
  console.log('errores', errs);
  await b.close();
})();

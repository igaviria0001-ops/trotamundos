const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width < 500 ? '' : '-pc';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.evaluate(c => TMD.UI.ir('juego_rompepaises', { cont: c, nivel: '1', rondas: 5 }), process.argv[3] || 'SA');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/rompe-1${suf}.png` });
  // arrastrar la primera pieza a un lugar errado y luego al correcto
  const arrastrar = async (destino) => {
    const f = await p.locator('.rp-pieza').nth(0).boundingBox();
    await p.mouse.move(f.x + f.width / 2, f.y + f.height / 2); await p.mouse.down();
    const xy = destino || [vp.width * .2, 120];
    await p.mouse.move(xy[0], xy[1], { steps: 10 });
    return f;
  };
  await arrastrar(); await p.screenshot({ path: `scratch/rompe-2${suf}.png` }); await p.mouse.up(); await p.waitForTimeout(600);
  for (let k = 0; k < 4; k++) {
    const iso = await p.evaluate(() => document.querySelector('.rp-pieza').dataset.iso);
    const xy = await p.evaluate(iso => { const h = document.querySelector(`.rp-hueco[data-iso="${iso}"]`); const r = h.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, iso);
    // el dedo va debajo de la pieza: compensar con la medida de la pieza flotante
    const f = await p.locator('.rp-pieza').nth(0).boundingBox();
    await p.mouse.move(f.x + f.width / 2, f.y + f.height / 2); await p.mouse.down();
    await p.mouse.move(xy[0], xy[1], { steps: 6 });
    const off = await p.evaluate(() => { const fl = document.querySelector('.rp-flota'); const r = fl.getBoundingClientRect(); return [r.width / 2, r.height + 28]; });
    await p.mouse.move(xy[0], xy[1] + off[1] - (await p.evaluate(() => document.querySelector('.rp-flota').getBoundingClientRect().height / 2)), { steps: 4 });
    await p.mouse.up(); await p.waitForTimeout(700);
  }
  await p.screenshot({ path: `scratch/rompe-3${suf}.png` });
  console.log('errores', errs);
  await b.close();
})();

const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width < 500 ? '' : '-pc';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  const info = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); const ok = TMD.PAISES_JUEGO.filter(p => analizarBandera(p.iso)); return { n: ok.length, l1: ok.filter(p => p.t === 1).map(p => p.iso).join(' '), no: TMD.PAISES_JUEGO.filter(p => p.t === 1 && !analizarBandera(p.iso)).map(p => p.iso).join(' ') }; });
  console.log(info);
  const modo = process.argv[3] || 'pintabandera';
  await p.evaluate(m => TMD.UI.ir('juego_' + m, { cont: 'todo', nivel: '1', rondas: 5 }), modo);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/${modo}-1${suf}.png` });
  if (modo === 'pintabandera') {
    // pinta con colores al azar cada zona
    const n = await p.locator('.pb-color').count();
    for (let k = 0; k < 6; k++) {
      await p.locator('.pb-color').nth(k % n).click();
      const els = await p.$$('.pb-lienzo [data-g]');
      const el = els[k % els.length]; const bb = await el.boundingBox();
      if (bb) await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    }
    await p.screenshot({ path: `scratch/${modo}-2${suf}.png` });
    const dis = await p.evaluate(() => document.querySelector('.pb-pie .btn').disabled);
    if (!dis) { await p.click('.pb-pie .btn'); await p.waitForTimeout(1800); await p.screenshot({ path: `scratch/${modo}-3${suf}.png` }); }
  }
  console.log('errores', errs);
  await b.close();
})();

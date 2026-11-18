const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'pc' ? { width: 1440, height: 900 } : process.argv[2] === 'chico' ? { width: 360, height: 640 } : { width: 390, height: 844 };
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 500, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const suf = vp.width >= 900 ? '-pc' : vp.height < 700 ? '-chico' : '';
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  // un poco de progreso falso para ver las pantallas con datos
  await p.evaluate(() => { const P = TMD.Progreso; P.load(); TMD.LUGARES.slice(0, 60).forEach((l, i) => P.registrar(l.id, i % 3 ? 1 : .5)); ['p:FR', 'p:BR', 'b:JP', 'c:EG', 'p:CO', 'p:AU'].forEach(k => { P.registrar(k, 1); P.registrar(k, 1); P.registrar(k, 1); }); P.sumar(23000, 5); });
  await p.evaluate(() => TMD.UI.ir('inicio')); await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/f6-inicio${suf}.png` });
  await p.evaluate(() => TMD.UI.ir('pasaporte')); await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/f6-pasaporte${suf}.png` });
  await p.evaluate(() => document.querySelector('.pa-zona').scrollTop = 700); await p.waitForTimeout(500);
  await p.screenshot({ path: `scratch/f6-pasaporte2${suf}.png` });
  await p.evaluate(() => TMD.UI.ir('album')); await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/f6-album${suf}.png` });
  await p.evaluate(() => TMD.UI.ir('medida')); await p.waitForTimeout(800);
  await p.screenshot({ path: `scratch/f6-medida${suf}.png` });
  await p.click('.pie-fijo .btn'); await p.waitForTimeout(1000);
  await p.screenshot({ path: `scratch/f6-cadena${suf}.png` });
  await p.click('.pie-fijo .btn'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `scratch/f6-cadena-juego${suf}.png` });
  console.log('errores', errs);
  await b.close();
})();

const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => TMD.UI.ir('juego_parejas', { modo: 'parejas', cont: 'todo', nivel: '1', rondas: 5, parejaTipo: 'nombre-bandera' }));
  await p.waitForTimeout(1000);
  await p.click('.carta-mem >> nth=0'); await p.click('.carta-mem >> nth=1'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'scratch/parejas-1.png' });
  console.log('errores', errs);
  await b.close();
})();

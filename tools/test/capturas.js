// Capturas de las pantallas principales en celular y PC
// uso: node tools/test/capturas.js [celular|pc|todo]   (necesita servidor en :8765 sirviendo docs/)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = __dirname + '/../../scratch/';
const VIEWS = {
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  pc: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  chico: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
(async () => {
  const which = process.argv[2] || 'todo';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, opt] of Object.entries(VIEWS)) {
    if (which !== 'todo' && which !== name) continue;
    const ctx = await b.newContext(opt);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://localhost:8765/index.html');
    await p.waitForTimeout(2500);
    await p.screenshot({ path: OUT + `${name}-1-inicio.png` });
    await p.evaluate(() => TMD.UI.ir('modos'));
    await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + `${name}-2-modos.png` });
    await p.evaluate(() => TMD.UI.ir('tiquete', 'postal'));
    await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + `${name}-3-tiquete.png` });
    await p.evaluate(() => TMD.UI.ir('juego_postal', { modo: 'postal', cont: 'todo', nivel: '1', rondas: 5 }));
    await p.waitForTimeout(2200);
    await p.screenshot({ path: OUT + `${name}-4-postal.png` });
    // tocar el globo en el centro de la zona libre
    const box = await p.locator('.globo-cont canvas').boundingBox();
    await p.mouse.click(box.x + box.width * .5, box.y + box.height * .62);
    await p.waitForTimeout(900);
    await p.screenshot({ path: OUT + `${name}-5-pin.png` });
    await p.click('.aqui');
    await p.waitForTimeout(3600);
    await p.screenshot({ path: OUT + `${name}-6-resultado.png` });
    console.log(name, 'errores:', errs.length ? errs : 'ninguno');
    await ctx.close();
  }
  await b.close();
})();

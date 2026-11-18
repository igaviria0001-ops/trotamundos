// abre cada modo (y las pantallas principales) en el tamaño pedido y guarda una captura de cada uno
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const tam = { pc: { width: 1440, height: 900 }, chico: { width: 360, height: 640 }, cel: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 } }[process.argv[2] || 'cel'];
  const p = await (await b.newContext({ viewport: tam, deviceScaleFactor: 1, isMobile: tam.width < 900, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  await p.evaluate(() => { localStorage.setItem('tmd_bienvenida', '1'); document.querySelector('#capa').innerHTML = ''; });
  const modos = ['postal', 'raspa', 'lupa', 'pistas', 'parejas', 'rompepostal', 'colorea', 'rompepaises', 'silueta', 'brujula', 'nortesur', 'pintabandera', 'banderasviento', 'capitales', 'lineatiempo', 'masalto', 'explorar', 'maleta'];
  const pant = [['inicio'], ['modos'], ['tiquete', 'colorea'], ['album'], ['pasaporte'], ['medida'], ['expedicion']];
  for (const [n, a] of pant) { await p.evaluate(([n, a]) => TMD.UI.ir(n, a), [n, a]); await p.waitForTimeout(1100); await p.screenshot({ path: `scratch/todo/${process.argv[2] || 'cel'}-${n}.png` }); }
  for (const m of modos) {
    await p.evaluate(m => TMD.UI.ir('juego_' + m, { cont: 'todo', nivel: '1', rondas: 5 }), m);
    await p.waitForTimeout(1800);
    await p.evaluate(() => { const d = document.querySelector('#capa .dialogo .btn'); d && d.click(); });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `scratch/todo/${process.argv[2] || 'cel'}-${m}.png` });
  }
  console.log('errores', errs);
  await b.close();
})();

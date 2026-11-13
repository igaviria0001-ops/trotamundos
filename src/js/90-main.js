// ===== arranque =====
(function arrancar() {
  Ajustes.load();
  decorarCielo();
  Progreso.load();
  Mapa.init();
  Banderas.cargar();
  // el primer toque despierta el audio (los navegadores lo exigen)
  const despertar = () => { Sonido.init(); document.removeEventListener('pointerdown', despertar); };
  document.addEventListener('pointerdown', despertar);
  const inicio = (location.hash || '').slice(1);
  UI.ir(inicio === 'modos' ? 'modos' : 'inicio');
  window.TMD = { UI, Progreso, LUGARES, PAISES, PAISES_JUEGO, Mapa, centroPais, globo: null }; // para pruebas
})();

// adornos del fondo: nubes con volumen, garabatos de viaje y colinas
function decorarCielo() {
  const r = document.documentElement.style;
  try { [0, 1, 2].forEach(i => r.setProperty('--nube' + (i + 1), `url(${spriteNube(i).toDataURL()})`)); } catch (e) { }
  const garabatos = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".55"><path d="M20 40l14-4 2 2-6 4 5 1-1 2-6-1-4 2z" fill="#fff"/><path d="M150 30l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/><circle cx="96" cy="96" r="3" fill="#fff"/><path d="M30 150c6-6 12 6 18 0s12 6 18 0"/><path d="M160 140c0-9 7-15 15-15s15 6 15 15c0 11-15 26-15 26s-15-15-15-26z"/><circle cx="175" cy="140" r="4"/><circle cx="60" cy="200" r="2.4" fill="#fff"/><path d="M110 180l6 6m0-6l-6 6"/><circle cx="200" cy="60" r="2" fill="#fff"/></g></svg>`;
  r.setProperty('--garabatos', `url("data:image/svg+xml;utf8,${encodeURIComponent(garabatos)}")`);
  const arbol = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2" y="-2" width="4" height="12" rx="2" fill="#9B6A3C"/><circle cx="0" cy="-10" r="11" fill="#55B866"/><circle cx="-3.5" cy="-14" r="4" fill="#8EDB8F" opacity=".8"/></g>`;
  const colinas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 70 C60 40 110 44 170 64 S300 30 400 56 V120 H0z" fill="#B9E7B8"/><path d="M0 70 C60 40 110 44 170 64 S300 30 400 56" fill="none" stroke="#DDF6D7" stroke-width="3"/><path d="M0 92 C70 70 140 78 210 92 S330 74 400 86 V120 H0z" fill="#8FD597"/><path d="M0 92 C70 70 140 78 210 92 S330 74 400 86" fill="none" stroke="#C3EDC0" stroke-width="3"/>${arbol(40, 72, .9)}${arbol(62, 76, .7)}${arbol(300, 70, .85)}${arbol(352, 60, .7)}${arbol(250, 88, .6)}</svg>`;
  try { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.fillStyle = patronOlas(g); g.fillRect(0, 0, 96, 96); r.setProperty('--olas', `url(${c.toDataURL()})`); } catch (e) { }
  r.setProperty('--colinas', `url("data:image/svg+xml;utf8,${encodeURIComponent(colinas)}")`);
}

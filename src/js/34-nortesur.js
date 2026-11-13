// ===== Modo: De norte a sur =====
// Cuatro postales: ordénalas de norte a sur (en columna) o de oeste a este (en fila). Luego el globo
// muestra dónde está cada una, con su paralelo o su meridiano.
function grupoOrdenar(pool, base, eje, nivel) {
  const val = eje === 'ns' ? l => l.lat : l => l.lon;
  const sep = (nivel === '3' ? 1.6 : 2.6) * (eje === 'oe' ? 1.5 : 1);
  // primero sin repetir país; si no alcanza, se permite
  for (const mismoPais of [false, true]) {
    const out = [base];
    for (const x of shuffle(pool)) {
      if (out.length === 4) break;
      if (out.some(o => o.id === x.id || (!mismoPais && o.iso[0] === x.iso[0]))) continue;
      if (out.every(o => Math.abs(val(o) - val(x)) >= sep)) out.push(x);
    }
    if (out.length === 4) return out;
  }
  return null;
}
function paresBien(orden, correcto) {
  let ok = 0, tot = 0;
  for (let i = 0; i < orden.length; i++) for (let j = i + 1; j < orden.length; j++) {
    tot++; if (correcto.indexOf(orden[i]) < correcto.indexOf(orden[j])) ok++;
  }
  return { ok, tot };
}

Pantallas.juego_nortesur = (cfg) => {
  Progreso.load();
  const pool = poolModo('nortesur', cfg);
  const bases = Progreso.elegir(pool, Math.min(escalaModo('nortesur', cfg.rondas), pool.length));
  const rondas = [];
  bases.forEach((b, k) => {
    let eje = k % 2 ? 'oe' : 'ns', g = grupoOrdenar(pool, b, eje, cfg.nivel);
    if (!g) { eje = eje === 'ns' ? 'oe' : 'ns'; g = grupoOrdenar(pool, b, eje, cfg.nivel); }
    if (g) rondas.push({ eje, lugares: shuffle(g) });
  });
  const N = rondas.length;
  const P = crearPartida({ modo: 'nortesur', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', orden: [] };

  const globoCont = h('div.ns-globo');
  const cinta = h('div.ns-cinta');
  const tablero = h('div.ns-tablero');
  const etqIni = h('span.ns-etq.ini'), etqFin = h('span.ns-etq.fin');
  const marco = h('div.ns-marco', etqIni, tablero, etqFin);
  const banner = h('div.ns-banner');
  const btn = h('button.btn.grande.ancho', { onclick: () => S.estado === 'jugando' ? revisar() : siguiente() }, h('span', { html: I.check }), h('span.ns-btn-txt', '¡Listo!'));
  P.escena.append(h('div.ns-zona', globoCont, cinta, marco, banner, h('div.ns-pie', btn)));

  let globo;
  const ahora = () => rondas[P.i];

  // ----- tarjetas que se arrastran -----
  let cartas = [], paso = 0;
  function medir() {
    const r = ahora(), n = cartas.length, gap = 8;
    if (r.eje === 'ns') {
      const alto = clamp(Math.floor((tablero.clientHeight - gap * (n - 1)) / n), 52, 74);
      paso = alto + gap;
      cartas.forEach(c => { c.style.height = alto + 'px'; c.style.width = '100%'; });
    } else {
      const ancho = Math.floor((tablero.clientWidth - gap * (n - 1)) / n);
      paso = ancho + gap;
      cartas.forEach(c => { c.style.width = ancho + 'px'; c.style.height = '100%'; });
    }
  }
  function ubicar(sin = null) {
    const r = ahora();
    S.orden.forEach((l, k) => {
      const c = cartas.find(x => x.dataset.id === l.id);
      if (c === sin) return;
      c.style.transform = r.eje === 'ns' ? `translate(0, ${k * paso}px)` : `translate(${k * paso}px, 0)`;
    });
  }
  function arrastrable(c) {
    let ini = null;
    c.addEventListener('pointerdown', e => {
      if (S.estado !== 'jugando') return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      const r = ahora(), k = S.orden.findIndex(l => l.id === c.dataset.id);
      ini = { x: e.clientX, y: e.clientY, k, base: k * paso };
      c.classList.add('alzada'); Sonido.play('tap'); vibrar(8);
      c.style.transition = 'none';
      c.dataset.eje = r.eje;
    });
    c.addEventListener('pointermove', e => {
      if (!ini) return;
      const r = ahora();
      const d = r.eje === 'ns' ? e.clientY - ini.y : e.clientX - ini.x;
      const pos = clamp(ini.base + d, -paso * .3, paso * (cartas.length - 1 + .3));
      c.style.transform = r.eje === 'ns' ? `translate(0, ${pos}px) scale(1.04)` : `translate(${pos}px, 0) scale(1.04)`;
      const nk = clamp(Math.round(pos / paso), 0, cartas.length - 1);
      const k = S.orden.findIndex(l => l.id === c.dataset.id);
      if (nk !== k) { const [l] = S.orden.splice(k, 1); S.orden.splice(nk, 0, l); ubicar(c); Sonido.play('papel'); }
    });
    const soltar = () => {
      if (!ini) return;
      ini = null; c.classList.remove('alzada'); c.style.transition = '';
      ubicar(); vibrar(6);
    };
    c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
  }

  function ronda() {
    const r = ahora();
    S.estado = 'jugando'; S.orden = r.lugares.slice();
    P.ronda(P.i, `Ronda ${P.i + 1} de ${N}`);
    P.escena.classList.toggle('ns-fila', r.eje === 'oe');
    P.escena.classList.remove('ns-revisado');
    cinta.innerHTML = '';
    cinta.append(h('span.ns-cinta-ico', { html: r.eje === 'ns' ? flechaSVG : flechaSVG, style: { transform: r.eje === 'ns' ? 'rotate(180deg)' : 'rotate(90deg)' } }),
      h('b', r.eje === 'ns' ? 'Ordena de norte a sur' : 'Ordena de oeste a este'));
    etqIni.textContent = r.eje === 'ns' ? 'Norte' : 'Oeste';
    etqFin.textContent = r.eje === 'ns' ? 'Sur' : 'Este';
    banner.className = 'ns-banner'; banner.innerHTML = '';
    $('.ns-btn-txt', btn).textContent = '¡Listo!';
    tablero.innerHTML = '';
    cartas = r.lugares.map(l => {
      const c = h('div.ns-carta', { 'data-id': l.id },
        h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '', draggable: false }),
        h('div.ns-carta-txt', h('b', l.n), h('small', ...l.iso.map(i => Banderas.el(i)), ' ', paisesDe(l))),
        h('span.ns-asa', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>' }),
        h('span.ns-marca'));
      arrastrable(c);
      return c;
    });
    tablero.append(...cartas);
    requestAnimationFrame(() => { medir(); cartas.forEach(c => c.style.transition = 'none'); ubicar(); requestAnimationFrame(() => cartas.forEach(c => c.style.transition = '')); });
    globo.limpiar();
    const [c, z] = vistaDe(cfg);
    globo.vuela(c, Math.min(z, 1.6), 800);
    Sonido.play('papel');
  }

  async function revisar() {
    if (S.estado !== 'jugando') return;
    S.estado = 'revisando';
    const r = ahora();
    const correcto = r.lugares.slice().sort(r.eje === 'ns' ? (a, b) => b.lat - a.lat : (a, b) => a.lon - b.lon);
    const { ok, tot } = paresBien(S.orden, correcto);
    const enSitio = S.orden.filter((l, k) => correcto[k] === l).length;
    const est = ok === tot ? 3 : ok >= tot - 1 ? 2 : ok >= tot - 2 ? 1 : 0;
    const pts = Math.round(1000 * Math.pow(ok / tot, 2));
    // marcas sobre las tarjetas
    S.orden.forEach((l, k) => {
      const c = cartas.find(x => x.dataset.id === l.id), bien = correcto[k] === l;
      c.classList.add(bien ? 'bien' : 'mal');
      $('.ns-marca', c).innerHTML = bien ? I.check : String(correcto.indexOf(l) + 1);
      if (bien) Progreso.registrar(l.id, .6);
    });
    Sonido.play(est >= 3 ? 'genial' : est >= 2 ? 'bien' : est === 1 ? 'medio' : 'lejos');
    if (est >= 3) UI.confeti(40);
    // el globo enseña dónde está cada uno
    const lls = correcto.map(l => [l.lon, l.lat]);
    const cols = ['#EF6F5E', '#FFB020', '#5DBB88', '#3E7CC4'];
    correcto.forEach((l, k) => {
      globo.pin([l.lon, l.lat], { color: cols[k], texto: `${k + 1}. ${l.n}`, esc: .9 });
      globo.linea(r.eje === 'ns' ? { lat: l.lat, color: cols[k] } : { lon: l.lon, color: cols[k] });
    });
    encuadrarVarios(globo, lls);
    const dom = Progreso.registrar(correcto[0].id, est >= 3 ? .8 : .5);
    P.res.push({ l: correcto[0], est, pts, det: `${enSitio} de 4 en su sitio`, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    banner.className = 'ns-banner ve ' + (est >= 2 ? 'bien' : 'mal');
    banner.append(UI.estrellas(est), h('b', est === 3 ? '¡Orden perfecto!' : est === 2 ? '¡Casi perfecto!' : est === 1 ? 'Vas bien' : 'Así es el orden'), h('span.ns-pts', `+${fmt.n(pts)}`));
    // acomoda las tarjetas en el orden correcto
    await sleep(1300);
    S.orden = correcto; ubicar();
    P.escena.classList.add('ns-revisado');
    $('.ns-btn-txt', btn).textContent = P.i >= N - 1 ? 'Ver mi viaje' : 'Siguiente';
    S.estado = 'resultado';
  }
  function siguiente() {
    if (S.estado !== 'resultado') return;
    Sonido.play('tap');
    if (P.i >= N - 1) return P.terminar();
    P.i++; ronda();
  }

  const teclas = e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };
  document.addEventListener('keydown', teclas);
  const ro = new ResizeObserver(() => { if (cartas.length) { medir(); ubicar(); } });
  function limpiar() { document.removeEventListener('keydown', teclas); ro.disconnect(); globo && globo.destruir(); }

  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay lugares suficientes con esa combinación'); return UI.ir('tiquete', 'nortesur'); }
    const [c, z] = vistaDe(cfg);
    globo = new Globo(globoCont, { centro: c, zoom: Math.min(z, 1.6), dobleToque: false, alfaNubes: .45, cuantasNubes: 6, margen: .94 });
    ro.observe(tablero);
    Banderas.cargar();
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

// encuadra varios puntos en el globo
function encuadrarVarios(globo, lls, ms = 1100) {
  const cen = D3.geoCentroid({ type: 'MultiPoint', coordinates: lls });
  const ang = Math.max(...lls.map(p => D3.geoDistance(p, cen)));
  const z = clamp(.66 / Math.max(Math.sin(Math.min(ang, 1.4)), .03), .95, 9);
  return globo.vuela(cen, z, ms);
}

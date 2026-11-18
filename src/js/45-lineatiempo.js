// ===== Modo: Línea del tiempo =====
// Ordena las postales de la más antigua a la más nueva. Al revisar, cada una muestra su año
// y una marca en la regla del tiempo, a escala (lo muy antiguo se comprime).
const lugaresConAnio = cfg => filtrarLugares(cfg).filter(l => l.anio != null && l.k !== 'naturaleza');
function haceAnios(anio) {
  const a = new Date().getFullYear() - anio;
  return a < 1 ? 'este año' : a === 1 ? 'hace 1 año' : `hace ${fmt.n(a)} años`;
}
function grupoTiempo(pool, base, n, nivel) {
  const sep = nivel === '3' ? 15 : nivel === '2' ? 40 : 80; // años mínimos entre uno y otro
  for (const tolera of [1, .4, 0]) {
    const out = [base];
    for (const x of shuffle(pool)) {
      if (out.length === n) break;
      if (out.some(o => o.id === x.id)) continue;
      if (out.every(o => Math.abs(o.anio - x.anio) >= sep * tolera && (tolera === 0 || o.iso[0] !== x.iso[0] || out.length > 2))) out.push(x);
    }
    if (out.length === n) return out;
  }
  return null;
}

Pantallas.juego_lineatiempo = (cfg) => {
  Progreso.load();
  let pool = lugaresConAnio(cfg);
  if (pool.length < 8) pool = lugaresConAnio(Object.assign({}, cfg, { nivel: 'mezcla' }));
  const nCartas = cfg.nivel === '3' ? 5 : 4;
  const bases = Progreso.elegir(pool, Math.min(escalaModo('lineatiempo', cfg.rondas), pool.length));
  const rondas = bases.map(b => grupoTiempo(pool, b, nCartas, cfg.nivel)).filter(Boolean).map(g => shuffle(g));
  const N = rondas.length;
  const P = crearPartida({ modo: 'lineatiempo', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando' };

  const tablero = h('div.lt-tablero');
  const regla = h('div.lt-regla', h('span.lt-etq.ini', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h20L12 4z" fill="#E2B56E" stroke="#9C6B2A" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 4l3 16" stroke="#9C6B2A" stroke-width="1.2" opacity=".6"/></svg>', title: 'Más antiguo' }),
    h('span.lt-etq.fin', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="8" height="15" rx="1" fill="#7FB6E8" stroke="#2F64A6" stroke-width="1.5"/><rect x="13" y="2" width="6" height="19" rx="1" fill="#A9CDEB" stroke="#2F64A6" stroke-width="1.5"/><path d="M7.5 10h3M7.5 14h3M15 6h2M15 10h2M15 14h2" stroke="#2F64A6" stroke-width="1.2"/></svg>', title: 'Más nuevo' }));
  const lineas = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lineas.setAttribute('class', 'lt-lineas');
  const marco = h('div.lt-marco', regla, tablero, lineas);
  const banner = h('div.ns-banner');
  const btn = h('button.btn.grande.ancho', { onclick: () => S.estado === 'jugando' ? revisar() : siguiente() }, h('span', { html: I.check }), h('span.lt-btn-txt', '¡Listo!'));
  P.escena.append(h('div.lt-zona',
    h('div.ns-cinta.lt-cinta', h('span.ns-cinta-ico', { html: relojSVG() }), h('b', 'Del más antiguo al más nuevo')),
    marco, banner, h('div.ns-pie', btn)));
  const ord = hacerOrdenable(tablero, { eje: 'y', maxAlto: 124 });
  const ahora = () => rondas[P.i];

  function ronda() {
    const g = ahora();
    S.estado = 'jugando';
    P.ronda(P.i, `Ronda ${P.i + 1} de ${N}`);
    P.escena.classList.remove('lt-revisado');
    banner.className = 'ns-banner'; banner.innerHTML = '';
    $('.lt-btn-txt', btn).textContent = '¡Listo!';
    lineas.innerHTML = '';
    ord.poner(g.map(l => h('div.ns-carta.lt-carta', { 'data-id': l.id },
      h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '', draggable: false }),
      h('div.ns-carta-txt', h('b', l.n), h('small', ...l.iso.map(i => Banderas.el(i)), ' ', paisesDe(l)), h('em.lt-anio')),
      h('span.ns-asa', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>' }),
      h('span.ns-marca'))));
    Sonido.play('papel');
  }

  async function revisar() {
    if (S.estado !== 'jugando') return;
    S.estado = 'revisando'; ord.activar(false);
    const g = ahora();
    const correcto = g.slice().sort((a, b) => a.anio - b.anio);
    const idsC = correcto.map(l => l.id), usu = ord.orden();
    const { ok, tot } = paresBien(usu, idsC);
    const enSitio = usu.filter((id, k) => idsC[k] === id).length;
    const est = ok === tot ? 3 : ok >= tot - 1 ? 2 : ok >= tot - 2 ? 1 : 0;
    const pts = Math.round(1000 * Math.pow(ok / tot, 2));
    usu.forEach((id, k) => {
      const c = $(`.lt-carta[data-id="${id}"]`, tablero), bien = idsC[k] === id, l = LUGAR[id];
      c.classList.add(bien ? 'bien' : 'mal');
      $('.ns-marca', c).innerHTML = bien ? I.check : String(idsC.indexOf(id) + 1);
      $('.lt-anio', c).textContent = `${l.anioTxt || l.anio} · ${haceAnios(l.anio)}`;
      if (bien) Progreso.registrar(id, .6);
    });
    Sonido.play(est >= 3 ? 'genial' : est >= 2 ? 'bien' : est === 1 ? 'medio' : 'lejos');
    if (est >= 3) UI.confeti(40);
    const dom = Progreso.registrar(correcto[0].id, est >= 3 ? .8 : .5);
    P.res.push({ l: correcto[0], est, pts, det: `${enSitio} de ${g.length} en su sitio`, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    banner.className = 'ns-banner ve ' + (est >= 2 ? 'bien' : 'mal');
    banner.append(UI.estrellas(est), h('b', est === 3 ? '¡Orden perfecto!' : est === 2 ? '¡Casi perfecto!' : est === 1 ? 'Vas bien' : 'Así va el orden'), h('span.ns-pts', `+${fmt.n(pts)}`));
    await sleep(1200);
    ord.ordenar(idsC);
    P.escena.classList.add('lt-revisado');
    await sleep(350);
    dibujarRegla(correcto);
    $('.lt-btn-txt', btn).textContent = P.i >= N - 1 ? 'Ver mi viaje' : 'Siguiente';
    S.estado = 'resultado';
  }
  // marcas en la regla a escala logarítmica del tiempo transcurrido, unidas con su tarjeta
  function dibujarRegla(correcto) {
    const m = marco.getBoundingClientRect(), r = regla.getBoundingClientRect(), t = tablero.getBoundingClientRect();
    lineas.setAttribute('viewBox', `0 0 ${m.width} ${m.height}`);
    const hoy = new Date().getFullYear(), u = l => Math.log(Math.max(2, hoy - l.anio));
    const u0 = u(correcto[0]), u1 = u(correcto[correcto.length - 1]);
    const y0 = r.top - m.top + 44, y1 = r.bottom - m.top - 44, x = r.left - m.left + r.width / 2;
    let html = '';
    correcto.forEach((l, k) => {
      const f = u0 === u1 ? k / (correcto.length - 1) : (u0 - u(l)) / (u0 - u1);
      const ym = y0 + f * (y1 - y0), yc = t.top - m.top + ord.centro(l.id), xc = t.left - m.left;
      html += `<path d="M${x} ${ym} C${x + 20} ${ym}, ${xc - 20} ${yc}, ${xc} ${yc}" class="lt-hilo" style="animation-delay:${k * 120}ms"/>`;
      html += `<circle cx="${x}" cy="${ym}" r="7" class="lt-punto" style="animation-delay:${k * 120}ms"/>`;
    });
    lineas.innerHTML = html;
  }
  function siguiente() {
    if (S.estado !== 'resultado') return;
    Sonido.play('tap');
    if (P.i >= N - 1) return P.terminar();
    P.i++; ronda();
  }

  const teclas = e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); ord.destruir(); }
  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay lugares suficientes con esa combinación'); return UI.ir('tiquete', 'lineatiempo'); }
    Banderas.cargar();
    ronda();
  });
  return { el: P.el, salir: limpiar };
};
function relojSVG() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 5 4.5 6 4.5 8.5S7.5 15.5 7.5 20.5M16.5 3.5c0 5-4.5 6-4.5 8.5s4.5 3.5 4.5 8.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9.5 18.5c.8-1.6 1.6-2.4 2.5-2.4s1.7.8 2.5 2.4z" fill="currentColor"/></svg>';
}

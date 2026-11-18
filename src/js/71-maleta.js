// ===== La maleta perdida =====
// La maleta de Quinde viaja sola por el mundo. En cada parada hay pistas (datos del lugar y hacia dónde voló);
// el jugador clava un pin donde cree que está. Al final, ¡la encuentra!
function maletaSVG() {
  return `<svg viewBox="0 0 80 70" aria-hidden="true">
    <path d="M28 14v-5a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v5" fill="none" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/>
    <rect x="6" y="14" width="68" height="50" rx="10" fill="#D98B4A"/><rect x="6" y="14" width="68" height="50" rx="10" fill="url(#mlG)"/>
    <defs><linearGradient id="mlG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient></defs>
    <rect x="22" y="14" width="6" height="50" fill="#A8622C"/><rect x="52" y="14" width="6" height="50" fill="#A8622C"/>
    <circle cx="40" cy="38" r="9" fill="#FFC94D" stroke="#fff" stroke-width="2.5"/><path d="M36 38l3 3 5-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="58" y="44" width="12" height="9" rx="2" fill="#7FD4F2" transform="rotate(-12 64 48)"/><rect x="10" y="20" width="10" height="8" rx="2" fill="#FF9CC8" transform="rotate(10 15 24)"/>
  </svg>`;
}
function pistasMaleta(l, prev) {
  const base = pistasDe(l).filter(p => p.tipo !== 'pais' || true);
  const out = [];
  if (prev) {
    const km = Geo.km([prev.lon, prev.lat], [l.lon, l.lat]);
    const r = km > 3000 ? Math.round(km / 500) * 500 : Math.round(km / 100) * 100;
    out.push({ t: `Desde ${prev.n} voló unos ${fmt.n(r)} km hacia el ${rumboTexto(Geo.rumbo([prev.lon, prev.lat], [l.lon, l.lat]))}.`, tipo: 'viaje' });
  }
  return out.concat(base);
}
function rutaMaleta(pool, n, cont) {
  const [mn, mx] = cont && cont !== 'todo' ? [250, 3200] : [1200, 7500];
  for (let intento = 0; intento < 30; intento++) {
    const ruta = [Progreso.elegir(pool, 1)[0] || pick(pool)];
    while (ruta.length < n) {
      const prev = ruta[ruta.length - 1];
      const cand = shuffle(pool).find(x => !ruta.includes(x) && !ruta.some(r => r.iso[0] === x.iso[0]) && (d => d >= mn && d <= mx)(Geo.km([prev.lon, prev.lat], [x.lon, x.lat])));
      if (!cand) break;
      ruta.push(cand);
    }
    if (ruta.length === n) return ruta;
  }
  return shuffle(pool).slice(0, n);
}

Pantallas.juego_maleta = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg);
  const N = Math.min(escalaModo('maleta', cfg.rondas), pool.length);
  const ruta = rutaMaleta(pool, N, cfg.cont);
  const P = crearPartida({ modo: 'maleta', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', pistas: [], vistas: 2, pin: null };

  const globoCont = h('div.globo-cont');
  const lista = h('div.ml-lista');
  const btnPista = h('button.btn.blanco.pista', { onclick: () => otraPista() }, h('span', { html: I.bombillo }), 'Pista');
  const btnAqui = h('button.btn.grande.aqui', { disabled: true, onclick: () => confirmar() }, h('span', { html: I.check }), 'Aquí está');
  const etiqueta = h('div.ml-etiqueta',
    h('div.ml-maleta', { html: maletaSVG() }),
    h('div.ml-cuerpo', h('div.ml-cab', h('b', '¿Dónde está la maleta?'), h('small.ml-vale')), lista));
  const ayuda = h('div.ayuda-toque', 'Lee las pistas y toca el globo donde crees que está');
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.8, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.8, 350) }),
    h('button.icono-btn', { 'aria-label': 'Ver todo el mundo', html: I.centrar, onclick: () => globo.vuela([globo.centro[0], 15], 1, 600) }));
  P.escena.append(globoCont, h('div.orden-zona', etiqueta), ayuda, controles, h('div.accion', btnPista, btnAqui), P.hoja);

  let globo;
  P.onHoja = () => globo && globo.setPad(pads(), 300);
  const ahora = () => ruta[P.i];
  const pads = () => {
    const res = P.escena.classList.contains('con-resultado');
    return { top: res ? 8 : $('.orden-zona', P.escena).offsetHeight + 10, bottom: res ? P.hoja.offsetHeight : 86 };
  };
  const valor = () => Math.max(.3, 1 - (S.vistas - 2) * .14);

  function mostrarPistas() {
    lista.innerHTML = '';
    S.pistas.slice(0, S.vistas).forEach((p, k) => lista.append(h('p.ml-pista' + (p.tipo === 'viaje' ? '.viaje' : ''), { style: { animationDelay: (k === S.vistas - 1 ? 0 : 0) + 's' } }, h('span', String(k + 1)), p.t)));
    lista.scrollTop = lista.scrollHeight;
    $('.ml-vale', etiqueta).textContent = `Vale hasta ${fmt.n(1000 * valor())} puntos`;
    btnPista.disabled = S.vistas >= S.pistas.length;
  }
  function ronda() {
    const l = ahora(), prev = P.i ? ruta[P.i - 1] : null;
    S.estado = 'jugando'; S.pin = null; S.vistas = 2;
    S.pistas = pistasMaleta(l, prev);
    P.ronda(P.i, `Parada ${P.i + 1} de ${N}`);
    btnAqui.disabled = true;
    globo.limpiar();
    // el rastro de la maleta: paradas anteriores con su foto
    ruta.slice(0, P.i).forEach((r, k) => { globo.pin([r.lon, r.lat], { color: '#B7C5D3', esc: .7, caer: false }); if (k) globo.arcos.push({ de: [ruta[k - 1].lon, ruta[k - 1].lat], a: [r.lon, r.lat], prog: 1, color: '#B0835A' }); });
    etiqueta.classList.remove('llega'); void etiqueta.offsetWidth; etiqueta.classList.add('llega');
    mostrarPistas();
    ayuda.classList.toggle('oculta', P.i > 0);
    setTimeout(() => globo.setPad(pads(), 300), 30);
    globo.vuela(prev ? [prev.lon, prev.lat] : [clamp(globo.centro[0], -180, 180), 15], 1, 800);
    Sonido.play('papel');
  }
  function otraPista() {
    if (S.estado !== 'jugando' || S.vistas >= S.pistas.length) return;
    S.vistas++; mostrarPistas(); Sonido.play('papel');
    setTimeout(() => globo.setPad(pads(), 250), 30);
  }
  function ponerPin(ll) {
    if (S.estado !== 'jugando' || !ll) return;
    if (S.pin) globo.quitaPin(S.pin);
    const iso = Mapa.paisEn(ll);
    S.pin = globo.pin(ll, { color: '#3E7CC4', texto: iso ? nombrePais(iso) : 'Océano', icono: 'estrella' });
    btnAqui.disabled = false; ayuda.classList.add('oculta');
    Sonido.play('pin'); vibrar(12);
  }
  async function confirmar() {
    if (S.estado !== 'jugando' || !S.pin) return;
    S.estado = 'revelando'; btnAqui.disabled = true; btnPista.disabled = true;
    const l = ahora(), real = [l.lon, l.lat], tu = S.pin.ll;
    const km = Geo.km(tu, real);
    const pts = Math.round(puntosPostal(km) * valor()), est = Math.max(0, estrellasPostal(km) - (S.vistas > 4 ? 1 : 0));
    const dom = Progreso.registrar(l.id, Math.min(calidadPostal(km), valor()));
    P.res.push({ l, km, pts, est, dom, det: km <= 25 ? '¡exacto!' : `a ${fmt.km(km)}` });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    S.pin.texto = null;
    globo.encuadra(tu, real, 1000);
    await sleep(400);
    await globo.arco(tu, real, { ms: 1100 });
    const img = await Foto.cargar(Foto.url(l, 0, true));
    globo.pin(real, img ? { tipo: 'foto', img } : { color: '#EF6F5E' });
    P.sumar(pts);
    S.estado = 'resultado';
    const sig = ruta[P.i + 1];
    P.resultado({
      est, pts, l, dom, ultima: P.i === N - 1,
      titulo: P.i === N - 1 ? '¡Encontraste la maleta!' : km <= 300 ? '¡La maleta estuvo aquí!' : `Estaba en ${l.n}`,
      detalle: `Tu pin quedó a ${fmt.km(km)}.`,
      nota: sig ? 'Un señor del aeropuerto vio la maleta subir a otro avión… ¡sigue el rastro!' : 'Quinde abraza su maleta. ¡Gracias por ayudarlo!',
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar({ viaje: ruta.reduce((s, r, k) => k ? s + Geo.km([ruta[k - 1].lon, ruta[k - 1].lat], [r.lon, r.lat]) : 0, 0) }); P.i++; ronda(); },
    });
    if (P.i === N - 1) UI.confeti(70);
    setTimeout(() => globo.setPad(pads(), 400), 60);
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (e.key === 'Enter' && S.estado === 'jugando' && S.pin) confirmar();
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
    else if ((e.key === 'p' || e.key === ' ') && S.estado === 'jugando') { e.preventDefault(); otraPista(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); globo && globo.destruir(); }
  requestAnimationFrame(() => {
    if (N < 2) { UI.toast('No hay lugares suficientes con esa combinación'); return UI.ir('tiquete', 'maleta'); }
    globo = new Globo(globoCont, { centro: [ruta[0].lon - 40, 15], zoom: 1, dobleToque: true, zoomMax: 16, alfaNubes: .6, cuantasNubes: 8 });
    globo.on('tap', ll => ponerPin(ll));
    Banderas.cargar();
    ronda();
    if (!cfg.cadena) setTimeout(() => UI.dialogo({ titulo: '¡Ayuda, mi maleta!', texto: 'Se subió sola a otro avión y anda viajando por el mundo. En cada parada te dejo pistas: lee, piensa y clava el pin donde creas que está.', botones: [{ texto: '¡A buscarla!', valor: true }] }), 500);
  });
  return { el: P.el, salir: limpiar };
};

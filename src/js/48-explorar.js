// ===== Modo: Explorar =====
// El globo libre con los 470 lugares. Puntos de colores por categoría; al acercarse aparecen sus fotos.
// Se busca por nombre o país, se filtra por categoría y hay un botón de viaje sorpresa.
const COLOR_CAT = { monumento: '#EF6F5E', naturaleza: '#4FBF7F', antiguo: '#E0A23C', sagrado: '#9B7BE0', ciudad: '#3E8FD8', moderno: '#F27BB6' };
const Visitados = {
  d: null,
  get() { if (!this.d) this.d = new Set(Store.get('visitados', [])); return this.d; },
  marcar(id) { const s = this.get(); if (!s.has(id)) { s.add(id); Store.set('visitados', [...s]); } },
};

Pantallas.juego_explorar = () => {
  Progreso.load();
  const S = { cats: new Set(Object.keys(COLOR_CAT)), abierto: null, fotos: new Map() };
  const globoCont = h('div.globo-cont');
  const buscar = h('input.ex-buscar', { type: 'search', placeholder: 'Busca un lugar o un país', 'aria-label': 'Buscar', autocomplete: 'off' });
  const resultados = h('div.ex-resultados');
  const filtros = h('div.ex-filtros', Object.entries(CATEGORIAS).map(([k, n]) => h('button.chip.ex-chip', { 'data-k': k, 'aria-pressed': 'true', style: { '--cc': COLOR_CAT[k] }, onclick: e => filtrar(k, e.currentTarget) }, h('span.punto', { style: { background: COLOR_CAT[k] } }), n)));
  const cuenta = h('b');
  const hojaCont = h('div.contenido'), hojaPie = h('div.pie');
  const hoja = hojaConAsa(hojaCont, hojaPie, '.ex-hoja', () => globo && globo.setPad({ bottom: hoja.classList.contains('abierta') ? hoja.offsetHeight * .92 : 76 }, 300));
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.8, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.8, 350) }),
    h('button.icono-btn', { 'aria-label': 'Ver todo el mundo', html: I.centrar, onclick: () => globo.vuela([globo.centro[0], 15], 1, 600) }));
  const sorpresa = h('button.btn.sol.ex-sorpresa', { onclick: () => viajeSorpresa() }, h('span', { html: dadoSVG() }), 'Sorpréndeme');
  const escena = h('div.escena', globoCont,
    h('div.ex-arriba', h('div.ex-busca', h('span.ex-lupa', { html: lupaSVG() }), buscar), resultados, filtros),
    controles, h('div.ex-abajo', h('div.ex-cuenta', 'Visitaste ', cuenta, ` de ${LUGARES.length}`), sorpresa), hoja);
  const el = h('div.juego.juego-explorar',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Salir', html: I.cerrar, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'Explorar'), h('div.sub', 'El mundo sin prisa')),
      h('div.barra-hueco')),
    escena);

  let globo;
  const actualizarCuenta = () => { cuenta.textContent = String(Visitados.get().size); };
  function pintarPuntos() {
    const vis = Visitados.get();
    globo.pines = globo.pines.filter(p => p.tipo === 'foto');
    for (const l of LUGARES) {
      if (!S.cats.has(l.k)) continue;
      globo.pines.unshift({ ll: [l.lon, l.lat], tipo: 'punto', color: COLOR_CAT[l.k], r: vis.has(l.id) ? 5.5 : 4.5, lugar: l, tocable: true });
    }
    globo.sucio = true;
  }
  // fotos para los lugares visibles cerca del centro cuando hay zoom
  let tFotos;
  function fotosCerca() {
    clearTimeout(tFotos);
    tFotos = setTimeout(() => {
      if (!globo) return;
      const quiere = globo.zoom < 2.2 ? [] : LUGARES.filter(l => S.cats.has(l.k) && D3.geoDistance([l.lon, l.lat], globo.centro) < 1.25 / globo.zoom)
        .sort((a, b) => D3.geoDistance([a.lon, a.lat], globo.centro) - D3.geoDistance([b.lon, b.lat], globo.centro)).slice(0, 24);
      const ids = new Set(quiere.map(l => l.id));
      globo.pines = globo.pines.filter(p => p.tipo !== 'foto' || ids.has(p.lugar.id) || p === S.abiertoPin);
      for (const l of quiere) {
        if (globo.pines.some(p => p.tipo === 'foto' && p.lugar.id === l.id)) continue;
        Foto.cargar(Foto.url(l, 0, true)).then(img => { if (img && globo && !globo.pines.some(p => p.tipo === 'foto' && p.lugar.id === l.id)) { globo.pines.push({ ll: [l.lon, l.lat], tipo: 'foto', img, lugar: l, tocable: true, esc: .8, t0: performance.now() }); globo.sucio = true; } });
      }
      globo.sucio = true;
    }, 180);
  }

  function abrir(l, volar = true) {
    S.abierto = l;
    Visitados.marcar(l.id); actualizarCuenta();
    if (volar) globo.vuela([l.lon, l.lat], Math.max(globo.zoom, 3.2), 1000);
    hojaCont.innerHTML = ''; hojaPie.innerHTML = '';
    const cerca = LUGARES.filter(x => x.id !== l.id).sort((a, b) => Geo.km([a.lon, a.lat], [l.lon, l.lat]) - Geo.km([b.lon, b.lat], [l.lon, l.lat])).slice(0, 4);
    hojaCont.append(fichaLugar(l),
      h('div.ex-cerca', h('b', 'Cerca de aquí'), h('div.ex-cerca-lista', cerca.map(x => h('button.ex-cerca-item', { onclick: () => { Sonido.play('tap'); abrir(x); } },
        h('img', { src: Foto.url(x, 0, true) || Foto.respaldo(x), alt: '', loading: 'lazy' }), h('span', h('b', x.n), h('small', fmt.km(Geo.km([x.lon, x.lat], [l.lon, l.lat])))))))));
    hojaPie.append(h('button.btn.blanco.ancho', { onclick: () => cerrarHoja() }, 'Seguir explorando'));
    hoja.classList.add('abierta'); escena.classList.add('con-resultado');
    $('.hoja-scroll', hoja).scrollTop = 0;
    globo.setPad({ bottom: hoja.offsetHeight * .92 }, 400);
    Sonido.play('papel');
    pintarPuntos(); fotosCerca();
  }
  function cerrarHoja() {
    hoja.classList.remove('abierta', 'grande'); escena.classList.remove('con-resultado');
    S.abierto = null; globo.setPad({ bottom: 76 }, 400);
    Sonido.play('papel');
  }
  function filtrar(k, b) {
    if (S.cats.has(k) && S.cats.size === 1) { S.cats = new Set(Object.keys(COLOR_CAT)); $$('.ex-chip', filtros).forEach(c => c.setAttribute('aria-pressed', 'true')); }
    else if (S.cats.size === Object.keys(COLOR_CAT).length) { S.cats = new Set([k]); $$('.ex-chip', filtros).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.k === k))); }
    else { S.cats.has(k) ? S.cats.delete(k) : S.cats.add(k); b.setAttribute('aria-pressed', String(S.cats.has(k))); }
    Sonido.play('tap'); pintarPuntos(); fotosCerca();
  }
  function viajeSorpresa() {
    const vis = Visitados.get();
    const cand = LUGARES.filter(l => S.cats.has(l.k) && !vis.has(l.id));
    const l = pick(cand.length ? cand : LUGARES);
    Sonido.play('avion');
    abrir(l);
  }
  // búsqueda por nombre, lugar o país (sin importar tildes)
  buscar.addEventListener('input', () => {
    const q = norm(buscar.value);
    resultados.innerHTML = '';
    if (q.length < 2) return;
    const res = LUGARES.filter(l => norm(l.n).includes(q) || norm(paisesDe(l)).includes(q) || norm(l.lugar || '').includes(q)).slice(0, 7);
    if (!res.length) resultados.append(h('p.ex-nada', 'No encontré ese lugar'));
    res.forEach(l => resultados.append(h('button.ex-res', { onclick: () => { buscar.value = ''; resultados.innerHTML = ''; buscar.blur(); abrir(l); } },
      h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '' }), h('span', h('b', l.n), h('small', ...l.iso.map(i => Banderas.el(i)), ' ', paisesDe(l))))));
  });
  buscar.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('.ex-res', resultados); b && b.click(); } if (e.key === 'Escape') { buscar.value = ''; resultados.innerHTML = ''; } });

  function limpiar() { clearTimeout(tFotos); globo && globo.destruir(); }
  requestAnimationFrame(() => {
    globo = new Globo(globoCont, { centro: [-20, 20], zoom: 1, zoomMax: 30, nubes: false, dobleToque: true });
    globo.setPad({ top: $('.ex-arriba', escena).offsetHeight + 8, bottom: 76 });
    globo.on('tap', (ll, p, pin) => { if (pin && pin.lugar) { Sonido.play('pop'); abrir(pin.lugar, false); } });
    globo.on('mueve', fotosCerca);
    Banderas.cargar();
    pintarPuntos(); actualizarCuenta();
  });
  return { el, salir: limpiar };
};
function dadoSVG() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/></svg>'; }
function lupaSVG() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'; }

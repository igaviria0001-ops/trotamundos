// ===== portada =====
const LOGO = () => h('h1.logo', { 'aria-label': 'Trotamundos' },
  svgEl(`<svg class="logo-ruta" viewBox="0 0 300 60" aria-hidden="true"><path d="M8 50 C 60 6, 130 4, 170 26 S 260 46, 292 12" fill="none" stroke="#3E7CC4" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round"/></svg>`),
  h('span.logo-txt', 'Trotamundos'),
  h('span.logo-avion', { html: I.avion }));

Pantallas.inicio = () => {
  Progreso.load();
  const r = rango();
  const total = LUGARES.length;
  const aprend = Progreso.aprendidos();
  const heroe = h('div.heroe');
  const el = h('div.inicio',
    h('header.cabecera',
      LOGO(),
      h('button.icono-btn', { 'aria-label': 'Ajustes', html: I.ajustes, onclick: () => abrirAjustes() })),
    heroe,
    h('section.panel-inicio',
      h('div.saludo', h('div.quinde', { html: I.quinde }),
        h('div.globo-texto', pick(['¿A dónde viajamos hoy?', '¡Hola! ¿Qué conocemos hoy?', 'Tengo postales nuevas para ti', '¿Listo para despegar?']))),
      h('div.pasaporte-mini',
        h('div', h('b', r.n), h('small', `${fmt.n(Progreso.st.km)} km recorridos`)),
        h('div.barra-rango', h('i', { style: { width: (r.prog * 100).toFixed(1) + '%' } })),
        h('div', h('b', `${aprend} / ${total}`), h('small', 'lugares aprendidos'))),
      h('button.btn.grande.ancho', { onclick: () => { Sonido.play('tap'); UI.ir('modos'); } }, 'Jugar'),
      h('div.fila-btns',
        h('button.btn.blanco', { onclick: () => { Sonido.play('tap'); UI.ir('juego_postal', Object.assign(cfgModo('postal'), { rapido: true })); } }, h('span', { html: I.avion }), 'Viaje rápido'),
        h('button.btn.blanco', { onclick: () => { Sonido.play('tap'); UI.ir('tiquete', 'postal'); } }, h('span', { html: I.tiquete }), 'A la medida'))));

  // globo de portada con fotos de lugares famosos
  let globo;
  requestAnimationFrame(() => {
    globo = new Globo(heroe, { giro: 6, centro: [-40, 18], zoomMax: 3, margen: .92, zoomDoble: false });
    const famosos = shuffle(LUGARES.filter(l => l.t === 1 && l.fotos.length)).slice(0, 18);
    famosos.forEach((l, i) => Foto.cargar(Foto.url(l, 0, true)).then(img => {
      if (img) setTimeout(() => globo.pin([l.lon, l.lat], { tipo: 'foto', img, lugar: l, tocable: true, esc: .9 }), i * 90);
    }));
    if (!famosos.length) LUGARES.filter(l => l.t === 1).forEach(l => globo.pin([l.lon, l.lat], { color: '#EF6F5E', lugar: l, tocable: true, caer: false, esc: .7 }));
    globo.on('toca', () => { globo.quieto = true; });
    globo.on('tap', (ll, p, pin) => { if (pin && pin.lugar) { Sonido.play('pop'); abrirFicha(pin.lugar); } });
    let t; globo.on('mueve', () => { clearTimeout(t); t = setTimeout(() => { globo.quieto = false; }, 4000); });
  });
  return { el, salir: () => globo && globo.destruir() };
};

// configuración guardada de cada modo
function cfgModo(id) {
  return Object.assign({ modo: id, cont: 'todo', nivel: '1', rondas: 5 }, Store.get('cfg_' + id, {}));
}

// ===== colección de modos (cada modo es un sello) =====
Pantallas.modos = () => {
  const el = h('div.modos',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'Modos de juego'), h('div.sub', (n => `${n} ${n === 1 ? 'listo' : 'listos'} para jugar y ${MODOS.length - n} en camino`)(MODOS.filter(modoListo).length)))),
    h('div.scroll.modos-lista',
      Object.entries(GRUPOS).map(([g, info]) => h('section.grupo',
        h('h3', info.n), h('p.grupo-d', info.d),
        h('div.sellos', MODOS.filter(m => m.g === g).map(m => {
          const listo = modoListo(m);
          return h('button.sello-wrap.modo' + (listo ? '' : '.cerrado'), {
            onclick: () => {
              if (listo) { Sonido.play('tap'); UI.ir('tiquete', m.id); }
              else { Sonido.play('pop'); UI.toast(`«${m.n}» llega en la fase ${m.fase}`); }
            },
          }, h('div.sello', h('div.dentro',
            h('div.ilus', { html: I.m[ICO_MODO[m.id]] }),
            h('div.modo-txt', h('b', m.n), h('small', m.d)),
            listo ? null : h('span.pronto', `Fase ${m.fase}`))));
        }))))));
  return { el };
};

// ===== ajustes =====
function abrirAjustes() {
  const fila = (k, txt, sub) => {
    const b = h('button.interruptor', { role: 'switch', 'aria-checked': String(!!Ajustes.get(k)), onclick: () => { Ajustes.set(k, !Ajustes.get(k)); b.setAttribute('aria-checked', String(!!Ajustes.get(k))); Sonido.play('tap'); } }, h('i'));
    return h('label.ajuste', h('span', h('b', txt), sub ? h('small', sub) : null), b);
  };
  const cerrar = () => { $('#capa').innerHTML = ''; };
  $('#capa').append(h('div.fondo-capa', { onclick: cerrar }),
    h('div.dialogo.ajustes', h('h3', 'Ajustes'),
      fila('sonido', 'Sonidos'), fila('vibrar', 'Vibración', 'En celulares que la tienen'),
      fila('letra', 'Letra más grande'), fila('menosMov', 'Menos animaciones'),
      h('p.version', `Versión ${window.TMD_VERSION || ''}`),
      h('div.botones', h('button.btn', { onclick: cerrar }, 'Listo'))));
}

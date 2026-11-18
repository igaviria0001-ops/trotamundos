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
      h('button.pasaporte-mini', { 'aria-label': 'Abrir mi pasaporte', onclick: () => { Sonido.play('papel'); UI.ir('pasaporte'); } },
        h('div', h('b', r.n), h('small', `${fmt.n(Progreso.st.km)} km recorridos`)),
        h('div.barra-rango', h('i', { style: { width: (r.prog * 100).toFixed(1) + '%' } })),
        h('div', h('b', `${aprend} / ${total}`), h('small', 'lugares aprendidos'))),
      h('div.ini-atajos',
        h('button.ini-atajo.reto' + (Reto.hechoHoy() ? '.hecho' : ''), { onclick: () => { Sonido.play('tap'); Cadena.iniciar(retoDelDia()); } },
          h('span.ini-atajo-ico', { html: Reto.hechoHoy() ? I.check : llamaSVG() }),
          h('span', h('b', 'Reto del día'), h('small', Reto.hechoHoy() ? `¡Hecho! Racha: ${Reto.get().racha}` : Reto.get().racha ? `Racha de ${Reto.get().racha} ${Reto.get().racha === 1 ? 'día' : 'días'}` : '6 paradas nuevas'))),
        h('button.ini-atajo.expe', { onclick: () => { Sonido.play('tap'); UI.ir('expedicion'); } },
          h('span.ini-atajo-ico', { html: I.m.expedicion }),
          h('span', h('b', 'Expedición'), h('small', `Capítulo ${Math.max(1, CAPITULOS.filter((c, i) => Expedicion.abierto(i)).length)}`))),
        h('button.ini-atajo.album', { onclick: () => { Sonido.play('tap'); UI.ir('album'); } },
          h('span.ini-atajo-ico', { html: albumSVG() }),
          h('span', h('b', 'Mi álbum'), h('small', `${LUGARES.filter(l => Progreso.de(l.id).v > 0 || Visitados.get().has(l.id)).length} sellos`)))),
      h('button.btn.grande.ancho', { onclick: () => { Sonido.play('tap'); UI.ir('modos'); } }, 'Jugar'),
      h('div.fila-btns',
        h('button.btn.blanco', { onclick: () => { Sonido.play('tap'); Cadena.iniciar(viajeRapido()); } }, h('span', { html: I.avion }), 'Viaje rápido'),
        h('button.btn.blanco', { onclick: () => { Sonido.play('tap'); UI.ir('medida'); } }, h('span', { html: I.tiquete }), 'A la medida'))));

  // globo de portada con fotos de lugares famosos
  let globo;
  requestAnimationFrame(() => {
    if (!Store.get('bienvenida')) setTimeout(bienvenida, 900);
    globo = new Globo(heroe, { giro: 6, centro: [-40, 18], zoomMax: 3, margen: .92, zoomDoble: false, paginable: true });
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

// primera vez: Quinde explica cómo aprender paso a paso
async function bienvenida() {
  if (Store.get('bienvenida') || UI.actual.dataset.pantalla !== 'inicio') return;
  Store.set('bienvenida', 1);
  const v = await UI.dialogo({ titulo: '¡Hola! Soy Quinde', texto: 'Vamos a conocer el mundo jugando: fotos reales, mapas, banderas y pistas. Te recomiendo empezar por la gran expedición: va de los lugares más famosos a los menos conocidos, paso a paso.', botones: [{ texto: 'Empezar la expedición', valor: 'exp' }, { texto: 'Ver todos los modos', valor: 'modos', clase: 'blanco' }] });
  if (v === 'exp') UI.ir('expedicion', 0); else if (v === 'modos') UI.ir('modos');
}
function albumSVG() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" fill="#fff" stroke="currentColor" stroke-width="2"/><rect x="6" y="7" width="5" height="5" rx="1" fill="#FFC94D"/><rect x="13" y="7" width="5" height="5" rx="1" fill="#7FD49E"/><rect x="6" y="13.5" width="5" height="4" rx="1" fill="#8EC5F2"/><rect x="13" y="13.5" width="5" height="4" rx="1" fill="#FF9C8C"/></svg>'; }

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
              if (listo) { Sonido.play('tap'); m.sinTiquete ? UI.ir('juego_' + m.id) : UI.ir('tiquete', m.id); }
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
    const b = h('button.interruptor', { role: 'switch', 'aria-checked': String(!!Ajustes.get(k)), onclick: () => {
      Ajustes.set(k, !Ajustes.get(k)); b.setAttribute('aria-checked', String(!!Ajustes.get(k))); Sonido.play('tap');
      if (k === 'musica') Ajustes.get('musica') ? Musica.iniciar() : Musica.parar();
    } }, h('i'));
    return h('label.ajuste', h('span', h('b', txt), sub ? h('small', sub) : null), b);
  };
  const cerrar = () => { $('#capa').innerHTML = ''; };
  $('#capa').append(h('div.fondo-capa', { onclick: cerrar }),
    h('div.dialogo.ajustes', h('h3', 'Ajustes'),
      fila('musica', 'Música', 'Una melodía suave de fondo'), fila('sonido', 'Sonidos'), fila('vibrar', 'Vibración', 'En celulares que la tienen'),
      fila('letra', 'Letra más grande'), fila('menosMov', 'Menos animaciones'),
      h('button.btn.blanco.ancho.creditos-btn', { onclick: () => { cerrar(); abrirCreditos(); } }, 'Créditos de fotos y datos'),
      h('button.btn.blanco.ancho.creditos-btn.borrar', { onclick: async () => {
        cerrar();
        const v = await UI.dialogo({ titulo: '¿Empezar de cero?', texto: 'Se borra todo lo aprendido, tus sellos, logros, rachas y la expedición. No se puede deshacer.', botones: [{ texto: 'No, mejor no', valor: false }, { texto: 'Sí, borrar todo', valor: true, clase: 'blanco' }] });
        if (!v) return;
        ['prog', 'stats', 'logros', 'hazanas', 'visitados', 'reto', 'expedicion', 'bienvenida', 'nombre'].forEach(k => Store.del(k));
        Progreso.load(); Logros.load(); Visitados.d = null;
        UI.toast('Listo: tu pasaporte está como nuevo'); UI.ir('inicio');
      } }, 'Borrar mi progreso'),
      h('p.version', `Versión ${window.TMD_VERSION || ''}`),
      h('div.botones', h('button.btn', { onclick: cerrar }, 'Listo'))));
}

// ===== créditos: fotos y datos abiertos =====
function abrirCreditos() {
  const cerrar = () => { $('#capa').innerHTML = ''; };
  const fotos = LUGARES.filter(l => l.fotos.length).sort((a, b) => a.n.localeCompare(b.n, 'es'));
  const lista = h('ul.creditos-lista', fotos.flatMap(l => l.fotos.map((f, i) =>
    h('li', h('b', l.n + (l.fotos.length > 1 ? ` (${i + 1})` : '')), ' — ', f.a || 'autor desconocido', ', ', f.l || '', ' · ',
      h('a', { href: f.u, target: '_blank', rel: 'noopener' }, 'ver en Wikimedia Commons')))));
  $('#capa').append(h('div.fondo-capa', { onclick: cerrar }),
    h('div.ficha-capa.creditos',
      h('button.icono-btn.cerrar', { 'aria-label': 'Cerrar', html: I.cerrar, onclick: cerrar }),
      h('h3', 'Créditos'),
      h('p', 'Las fotos son de Wikimedia Commons y se usan con licencias libres; cada una lleva el nombre de quien la tomó y su licencia.'),
      h('p', 'Mapa: Natural Earth (dominio público). Países: world-countries (ODbL) y Wikidata (CC0). Banderas: flag-icons (MIT). Datos de lugares: Wikidata y Wikipedia. Letras: Baloo 2, Nunito y Caveat (SIL OFL).'),
      h('h4', `Fotos (${fotos.reduce((a, l) => a + l.fotos.length, 0)})`),
      lista));
}

// ===== catálogo de modos y fichas de lugares =====
const GRUPOS = {
  lugares: { n: 'Lugares', d: 'Fotos reales: ubícalas, descúbrelas y reconócelas' },
  mapa: { n: 'Mapa', d: 'Países, formas y orientación' },
  banderas: { n: 'Banderas y capitales', d: 'Pinta, iza y conecta' },
  tiempo: { n: 'Tiempo y escala', d: 'Cuándo se hizo y qué tan grande es' },
  aventuras: { n: 'Aventuras', d: 'Viajes largos con historia' },
};
const MODOS = [
  { id: 'postal', n: 'Postal misteriosa', g: 'lugares', fase: 1, d: 'Clava el pin donde está la foto' },
  { id: 'raspa', n: 'Raspa y descubre', g: 'lugares', fase: 2, d: 'Raspa la foto y adivina' },
  { id: 'lupa', n: 'Lupa viajera', g: 'lugares', fase: 2, d: 'De un detalle a la foto completa' },
  { id: 'pistas', n: 'Pistas de Quinde', g: 'lugares', fase: 2, d: 'Adivina con las menos pistas' },
  { id: 'parejas', n: 'Parejas del mundo', g: 'lugares', fase: 2, d: 'Une foto, país y bandera' },
  { id: 'rompepostal', n: 'Rompecabezas postal', g: 'lugares', fase: 5, d: 'Arma la foto pieza a pieza', escalas: { 5: [4, 'postales'], 10: [6, 'postales'], 15: [9, 'postales'] } },
  { id: 'colorea', n: 'Colorea el mapa', g: 'mapa', fase: 3, d: 'Toca el país y píntalo', datos: 'paises', escalas: { 5: [8, 'países'], 10: [15, 'países'], 15: [25, 'países'] } },
  { id: 'rompepaises', n: 'Rompecabezas de países', g: 'mapa', fase: 3, d: 'Cada país en su sitio', datos: 'paises', escalas: { 5: [8, 'piezas'], 10: [15, 'piezas'], 15: [25, 'piezas'] } },
  { id: 'silueta', n: 'Silueta y rumbo', g: 'mapa', fase: 3, d: 'Deduce el país por su forma', datos: 'paises', escalas: { 5: [5, 'siluetas'], 10: [10, 'siluetas'], 15: [15, 'siluetas'] } },
  { id: 'brujula', n: 'Brújula', g: 'mapa', fase: 3, d: '¿Hacia dónde queda?', escalas: { 5: [5, 'rumbos'], 10: [10, 'rumbos'], 15: [15, 'rumbos'] } },
  { id: 'nortesur', n: 'De norte a sur', g: 'mapa', fase: 3, d: 'Ordena por posición', escalas: { 5: [5, 'rondas'], 10: [8, 'rondas'], 15: [12, 'rondas'] } },
  { id: 'pintabandera', n: 'Pinta la bandera', g: 'banderas', fase: 4, d: 'Cada franja con su color', datos: 'paises', escalas: { 5: [5, 'banderas'], 10: [8, 'banderas'], 15: [12, 'banderas'] } },
  { id: 'banderasviento', n: 'Banderas al viento', g: 'banderas', fase: 4, d: 'Iza la bandera correcta', datos: 'paises', escalas: { 5: [6, 'banderas'], 10: [10, 'banderas'], 15: [14, 'banderas'] } },
  { id: 'capitales', n: 'Capitales: conecta', g: 'banderas', fase: 4, d: 'Une país y capital', datos: 'paises', escalas: { 5: [4, 'tableros'], 10: [6, 'tableros'], 15: [9, 'tableros'] } },
  { id: 'lineatiempo', n: 'Línea del tiempo', g: 'tiempo', fase: 5, d: 'De las pirámides a hoy', escalas: { 5: [5, 'rondas'], 10: [8, 'rondas'], 15: [12, 'rondas'] } },
  { id: 'masalto', n: '¿Más alto o más bajo?', g: 'tiempo', fase: 5, d: 'Adivina cuál se eleva más', escalas: { 5: [8, 'comparaciones'], 10: [12, 'comparaciones'], 15: [18, 'comparaciones'] } },
  { id: 'explorar', n: 'Explorar', g: 'aventuras', fase: 5, d: 'El globo libre, sin prisa', sinTiquete: true },
  { id: 'reto', n: 'Reto del día', g: 'aventuras', fase: 6, d: 'Seis paradas nuevas cada día', sinTiquete: true },
  { id: 'expedicion', n: 'La gran expedición', g: 'aventuras', fase: 7, d: 'El mundo por capítulos', sinTiquete: true },
  { id: 'maleta', n: 'La maleta perdida', g: 'aventuras', fase: 7, d: 'Sigue las pistas por el mundo', escalas: { 5: [4, 'paradas'], 10: [5, 'paradas'], 15: [7, 'paradas'] } },
];
const MODO = Object.fromEntries(MODOS.map(m => [m.id, m]));
const ICO_MODO = { postal: 'postal', raspa: 'raspa', lupa: 'lupa', pistas: 'pistas', parejas: 'parejas', rompepostal: 'rompepostal', colorea: 'colorea', rompepaises: 'rompepaises', silueta: 'silueta', brujula: 'brujula', nortesur: 'nortesur', pintabandera: 'pintabandera', banderasviento: 'banderasviento', capitales: 'capitales', lineatiempo: 'lineatiempo', masalto: 'masalto', explorar: 'explorar', reto: 'reto', expedicion: 'expedicion', maleta: 'maleta' };
const modoListo = m => !!Pantallas['juego_' + m.id];

const NIVELES_PAIS = {
  1: { n: 'Grandes', d: 'Los países más conocidos' },
  2: { n: 'Medianos', d: 'Hay que fijarse más' },
  3: { n: 'Pequeños', d: 'Islas y países chiquitos' },
};
// cuántos elementos usa un modo según la escala elegida en el tiquete
const escalaModo = (id, r) => { if (typeof r === 'string' && r[0] === 'n') return +r.slice(1); const e = MODO[id].escalas; return e ? (e[r] || e[5])[0] : (r || 5); };
// lo que entra en juego para un modo (lugares o países)
function poolModo(id, cfg) {
  if (id === 'silueta') return filtrarPaises(cfg, { minArea: 9000 });
  if (id === 'rompepaises') return filtrarPaises(cfg, { excluir: ['RU'] });
  if (id === 'lineatiempo') { const l = lugaresConAnio(cfg); return l.length >= 8 ? l : lugaresConAnio(Object.assign({}, cfg, { nivel: 'mezcla' })); }
  if (id === 'masalto') return lugaresAltura(cfg);
  if (id === 'pintabandera') return filtrarPaises(cfg).filter(p => Banderas.data ? analizarBandera(p.iso) : true);
  if (id === 'capitales') return filtrarPaises(cfg, { excluir: ['IL', 'PS'] }).filter(p => p.cap && p.capLat != null);
  if (MODO[id].datos === 'paises') return filtrarPaises(cfg);
  return filtrarLugares(cfg);
}

// lugares que cumplen una configuración
function filtrarLugares(cfg, { conFoto = true } = {}) {
  const hayFotos = LUGARES.some(l => l.fotos.length);
  return LUGARES.filter(l =>
    (cfg.conts ? cfg.conts.includes(l.c) : (!cfg.cont || cfg.cont === 'todo' || l.c === cfg.cont)) &&
    (cfg.niveles ? cfg.niveles.includes(l.t) : (!cfg.nivel || cfg.nivel === 'mezcla' || String(l.t) === String(cfg.nivel))) &&
    (!conFoto || !hayFotos || l.fotos.length));
}

// ----- ficha de un lugar -----
function datoLinea(icono, texto) { return h('li', h('span.dato-ico', { html: I.d[icono] }), h('span', texto)); }
function fichaLugar(l, { foto = true, compacta = false } = {}) {
  const dom = Progreso.dominio(l.id);
  const pTxt = paisesDe(l);
  const lugarTxt = (l.lugar && norm(l.lugar).includes(norm(pTxt))) ? l.lugar : [l.lugar, pTxt].filter(Boolean).join(', ');
  const chips = [NIVELES[l.t].n, CATEGORIAS[l.k]];
  if (l.unesco) chips.push('Patrimonio de la Humanidad');
  const extras = [];
  if (l.anioTxt && l.k !== 'naturaleza') {
    const pre = l.k === 'ciudad' ? 'Fundada' : 'Construido', t = l.anioTxt;
    extras.push(datoLinea('cal', /^hacia/.test(t) ? `${pre} ${t}` : /^(siglo|año)/.test(t) ? `${pre} en el ${t}` : `${pre} en ${t}`));
  }
  if (l.alto) extras.push(datoLinea('alto', `${fmt.m(l.alto)} de altura`));
  else if (l.elev) extras.push(datoLinea('monte', `${fmt.m(l.elev)} sobre el nivel del mar`));
  const datos = (compacta ? l.datos.slice(0, 1) : l.datos).map(t => datoLinea('dato', t));
  const src = Foto.url(l, 0) || Foto.respaldo(l);
  return h('article.ficha' + (compacta ? '.compacta' : ''),
    foto ? h('button.ficha-foto', { 'aria-label': 'Ver foto grande', onclick: () => UI.visor(src, Foto.credito(l)) },
      h('img', { src: compacta ? (Foto.url(l, 0, true) || src) : src, alt: l.n, loading: 'lazy' }),
      h('span.ampliar', { html: I.ampliar })) : null,
    h('div.ficha-texto',
      h('h3', l.n),
      h('p.ficha-donde', ...l.iso.map(i => Banderas.el(i)), ' ', lugarTxt),
      h('div.ficha-chips', chips.map(c => h('span', c))),
      l.porque ? h('p.ficha-porque', l.porque) : null,
      (extras.length || datos.length) ? h('ul.ficha-datos', extras, datos) : null,
      h('div.ficha-dominio', h('span', 'Tu dominio'), UI.estrellas(dom, 5)),
      foto && l.fotos[0] ? h('p.ficha-credito', Foto.credito(l)) : null));
}
function abrirFicha(l) {
  const cerrar = () => { $('#capa').innerHTML = ''; };
  $('#capa').append(h('div.fondo-capa', { onclick: cerrar }),
    h('div.ficha-capa', h('button.icono-btn.cerrar', { 'aria-label': 'Cerrar', html: I.cerrar, onclick: cerrar }), fichaLugar(l)));
}

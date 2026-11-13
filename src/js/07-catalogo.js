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
  { id: 'rompepostal', n: 'Rompecabezas postal', g: 'lugares', fase: 5, d: 'Arma la foto pieza a pieza' },
  { id: 'colorea', n: 'Colorea el mapa', g: 'mapa', fase: 3, d: 'Toca el país y píntalo' },
  { id: 'rompepaises', n: 'Rompecabezas de países', g: 'mapa', fase: 3, d: 'Cada país en su sitio' },
  { id: 'silueta', n: 'Silueta y rumbo', g: 'mapa', fase: 3, d: 'Deduce el país por su forma' },
  { id: 'brujula', n: 'Brújula', g: 'mapa', fase: 3, d: '¿Hacia dónde queda?' },
  { id: 'nortesur', n: 'De norte a sur', g: 'mapa', fase: 3, d: 'Ordena por posición' },
  { id: 'pintabandera', n: 'Pinta la bandera', g: 'banderas', fase: 4, d: 'Cada franja con su color' },
  { id: 'banderasviento', n: 'Banderas al viento', g: 'banderas', fase: 4, d: 'Iza la bandera correcta' },
  { id: 'capitales', n: 'Capitales: conecta', g: 'banderas', fase: 4, d: 'Une país y capital' },
  { id: 'lineatiempo', n: 'Línea del tiempo', g: 'tiempo', fase: 5, d: 'De las pirámides a hoy' },
  { id: 'masalto', n: '¿Cuál es más alto?', g: 'tiempo', fase: 5, d: 'Ordena por altura' },
  { id: 'explorar', n: 'Explorar', g: 'aventuras', fase: 5, d: 'El globo libre, sin prisa' },
  { id: 'reto', n: 'Reto del día', g: 'aventuras', fase: 6, d: 'Seis retos nuevos cada día' },
  { id: 'expedicion', n: 'La gran expedición', g: 'aventuras', fase: 7, d: 'El mundo por capítulos' },
  { id: 'maleta', n: 'La maleta perdida', g: 'aventuras', fase: 7, d: 'Sigue las pistas por el mundo' },
];
const MODO = Object.fromEntries(MODOS.map(m => [m.id, m]));
const ICO_MODO = { postal: 'postal', raspa: 'raspa', lupa: 'lupa', pistas: 'pistas', parejas: 'parejas', rompepostal: 'rompepostal', colorea: 'colorea', rompepaises: 'rompepaises', silueta: 'silueta', brujula: 'brujula', nortesur: 'nortesur', pintabandera: 'pintabandera', banderasviento: 'banderasviento', capitales: 'capitales', lineatiempo: 'lineatiempo', masalto: 'masalto', explorar: 'explorar', reto: 'reto', expedicion: 'expedicion', maleta: 'maleta' };
const modoListo = m => !!Pantallas['juego_' + m.id];

// lugares que cumplen una configuración
function filtrarLugares(cfg, { conFoto = true } = {}) {
  const hayFotos = LUGARES.some(l => l.fotos.length);
  return LUGARES.filter(l =>
    (!cfg.cont || cfg.cont === 'todo' || l.c === cfg.cont) &&
    (!cfg.nivel || cfg.nivel === 'mezcla' || String(l.t) === String(cfg.nivel)) &&
    (!conFoto || !hayFotos || l.fotos.length));
}

// ----- ficha de un lugar -----
function datoLinea(icono, texto) { return h('li', h('span.dato-ico', { html: I.d[icono] }), h('span', texto)); }
function fichaLugar(l, { foto = true, compacta = false } = {}) {
  const dom = Progreso.dominio(l.id);
  const lugarTxt = [l.lugar, paisesDe(l)].filter(Boolean).join(', ');
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

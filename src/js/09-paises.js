// ===== países como piezas de juego =====
// Los modos de mapa usan países (no lugares). Cada país tiene un nivel según qué tan conocido y grande es
// dentro de su continente, y su "dominio" se guarda en Progreso con la clave p:ISO.
const CON_FORMA = new Set(Object.values(DATA.shape).filter(Boolean));
const PAISES_JUEGO = PAISES.filter(p => p.un && CON_FORMA.has(p.iso) && p.c !== 'AN');
(function nivelesPaises() {
  const fama = p => Math.log10(Math.max(p.pob || 1e4, 1e4)) + .7 * Math.log10(Math.max(p.area || 1, 1));
  for (const c of Object.keys(CONTINENTES)) {
    const ps = PAISES_JUEGO.filter(p => p.c === c).sort((a, b) => fama(b) - fama(a));
    ps.forEach((p, i) => { const f = i / ps.length; p.t = f < .4 ? 1 : f < .72 ? 2 : 3; });
  }
})();

const idPais = iso => 'p:' + iso;
function filtrarPaises(cfg, { minArea = 0, excluir = [] } = {}) {
  return PAISES_JUEGO.filter(p =>
    (!cfg.cont || cfg.cont === 'todo' || p.c === cfg.cont) &&
    (!cfg.nivel || cfg.nivel === 'mezcla' || String(p.t) === String(cfg.nivel)) &&
    (p.area || 0) >= minArea && !excluir.includes(p.iso));
}
// un país con la forma de un lugar, para reusar resultados y resumen
function paisComoLugar(p) { return { id: idPais(p.iso), n: p.n, iso: [p.iso], c: p.c, t: p.t, fotos: [], datos: [], esPais: true, pais: p }; }
// elige países mezclando nuevos y repaso, igual que con los lugares
function elegirPaises(pool, n, rnd) {
  const como = pool.map(p => ({ id: idPais(p.iso), p }));
  return Progreso.elegir(como, Math.min(n, como.length), rnd).map(x => x.p);
}

// partes principales de un país: el polígono más grande y lo que está cerca (sin territorios lejanos)
const _partes = {};
function partesPais(iso) {
  if (iso in _partes) return _partes[iso];
  const polys = [];
  for (const f of Mapa.de(iso)) {
    const g = f.geometry; if (!g) continue;
    const cs = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const c of cs) {
      let x0 = 999, x1 = -999, y0 = 999, y1 = -999;
      for (const [x, y] of c[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      polys.push({ c, a: D3.geoArea({ type: 'Polygon', coordinates: c }), b: [x0, y0, x1, y1] });
    }
  }
  if (!polys.length) return (_partes[iso] = null);
  polys.sort((a, b) => b.a - a.a);
  // se juntan las partes cuyas cajas quedan a menos de ~650 km de algo ya incluido
  const cerca = (p, q) => {
    const lat = Math.abs((p.b[1] + p.b[3]) / 2), dy = 5.8, dx = 5.8 / Math.max(.25, Math.cos(lat * RAD));
    return !(p.b[2] + dx < q.b[0] || q.b[2] + dx < p.b[0] || p.b[3] + dy < q.b[1] || q.b[3] + dy < p.b[1]);
  };
  const keep = [polys[0]], resto = polys.slice(1);
  for (let cambio = true; cambio;) {
    cambio = false;
    for (let i = resto.length - 1; i >= 0; i--) if (keep.some(k => cerca(k, resto[i]))) { keep.push(resto[i]); resto.splice(i, 1); cambio = true; }
  }
  const feat = { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: keep.map(k => k.c) } };
  return (_partes[iso] = { feat, cen: D3.geoCentroid(feat), area: keep.reduce((s, k) => s + k.a, 0) });
}
const centroPais = iso => { const p = partesPais(iso); if (p) return p.cen; const q = PAIS[iso]; return [q.lon, q.lat]; };

// silueta del país como trazo SVG ajustado a un rectángulo
function siluetaPath(iso, w, h, pad = 8) {
  const pt = partesPais(iso);
  if (!pt) return '';
  const proj = D3.geoOrthographic().rotate([-pt.cen[0], -pt.cen[1]]).fitExtent([[pad, pad], [w - pad, h - pad]], pt.feat);
  return D3.geoPath(proj)(pt.feat) || '';
}
// silueta de plastilina: sombra, cuerpo con degradé, bisel y brillo
let _silId = 0;
function siluetaSVG(iso, { w = 240, h = 180, color = '#F7A35C', pad = 14 } = {}) {
  const d = siluetaPath(iso, w, h, pad);
  const id = 'sil' + (++_silId);
  const claro = ajustaColor(color, .38), oscuro = ajustaColor(color, -.3);
  return `<svg viewBox="0 0 ${w} ${h}" class="silueta-svg" aria-hidden="true">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${oscuro}"/></linearGradient>
    <clipPath id="${id}c"><path d="${d}"/></clipPath></defs>
    <path d="${d}" transform="translate(2 6)" fill="rgba(40,70,100,.22)"/>
    <path d="${d}" fill="url(#${id}g)" stroke="${ajustaColor(color, -.42)}" stroke-width="1.6" stroke-linejoin="round"/>
    <g clip-path="url(#${id}c)"><path d="${d}" transform="translate(2.5 3.5)" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="5" stroke-linejoin="round"/>
    <path d="${d}" transform="translate(-2.5 -3)" fill="none" stroke="rgba(90,40,10,.18)" stroke-width="5" stroke-linejoin="round"/></g>
  </svg>`;
}

// ----- puntos cardinales -----
const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
const RUMBOS_CORTO = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const rumboTexto = g => RUMBOS[Math.round(((g % 360) + 360) % 360 / 45) % 8];
const rumboCorto = g => RUMBOS_CORTO[Math.round(((g % 360) + 360) % 360 / 45) % 8];
const difAngulo = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

// ----- ficha de un país -----
fmt.pob = v => !v ? '' : v >= 1e9 ? `${(v / 1e9).toLocaleString('es-CO', { maximumFractionDigits: 2 })} mil millones` : v >= 1e6 ? `${(v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: v >= 1e7 ? 0 : 1 })} millones` : fmt.n(v);
fmt.area = v => `${fmt.n(v)} km²`;
function fichaPais(p, { silueta = true } = {}) {
  const dom = Progreso.dominio(idPais(p.iso));
  const lineas = [];
  if (p.cap) lineas.push(datoLinea('capital', `Capital: ${p.cap}`));
  if (p.pob) lineas.push(datoLinea('gente', `${fmt.pob(p.pob)} de habitantes`));
  if (p.area) lineas.push(datoLinea('area', `${fmt.area(p.area)} de superficie`));
  if (p.idiomas && p.idiomas.length) lineas.push(datoLinea('idioma', (p.idiomas.length > 1 ? 'Idiomas: ' : 'Idioma: ') + p.idiomas.slice(0, 3).join(', ')));
  if (p.moneda) lineas.push(datoLinea('moneda', `Moneda: ${p.moneda}`));
  const vec = (p.vec || []).filter(i => PAIS[i]);
  return h('article.ficha.ficha-pais',
    h('div.ficha-pais-cab',
      h('div.ficha-bandera', Banderas.el(p.iso)),
      silueta ? h('div.ficha-silueta', { html: siluetaSVG(p.iso, { w: 120, h: 92, pad: 6, color: CONTINENTES[p.c].color }) }) : null),
    h('div.ficha-texto',
      h('h3', p.n),
      h('div.ficha-chips', h('span', CONTINENTES[p.c].n)),
      lineas.length ? h('ul.ficha-datos', lineas) : null,
      vec.length ? h('div.ficha-vecinos', h('span', vec.length === 1 ? 'Su vecino:' : `Sus ${vec.length} vecinos:`), h('div.vecinos', vec.slice(0, 14).map(i => h('span.vecino', { title: nombrePais(i) }, Banderas.el(i))))) : null,
      h('div.ficha-dominio', h('span', 'Tu dominio'), UI.estrellas(dom, 5))));
}
function abrirFichaPais(p) {
  const cerrar = () => { $('#capa').innerHTML = ''; };
  $('#capa').append(h('div.fondo-capa', { onclick: cerrar }),
    h('div.ficha-capa', h('button.icono-btn.cerrar', { 'aria-label': 'Cerrar', html: I.cerrar, onclick: cerrar }), fichaPais(p)));
}

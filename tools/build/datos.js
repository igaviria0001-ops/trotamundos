// Junta los datos del juego: lugares (lista + Wikidata + fichas escritas + fotos) y paises.
const fs = require('fs');
const path = require('path');
const R = (...p) => path.join(__dirname, '..', '..', ...p);
const jsonOr = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch (e) { return d; } };

const CONT = { Europe: 'EU', Asia: 'AS', Africa: 'AF', Oceania: 'OC', Antarctic: 'AN' };
const NE_FIX = { Kosovo: 'XK', Somaliland: 'SO', 'N. Cyprus': 'CY', 'Indian Ocean Ter.': 'AU', 'Siachen Glacier': null };

function contOf(c) {
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'SA' : 'NA';
  return CONT[c.region] || 'AN';
}

function paises() {
  const wc = require('world-countries');
  const wd = {};
  for (const w of jsonOr('tools/fotos/out/paises.json', [])) {
    // si hay varios items con el mismo codigo, quedarse con el que tenga capital
    if (!wd[w.iso] || (!wd[w.iso].capitales.length && w.capitales.length)) wd[w.iso] = w;
  }
  const extra = jsonOr('data/paises-extra.json', {});
  const byN = {};
  const out = wc.filter(c => c.cca2 && c.status !== 'user-assigned' || c.cca2 === 'XK').map(c => {
    const w = wd[c.cca2] || {};
    const x = extra[c.cca2] || {};
    let cap = x.capital, capLat, capLon;
    const caps = (w.capitales || []).map(s => {
      const [name, pt] = s.split('@');
      const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(pt || '');
      return { name, lon: m ? +m[1] : null, lat: m ? +m[2] : null };
    });
    let pick = caps.find(k => k.name === cap) || caps[0];
    if (!cap) cap = pick ? pick.name : (c.capital || [])[0] || '';
    if (pick && pick.lat != null) { capLat = pick.lat; capLon = pick.lon; }
    if (x.capLat != null) { capLat = x.capLat; capLon = x.capLon; }
    if (capLat == null && c.capitalInfo) { /* sin datos */ }
    const p = {
      iso: c.cca2,
      n: x.nombre || (c.translations.spa && c.translations.spa.common) || c.name.common,
      c: contOf(c),
      sub: c.subregion || '',
      cap,
      capLat: capLat != null ? +capLat.toFixed(3) : null,
      capLon: capLon != null ? +capLon.toFixed(3) : null,
      lat: c.latlng ? c.latlng[0] : 0,
      lon: c.latlng ? c.latlng[1] : 0,
      area: c.area,
      pob: w.poblacion ? +w.poblacion : null,
      idiomas: x.idiomas || (w.idiomas || []).slice(0, 4),
      moneda: x.moneda || (w.monedas || [])[0] || '',
      vec: (c.borders || []).map(b => (wc.find(k => k.cca3 === b) || {}).cca2).filter(Boolean),
      un: !!c.unMember || ['VA', 'PS'].includes(c.cca2),
      ccn3: c.ccn3 || '',
    };
    byN[p.ccn3] = p.iso;
    return p;
  });
  // forma del mapa -> iso
  const topo = jsonOr('data/mapa-lo.json', null);
  const shape = {};
  if (topo) for (const g of topo.objects.countries.geometries) {
    const name = g.properties && g.properties.name;
    shape[g.id || name] = g.id && byN[g.id] ? byN[g.id] : (name in NE_FIX ? NE_FIX[name] : null);
  }
  return { paises: out, shape };
}

function anioTexto(y, prec) {
  if (y == null) return '';
  const a = Math.abs(y);
  if (prec != null && prec <= 7) {
    const sig = Math.ceil(a / 100);
    const rom = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX'][sig] || sig;
    return `siglo ${rom}${y < 0 ? ' a. C.' : ''}`;
  }
  return y < 0 ? `${a} a. C.` : String(a);
}

function lugares() {
  const tsv = fs.readFileSync(R('tools/fotos/lugares.tsv'), 'utf8').trim().split('\n');
  const head = tsv.shift().split('\t');
  const fichas = jsonOr('data/fichas.json', {});
  const cred = jsonOr('fotos/creditos.json', {});
  const out = [];
  for (const line of tsv) {
    const r = Object.fromEntries(line.split('\t').map((v, i) => [head[i], v]));
    const wd = jsonOr(`tools/fotos/out/lugares/${r.id}.json`, {});
    const f = fichas[r.id] || {};
    const coord = f.coord || wd.coord;
    if (!coord) continue;
    const fotos = Object.keys(cred).filter(k => k.startsWith(r.id + '-') && /^\d+$/.test(k.slice(r.id.length + 1)))
      .sort((a, b) => +a.split('-').pop() - +b.split('-').pop())
      .map(k => ({ f: k, w: cred[k].ancho, h: cred[k].alto, a: cred[k].autor, l: cred[k].licencia, u: cred[k].page, fo: cred[k].foco }));
    let anio = f.anio, anioTxt = f.anioTxt;
    if (anio == null && wd.inicio && wd.inicio.length) {
      const i = wd.inicio[0];
      const m = /^([+-])(\d+)-/.exec(i.time || '');
      if (m) { anio = (m[1] === '-' ? -1 : 1) * +m[2]; anioTxt = anioTexto(anio, i.prec); }
    }
    let alto = f.alto;
    if (alto == null && wd.altura) { const h = wd.altura.find(x => x.u === 'Q11573'); if (h) alto = h.v; }
    out.push({
      id: r.id, n: f.nombre || r.nombre, iso: r.iso.split(','), c: r.cont, t: +r.nivel, k: r.cat,
      lat: +(+coord[0]).toFixed(4), lon: +(+coord[1]).toFixed(4),
      lugar: f.lugar || '', anio: anio == null ? null : anio, anioTxt: anioTxt || '',
      alto: alto == null ? null : Math.round(alto * 10) / 10, elev: f.elev || null,
      datos: f.datos || [], porque: f.porque || '', pistas: f.pistas || [], unesco: !!wd.unesco,
      fotos,
    });
  }
  return out;
}

exports.build = () => {
  const { paises: ps, shape } = paises();
  const lu = lugares();
  return { embed: { lugares: lu, paises: ps, shape, mapaLo: jsonOr('data/mapa-lo.json', null) } };
};

if (require.main === module) {
  const d = exports.build().embed;
  console.log('lugares', d.lugares.length, 'paises', d.paises.length, 'con capital', d.paises.filter(p => p.capLat != null).length);
}

// ===== datos del mundo =====
const DATA = window.TMD_DATA;
const LUGARES = DATA.lugares;
const PAISES = DATA.paises;
const LUGAR = Object.fromEntries(LUGARES.map(l => [l.id, l]));
const PAIS = Object.fromEntries(PAISES.map(p => [p.iso, p]));

const CONTINENTES = {
  EU: { n: 'Europa', color: '#F5C29E' },
  AS: { n: 'Asia', color: '#F3D98F' },
  AF: { n: 'África', color: '#EDB088' },
  NA: { n: 'Norteamérica y Centroamérica', corto: 'Norteamérica', color: '#A6D7A3' },
  SA: { n: 'Suramérica', color: '#99D3C0' },
  OC: { n: 'Oceanía', color: '#E5B6D3' },
  AN: { n: 'Antártida', color: '#F3F7F9' },
};
const NIVELES = {
  1: { n: 'Famosos', d: 'Los íconos que todo el mundo conoce' },
  2: { n: 'Conocidos', d: 'Lugares célebres de cada país' },
  3: { n: 'Para expertos', d: 'Reconocidos, pero menos famosos' },
};
const CATEGORIAS = {
  monumento: 'Monumento', naturaleza: 'Naturaleza', antiguo: 'Antiguo', sagrado: 'Sagrado', ciudad: 'Ciudad', moderno: 'Moderno',
};

const nombrePais = iso => (PAIS[iso] || {}).n || iso;
const paisesDe = l => l.iso.map(nombrePais).join(' / ');

// fotos: archivos aparte (cargan solos cuando se necesitan)
const Foto = {
  url(l, i = 0, min = false) { const f = l.fotos[i]; return f ? `fotos/${min ? 'min/' : ''}${f.f}.webp` : null; },
  tiene(l) { return l.fotos && l.fotos.length > 0; },
  credito(l, i = 0) { const f = l.fotos[i]; return f ? `Foto: ${f.a || 'autor desconocido'} · ${f.l || ''} · Wikimedia Commons` : ''; },
  // precarga y devuelve una promesa que resuelve cuando la imagen está lista
  cargar(src) { return new Promise(res => { if (!src) return res(null); const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); },
  // si un lugar no tiene foto todavía, se dibuja una postal ilustrada con su mapa
  respaldo(l) {
    const c = CONTINENTES[l.c] || CONTINENTES.EU;
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFEAF6"/><stop offset="1" stop-color="#F7FCFE"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><circle cx="200" cy="150" r="80" fill="${c.color}" opacity=".7"/><text x="200" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#5A7591">Foto en camino</text></svg>`)}`;
  },
};

// banderas (flag-icons, MIT): un solo archivo que se pide una vez
const Banderas = {
  data: null, prom: null,
  cargar() {
    if (!this.prom) this.prom = fetch('datos/banderas.json').then(r => r.json()).then(d => (this.data = d)).catch(() => (this.data = {}));
    return this.prom;
  },
  src(iso) {
    const s = this.data && this.data[(iso || '').toLowerCase()];
    return s ? 'data:image/svg+xml;utf8,' + encodeURIComponent(s) : null;
  },
  el(iso) {
    const span = h('span.bandera', { title: nombrePais(iso) });
    const put = () => { const s = this.src(iso); if (s) span.append(h('img', { src: s, alt: '' })); };
    if (this.data) put(); else this.cargar().then(put);
    return span;
  },
};

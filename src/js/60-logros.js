// ===== Logros =====
// Unos se calculan con lo aprendido (dominio) y otros con hazañas que avisan los modos (Logros.evento).
const Logros = {
  hechos: null, hazanas: null,
  load() { this.hechos = Store.get('logros', {}); this.hazanas = Store.get('hazanas', {}); },
  evento(id, n = 1) {
    if (!this.hazanas) this.load();
    this.hazanas[id] = (this.hazanas[id] || 0) + n;
    Store.set('hazanas', this.hazanas);
  },
  // conteos que usan los logros
  cuentas() {
    if (!Progreso.d) Progreso.load();
    if (!this.hazanas) this.load();
    const d = Progreso.d, dom = (pref, min = 3) => Object.keys(d).filter(k => k.startsWith(pref) && d[k].dom >= min).length;
    const lug = LUGARES.filter(l => (d[l.id] || {}).dom >= 3);
    const porCont = {}; for (const c of Object.keys(CONTINENTES)) porCont[c] = lug.filter(l => l.c === c).length;
    return {
      partidas: Progreso.st.partidas, km: Progreso.st.km, lugares: lug.length, porCont,
      paises: dom('p:'), banderas: dom('b:'), capitales: dom('c:'),
      maestros: LUGARES.filter(l => (d[l.id] || {}).dom >= 5).length,
      visitados: Visitados.get().size, racha: (Store.get('reto', {}).mejor || 0), retos: (Store.get('reto', {}).total || 0),
      h: this.hazanas,
    };
  },
  LISTA: [
    { id: 'primer', n: 'Primer despegue', d: 'Termina tu primer viaje', ico: 'avion', ok: c => c.partidas >= 1 },
    { id: 'frecuente', n: 'Viajero frecuente', d: 'Termina 10 viajes', ico: 'avion', ok: c => c.partidas >= 10 },
    { id: 'incansable', n: 'Incansable', d: 'Termina 50 viajes', ico: 'avion', ok: c => c.partidas >= 50 },
    { id: 'aprende10', n: 'Buena memoria', d: 'Aprende 10 lugares', ico: 'estrella', ok: c => c.lugares >= 10 },
    { id: 'aprende50', n: 'Enciclopedia andante', d: 'Aprende 50 lugares', ico: 'estrella', ok: c => c.lugares >= 50 },
    { id: 'aprende150', n: 'Sabio viajero', d: 'Aprende 150 lugares', ico: 'estrella', ok: c => c.lugares >= 150 },
    { id: 'aprende300', n: 'Atlas viviente', d: 'Aprende 300 lugares', ico: 'estrella', ok: c => c.lugares >= 300 },
    { id: 'maestro', n: 'Maestro de postales', d: 'Domina 10 lugares al máximo (5 estrellas)', ico: 'corona', ok: c => c.maestros >= 10 },
    { id: 'EU', n: 'Sello de Europa', d: 'Aprende 10 lugares de Europa', ico: 'sello', ok: c => c.porCont.EU >= 10 },
    { id: 'AS', n: 'Sello de Asia', d: 'Aprende 10 lugares de Asia', ico: 'sello', ok: c => c.porCont.AS >= 10 },
    { id: 'AF', n: 'Sello de África', d: 'Aprende 10 lugares de África', ico: 'sello', ok: c => c.porCont.AF >= 10 },
    { id: 'NA', n: 'Sello de Norteamérica', d: 'Aprende 10 lugares de Norte y Centroamérica', ico: 'sello', ok: c => c.porCont.NA >= 10 },
    { id: 'SA', n: 'Sello de Suramérica', d: 'Aprende 10 lugares de Suramérica', ico: 'sello', ok: c => c.porCont.SA >= 10 },
    { id: 'OC', n: 'Sello de Oceanía', d: 'Aprende 10 lugares de Oceanía', ico: 'sello', ok: c => c.porCont.OC >= 10 },
    { id: 'paises30', n: 'Cartógrafo', d: 'Domina 30 países en el mapa', ico: 'mapa', ok: c => c.paises >= 30 },
    { id: 'banderas20', n: 'Abanderado', d: 'Domina 20 banderas', ico: 'bandera', ok: c => c.banderas >= 20 },
    { id: 'capitales20', n: 'Capitalino', d: 'Domina 20 capitales', ico: 'capital', ok: c => c.capitales >= 20 },
    { id: 'explora25', n: 'Curioso', d: 'Visita 25 lugares en Explorar', ico: 'lupa', ok: c => c.visitados >= 25 },
    { id: 'explora100', n: 'Explorador', d: 'Visita 100 lugares en Explorar', ico: 'lupa', ok: c => c.visitados >= 100 },
    { id: 'blanco', n: 'En el blanco', d: 'Clava una postal a menos de 25 km', ico: 'pin', ok: c => c.h.postalExacta >= 1 },
    { id: 'rumbo', n: 'Rumbo perfecto', d: 'Apunta la brújula con menos de 5° de error', ico: 'brujula', ok: c => c.h.rumboPerfecto >= 1 },
    { id: 'racha5', n: 'Ojo de medidor', d: 'Racha de 5 en ¿Más alto o más bajo?', ico: 'regla', ok: c => c.h.rachaAltura >= 1 },
    { id: 'reto3', n: 'Constante', d: 'Haz el reto del día 3 días seguidos', ico: 'calendario', ok: c => c.racha >= 3 },
    { id: 'reto7', n: 'Semana viajera', d: 'Haz el reto del día 7 días seguidos', ico: 'calendario', ok: c => c.racha >= 7 },
    { id: 'km100k', n: '100 000 km', d: 'Recorre 100 000 km entre postales', ico: 'globo', ok: c => c.km >= 100000 },
  ],
  // devuelve los logros que se acaban de ganar
  revisar() {
    if (!this.hechos) this.load();
    const c = this.cuentas(), nuevos = [];
    for (const l of this.LISTA) if (!this.hechos[l.id] && l.ok(c)) { this.hechos[l.id] = Date.now(); nuevos.push(l); }
    if (nuevos.length) Store.set('logros', this.hechos);
    return nuevos;
  },
  tiene(id) { if (!this.hechos) this.load(); return !!this.hechos[id]; },
};

// medallas: círculo brillante con un dibujo sencillo
const ICO_LOGRO = {
  avion: '<path d="M-9 2l18-8-6 16-3-6z" fill="#fff"/>',
  estrella: '<path d="M0-10l3 6.5 7 .8-5.2 4.8 1.4 7L0 5.6-6.2 9.1l1.4-7L-10-2.7l7-.8z" fill="#fff"/>',
  corona: '<path d="M-10 6h20l2-12-7 5-5-8-5 8-7-5z" fill="#fff"/>',
  sello: '<circle r="9" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 2"/><circle r="4" fill="#fff"/>',
  mapa: '<path d="M-10-7l6-2 8 3 6-2v15l-6 2-8-3-6 2z" fill="#fff"/><path d="M-4-9v15M4-6v15" stroke="rgba(0,0,0,.2)" stroke-width="1.4"/>',
  bandera: '<path d="M-7-10v21" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M-6-9h14l-3 5 3 5h-14z" fill="#fff"/>',
  capital: '<path d="M-10 9h20M-8 9v-7M-3 9v-7M3 9v-7M8 9v-7M-11 2h22L0-9z" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  lupa: '<circle cx="-2" cy="-2" r="6" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M3 3l6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
  pin: '<path d="M0 10C-4 4-7 1-7-3a7 7 0 0 1 14 0c0 4-3 7-7 13z" fill="#fff"/><circle cy="-3" r="2.6" fill="rgba(0,0,0,.25)"/>',
  brujula: '<circle r="9" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M0-7l3 7-3 7-3-7z" fill="#fff"/>',
  regla: '<rect x="-10" y="-4" width="20" height="8" rx="2" fill="#fff"/><path d="M-6-4v3M-2-4v4M2-4v3M6-4v4" stroke="rgba(0,0,0,.3)" stroke-width="1.3"/>',
  calendario: '<rect x="-9" y="-7" width="18" height="16" rx="3" fill="#fff"/><path d="M-9-2h18" stroke="rgba(0,0,0,.25)" stroke-width="1.6"/><path d="M-4-10v5M4-10v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  globo: '<circle r="9" fill="#fff"/><path d="M-9 0h18M0-9c-4 4-4 14 0 18M0-9c4 4 4 14 0 18" stroke="rgba(0,0,0,.22)" stroke-width="1.4" fill="none"/>',
};
const COLOR_LOGRO = { avion: '#3E7CC4', estrella: '#F2AE1C', corona: '#E0A21C', sello: '#EF6F5E', mapa: '#4FBF7F', bandera: '#E05A8A', capital: '#9B7BE0', lupa: '#2FA7C9', pin: '#EF6F5E', brujula: '#D88E12', regla: '#5DBB88', calendario: '#3E7CC4', globo: '#2F8FD8' };
function medallaSVG(l, gano) {
  const c = gano ? COLOR_LOGRO[l.ico] : '#C9D3DC';
  return `<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle r="21" fill="${ajustaColor(c, -.25)}"/><circle r="19.5" cy="-1" fill="${c}"/>
    <circle r="15" cy="-1" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.4" stroke-dasharray="2 2.4"/>
    <g transform="translate(0 -1)" opacity="${gano ? 1 : .8}">${ICO_LOGRO[l.ico]}</g>
    <ellipse cx="-7" cy="-11" rx="7" ry="3.6" fill="rgba(255,255,255,.45)" transform="rotate(-25 -7 -11)"/></svg>`;
}
// aviso de logro nuevo
function anunciarLogros(nuevos) {
  nuevos.forEach((l, k) => setTimeout(() => {
    const t = h('div.toast.toast-logro', h('span.toast-medalla', { html: medallaSVG(l, true) }), h('span', h('small', '¡Logro nuevo!'), h('b', l.n)));
    $('#toasts').append(t); Sonido.play('genial'); setTimeout(() => t.remove(), 3400);
  }, 700 + k * 1300));
}

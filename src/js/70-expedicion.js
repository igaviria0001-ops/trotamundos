// ===== La gran expedición =====
// El camino de aprendizaje: capítulos que van de lo más famoso a lo menos conocido.
// Cada capítulo tiene 6 paradas (juegos cortos); cada parada abre la siguiente y el capítulo abre el próximo.
const CAPITULOS = [
  { id: 'iconos', n: 'Íconos del mundo', d: 'Los lugares que todo el mundo reconoce', conts: ['EU', 'AS', 'AF', 'NA', 'SA', 'OC'], niveles: [1], color: '#3E7CC4' },
  { id: 'americas', n: 'Las Américas', d: 'De Alaska a la Patagonia', conts: ['NA', 'SA'], niveles: [1, 2], color: '#4FBF7F' },
  { id: 'europa', n: 'Europa', d: 'Castillos, plazas y montañas', conts: ['EU'], niveles: [1, 2], color: '#F2995A' },
  { id: 'asia', n: 'Asia', d: 'Templos, ciudades y cumbres', conts: ['AS'], niveles: [1, 2], color: '#E8B526' },
  { id: 'afoc', n: 'África y Oceanía', d: 'Desiertos, sabanas e islas', conts: ['AF', 'OC'], niveles: [1, 2], color: '#E9845E' },
  { id: 'joyas-am', n: 'Joyas de América', d: 'Lugares menos famosos, pero reconocidos', conts: ['NA', 'SA'], niveles: [3], color: '#2FA48A' },
  { id: 'joyas-eu', n: 'Joyas de Europa', d: 'Para viajeros con experiencia', conts: ['EU'], niveles: [3], color: '#D8743A' },
  { id: 'joyas-as', n: 'Joyas de Asia', d: 'Para viajeros con experiencia', conts: ['AS'], niveles: [3], color: '#C9941A' },
  { id: 'joyas-afoc', n: 'Joyas de África y Oceanía', d: 'La última frontera del explorador', conts: ['AF', 'OC'], niveles: [3], color: '#D15A8A' },
];
// las seis paradas cambian un poco según el capítulo
function paradasDe(k) {
  const a = [['postal', 2], ['pistas', 2], ['silueta', 'n2'], ['banderasviento', 'n3'], ['raspa', 2], ['postal', 3]];
  const b = [['lupa', 2], ['postal', 2], ['colorea', 'n5'], ['capitales', 'n1'], ['pistas', 2], ['postal', 3]];
  const c = [['raspa', 2], ['brujula', 'n2'], ['silueta', 'n2'], ['pintabandera', 'n2'], ['lupa', 2], ['postal', 3]];
  return [a, b, c][k % 3].map(([modo, rondas], i) => ({ modo, rondas, jefe: i === 5 }));
}
const Expedicion = {
  get() { return Store.get('expedicion', {}); },
  estrellas(cap) { return this.get()[cap] || {}; },
  guardar(cap, k, est) { const d = this.get(); d[cap] = d[cap] || {}; d[cap][k] = Math.max(d[cap][k] || 0, est); Store.set('expedicion', d); },
  total(cap) { return Object.values(this.estrellas(cap)).reduce((a, b) => a + b, 0); },
  // un capítulo se abre cuando el anterior tiene su parada final con al menos una estrella
  abierto(i) { return i === 0 || (this.estrellas(CAPITULOS[i - 1].id)[5] || 0) >= 1; },
  paradaAbierta(cap, k) { return k === 0 || (this.estrellas(cap)[k - 1] || 0) >= 1; },
};

Pantallas.juego_expedicion = () => { setTimeout(() => UI.ir('expedicion'), 0); return { el: h('div') }; };
Pantallas.expedicion = (capIdx) => {
  let ci = capIdx != null ? capIdx : Math.max(0, CAPITULOS.findIndex((c, i) => Expedicion.abierto(i) && Expedicion.total(c.id) < 18 && !(i + 1 < CAPITULOS.length && Expedicion.abierto(i + 1))));
  if (ci < 0) ci = 0;
  const camino = h('div.exp-camino');
  const tabs = h('div.exp-caps');
  const cab = h('div.exp-cab');
  function pintar() {
    const cap = CAPITULOS[ci], est = Expedicion.estrellas(cap.id), abierto = Expedicion.abierto(ci);
    tabs.innerHTML = '';
    CAPITULOS.forEach((c, i) => tabs.append(h('button.exp-tab' + (i === ci ? '.activo' : '') + (Expedicion.abierto(i) ? '' : '.cerrado'), { style: { '--cc': c.color }, onclick: () => { ci = i; Sonido.play('tap'); pintar(); } },
      h('b', String(i + 1)), Expedicion.abierto(i) ? null : h('span.exp-candado', { html: candadoSVG() }))));
    cab.innerHTML = '';
    cab.style.setProperty('--cc', cap.color);
    cab.append(h('small', `Capítulo ${ci + 1}`), h('h3', cap.n), h('p', cap.d),
      h('div.exp-total', h('span', { html: I.estrella }), h('b', `${Expedicion.total(cap.id)} / 18`)));
    // camino serpenteante con seis paradas
    camino.innerHTML = '';
    camino.style.setProperty('--cc', cap.color);
    const paradas = paradasDe(ci);
    const pos = [[22, 8], [70, 22], [30, 38], [72, 54], [28, 70], [62, 88]];
    const d = pos.map(([x, y], k) => (k ? `S${(pos[k - 1][0] + x) / 2 + (k % 2 ? 20 : -20)} ${(pos[k - 1][1] + y) / 2} ${x} ${y}` : `M${x} ${y}`)).join(' ');
    camino.append(svgEl(`<svg class="exp-ruta" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="3.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${cap.color}" stroke-width="2" stroke-dasharray="1 2.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`));
    paradas.forEach((p, k) => {
      const ab = abierto && Expedicion.paradaAbierta(cap.id, k), e = est[k] || 0;
      camino.append(h('button.exp-parada' + (ab ? '' : '.cerrada') + (p.jefe ? '.jefe' : '') + (ab && !e ? '.siguiente' : ''), {
        style: { left: pos[k][0] + '%', top: pos[k][1] + '%' },
        onclick: () => jugar(k, ab),
      },
        h('span.exp-bola', { html: ab ? I.m[ICO_MODO[p.modo]] : candadoSVG() }),
        h('span.exp-nombre', p.jefe ? '¡Gran final!' : MODO[p.modo].n),
        ab ? UI.estrellas(e) : null));
    });
    // adornos del capítulo
    camino.append(h('div.exp-adorno.a1', { html: adornoSVG(ci, 0) }), h('div.exp-adorno.a2', { html: adornoSVG(ci, 1) }));
  }
  function jugar(k, ab) {
    const cap = CAPITULOS[ci];
    if (!Expedicion.abierto(ci)) { UI.toast('Termina el gran final del capítulo anterior para abrir este'); Sonido.play('pop'); return; }
    if (!ab) { UI.toast('Gana al menos una estrella en la parada anterior'); Sonido.play('pop'); return; }
    const p = paradasDe(ci)[k];
    Sonido.play('sello');
    Cadena.iniciar({ tipo: 'expedicion', titulo: cap.n, cap: ci, parada: k, nivel: String(cap.niveles[0]), pasos: [{ modo: p.modo, cfg: { conts: cap.conts, niveles: cap.niveles, cont: cap.conts.length === 1 ? cap.conts[0] : 'todo', rondas: p.rondas } }] });
  }
  const el = h('div.expedicion',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'La gran expedición'), h('div.sub', 'El mundo por capítulos')),
      h('div.barra-hueco')),
    h('div.exp-tabs-zona', tabs),
    h('div.scroll.exp-zona', cab, camino));
  requestAnimationFrame(pintar);
  return { el };
};
function candadoSVG() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" fill="#B7C5D3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#B7C5D3" stroke-width="2.6"/><circle cx="12" cy="15.5" r="1.8" fill="#fff"/></svg>'; }
function adornoSVG(ci, k) {
  const set = [
    ['<path d="M10 54h44L32 10z" fill="#E2B56E"/><path d="M32 10l22 44H32z" fill="#C9954D"/>', '<circle cx="32" cy="34" r="20" fill="#7FD49E"/><rect x="29" y="46" width="6" height="14" rx="3" fill="#A06B3A"/>'],
    ['<path d="M6 56l18-30 10 14 8-10 16 26z" fill="#8FC9A6"/><path d="M24 26l5 8-5-2-5 2z" fill="#fff"/>', '<path d="M30 60V24" stroke="#A06B3A" stroke-width="4"/><path d="M30 26c-10-8-20-4-24 2 8-2 16-1 24-2zm0 0c10-8 20-4 24 2-8-2-16-1-24-2z" fill="#5DBB88"/>'],
    ['<rect x="18" y="22" width="28" height="34" rx="3" fill="#F2C9A0"/><path d="M14 24L32 8l18 16z" fill="#E07A5F"/><rect x="28" y="40" width="8" height="16" rx="3" fill="#A06B3A"/>', '<path d="M6 56l18-30 10 14 8-10 16 26z" fill="#B9D8EE"/><path d="M24 26l6 9-6-3-6 3z" fill="#fff"/>'],
  ];
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${set[ci % 3][k]}</svg>`;
}

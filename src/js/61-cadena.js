// ===== Viajes encadenados: reto del día, viaje rápido y viaje a la medida =====
// Una cadena es una lista de paradas (cada una, un modo con pocas rondas). Entre parada y parada
// aparece una tarjeta de "próxima parada"; al final, un resumen con todo.
const hoyClave = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nivelSugerido = () => { const a = Progreso.aprendidos(); return a < 25 ? '1' : a < 90 ? 'mezcla' : a < 200 ? '2' : 'mezcla'; };
// cuántas rondas usa cada modo dentro de una cadena
const PASO_CORTO = { postal: 2, raspa: 2, lupa: 2, pistas: 2, parejas: 5, rompepostal: 'n1', colorea: 'n5', rompepaises: 'n5', silueta: 'n2', brujula: 'n2', nortesur: 'n1', pintabandera: 'n2', banderasviento: 'n3', capitales: 'n1', lineatiempo: 'n1', masalto: 'n4' };

const Cadena = {
  activa: null,
  iniciar(def) {
    this.activa = Object.assign({ i: 0, puntos: 0, max: 0, res: [], hechos: [] }, def);
    UI.ir('cadena');
  },
  jugar() {
    const a = this.activa, p = a.pasos[a.i];
    UI.ir('juego_' + p.modo, Object.assign({ cont: 'todo', nivel: a.nivel || '1' }, p.cfg, { rondas: PASO_CORTO[p.modo], cadena: true }));
  },
  termino(d) {
    const a = this.activa; if (!a) return UI.ir('resumen', d);
    a.puntos += d.puntos; a.max += d.max; a.res.push(...d.res);
    a.hechos.push({ modo: d.modo, puntos: d.puntos, max: d.max, est: estrellasDe(d.puntos / Math.max(1, d.max)) });
    a.i++;
    UI.ir(a.i >= a.pasos.length ? 'cadena_fin' : 'cadena');
  },
  salir() { this.activa = null; },
};
const estrellasDe = f => f >= .8 ? 3 : f >= .55 ? 2 : f >= .25 ? 1 : 0;

// ----- definiciones -----
function retoDelDia() {
  const r = rng(hash(hoyClave()));
  const grupos = [['postal', 'raspa', 'lupa', 'pistas', 'rompepostal'], ['silueta', 'brujula', 'colorea', 'nortesur'], ['banderasviento', 'pintabandera', 'capitales'], ['masalto', 'lineatiempo'], ['postal', 'pistas', 'silueta', 'banderasviento']];
  const pasos = [];
  for (const g of grupos) { const m = g[Math.floor(r() * g.length)]; if (!pasos.some(p => p.modo === m)) pasos.push({ modo: m }); }
  while (pasos.length < 6) { const m = pick(['postal', 'pistas', 'raspa', 'lupa', 'silueta', 'brujula', 'banderasviento', 'masalto']); if (!pasos.some(p => p.modo === m)) pasos.push({ modo: m }); }
  return { tipo: 'reto', titulo: 'Reto del día', pasos: shuffle(pasos, r), nivel: nivelSugerido() };
}
function viajeRapido() {
  const ops = ['postal', 'pistas', 'raspa', 'lupa', 'silueta', 'banderasviento', 'brujula', 'masalto', 'capitales', 'nortesur'];
  return { tipo: 'rapido', titulo: 'Viaje rápido', pasos: shuffle(ops).slice(0, 3).map(m => ({ modo: m })), nivel: nivelSugerido() };
}
const Reto = {
  get() { return Object.assign({ ultimo: null, racha: 0, mejor: 0, total: 0, hoyPts: 0 }, Store.get('reto', {})); },
  hechoHoy() { return this.get().ultimo === hoyClave(); },
  completar(pts) {
    const r = this.get(), hoy = hoyClave(), ayer = hoyClave(new Date(Date.now() - 864e5));
    if (r.ultimo === hoy) { r.hoyPts = Math.max(r.hoyPts, pts); Store.set('reto', r); return { r, nuevo: false }; }
    r.racha = r.ultimo === ayer ? r.racha + 1 : 1;
    r.mejor = Math.max(r.mejor, r.racha); r.ultimo = hoy; r.total++; r.hoyPts = pts;
    Store.set('reto', r);
    return { r, nuevo: true };
  },
};
Pantallas.juego_reto = () => { setTimeout(() => Cadena.iniciar(retoDelDia()), 0); return { el: h('div') }; };

// ----- tarjeta de próxima parada -----
Pantallas.cadena = () => {
  const a = Cadena.activa;
  if (!a) { setTimeout(() => UI.ir('inicio'), 0); return { el: h('div') }; }
  const p = a.pasos[a.i], m = MODO[p.modo];
  const salir = async () => {
    const v = await UI.dialogo({ titulo: `¿Dejar el ${a.titulo.toLowerCase()}?`, texto: 'Lo que aprendiste se guarda.', botones: [{ texto: 'Seguir', valor: false }, { texto: 'Salir', valor: true, clase: 'blanco' }] });
    if (v) { Cadena.salir(); UI.ir('inicio'); }
  };
  const ruta = h('div.cad-ruta', a.pasos.map((q, k) => h('div.cad-parada' + (k < a.i ? '.hecha' : k === a.i ? '.actual' : ''),
    h('div.cad-punto', { html: I.m[ICO_MODO[q.modo]] }),
    k < a.i ? UI.estrellas(a.hechos[k].est) : h('small', MODO[q.modo].n))));
  const el = h('div.cadena',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Salir', html: I.cerrar, onclick: salir }),
      h('div.titulo', h('h2', a.titulo), h('div.sub', `Parada ${a.i + 1} de ${a.pasos.length}`)),
      h('div.marcador', h('span.num', fmt.n(a.puntos)), h('small', 'puntos'))),
    h('div.scroll.cad-zona',
      ruta,
      h('div.cad-tarjeta',
        h('div.cad-cinta', a.i === 0 ? '¡Primera parada!' : a.i === a.pasos.length - 1 ? '¡Última parada!' : 'Próxima parada'),
        h('div.cad-ilus', { html: I.m[ICO_MODO[p.modo]] }),
        h('h3', m.n), h('p', m.d),
        UI.quinde(pick(['¡Tú puedes!', 'Este me encanta', '¡Vamos allá!', 'Mira bien las pistas', '¡A volar!']), '.cad-quinde'))),
    h('div.pie-fijo', h('button.btn.grande.ancho', { onclick: () => { Sonido.play('sello'); Cadena.jugar(); } }, h('span', { html: I.avion }), '¡Vamos!')));
  requestAnimationFrame(() => { const r = $('.cad-parada.actual', el); r && r.scrollIntoView({ inline: 'center', block: 'nearest' }); Sonido.play('papel'); });
  return { el };
};

// ----- final de la cadena -----
Pantallas.cadena_fin = () => {
  const a = Cadena.activa;
  if (!a) { setTimeout(() => UI.ir('inicio'), 0); return { el: h('div') }; }
  Cadena.activa = null;
  const f = a.puntos / Math.max(1, a.max);
  let racha = null;
  if (a.tipo === 'reto') racha = Reto.completar(a.puntos);
  const nuevos = Logros.revisar();
  const titulo = f >= .8 ? '¡Viaje de leyenda!' : f >= .55 ? '¡Gran viaje!' : f >= .3 ? '¡Buen viaje!' : '¡Viaje terminado!';
  const num = h('b.res-total', '0');
  const el = h('div.resumen',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Inicio', html: I.casa, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', a.titulo), h('div.sub', `${a.pasos.length} paradas`))),
    h('div.scroll.resumen-zona',
      h('section.resumen-cabeza',
        h('div.sello-grande', { html: selloFinSVG(titulo) }),
        h('div.resumen-puntos', num, h('span', `de ${fmt.n(a.max)} puntos`)),
        racha ? h('div.cad-racha', h('span.cad-fuego', { html: llamaSVG() }), h('div', h('b', racha.r.racha === 1 ? '1 día seguido' : `${racha.r.racha} días seguidos`), h('small', racha.nuevo ? '¡Vuelve mañana para seguir la racha!' : 'Ya hiciste el reto de hoy'))) : null,
        nuevos.length ? h('div.cad-logros', nuevos.map(l => h('div.cad-logro', h('span', { html: medallaSVG(l, true) }), h('b', l.n)))) : null),
      h('section.resumen-lista',
        a.hechos.map((x, k) => h('div.res-item.cad-res', { style: { animationDelay: (k * 70 + 300) + 'ms' } },
          h('div.cad-mini', { html: I.m[ICO_MODO[x.modo]] }),
          h('div.res-item-txt', h('b', MODO[x.modo].n), h('small', `${fmt.n(x.puntos)} de ${fmt.n(x.max)} puntos`)),
          h('div.res-item-der', UI.estrellas(x.est))))),
      h('section.resumen-botones',
        a.tipo !== 'reto' ? h('button.btn.grande.ancho', { onclick: () => Cadena.iniciar(a.tipo === 'rapido' ? viajeRapido() : Object.assign({}, a, { i: 0, puntos: 0, max: 0, res: [], hechos: [] })) }, h('span', { html: I.repetir }), 'Otro viaje así') : null,
        h('div.fila-btns',
          h('button.btn.blanco', { onclick: () => UI.ir('pasaporte') }, h('span', { html: I.tiquete }), 'Mi pasaporte'),
          h('button.btn.blanco', { onclick: () => UI.ir('inicio') }, h('span', { html: I.casa }), 'Inicio')))));
  requestAnimationFrame(async () => {
    await sleep(350); Sonido.play('sello'); await sleep(250);
    UI.contar(num, 0, a.puntos, 1200);
    if (f >= .55) { await sleep(600); Sonido.play('fin'); UI.confeti(90); }
  });
  return { el };
};
function llamaSVG() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4.4 0-7.5-3-7.5-7 0-3.5 2.6-5.6 3.8-8.6.3 2 1.4 3.2 2.6 3.7C10.6 6.4 12.5 3.6 15 2c-.6 3.3 4.5 6.2 4.5 12.6 0 4.2-3.2 7.4-7.5 7.4z" fill="#FF8A3D"/><path d="M12 21c-2.2 0-3.7-1.5-3.7-3.5 0-2.3 2-3.4 2.6-5.4 1.4 1 4.8 2.8 4.8 5.6 0 1.9-1.6 3.3-3.7 3.3z" fill="#FFD45E"/></svg>'; }

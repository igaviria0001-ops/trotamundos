// ===== Modo 5: Parejas del mundo =====
// Memoria con cartas: cada lugar tiene su pareja (foto con nombre, foto con bandera o lugar con país).
Pantallas.juego_parejas = (cfg) => {
  Progreso.load();
  const pares = { 5: 6, 10: 8, 15: 10 }[cfg.rondas] || 6;
  const pool = filtrarLugares(cfg);
  // sin dos lugares del mismo país cuando la pareja es la bandera
  const tipo = cfg.parejaTipo || pick(['foto-nombre', 'foto-bandera', 'foto-nombre', 'nombre-bandera']);
  let elegidos = Progreso.elegir(pool, Math.min(pares * 3, pool.length));
  if (tipo !== 'foto-nombre') { const vistos = new Set(); elegidos = elegidos.filter(l => !vistos.has(l.iso[0]) && vistos.add(l.iso[0])); }
  elegidos = elegidos.slice(0, pares);
  const N = elegidos.length;
  const P = crearPartida({ modo: 'parejas', cfg, n: N, onSalir: () => limpiar() });
  const S = { abiertas: [], bloqueo: false, fallos: {}, hechas: 0, movs: 0, t0: performance.now() };
  const titulos = { 'foto-nombre': 'Une cada foto con su nombre', 'foto-bandera': 'Une cada foto con la bandera de su país', 'nombre-bandera': 'Une cada lugar con la bandera de su país' };

  const caraDe = (l, lado) => {
    const t = tipo.split('-')[lado];
    if (t === 'foto') return h('div.cara.frente.c-foto', h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '', draggable: false }));
    if (t === 'nombre') return h('div.cara.frente.c-nombre', h('b', l.n), h('small', CATEGORIAS[l.k]));
    const b = Banderas.el(l.iso[0]); b.classList.add('grande');
    return h('div.cara.frente.c-bandera', b, h('small', nombrePais(l.iso[0])));
  };
  const cartas = shuffle(elegidos.flatMap(l => [0, 1].map(lado => ({ l, lado }))));
  const tablero = h('div.tablero', { style: { '--cols': N <= 6 ? 3 : 4 } }, cartas.map(c => {
    const b = h('button.carta-mem', { 'aria-label': 'Carta tapada', onclick: () => voltear(b, c) },
      h('div.carta-int', caraDe(c.l, c.lado), h('div.cara.dorso', h('span', { html: I.avion }))));
    c.el = b;
    return b;
  }));
  const ayuda = h('p.parejas-ayuda', titulos[tipo]);
  const movs = h('b', '0');
  const movsTxt = h('span', ' intentos');
  P.escena.append(h('div.parejas-zona', h('div.parejas-cab', ayuda, h('span.parejas-movs', movs, movsTxt)), tablero), P.hoja);
  P.ronda(0, titulos[tipo].replace('Une cada ', 'Parejas: ').replace(' con ', ' y '));
  const sub = $('.barra .sub', P.el); sub.textContent = `${N} parejas`;

  function voltear(b, c) {
    if (S.bloqueo || b.classList.contains('arriba') || b.classList.contains('hecha')) return;
    b.classList.add('arriba'); Sonido.play('papel');
    S.abiertas.push(c);
    if (S.abiertas.length < 2) return;
    const [a, d] = S.abiertas; S.abiertas = [];
    S.movs++; movs.textContent = S.movs; movsTxt.textContent = S.movs === 1 ? ' intento' : ' intentos';
    if (a.l.id === d.l.id && a.lado !== d.lado) {
      // ¡pareja!
      const l = a.l, f = S.fallos[l.id] || 0;
      a.el.classList.add('hecha'); d.el.classList.add('hecha');
      const est = f === 0 ? 3 : f <= 2 ? 2 : 1;
      const pts = Math.max(200, 1000 - f * 200);
      const dom = Progreso.registrar(l.id, est === 3 ? .9 : est === 2 ? .7 : .5);
      P.res.push({ l, est, pts, det: f === 0 ? 'a la primera' : `${f} ${f === 1 ? 'fallo' : 'fallos'}`, dom });
      P.marcar(S.hechas, est >= 2 ? 'hecho' : 'medio');
      S.hechas++;
      P.sumar(pts);
      Sonido.play(est === 3 ? 'bien' : 'medio'); vibrar(18);
      mostrarPareja(l);
      if (S.hechas === N) setTimeout(fin, 1200);
    } else {
      S.fallos[a.l.id] = (S.fallos[a.l.id] || 0) + 1;
      S.fallos[d.l.id] = (S.fallos[d.l.id] || 0) + 1;
      S.bloqueo = true;
      setTimeout(() => { a.el.classList.remove('arriba'); d.el.classList.remove('arriba'); S.bloqueo = false; }, 950);
    }
  }
  function mostrarPareja(l) {
    const t = h('div.pareja-aviso', h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '' }), h('div', h('b', l.n), h('small', ...l.iso.map(i => Banderas.el(i)), ' ', paisesDe(l))));
    $('.parejas-zona', P.el).append(t);
    setTimeout(() => t.remove(), 2200);
  }
  function fin() {
    const seg = Math.round((performance.now() - S.t0) / 1000);
    Sonido.play('fin'); UI.confeti(60);
    P.terminar({ det: `${S.movs} intentos en ${seg} s` });
  }
  function limpiar() { }
  return { el: P.el, salir: limpiar };
};

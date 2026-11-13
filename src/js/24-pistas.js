// ===== Modo 4: Pistas de Quinde =====
// Quinde da pistas una a una; se elige la postal correcta con las menos pistas posibles.
function pistasDe(l) {
  const out = [];
  const ocultar = t => t.replace(new RegExp(l.n.split(/[ ,(]/)[0], 'gi'), '…');
  for (const d of (l.pistas.length ? l.pistas : l.datos)) out.push({ t: ocultar(d), tipo: 'dato' });
  if (l.anioTxt && l.k !== 'naturaleza') out.push({ t: `Se construyó ${/^hacia/.test(l.anioTxt) ? l.anioTxt : /^(siglo|año)/.test(l.anioTxt) ? 'en el ' + l.anioTxt : 'en ' + l.anioTxt}.`, tipo: 'año' });
  if (l.alto) out.push({ t: `Mide ${fmt.m(l.alto)} de altura.`, tipo: 'alto' });
  if (l.elev) out.push({ t: `Está a ${fmt.m(l.elev)} sobre el nivel del mar.`, tipo: 'alto' });
  out.push({ t: `Es un lugar de la categoría «${CATEGORIAS[l.k].toLowerCase()}».`, tipo: 'cat' });
  out.push({ t: `Está en ${CONTINENTES[l.c].n}.`, tipo: 'cont' });
  if (l.lugar) out.push({ t: `Queda en ${l.lugar}.`, tipo: 'lugar' });
  out.push({ t: `Su país: ${paisesDe(l)}.`, tipo: 'pais' });
  // los datos curiosos primero (más difíciles), lo geográfico al final
  const orden = { dato: 0, año: 1, alto: 1, cat: 2, cont: 3, lugar: 4, pais: 5 };
  return out.sort((a, b) => orden[a.tipo] - orden[b.tipo]).slice(0, 6);
}

Pantallas.juego_pistas = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg);
  const rondas = Progreso.elegir(pool, Math.min(cfg.rondas || 5, pool.length));
  const N = rondas.length;
  const P = crearPartida({ modo: 'pistas', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', vistas: 1, errores: 0, pistas: [] };

  const burbuja = h('div.pistas-lista');
  const btnMas = h('button.btn.blanco.pistas-mas', { onclick: () => otraPista() }, h('span', { html: I.bombillo }), 'Otra pista');
  const vale = h('b', '1000');
  const opciones = h('div.opciones.fotos');
  P.escena.append(h('div.pistas-zona',
    h('div.pistas-quinde', h('div.quinde', { html: I.quinde }), h('div.pistas-cab', h('b', 'Quinde dice:'), h('small', 'Vale ', vale, ' puntos'))),
    burbuja,
    h('div.pistas-fila', btnMas),
    opciones), P.hoja);

  const valor = () => Math.max(100, Math.round((1000 - (S.vistas - 1) * 170) * (S.errores ? .5 : 1)));
  function mostrar(k) {
    const p = S.pistas[k];
    burbuja.append(h('div.pista-carta', { style: { animationDelay: '0s' } }, h('span.pista-num', String(k + 1)), h('p', p.t)));
    burbuja.scrollTop = burbuja.scrollHeight;
    vale.textContent = fmt.n(valor());
    btnMas.disabled = S.vistas >= S.pistas.length;
  }
  function otraPista() {
    if (S.estado !== 'jugando' || S.vistas >= S.pistas.length) return;
    S.vistas++; mostrar(S.vistas - 1);
    Sonido.play('papel');
  }

  async function ronda() {
    const l = rondas[P.i];
    S.estado = 'cargando'; S.vistas = 1; S.errores = 0; S.pistas = pistasDe(l);
    P.ronda(P.i, `Lugar ${P.i + 1} de ${N}`);
    burbuja.innerHTML = '';
    mostrar(0);
    opciones.innerHTML = '';
    opcionesPara(l, 4).forEach((o, k) => opciones.append(
      h('button.opcion.opcion-foto', { 'data-id': o.id, onclick: e => elegir(o, e.currentTarget) },
        h('img', { src: Foto.url(o, 0, true) || Foto.respaldo(o), alt: '' }),
        h('span.opcion-num', String(k + 1)),
        h('span.opcion-txt', h('b', o.n)))));
    S.estado = 'jugando';
    Sonido.play('pop');
  }

  function elegir(o, btn) {
    if (S.estado !== 'jugando') return;
    const l = rondas[P.i];
    if (o.id !== l.id) {
      S.errores++; btn.classList.add('mal'); btn.disabled = true;
      Sonido.play('lejos'); vibrar([20, 40, 20]);
      if (S.errores < 2) { UI.toast('Ese no es. Te doy otra pista'); otraPista(); vale.textContent = fmt.n(valor()); return; }
      return resolver(false);
    }
    btn.classList.add('bien');
    resolver(true);
  }

  async function resolver(acierto) {
    const l = rondas[P.i];
    S.estado = 'resultado';
    $$('.opcion', opciones).forEach(b => { b.disabled = true; if (b.dataset.id === l.id) b.classList.add('bien'); });
    const pts = acierto ? valor() : 0;
    const est = !acierto ? 0 : S.errores ? 1 : S.vistas <= 1 ? 3 : S.vistas <= 3 ? 2 : 1;
    const dom = Progreso.registrar(l.id, !acierto ? 0 : S.errores ? .4 : 1 - (S.vistas - 1) * .12);
    P.res.push({ l, est, pts, det: acierto ? (S.vistas === 1 ? 'con 1 pista' : `con ${S.vistas} pistas`) : 'no la adivinaste', dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    await sleep(500);
    P.sumar(pts);
    P.resultado({
      est, pts, l, dom, ultima: P.i === N - 1,
      titulo: !acierto ? `Era ${l.n}` : est === 3 ? '¡Con una sola pista!' : est === 2 ? '¡Bien deducido!' : '¡Lo lograste!',
      detalle: acierto ? `Lo adivinaste ${S.vistas === 1 ? 'con 1 pista' : `con ${S.vistas} pistas`}.` : 'Ahora ya conoces sus pistas.',
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
    // la foto grande del lugar arriba de la ficha
    const f = h('button.ficha-foto.res-foto', { onclick: () => UI.visor(Foto.url(l, 0) || Foto.respaldo(l), Foto.credito(l)) }, h('img', { src: Foto.url(l, 0) || Foto.respaldo(l), alt: l.n }));
    const cab = $('.res-cabeza', P.hoja); cab && cab.after(f);
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (S.estado === 'jugando' && /^[1-4]$/.test(e.key)) { const b = $$('.opcion', opciones)[+e.key - 1]; b && !b.disabled && b.click(); }
    else if (S.estado === 'jugando' && (e.key === ' ' || e.key.toLowerCase() === 'p')) { e.preventDefault(); otraPista(); }
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); }
  requestAnimationFrame(() => { if (!N) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'pistas'); } ronda(); });
  return { el: P.el, salir: limpiar };
};

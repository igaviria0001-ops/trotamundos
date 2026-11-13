// ===== Modo 3: Lupa viajera =====
// La foto empieza en un detalle muy de cerca y se va alejando sola; se responde cuando se reconoce.
Pantallas.juego_lupa = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg);
  const rondas = Progreso.elegir(pool, Math.min(cfg.rondas || 5, pool.length));
  const N = rondas.length;
  const DUR = 16000, ZMAX = 7;
  const P = crearPartida({ modo: 'lupa', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', t0: 0, prog: 0, pausa: false, errores: 0, raf: 0, foco: [.5, .5] };

  const img = h('img', { alt: 'Foto de cerca' });
  const lente = h('div.lupa-lente', img, h('div.lupa-aro'));
  const carta = h('div.raspa-carta.postal.lupa-carta', h('div.foto', lente));
  const barra = h('i');
  const vale = h('b', '1000');
  const medidor = h('div.raspa-medidor', h('div.raspa-barra.lupa-barra', barra), h('span', 'Vale ', vale, ' puntos'));
  const btnPausa = h('button.btn.blanco.lupa-pausa', { onclick: () => pausar() }, 'Pausa');
  const opciones = h('div.opciones');
  P.escena.append(h('div.raspa-zona', carta, h('div.lupa-fila', medidor, btnPausa), opciones), P.hoja);

  const valor = () => Math.max(150, Math.round(1000 * Math.pow(1 - S.prog, 1.1) * (S.errores ? .5 : 1)));
  function pintar() {
    const e = 1 - Math.pow(1 - S.prog, 1.6);       // se aleja despacio al principio
    const z = ZMAX - (ZMAX - 1) * e;
    img.style.transformOrigin = `${S.foco[0] * 100}% ${S.foco[1] * 100}%`;
    img.style.transform = `scale(${z.toFixed(3)})`;
    barra.style.width = (S.prog * 100).toFixed(1) + '%';
    vale.textContent = fmt.n(valor());
  }
  function tick(now) {
    if (S.estado !== 'jugando') return;
    if (!S.pausa) { S.prog = clamp((now - S.t0) / DUR, 0, 1); pintar(); }
    if (S.prog < 1) S.raf = requestAnimationFrame(tick);
  }
  function pausar() {
    if (S.estado !== 'jugando') return;
    S.pausa = !S.pausa;
    if (!S.pausa) S.t0 = performance.now() - S.prog * DUR;
    btnPausa.textContent = S.pausa ? 'Seguir' : 'Pausa';
    Sonido.play('tap');
  }

  async function ronda() {
    const l = rondas[P.i];
    S.estado = 'cargando'; S.errores = 0; S.prog = 0; S.pausa = false; btnPausa.textContent = 'Pausa';
    P.ronda(P.i, `Foto ${P.i + 1} de ${N}`);
    const f = l.fotos[0] || {};
    // foco: un punto con detalle, cerca del centro (o el elegido a mano)
    S.foco = f.fo ? f.fo : [.35 + Math.random() * .3, .3 + Math.random() * .35];
    const ok = await Foto.cargar(Foto.url(l, 0) || Foto.respaldo(l));
    img.src = ok ? ok.src : Foto.respaldo(l);
    pintar();
    carta.classList.remove('llega'); void carta.offsetWidth; carta.classList.add('llega');
    opciones.innerHTML = '';
    opcionesPara(l, 4).forEach((o, k) => opciones.append(
      h('button.opcion', { 'data-id': o.id, onclick: e => elegir(o, e.currentTarget) },
        h('span.opcion-num', String(k + 1)),
        h('span.opcion-txt', h('b', o.n), h('small', ...o.iso.slice(0, 1).map(i => Banderas.el(i)), ' ', nombrePais(o.iso[0]))))));
    S.estado = 'jugando'; S.t0 = performance.now();
    Sonido.play('papel');
    S.raf = requestAnimationFrame(tick);
  }

  function elegir(o, btn) {
    if (S.estado !== 'jugando') return;
    const l = rondas[P.i];
    if (o.id !== l.id) {
      S.errores++; btn.classList.add('mal'); btn.disabled = true;
      Sonido.play('lejos'); vibrar([20, 40, 20]);
      if (S.errores < 2) { UI.toast('No es ese. Mira con calma'); return; }
      return resolver(false);
    }
    btn.classList.add('bien');
    resolver(true);
  }

  async function resolver(acierto) {
    const l = rondas[P.i];
    cancelAnimationFrame(S.raf);
    S.estado = 'resultado';
    $$('.opcion', opciones).forEach(b => { b.disabled = true; if (b.dataset.id === l.id) b.classList.add('bien'); });
    const pts = acierto ? valor() : 0;
    const est = !acierto ? 0 : S.errores ? 1 : S.prog <= .3 ? 3 : S.prog <= .65 ? 2 : 1;
    const dom = Progreso.registrar(l.id, !acierto ? 0 : S.errores ? .4 : 1 - S.prog * .5);
    P.res.push({ l, est, pts, det: acierto ? (S.prog <= .3 ? 'muy de cerca' : S.prog <= .65 ? 'a media distancia' : 'casi completa') : 'no la adivinaste', dom });
    // se aleja del todo para ver la foto entera
    const desde = S.prog;
    tween(700, t => { S.prog = lerp(desde, 1, t); pintar(); });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    await sleep(750);
    P.sumar(pts);
    P.resultado({
      est, pts, l, dom, ultima: P.i === N - 1,
      titulo: !acierto ? `Era ${l.n}` : est === 3 ? '¡Qué buen ojo!' : est === 2 ? '¡Bien visto!' : '¡Lo lograste!',
      detalle: acierto ? 'Mira la foto completa y fíjate en ese detalle.' : 'Fíjate en los detalles: la próxima vez lo reconocerás.',
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (S.estado === 'jugando' && /^[1-4]$/.test(e.key)) { const b = $$('.opcion', opciones)[+e.key - 1]; b && !b.disabled && b.click(); }
    else if (e.key === ' ' && S.estado === 'jugando') { e.preventDefault(); pausar(); }
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { cancelAnimationFrame(S.raf); S.estado = 'fin'; document.removeEventListener('keydown', teclas); }
  requestAnimationFrame(() => { if (!N) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'lupa'); } ronda(); });
  return { el: P.el, salir: limpiar };
};

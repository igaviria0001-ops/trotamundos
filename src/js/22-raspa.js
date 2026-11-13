// ===== Modo 2: Raspa y descubre =====
// La foto está tapada con una capa plateada; se raspa con el dedo y se adivina lo antes posible.
Pantallas.juego_raspa = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg);
  const rondas = Progreso.elegir(pool, Math.min(cfg.rondas || 5, pool.length));
  const N = rondas.length;
  const P = crearPartida({ modo: 'raspa', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', desc: 0, errores: 0, rejilla: null, ultSon: 0 };

  const img = h('img', { alt: 'Foto tapada' });
  const capa = h('canvas.raspa-capa');
  const carta = h('div.raspa-carta.postal', h('div.foto', img, capa));
  const barraDesc = h('i');
  const vale = h('b', '1000');
  const medidor = h('div.raspa-medidor', h('div.raspa-barra', barraDesc), h('span', 'Vale ', vale, ' puntos'));
  const opciones = h('div.opciones');
  const pista = h('p.raspa-pista', 'Raspa con el dedo y elige de dónde es la foto');
  P.escena.append(h('div.raspa-zona', carta, medidor, pista, opciones), P.hoja);

  const ctx = capa.getContext('2d');
  let dpr = 1, W = 0, H = 0;
  function prepararCapa() {
    const r = capa.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = Math.max(40, r.width); H = Math.max(30, r.height);
    capa.width = Math.round(W * dpr); capa.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#C3CDD8'); g.addColorStop(.35, '#EEF2F6'); g.addColorStop(.55, '#C9D2DC'); g.addColorStop(.8, '#E6EBF0'); g.addColorStop(1, '#B4C0CC');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // dibujitos de viaje en relieve
    ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = '#7D8FA1'; ctx.font = `700 ${Math.round(W / 22)}px 'Baloo 2', sans-serif`;
    const simbolos = ['✈', '★', '●', '✈', '♦'];
    for (let y = 18, k = 0; y < H + 20; y += W / 9) for (let x = (k++ % 2) * W / 18; x < W + 20; x += W / 9) ctx.fillText(simbolos[(k + Math.round(x)) % simbolos.length], x, y);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `800 ${Math.round(W / 11)}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Raspa aquí', W / 2 + 1, H / 2 + 2);
    ctx.fillStyle = 'rgba(80,100,122,.55)'; ctx.fillText('Raspa aquí', W / 2, H / 2);
    S.rejilla = new Uint8Array(40 * 30); S.desc = 0;
    actualizarMedidor();
  }
  function raspar(x0, y0, x1, y1) {
    const R = Math.max(18, W / 16);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = R * 2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // marcar la rejilla para saber cuánto se ha descubierto
    const pasos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (R / 2)));
    for (let s = 0; s <= pasos; s++) {
      const x = lerp(x0, x1, s / pasos), y = lerp(y0, y1, s / pasos);
      const cx = Math.floor(x / W * 40), cy = Math.floor(y / H * 30), rx = Math.ceil(R / W * 40), ry = Math.ceil(R / H * 30);
      for (let j = cy - ry; j <= cy + ry; j++) for (let i = cx - rx; i <= cx + rx; i++) {
        if (i < 0 || j < 0 || i >= 40 || j >= 30) continue;
        if (Math.hypot((i + .5) / 40 * W - x, (j + .5) / 30 * H - y) <= R) S.rejilla[j * 40 + i] = 1;
      }
    }
    S.desc = S.rejilla.reduce((a, b) => a + b, 0) / S.rejilla.length;
    actualizarMedidor();
    const now = performance.now();
    if (now - S.ultSon > 70) { Sonido.play('raspa'); S.ultSon = now; }
  }
  const valor = () => Math.max(150, Math.round(1000 * Math.pow(1 - S.desc, .85) * (S.errores ? .5 : 1)));
  function actualizarMedidor() {
    barraDesc.style.width = (S.desc * 100).toFixed(1) + '%';
    vale.textContent = fmt.n(valor());
  }
  // gestos de raspar
  let ult = null;
  const xy = e => { const r = capa.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  capa.addEventListener('pointerdown', e => { if (S.estado !== 'jugando') return; capa.setPointerCapture(e.pointerId); ult = xy(e); raspar(...ult, ...ult); pista.classList.add('oculta'); });
  capa.addEventListener('pointermove', e => { if (!ult || S.estado !== 'jugando') return; const p = xy(e); raspar(...ult, ...p); ult = p; });
  const soltar = () => { ult = null; };
  capa.addEventListener('pointerup', soltar); capa.addEventListener('pointercancel', soltar);

  async function ronda() {
    const l = rondas[P.i];
    S.estado = 'cargando'; S.errores = 0;
    P.ronda(P.i, `Foto ${P.i + 1} de ${N}`);
    carta.classList.remove('destapada', 'llega');
    capa.style.opacity = 1;
    const src = Foto.url(l, 0) || Foto.respaldo(l);
    const ok = await Foto.cargar(src);
    img.src = ok ? ok.src : Foto.respaldo(l);
    void carta.offsetWidth; carta.classList.add('llega');
    prepararCapa();
    opciones.innerHTML = '';
    opcionesPara(l, 4).forEach((o, k) => opciones.append(
      h('button.opcion', { 'data-id': o.id, onclick: e => elegir(o, e.currentTarget) },
        h('span.opcion-num', String(k + 1)),
        h('span.opcion-txt', h('b', o.n), h('small', ...o.iso.slice(0, 1).map(i => Banderas.el(i)), ' ', nombrePais(o.iso[0]))))));
    S.estado = 'jugando';
    Sonido.play('papel');
  }

  async function elegir(o, btn) {
    if (S.estado !== 'jugando') return;
    const l = rondas[P.i];
    if (o.id !== l.id) {
      S.errores++;
      btn.classList.add('mal'); btn.disabled = true;
      Sonido.play('lejos'); vibrar([20, 40, 20]);
      if (S.errores < 2) { UI.toast('No es ese. Raspa un poco más'); actualizarMedidor(); return; }
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
    const est = !acierto ? 0 : S.errores ? 1 : S.desc <= .25 ? 3 : S.desc <= .55 ? 2 : 1;
    const q = !acierto ? 0 : S.errores ? .4 : 1 - S.desc * .5;
    const dom = Progreso.registrar(l.id, q);
    const pct = Math.round(S.desc * 100);
    P.res.push({ l, est, pts, det: acierto ? `con ${pct} % a la vista` : 'no la adivinaste', dom });
    carta.classList.add('destapada');
    capa.style.opacity = 0;
    vibrar(acierto ? 25 : 0);
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    await sleep(500);
    P.sumar(pts);
    P.resultado({
      est, pts, l, dom, ultima: P.i === N - 1,
      titulo: !acierto ? `Era ${l.n}` : est === 3 ? pick(['¡Ojo de águila!', '¡Lo viste al instante!']) : est === 2 ? '¡Bien visto!' : '¡Lo lograste!',
      detalle: acierto ? `La reconociste con el ${pct} % de la foto descubierto.` : 'Ya sabes cómo es: la próxima vez la reconocerás.',
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (S.estado === 'jugando' && /^[1-4]$/.test(e.key)) { const b = $$('.opcion', opciones)[+e.key - 1]; b && !b.disabled && b.click(); }
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  const alRedim = () => { if (S.estado === 'jugando' && S.desc < .02) prepararCapa(); };
  window.addEventListener('resize', alRedim);
  function limpiar() { document.removeEventListener('keydown', teclas); window.removeEventListener('resize', alRedim); }
  requestAnimationFrame(() => { if (!N) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'raspa'); } ronda(); });
  return { el: P.el, salir: limpiar };
};

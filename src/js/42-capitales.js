// ===== Modo: Capitales, conecta =====
// Cuatro países a la izquierda y cuatro capitales a la derecha: se unen con una cuerdita.
// Al revisar, el globo pone un alfiler en cada capital.
const pinCapSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16l-5.4 3 1.2-6L3.3 8.8l6.1-.7z" fill="#FFC94D" stroke="#C98A00" stroke-width="1.4" stroke-linejoin="round"/></svg>';

Pantallas.juego_capitales = (cfg) => {
  Progreso.load();
  const pool = poolModo('capitales', cfg);
  const nRondas = escalaModo('capitales', cfg.rondas);
  const elegidos = elegirPaises(pool, Math.min(pool.length, nRondas * 4), undefined, 'c');
  const rondas = [];
  for (let i = 0; i + 4 <= elegidos.length; i += 4) rondas.push(elegidos.slice(i, i + 4));
  const N = rondas.length;
  const P = crearPartida({ modo: 'capitales', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', pares: {}, sel: null };

  const globoCont = h('div.cap-globo');
  const izq = h('div.cap-col.izq'), der = h('div.cap-col.der');
  const cuerdas = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); cuerdas.setAttribute('class', 'cap-cuerdas');
  const tablero = h('div.cap-tablero', izq, der, cuerdas);
  const banner = h('div.ns-banner.cap-banner');
  const btn = h('button.btn.grande.ancho', { disabled: true, onclick: () => S.estado === 'jugando' ? revisar() : siguiente() }, h('span', { html: I.check }), h('span.cap-btn-txt', 'Revisar'));
  const ayuda = h('p.cap-ayuda', 'Une cada país con su capital: arrastra o toca uno y luego el otro');
  P.escena.append(h('div.cap-zona', globoCont, ayuda, tablero, banner, h('div.ns-pie', btn)));

  let globo;
  const ahora = () => rondas[P.i];
  const colorDe = iso => CRAYONES[(ahora().findIndex(p => p.iso === iso) * 2 + 1) % CRAYONES.length];

  function ronda() {
    const grupo = ahora();
    S.estado = 'jugando'; S.pares = {}; S.sel = null;
    P.ronda(P.i, `Tablero ${P.i + 1} de ${N}`);
    P.escena.classList.remove('cap-revisado');
    banner.className = 'ns-banner cap-banner'; banner.innerHTML = '';
    $('.cap-btn-txt', btn).textContent = 'Revisar'; btn.disabled = true;
    izq.innerHTML = ''; der.innerHTML = '';
    grupo.forEach((p, k) => izq.append(h('button.cap-item.pais', { 'data-iso': p.iso, style: { '--c': colorDe(p.iso), animationDelay: k * 60 + 'ms' } },
      Banderas.el(p.iso), h('b', p.n), h('i.cap-nudo'), h('span.cap-marca'))));
    shuffle(grupo).forEach((p, k) => der.append(h('button.cap-item.cap', { 'data-iso': p.iso, style: { animationDelay: (k * 60 + 120) + 'ms' } },
      h('i.cap-nudo'), h('span.cap-estrella', { html: pinCapSVG }), h('b', p.cap), h('span.cap-marca'))));
    $$('.cap-item', tablero).forEach(prepararItem);
    dibujar();
    // el globo muestra dónde quedan los cuatro países, cada uno con el color de su cuerda
    globo.limpiar();
    const col = {}; grupo.forEach(p => { col[p.iso] = ajustaColor(colorDe(p.iso), .25); });
    globo.colores = col; globo.colorResto = '#F3EAD7';
    encuadrarVarios(globo, grupo.map(p => centroPais(p.iso)), 900);
    Sonido.play('papel');
  }

  // ----- unir con el dedo -----
  let arr = null;
  function prepararItem(it) {
    it.addEventListener('pointerdown', e => {
      if (S.estado !== 'jugando') return;
      e.preventDefault();
      it.setPointerCapture(e.pointerId);
      arr = { it, x: e.clientX, y: e.clientY, movio: false };
    });
    it.addEventListener('pointermove', e => {
      if (!arr || arr.it !== it) return;
      if (Math.hypot(e.clientX - arr.x, e.clientY - arr.y) > 8) arr.movio = true;
      if (arr.movio) dibujar({ desde: it, x: e.clientX, y: e.clientY });
    });
    it.addEventListener('pointerup', e => {
      if (!arr || arr.it !== it) return;
      const a = arr; arr = null;
      if (!a.movio) return tocar(it);
      const bajo = document.elementFromPoint(e.clientX, e.clientY);
      const otro = bajo && bajo.closest('.cap-item');
      if (otro && otro.parentNode !== it.parentNode) unir(it, otro); else dibujar();
    });
    it.addEventListener('pointercancel', () => { arr = null; dibujar(); });
  }
  function tocar(it) {
    if (S.sel && S.sel !== it && S.sel.parentNode !== it.parentNode) { const s = S.sel; S.sel = null; s.classList.remove('sel'); return unir(s, it); }
    if (S.sel) S.sel.classList.remove('sel');
    S.sel = S.sel === it ? null : it;
    if (S.sel) it.classList.add('sel');
    Sonido.play('tap'); vibrar(6);
  }
  function unir(a, b) {
    const pais = a.classList.contains('pais') ? a : b, cap = pais === a ? b : a;
    // cada país y cada capital solo pueden tener una cuerda
    for (const k in S.pares) if (S.pares[k] === cap.dataset.iso) delete S.pares[k];
    S.pares[pais.dataset.iso] = cap.dataset.iso;
    $$('.cap-item.sel', tablero).forEach(x => x.classList.remove('sel')); S.sel = null;
    Sonido.play('pin'); vibrar(10);
    dibujar();
    btn.disabled = Object.keys(S.pares).length < ahora().length;
  }
  function nudo(it) {
    const r = $('.cap-nudo', it).getBoundingClientRect(), t = tablero.getBoundingClientRect();
    return [r.left + r.width / 2 - t.left, r.top + r.height / 2 - t.top];
  }
  function cuerda([x1, y1], [x2, y2], color, clase = '') {
    const dx = Math.abs(x2 - x1) * .45;
    return `<path class="cap-cuerda ${clase}" d="M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" style="--c:${color}"/>`;
  }
  function dibujar(tmp) {
    const t = tablero.getBoundingClientRect();
    cuerdas.setAttribute('viewBox', `0 0 ${t.width} ${t.height}`);
    let html = '';
    for (const iso in S.pares) {
      const a = $(`.pais[data-iso="${iso}"]`, izq), b = $(`.cap[data-iso="${S.pares[iso]}"]`, der);
      if (a && b) html += cuerda(nudo(a), nudo(b), S.revision ? (S.pares[iso] === iso ? '#4FBF7F' : '#EF6F5E') : colorDe(iso), S.revision && S.pares[iso] !== iso ? 'mala' : '');
    }
    if (tmp) {
      const p0 = nudo(tmp.desde), p1 = [tmp.x - t.left, tmp.y - t.top];
      html += cuerda(tmp.desde.classList.contains('pais') ? p0 : p1, tmp.desde.classList.contains('pais') ? p1 : p0, tmp.desde.classList.contains('pais') ? colorDe(tmp.desde.dataset.iso) : '#93A7BB', 'temp');
    }
    cuerdas.innerHTML = html;
    $$('.cap-item', tablero).forEach(it => it.classList.toggle('unido', it.classList.contains('pais') ? !!S.pares[it.dataset.iso] : Object.values(S.pares).includes(it.dataset.iso)));
  }

  async function revisar() {
    if (S.estado !== 'jugando') return;
    S.estado = 'revisando';
    const grupo = ahora();
    let bien = 0;
    for (const p of grupo) {
      const ok = S.pares[p.iso] === p.iso;
      if (ok) bien++;
      Progreso.registrar(idPais(p.iso, 'c'), ok ? .9 : 0);
      const it = $(`.pais[data-iso="${p.iso}"]`, izq);
      it.classList.add(ok ? 'bien' : 'mal'); $('.cap-marca', it).innerHTML = ok ? I.check : I.cerrar;
    }
    S.revision = true; dibujar();
    const est = bien === 4 ? 3 : bien === 3 ? 2 : bien === 2 ? 1 : 0, pts = bien * 250;
    Sonido.play(est >= 3 ? 'genial' : est >= 2 ? 'bien' : est === 1 ? 'medio' : 'lejos');
    if (est >= 3) UI.confeti(40);
    const dom = { antes: 0, despues: 0 };
    P.res.push({ l: paisComoLugar(grupo[0], 'c'), est, pts, det: `${bien} de 4 capitales`, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    // alfileres en las capitales
    globo.colores = {}; globo.colorResto = null;
    const lls = grupo.map(p => [p.capLon, p.capLat]);
    grupo.forEach((p, k) => setTimeout(() => globo.pin([p.capLon, p.capLat], { color: S.pares[p.iso] === p.iso ? '#4FBF7F' : '#EF6F5E', texto: p.cap, esc: .85 }), 300 + k * 160));
    encuadrarVarios(globo, lls, 1000);
    banner.className = 'ns-banner cap-banner ve ' + (est >= 2 ? 'bien' : 'mal');
    banner.append(UI.estrellas(est), h('b', est === 3 ? '¡Todas bien unidas!' : est === 2 ? '¡Casi todas!' : est === 1 ? 'Vas bien' : 'Así van unidas'), h('span.ns-pts', `+${fmt.n(pts)}`));
    await sleep(1300);
    // las que quedaron mal se acomodan con su capital de verdad
    S.pares = Object.fromEntries(grupo.map(p => [p.iso, p.iso])); dibujar();
    $$('.cap-item', tablero).forEach(it => { it.onclick = () => abrirFichaPais(PAIS[it.dataset.iso]); });
    P.escena.classList.add('cap-revisado');
    $('.cap-btn-txt', btn).textContent = P.i >= N - 1 ? 'Ver mi viaje' : 'Siguiente';
    btn.disabled = false;
    S.estado = 'resultado'; S.revision = false;
  }
  function siguiente() {
    if (S.estado !== 'resultado') return;
    Sonido.play('tap');
    if (P.i >= N - 1) return P.terminar();
    P.i++; ronda();
  }

  const teclas = e => { if (e.key === 'Enter' && !btn.disabled) { e.preventDefault(); btn.click(); } };
  document.addEventListener('keydown', teclas);
  const ro = new ResizeObserver(() => dibujar());
  function limpiar() { document.removeEventListener('keydown', teclas); ro.disconnect(); globo && globo.destruir(); }

  requestAnimationFrame(async () => {
    if (!N) { UI.toast('No hay suficientes países con esa combinación'); return UI.ir('tiquete', 'capitales'); }
    await Banderas.cargar();
    globo = new Globo(globoCont, { centro: [10, 18], zoom: 1, dobleToque: false, alfaNubes: .45, cuantasNubes: 6, margen: .94 });
    ro.observe(tablero);
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

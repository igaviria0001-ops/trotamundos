// ===== Modo: Rompecabezas postal =====
// La foto llega revuelta en fichas. Se intercambian arrastrando (o tocando una y luego otra).
// En cualquier momento se puede decir "¡Ya sé dónde es!": cuanto antes se adivine, más puntos.
const REJILLAS = { 1: [4, 3], 2: [5, 4], 3: [6, 5], mezcla: [5, 4] };

Pantallas.juego_rompepostal = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg).filter(l => l.fotos.length);
  const rondas = Progreso.elegir(pool, Math.min(escalaModo('rompepostal', cfg.rondas), pool.length));
  const N = rondas.length;
  const P = crearPartida({ modo: 'rompepostal', cfg, n: N, onSalir: () => limpiar() });
  const [C, F] = REJILLAS[cfg.nivel] || REJILLAS[1];
  const S = { estado: 'cargando', celdas: [], movs: 0, sel: null, adivino: null, fallo: false, puestasAlAdivinar: 0 };

  const movs = h('b', '0');
  const marco = h('div.rp2-marco');
  const tablero = h('div.rp2-tablero', { style: { '--c': C, '--f': F } });
  marco.append(tablero);
  const sello = h('div.estampilla.rp2-sello', { html: estampillaSVG() });
  const btnSe = h('button.btn.sol.ancho.grande.rp2-se', { onclick: () => abrirOpciones() }, h('span', { html: I.bombillo }), '¡Ya sé dónde es!');
  const opciones = h('div.opciones.rp2-opciones');
  const caja = h('div.rp2-caja', h('p.rp2-preg', '¿Dónde es esta postal?'), opciones);
  P.escena.append(h('div.rp2-zona',
    h('div.rp2-cab', h('div.ns-cinta.rp2-cinta', h('b', 'Arma la postal')), h('span.rp2-movs', 'Movimientos: ', movs)),
    marco, caja, h('div.ns-pie', btnSe)), P.hoja);
  const ahora = () => rondas[P.i];

  async function ronda() {
    const l = ahora();
    S.estado = 'cargando'; S.movs = 0; S.sel = null; S.adivino = null; S.fallo = false;
    P.ronda(P.i, `Postal ${P.i + 1} de ${N}`);
    movs.textContent = '0';
    P.escena.classList.remove('rp2-armada', 'rp2-pregunta');
    btnSe.disabled = false;
    opciones.innerHTML = '';
    const src = Foto.url(l, 0) || Foto.respaldo(l);
    await Foto.cargar(src);
    // fichas revueltas: ninguna en su sitio al empezar
    const n = C * F;
    let orden;
    do { orden = shuffle([...Array(n).keys()]); } while (orden.some((v, k) => v === k));
    tablero.innerHTML = ''; tablero.append(sello);
    S.celdas = orden; // celdas[k] = ficha que está en la celda k
    S.fichas = [...Array(n).keys()].map(id => {
      const f = h('div.rp2-ficha', { 'data-id': id, style: { backgroundImage: `url("${src}")`, backgroundSize: `${C * 100}% ${F * 100}%`, backgroundPosition: `${(id % C) / (C - 1) * 100}% ${Math.floor(id / C) / (F - 1) * 100}%` } });
      prepararFicha(f);
      tablero.append(f);
      return f;
    });
    ubicar(true);
    S.estado = 'jugando';
    Sonido.play('papel');
  }
  function ubicar(sinAnim) {
    S.celdas.forEach((id, k) => {
      const f = S.fichas[id];
      if (sinAnim) f.style.transition = 'none';
      f.style.left = (k % C) / C * 100 + '%';
      f.style.top = Math.floor(k / C) / F * 100 + '%';
      f.classList.toggle('bien', id === k);
      if (sinAnim) requestAnimationFrame(() => { f.style.transition = ''; });
    });
  }
  const celdaDe = id => S.celdas.indexOf(id);
  function prepararFicha(f) {
    let ini = null;
    f.addEventListener('pointerdown', e => {
      if (S.estado !== 'jugando' || f.classList.contains('bien')) return;
      e.preventDefault(); f.setPointerCapture(e.pointerId);
      ini = { x: e.clientX, y: e.clientY, movio: false };
    });
    f.addEventListener('pointermove', e => {
      if (!ini) return;
      const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
      if (!ini.movio && Math.hypot(dx, dy) > 6) { ini.movio = true; f.classList.add('alzada'); f.style.transition = 'none'; }
      if (ini.movio) f.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    });
    f.addEventListener('pointerup', e => {
      if (!ini) return;
      const mov = ini.movio; ini = null;
      f.classList.remove('alzada'); f.style.transform = ''; f.style.transition = '';
      if (!mov) return tocar(f);
      const r = tablero.getBoundingClientRect();
      const c = Math.floor((e.clientX - r.left) / r.width * C), fi = Math.floor((e.clientY - r.top) / r.height * F);
      if (c < 0 || c >= C || fi < 0 || fi >= F) return ubicar();
      intercambiar(+f.dataset.id, S.celdas[fi * C + c]);
    });
    f.addEventListener('pointercancel', () => { ini = null; f.classList.remove('alzada'); f.style.transform = ''; ubicar(); });
  }
  function tocar(f) {
    const id = +f.dataset.id;
    if (S.sel == null) { S.sel = id; f.classList.add('sel'); Sonido.play('tap'); return; }
    const a = S.sel; S.sel = null; S.fichas[a].classList.remove('sel');
    if (a !== id) intercambiar(a, id);
  }
  function intercambiar(a, b) {
    if (a === b || S.fichas[b].classList.contains('bien')) return ubicar();
    const ka = celdaDe(a), kb = celdaDe(b);
    S.celdas[ka] = b; S.celdas[kb] = a;
    S.movs++; movs.textContent = String(S.movs);
    ubicar();
    const encajo = S.celdas[kb] === kb || S.celdas[ka] === ka;
    Sonido.play(encajo ? 'pin' : 'papel'); vibrar(encajo ? 14 : 6);
    if (S.celdas.every((v, k) => v === k)) armada();
  }
  const puestas = () => S.celdas.filter((v, k) => v === k).length;

  async function armada() {
    S.estado = 'armada';
    P.escena.classList.add('rp2-armada');
    Sonido.play('genial'); UI.confeti(30);
    await sleep(700);
    if (S.adivino) return resolver();
    abrirOpciones(true);
  }
  function abrirOpciones(alFinal = false) {
    if (S.adivino || (!alFinal && S.estado !== 'jugando')) return;
    if (S.fallo && !alFinal) return;
    const l = ahora();
    S.puestasAlAdivinar = alFinal ? C * F : puestas();
    P.escena.classList.add('rp2-pregunta');
    btnSe.disabled = true;
    opciones.innerHTML = '';
    opcionesPara(l, 4).forEach((o, k) => opciones.append(
      h('button.opcion', { 'data-id': o.id, onclick: e => elegir(o, e.currentTarget, alFinal) },
        h('span.opcion-num', String(k + 1)),
        h('span.opcion-txt', h('b', o.n), h('small', ...o.iso.map(i => Banderas.el(i)), ' ', paisesDe(o))))));
    Sonido.play('pop');
  }
  function elegir(o, b, alFinal) {
    const l = ahora();
    if (S.adivino) return;
    if (o.id === l.id) {
      b.classList.add('bien'); S.adivino = { bien: true, puestas: S.puestasAlAdivinar, final: alFinal };
      Sonido.play('bien');
      if (S.estado === 'armada' || alFinal) return resolver();
      // sigue armando, ya con el nombre descubierto
      setTimeout(() => { P.escena.classList.remove('rp2-pregunta'); UI.toast(`¡Sí! Es ${l.n}. Termina de armarla`); }, 700);
      return;
    }
    b.classList.add('mal'); b.disabled = true; Sonido.play('lejos'); vibrar([20, 40, 20]);
    if (alFinal) { S.adivino = { bien: false }; return resolver(); }
    S.fallo = true;
    setTimeout(() => { P.escena.classList.remove('rp2-pregunta'); UI.toast('No es ese. Arma más para ver mejor'); }, 700);
  }
  async function resolver() {
    if (S.estado === 'resultado') return;
    const l = ahora();
    if (S.estado !== 'armada') { await new Promise(r => { const t = setInterval(() => { if (S.estado === 'armada') { clearInterval(t); r(); } }, 200); }); }
    S.estado = 'resultado';
    const total = C * F;
    const minimo = total - 1; // armar siempre pide unos cuantos movimientos
    const arma = Math.round(400 * clamp(minimo / Math.max(S.movs, 1), .4, 1));
    const ad = S.adivino && S.adivino.bien ? Math.round(600 * (S.adivino.final ? .35 : .4 + .6 * (1 - S.adivino.puestas / total))) * (S.fallo ? .6 : 1) : 0;
    const pts = Math.round(arma + ad);
    const est = pts >= 850 ? 3 : pts >= 560 ? 2 : pts > 0 && ad > 0 ? 1 : 0;
    const dom = Progreso.registrar(l.id, ad ? (pts >= 850 ? 1 : .6) : 0);
    P.res.push({ l, est, pts, det: ad ? (S.adivino.final ? 'al final' : `adivinada con ${S.adivino.puestas} de ${total} fichas`) : 'no la adivinaste', dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    P.resultado({
      est, pts, l, dom, ultima: P.i === N - 1,
      titulo: !ad ? `Era ${l.n}` : est === 3 ? '¡Ojo de explorador!' : '¡Postal armada!',
      detalle: `${S.movs} movimientos. ${ad ? (S.adivino.final ? 'La adivinaste al final.' : `La adivinaste con ${S.adivino.puestas} de ${total} fichas en su sitio.`) : ''}`,
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (P.escena.classList.contains('rp2-pregunta') && /^[1-4]$/.test(e.key)) { const b = $$('.opcion', opciones)[+e.key - 1]; b && !b.disabled && b.click(); }
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); }
  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'rompepostal'); }
    Banderas.cargar();
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

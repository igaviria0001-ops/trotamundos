// ===== Modo: Colorea el mapa =====
// El globo empieza en plastilina blanca; Quinde pide un país y el jugador lo toca para pintarlo.
const VISTA_CONT = { todo: [[10, 22], 1], EU: [[14, 52], 2.6], AS: [[88, 30], 1.4], AF: [[18, 2], 1.5], NA: [[-88, 30], 1.35], SA: [[-60, -20], 1.7], OC: [[150, -16], 1.35] };
const vistaDe = cfg => VISTA_CONT[cfg.cont] || VISTA_CONT.todo;
const COLOR_SIN_PINTAR = '#FFF4DB', COLOR_REFERENCIA = '#DCD2BF', COLOR_LEJOS = '#CDDAE1';
// crayones de juguete: cada país pintado recibe uno distinto al de sus vecinos ya pintados
const CRAYONES = ['#FF8A7A', '#FFC94D', '#6DCB95', '#62B6F2', '#B59BF2', '#FF9CCB', '#FFA95A', '#4ECFC0'];
function crayonPara(iso, pintados) {
  const usados = new Set(((PAIS[iso] || {}).vec || []).map(v => pintados[v]).filter(Boolean));
  const k0 = hash(iso) % CRAYONES.length;
  for (let k = 0; k < CRAYONES.length; k++) { const c = CRAYONES[(k0 + k) % CRAYONES.length]; if (!usados.has(c)) return c; }
  return CRAYONES[k0];
}

// colores del globo para un juego de países: los del juego en blanco, el resto apagado
function coloresJuego(enJuego, cfg) {
  const col = {};
  for (const p of PAISES) {
    if (enJuego.has(p.iso)) col[p.iso] = COLOR_SIN_PINTAR;
    else col[p.iso] = (cfg.cont === 'todo' || p.c === cfg.cont) ? COLOR_REFERENCIA : COLOR_LEJOS;
  }
  return col;
}

// bote de pintura de juguete
function boteSVG(color) {
  const cl = ajustaColor(color, .35), os = ajustaColor(color, -.25);
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <ellipse cx="32" cy="58" rx="19" ry="3.6" fill="rgba(36,71,107,.18)"/>
    <path d="M14 21 C10 6 54 6 50 21" fill="none" stroke="#7E95AD" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 22 L15.5 51 Q32 58.5 48.5 51 L52 22 Z" fill="#E9F1F8" stroke="#9DB3C8" stroke-width="1.5"/>
    <path d="M13.6 34 Q32 40 50.4 34 L49.3 44 Q32 50 14.7 44 Z" fill="${color}"/>
    <path d="M12 22 Q32 30 52 22 L51.4 27 Q48 29 47 33 Q45.5 37 44 33 Q43 29.5 38 30.6 Q35 31.2 34.6 37 Q33.6 41 32.4 36.5 Q31.6 31.6 24 30.6 Q21 30.2 20.4 34 Q19.6 37 18.6 33.6 Q17.6 29 12.8 27.6 Z" fill="${color}"/>
    <ellipse cx="32" cy="22" rx="20" ry="5.6" fill="${os}"/>
    <ellipse cx="32" cy="21.4" rx="17.6" ry="4.2" fill="${color}"/>
    <ellipse cx="26" cy="20.4" rx="7" ry="1.6" fill="${cl}" opacity=".9"/>
    <path d="M17 25 L19.5 49" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}

Pantallas.juego_colorea = (cfg) => {
  Progreso.load();
  const pool = poolModo('colorea', cfg);
  const rondas = elegirPaises(pool, escalaModo('colorea', cfg.rondas));
  const N = rondas.length;
  const P = crearPartida({ modo: 'colorea', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', errores: 0, pista: false, pintados: {}, color: null };
  const enJuego = new Set(pool.map(p => p.iso));

  const globoCont = h('div.globo-cont');
  const bote = h('div.bote');
  const nombre = h('b.orden-nombre');
  const bandera = h('span.orden-bandera');
  const btnPista = h('button.icono-btn.orden-pista', { 'aria-label': 'Pista', html: I.bombillo, onclick: () => pista() });
  const orden = h('div.orden', bote, h('div.orden-txt', h('small', 'Pinta'), h('div.orden-fila', bandera, nombre)), btnPista);
  const aviso = h('div.orden-aviso');
  const ayuda = h('div.ayuda-toque', 'Toca el país en el globo');
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.7, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.7, 350) }),
    h('button.icono-btn', { 'aria-label': 'Volver a la vista', html: I.centrar, onclick: () => { const [c, z] = vistaDe(cfg); globo.vuela(c, z, 600); } }));
  P.escena.append(globoCont, h('div.orden-zona', orden, aviso), ayuda, controles);

  let globo;
  const ahora = () => rondas[P.i];

  async function ronda() {
    const p = ahora();
    S.estado = 'cargando'; S.errores = 0; S.pista = false;
    P.ronda(P.i, `País ${P.i + 1} de ${N}`);
    globo.quitaEfectos('pulso');
    orden.classList.remove('llega'); void orden.offsetWidth; orden.classList.add('llega');
    S.color = crayonPara(p.iso, S.pintados);
    bote.innerHTML = boteSVG(S.color);
    nombre.textContent = p.n;
    bandera.innerHTML = ''; bandera.append(Banderas.el(p.iso));
    btnPista.disabled = false;
    Sonido.play('pop');
    S.estado = 'jugando';
  }

  function decir(texto, clase = '') {
    aviso.className = 'orden-aviso ' + clase; aviso.textContent = texto;
    void aviso.offsetWidth; aviso.classList.add('ve');
    clearTimeout(decir.t); decir.t = setTimeout(() => aviso.classList.remove('ve'), 1600);
  }

  function tocar(ll, px) {
    if (S.estado !== 'jugando' || !ll) return;
    ayuda.classList.add('oculta');
    const p = ahora();
    const iso = globo.paisToque(px, { objetivo: p.iso, tol: p.t === 3 ? 20 : 14, entre: enJuego });
    if (!iso) { Sonido.play('tap'); decir('Eso es agua. Busca tierra firme', 'suave'); return; }
    if (iso === p.iso) return acierto(ll);
    if (P.res.some(r => r.l.iso[0] === iso)) { Sonido.play('tap'); decir(`${nombrePais(iso)} ya está pintado`, 'suave'); return; }
    fallo(iso);
  }

  function fallo(iso) {
    const p = ahora();
    S.errores++;
    globo.efecto(iso, 'error');
    const et = { ll: centroPais(iso), texto: nombrePais(iso), color: '#C2453A' };
    globo.etiquetas.push(et); globo.sucio = true;
    setTimeout(() => { globo.etiquetas = globo.etiquetas.filter(e => e !== et); globo.sucio = true; }, 1500);
    Sonido.play('lejos'); vibrar([20, 40, 20]);
    if (S.errores >= 3) return resolver(false);
    if (S.errores === 2 && !S.pista) { decir(`Eso es ${nombrePais(iso)}. Mira la pista`, 'mal'); return pista(true); }
    decir(`Eso es ${nombrePais(iso)}`, 'mal');
    orden.classList.remove('tiembla'); void orden.offsetWidth; orden.classList.add('tiembla');
  }

  function pista(auto = false) {
    if (S.estado !== 'jugando' || S.pista) return;
    const p = ahora();
    S.pista = true; btnPista.disabled = true;
    const cen = centroPais(p.iso);
    const z = Math.max(globo.zoom, clamp(Math.sqrt(2.6e6 / Math.max(p.area || 1e5, 2e4)), 1.4, 7) * .7);
    globo.vuela(cen, z, 800);
    setTimeout(() => globo.efecto(p.iso, 'pulso'), 500);
    if (!auto) decir('Quinde lo señaló en el globo', 'suave');
    Sonido.play('papel');
  }

  async function acierto(ll) {
    const p = ahora();
    S.estado = 'pintando';
    globo.quitaEfectos('pulso');
    Sonido.play('pin'); vibrar(14);
    const pts = S.pista ? 300 : [1000, 600, 300][S.errores] || 300;
    const est = S.pista ? 1 : [3, 2, 1][S.errores] || 1;
    S.pintados[p.iso] = S.color;
    await globo.efecto(p.iso, 'pinta', { color: S.color, desde: ll });
    Sonido.play(est >= 3 ? 'genial' : 'bien');
    decir(p.cap ? `¡${p.n}! Su capital es ${p.cap}` : `¡${p.n}!`, 'bien');
    cerrarRonda(est, pts, S.errores ? `con ${S.errores + 1} intentos` : '¡al primer toque!');
  }

  async function resolver() {
    const p = ahora();
    S.estado = 'pintando';
    globo.quitaEfectos('pulso');
    const cen = centroPais(p.iso);
    globo.vuela(cen, Math.max(globo.zoom, 1.6), 700);
    await sleep(500);
    S.pintados[p.iso] = S.color;
    await globo.efecto(p.iso, 'pinta', { color: ajustaColor(S.color, .45) });
    decir(`Era aquí: ${p.n}`, 'mal');
    cerrarRonda(0, 0, 'Quinde lo pintó');
  }

  async function cerrarRonda(est, pts, det) {
    const p = ahora();
    const q = est >= 3 ? 1 : est === 2 ? .6 : est === 1 ? .35 : 0;
    const dom = Progreso.registrar(idPais(p.iso), q);
    P.res.push({ l: paisComoLugar(p), est, pts, det, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    await sleep(est ? 1100 : 1500);
    if (P.i >= N - 1) return final();
    P.i++; ronda();
  }

  async function final() {
    S.estado = 'fin';
    const [c, z] = vistaDe(cfg);
    globo.vuela(c, z * .92, 1200);
    decir('¡Mapa pintado!', 'bien');
    UI.confeti(80); Sonido.play('fin');
    await sleep(1900);
    P.terminar();
  }

  const teclas = e => { if (e.key === 'h' || e.key === 'p') pista(); };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); globo && globo.destruir(); }

  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay países con esa combinación'); return UI.ir('tiquete', 'colorea'); }
    const [c, z] = vistaDe(cfg);
    globo = new Globo(globoCont, { centro: c, zoom: z * .8, dobleToque: false, zoomMax: 22, alfaNubes: .55, cuantasNubes: 7 });
    globo.colores = coloresJuego(enJuego, cfg);
    globo.on('tap', (ll, px) => tocar(ll, px));
    globo.setPad({ top: 96, bottom: 20 });
    globo.vuela(c, z, 900);
    Banderas.cargar();
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

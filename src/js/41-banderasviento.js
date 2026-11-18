// ===== Modo: Banderas al viento =====
// Rondas que se alternan: (1) ondea una bandera y hay que tocar su país en el globo;
// (2) el globo señala un país y hay que izar su bandera, escogiéndola del tendedero.
function banderasParecidas(p, n = 3) {
  const out = [], usados = new Set([p.iso]);
  const tomar = lista => { for (const x of shuffle(lista)) { if (out.length >= n) return; if (!usados.has(x.iso) && Banderas.src(x.iso)) { usados.add(x.iso); out.push(x); return; } } };
  const vecinos = (p.vec || []).map(i => PAIS[i]).filter(x => x && x.un);
  tomar(vecinos);
  for (let k = 0; out.length < n && k < 8; k++) tomar(PAISES_JUEGO.filter(x => x.c === p.c));
  for (let k = 0; out.length < n && k < 8; k++) tomar(PAISES_JUEGO);
  return out;
}

Pantallas.juego_banderasviento = (cfg) => {
  Progreso.load();
  const pool = poolModo('banderasviento', cfg);
  const rondas = elegirPaises(pool, escalaModo('banderasviento', cfg.rondas), undefined, 'b').map((p, k) => ({ p, tipo: k % 2 ? 'iza' : 'donde' }));
  const N = rondas.length;
  const P = crearPartida({ modo: 'banderasviento', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', sel: null, intentos: 0 };

  const globoCont = h('div.globo-cont');
  const tela = h('div.bv-tela');
  const titulo = h('div.bv-txt');
  const carta = h('div.bv-carta', h('div.bv-mastil', { html: mastilSVG() }), h('div.bv-asta', tela), titulo);
  const nombreSel = h('span');
  const btnEste = h('button.btn.grande.aqui', { disabled: true, onclick: () => confirmar() }, h('span', { html: I.check }), nombreSel);
  const accion = h('div.accion.bv-accion', btnEste);
  const tendedero = h('div.bv-tendedero', h('div.bv-cuerda'));
  const ayuda = h('div.ayuda-toque');
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.7, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.7, 350) }),
    h('button.icono-btn', { 'aria-label': 'Ver todo el mundo', html: I.centrar, onclick: () => globo.vuela([globo.centro[0], 15], 1, 600) }));
  P.escena.append(globoCont, h('div.orden-zona', carta), ayuda, controles, accion, tendedero, P.hoja);

  let globo;
  P.onHoja = () => globo && globo.setPad(pads(), 300);
  const ahora = () => rondas[P.i];
  const pads = () => {
    const res = P.escena.classList.contains('con-resultado'), r = ahora();
    return { top: res ? 8 : $('.orden-zona', P.escena).offsetHeight + 10, bottom: res ? P.hoja.offsetHeight : r && r.tipo === 'iza' ? tendedero.offsetHeight + 6 : 86 };
  };

  async function ronda() {
    const { p, tipo } = ahora();
    S.estado = 'jugando'; S.sel = null; S.intentos = 0;
    P.ronda(P.i, `Bandera ${P.i + 1} de ${N}`);
    P.escena.classList.toggle('bv-iza', tipo === 'iza');
    globo.limpiar(); globo.colorResto = '#F3EAD7';
    tela.innerHTML = ''; tela.className = 'bv-tela';
    carta.classList.remove('llega'); void carta.offsetWidth; carta.classList.add('llega');
    if (tipo === 'donde') {
      tela.append(banderaOndea(p.iso)); tela.classList.add('arriba');
      titulo.innerHTML = ''; titulo.append(h('small', 'Esta bandera ondea en…'), h('b', '¿qué país?'));
      ayuda.textContent = 'Toca su país en el globo'; ayuda.classList.toggle('oculta', P.i > 1);
      btnEste.disabled = true; nombreSel.textContent = 'Toca un país';
      globo.vuela([clamp(globo.centro[0], -180, 180), 18], 1, 700);
    } else {
      titulo.innerHTML = ''; titulo.append(h('small', 'Iza la bandera de'), h('b', p.n));
      ayuda.classList.add('oculta');
      tendedero.innerHTML = ''; tendedero.append(h('div.bv-cuerda'));
      shuffle([p, ...banderasParecidas(p, 3)]).forEach((q, k) => {
        const b = h('button.bv-colgada', { 'data-iso': q.iso, style: { animationDelay: (k * .08) + 's', '--rot': ((k % 2 ? 1 : -1) * (2 + k)) + 'deg' }, 'aria-label': 'Bandera' },
          h('span.bv-pinza'), Banderas.el(q.iso));
        b.addEventListener('click', () => izar(q, b));
        tendedero.append(b);
      });
      const cen = centroPais(p.iso);
      const z = clamp(Math.sqrt(3e6 / Math.max(p.area || 1e5, 3e4)), 1.2, 5) * .8;
      globo.vuela(cen, z, 900);
      setTimeout(() => { globo.efecto(p.iso, 'pulso'); globo.etiquetas = [{ ll: cen, texto: p.n }]; globo.sucio = true; }, 600);
    }
    setTimeout(() => globo.setPad(pads(), 300), 30);
    Sonido.play('papel');
  }

  // ---- tipo "donde": tocar el país ----
  function seleccionar(ll, px) {
    const r = ahora();
    if (S.estado !== 'jugando' || r.tipo !== 'donde' || !ll) return;
    ayuda.classList.add('oculta');
    const iso = globo.paisToque(px, { tol: 10 });
    if (!iso || !PAIS[iso]) { Sonido.play('tap'); return; }
    globo.quitaEfectos('borde');
    globo.efecto(iso, 'borde', { color: '#24476B', ancho: 3 });
    globo.etiquetas = [{ ll: centroPais(iso), texto: nombrePais(iso) }];
    S.sel = iso; nombreSel.textContent = `Es ${nombrePais(iso)}`; btnEste.disabled = false;
    Sonido.play('pin'); vibrar(10);
  }
  function confirmar() {
    const { p } = ahora();
    if (S.estado !== 'jugando' || !S.sel) return;
    const iso = S.sel; S.sel = null; btnEste.disabled = true; nombreSel.textContent = 'Toca un país';
    globo.quitaEfectos('borde'); globo.etiquetas = [];
    S.intentos++;
    if (iso === p.iso) return resolver(true);
    globo.efecto(iso, 'error');
    Sonido.play('lejos'); vibrar([20, 40, 20]);
    if (S.intentos >= 2) return resolver(false);
    UI.toast(`Esa no es la bandera de ${nombrePais(iso)}. Pista: está en ${CONTINENTES[p.c].n}`);
    const [c, z] = VISTA_CONT[p.c] || VISTA_CONT.todo; globo.vuela(c, Math.min(z, 1.6), 800);
  }

  // ---- tipo "iza": escoger del tendedero ----
  async function izar(q, b) {
    const { p } = ahora();
    if (S.estado !== 'jugando' || b.classList.contains('caida')) return;
    S.estado = 'izando';
    S.intentos++;
    // la bandera vuela del tendedero al mástil y sube
    const desde = b.getBoundingClientRect(), hasta = $('.bv-asta', carta).getBoundingClientRect();
    const vuela = h('div.bv-vuela', Banderas.el(q.iso));
    Object.assign(vuela.style, { left: desde.left + 'px', top: desde.top + 'px', width: desde.width + 'px' });
    document.body.append(vuela);
    b.classList.add('vacia');
    Sonido.play('avion');
    await sleep(20);
    Object.assign(vuela.style, { left: hasta.left + 'px', top: (hasta.bottom - hasta.height * .35) + 'px', width: hasta.width + 'px' });
    await sleep(450);
    vuela.remove();
    tela.innerHTML = ''; tela.append(banderaOndea(q.iso)); tela.className = 'bv-tela';
    void tela.offsetWidth; tela.classList.add('sube');
    await sleep(900);
    if (q.iso === p.iso) { tela.classList.add('arriba'); return resolver(true); }
    tela.classList.add('baja'); Sonido.play('lejos'); vibrar([20, 40, 20]);
    b.classList.remove('vacia'); b.classList.add('caida');
    await sleep(500);
    if (S.intentos >= 2) return resolver(false);
    tela.innerHTML = ''; tela.className = 'bv-tela';
    UI.toast(`Esa es la de ${nombrePais(q.iso)}. ¡Prueba otra!`);
    S.estado = 'jugando';
  }

  async function resolver(acierto) {
    const { p, tipo } = ahora();
    S.estado = 'resultado';
    const est = !acierto ? 0 : S.intentos === 1 ? 3 : 1;
    const pts = !acierto ? 0 : S.intentos === 1 ? 1000 : 400;
    const dom = Progreso.registrar(idPais(p.iso, 'b'), !acierto ? 0 : S.intentos === 1 ? 1 : .45);
    P.res.push({ l: paisComoLugar(p, 'b'), est, pts, det: acierto ? (S.intentos === 1 ? '¡a la primera!' : 'al segundo intento') : 'no la acertaste', dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    globo.quitaEfectos(); globo.etiquetas = [];
    if (tipo === 'donde' || !acierto) { tela.innerHTML = ''; tela.append(banderaOndea(p.iso)); tela.className = 'bv-tela arriba'; }
    const cen = centroPais(p.iso);
    globo.vuela(cen, clamp(Math.sqrt(3e6 / Math.max(p.area || 1e5, 3e4)), 1.2, 5) * .8, 900);
    await sleep(400);
    await globo.efecto(p.iso, 'pinta', { color: acierto ? '#7FD49E' : '#FFB4A6' });
    if (acierto) { Sonido.play(est >= 3 ? 'genial' : 'bien'); UI.confeti(est >= 3 ? 30 : 10); }
    P.sumar(pts);
    P.resultado({
      est, pts, l: paisComoLugar(p, 'b'), dom, ultima: P.i === N - 1,
      titulo: !acierto ? `Era la de ${p.n}` : est === 3 ? '¡Bandera izada!' : '¡Bien, al segundo intento!',
      detalle: tipo === 'donde' ? `Esa bandera es de ${p.n}.` : `Así es la bandera de ${p.n}.`,
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
    setTimeout(() => { globo.setPad(pads(), 400); }, 60);
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (e.key === 'Enter' && S.estado === 'jugando' && S.sel) confirmar();
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
    else if (S.estado === 'jugando' && /^[1-4]$/.test(e.key) && ahora().tipo === 'iza') { const b = $$('.bv-colgada', tendedero)[+e.key - 1]; b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); globo && globo.destruir(); }

  requestAnimationFrame(async () => {
    if (!N) { UI.toast('No hay países con esa combinación'); return UI.ir('tiquete', 'banderasviento'); }
    await Banderas.cargar();
    globo = new Globo(globoCont, { centro: [10, 18], zoom: 1, dobleToque: false, zoomMax: 22, alfaNubes: .5, cuantasNubes: 7 });
    globo.on('tap', (ll, px) => seleccionar(ll, px));
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

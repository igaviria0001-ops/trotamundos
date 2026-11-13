// ===== Modo: Silueta y rumbo =====
// Aparece la silueta de un país. El jugador toca un país en el globo; si no es, ve a qué distancia
// quedó y una flecha con el rumbo hacia el país correcto (como una búsqueda del tesoro).
const MAX_INTENTOS_SIL = 6;
function colorTemperatura(km) {
  return km < 600 ? '#FF7B5C' : km < 1500 ? '#FFA95A' : km < 3000 ? '#FFD45E' : km < 6000 ? '#A8DCC2' : '#A9CDEB';
}
function textoTemperatura(km) {
  return km < 600 ? '¡Quemando!' : km < 1500 ? '¡Caliente!' : km < 3000 ? 'Tibio' : km < 6000 ? 'Frío' : '¡Congelado!';
}
const flechaSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l6.5 8.5h-4.2v10.5H9.7V11H5.5z" fill="currentColor" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';

Pantallas.juego_silueta = (cfg) => {
  Progreso.load();
  const pool = poolModo('silueta', cfg);
  const rondas = elegirPaises(pool, escalaModo('silueta', cfg.rondas));
  const N = rondas.length;
  const P = crearPartida({ modo: 'silueta', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', intentos: [], sel: null, pista: false, color: '#F7A35C' };

  const globoCont = h('div.globo-cont');
  const dibujo = h('div.silueta-dibujo');
  const vidas = h('div.silueta-vidas', Array.from({ length: MAX_INTENTOS_SIL }, () => h('i')));
  const nombreSel = h('span.silueta-sel');
  const carta = h('div.silueta-carta',
    h('div.silueta-cab', h('b', '¿Qué país es?'), vidas),
    dibujo,
    h('div.silueta-rosa', { html: rosaMiniSVG() }));
  const lista = h('div.silueta-intentos');
  const btnPista = h('button.btn.blanco.pista', { onclick: () => pista() }, h('span', { html: I.bombillo }), 'Pista');
  const btnEste = h('button.btn.grande.aqui', { disabled: true, onclick: () => confirmar() }, h('span', { html: I.check }), nombreSel);
  const ayuda = h('div.ayuda-toque', 'Toca en el globo el país de la silueta');
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.7, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.7, 350) }));
  P.escena.append(globoCont, h('div.silueta-zona', carta, lista), ayuda, controles, h('div.accion', btnPista, btnEste), P.hoja);

  let globo;
  const ahora = () => rondas[P.i];
  const pads = () => {
    const res = P.escena.classList.contains('con-resultado');
    return { top: res ? 8 : $('.silueta-zona', P.escena).offsetHeight + 6, bottom: res ? P.hoja.offsetHeight : 84 };
  };

  function ronda() {
    const p = ahora();
    S.estado = 'jugando'; S.intentos = []; S.sel = null; S.pista = false;
    S.color = CRAYONES[(P.i * 3 + 1) % CRAYONES.length];
    P.ronda(P.i, `Silueta ${P.i + 1} de ${N}`);
    dibujo.innerHTML = siluetaSVG(p.iso, { w: 260, h: 150, pad: 12, color: S.color });
    carta.classList.remove('llega', 'acierto'); void carta.offsetWidth; carta.classList.add('llega');
    $$('i', vidas).forEach(v => v.className = '');
    lista.innerHTML = '';
    globo.limpiar(); globo.colorResto = '#F3EAD7';
    btnEste.disabled = true; nombreSel.textContent = 'Toca un país'; btnPista.disabled = false;
    globo.setPad(pads(), 300);
    globo.vuela([clamp(globo.centro[0], -180, 180), 18], 1, 700);
    Sonido.play('papel');
  }

  function seleccionar(ll, px) {
    if (S.estado !== 'jugando' || !ll) return;
    ayuda.classList.add('oculta');
    const iso = globo.paisToque(px, { tol: 10 });
    if (!iso || !PAIS[iso]) { Sonido.play('tap'); return; }
    if (S.intentos.some(x => x.iso === iso)) { UI.toast(`Ya probaste con ${nombrePais(iso)}`); return; }
    globo.quitaEfectos('borde');
    globo.etiquetas = [{ ll: centroPais(iso), texto: nombrePais(iso) }];
    globo.efecto(iso, 'borde', { color: '#24476B', ancho: 3 });
    S.sel = iso;
    nombreSel.textContent = `Es ${nombrePais(iso)}`;
    btnEste.disabled = false;
    Sonido.play('pin'); vibrar(10);
  }

  function marcarVida(k, clase) { const v = $$('i', vidas)[k]; v && v.classList.add(clase); }

  function pista() {
    if (S.estado !== 'jugando' || S.pista) return;
    const p = ahora();
    S.pista = true; btnPista.disabled = true;
    S.intentos.push({ iso: null, pista: true });
    marcarVida(S.intentos.length - 1, 'pista');
    const col = {};
    for (const q of PAISES) if (q.c === p.c) col[q.iso] = ajustaColor(CONTINENTES[p.c].color, .25);
    for (const x of S.intentos) if (x.iso) col[x.iso] = colorTemperatura(x.km);
    globo.colores = col;
    globo.vuela((VISTA_CONT[p.c] || VISTA_CONT.todo)[0], Math.min(1.6, (VISTA_CONT[p.c] || VISTA_CONT.todo)[1]), 800);
    lista.prepend(h('div.intento.intento-pista', h('span', { html: I.bombillo }), h('b', `Está en ${CONTINENTES[p.c].n}`)));
    Sonido.play('pop');
    if (S.intentos.length >= MAX_INTENTOS_SIL) resolver(false);
  }

  async function confirmar() {
    if (S.estado !== 'jugando' || !S.sel) return;
    const p = ahora(), iso = S.sel;
    S.sel = null; btnEste.disabled = true; nombreSel.textContent = 'Toca un país';
    globo.quitaEfectos('borde'); globo.etiquetas = [];
    if (iso === p.iso) {
      S.intentos.push({ iso, km: 0 });
      marcarVida(S.intentos.length - 1, 'bien');
      return resolver(true);
    }
    const km = Geo.km(centroPais(iso), centroPais(p.iso));
    const rumbo = Geo.rumbo(centroPais(iso), centroPais(p.iso));
    const vecino = (PAIS[iso].vec || []).includes(p.iso);
    S.intentos.push({ iso, km, rumbo });
    marcarVida(S.intentos.length - 1, 'mal');
    globo.efecto(iso, 'pinta', { color: colorTemperatura(km) });
    const chip = h('div.intento', { style: { '--temp': colorTemperatura(km) } },
      Banderas.el(iso),
      h('div.intento-txt', h('b', nombrePais(iso)), h('small', vecino ? '¡Es vecino!' : textoTemperatura(km))),
      h('div.intento-km', fmt.km(km)),
      h('span.intento-flecha', { html: flechaSVG, style: { transform: `rotate(${rumbo}deg)` }, title: `Hacia el ${rumboTexto(rumbo)}` }));
    lista.prepend(chip);
    Sonido.play(km < 1500 ? 'medio' : 'lejos'); vibrar([15, 30, 15]);
    if (S.intentos.length >= MAX_INTENTOS_SIL) return resolver(false);
    setTimeout(() => globo.setPad(pads(), 250), 30);
  }

  async function resolver(acierto) {
    const p = ahora();
    S.estado = 'resultado';
    const n = S.intentos.length;
    const pts = acierto ? [1000, 800, 620, 450, 300, 150][n - 1] : 0;
    const est = !acierto ? 0 : n === 1 ? 3 : n <= 3 ? 2 : 1;
    const dom = Progreso.registrar(idPais(p.iso), !acierto ? 0 : n === 1 ? 1 : n <= 3 ? .6 : .4);
    P.res.push({ l: paisComoLugar(p), est, pts, det: acierto ? (n === 1 ? '¡a la primera!' : `en ${n} intentos`) : 'no lo encontraste', dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    carta.classList.add('acierto');
    const cen = centroPais(p.iso);
    const z = clamp(Math.sqrt(2.2e6 / Math.max((partesPais(p.iso) || {}).area * 6371 * 6371 || p.area || 1e5, 2e4)), 1.2, 6);
    globo.vuela(cen, z, 1000);
    await sleep(500);
    await globo.efecto(p.iso, 'pinta', { color: S.color });
    if (acierto) UI.confeti(30);
    P.sumar(pts);
    P.resultado({
      est, pts, l: paisComoLugar(p), dom, ultima: P.i === N - 1,
      titulo: !acierto ? `Era ${p.n}` : n === 1 ? '¡A la primera!' : est === 2 ? '¡Bien deducido!' : '¡Lo encontraste!',
      detalle: acierto ? `Lo encontraste en ${n === 1 ? '1 intento' : `${n} intentos`}.` : 'Ahora ya conoces su forma.',
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
    setTimeout(() => { globo.setPad(pads(), 400); globo.vuela(cen, z, 500); }, 60);
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (e.key === 'Enter' && S.estado === 'jugando' && S.sel) confirmar();
    else if (e.key === 'Enter' && S.estado === 'resultado') { const b = $('.pie .btn', P.hoja); b && b.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); globo && globo.destruir(); }

  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay países con esa combinación'); return UI.ir('tiquete', 'silueta'); }
    globo = new Globo(globoCont, { centro: [10, 18], zoom: 1, dobleToque: false, zoomMax: 22, alfaNubes: .5, cuantasNubes: 7 });
    globo.on('tap', (ll, px) => seleccionar(ll, px));
    Banderas.cargar();
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

// rosa de los vientos chiquita para las tarjetas (norte arriba)
function rosaMiniSVG() {
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#fff" stroke="#D9C9A6" stroke-width="2"/>
    <path d="M20 5l4 15h-8z" fill="#EF6F5E"/><path d="M20 35l4-15h-8z" fill="#9FB4C8"/><circle cx="20" cy="20" r="2.6" fill="#24476B"/>
    <text x="20" y="4.2" font-family="Baloo 2,sans-serif" font-weight="800" font-size="7" text-anchor="middle" fill="#24476B">N</text></svg>`;
}

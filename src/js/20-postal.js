// ===== Modo 1: Postal misteriosa =====
// Llega una postal con una foto real; el jugador clava un pin en el globo donde cree que está.
const POSTAL_TEXTOS = ['¿Desde dónde te escribo?', '¿Adivinas dónde estoy?', 'Te mando un saludo desde…', '¡Mira dónde llegué!', 'Hoy amanecí aquí. ¿Dónde es?'];

function puntosPostal(km) { return km <= 25 ? 1000 : Math.round(1000 * Math.exp(-(km - 25) / 1300)); }
function estrellasPostal(km) { return km <= 250 ? 3 : km <= 900 ? 2 : km <= 2200 ? 1 : 0; }
function calidadPostal(km) { return km <= 250 ? 1 : km <= 700 ? .85 : km <= 1600 ? .55 : km <= 3200 ? .3 : 0; }
function mensajePostal(km) {
  if (km <= 50) return pick(['¡En el blanco!', '¡Justo ahí!', '¡Perfecto!']);
  if (km <= 250) return pick(['¡Excelente!', '¡Casi exacto!']);
  if (km <= 900) return pick(['¡Muy cerca!', '¡Bien ahí!']);
  if (km <= 2200) return 'Buen intento';
  if (km <= 5000) return 'Te faltó un poco';
  return '¡Estaba lejos de ahí!';
}
const esAncho = () => matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)').matches;

Pantallas.juego_postal = (cfg) => {
  Progreso.load();
  const pool = filtrarLugares(cfg);
  const rondas = Progreso.elegir(pool, Math.min(cfg.rondas || 5, pool.length));
  const N = rondas.length;
  const S = { i: 0, puntos: 0, res: [], estado: 'cargando', pin: null, pista: false };

  // ---- estructura ----
  const numPuntos = h('span.num', '0');
  const sub = h('div.sub');
  const progreso = h('div.progreso', rondas.map(() => h('i')));
  const escena = h('div.escena');
  const globoCont = h('div.globo-cont');
  const fotoImg = h('img', { alt: 'Foto misteriosa' });
  const nota = h('p.nota-mano');
  const postal = h('div.postal-flot',
    h('div.postal',
      h('button.foto', { 'aria-label': 'Ver foto grande', onclick: e => { e.stopPropagation(); if (postal.classList.contains('mini')) return expandir(); UI.visor(fotoImg.src, Foto.credito(rondas[S.i])); } }, fotoImg),
      h('div.estampilla', { html: estampillaSVG() }),
      h('div.postal-pie', nota, h('button.mini-btn', { 'aria-label': 'Achicar la postal', onclick: e => { e.stopPropagation(); minimizar(); } }, h('span', { html: I.atras }))),
      h('div.matasellos', { html: matasellosSVG() })));
  postal.addEventListener('click', () => { if (postal.classList.contains('mini')) expandir(); });
  const btnPista = h('button.btn.blanco.pista', { onclick: () => pista() }, h('span', { html: I.bombillo }), 'Pista');
  const btnAqui = h('button.btn.grande.aqui', { disabled: true, onclick: () => confirmar() }, h('span', { html: I.check }), 'Aquí es');
  const ayuda = h('div.ayuda-toque', 'Toca el globo donde crees que está');
  const controles = h('div.zoom-ctrl',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => globo.vuela(globo.centro, globo.zoom * 1.8, 350) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => globo.vuela(globo.centro, globo.zoom / 1.8, 350) }));
  const accion = h('div.accion', btnPista, btnAqui);
  const hojaCont = h('div.contenido');
  const hojaPie = h('div.pie');
  const hoja = h('div.hoja', h('button.asa', { 'aria-label': 'Agrandar o achicar', onclick: () => { hoja.classList.toggle('grande'); Sonido.play('papel'); } }), h('div.scroll.hoja-scroll', hojaCont), hojaPie);
  escena.append(globoCont, postal, ayuda, controles, accion, hoja);
  const el = h('div.juego.postal-juego',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Salir', html: I.cerrar, onclick: () => salir() }),
      h('div.titulo', h('h2', 'Postal misteriosa'), sub, progreso),
      h('div.marcador', numPuntos, h('small', 'puntos'))),
    escena);

  let globo;
  const pads = () => {
    // espacio libre para el globo según lo que está encima
    const r = escena.getBoundingClientRect();
    if (esAncho()) {
      const pr = S.estado === 'resultado' ? hoja.offsetWidth + 16 : 0;
      return { top: 0, bottom: 76, left: postal.classList.contains('mini') ? 0 : postal.offsetWidth + 24, right: pr };
    }
    const top = postal.classList.contains('mini') ? 0 : postal.offsetHeight + 10;
    const bottom = S.estado === 'resultado' ? hoja.offsetHeight : 88;
    return { top, bottom, left: 0, right: 0 };
  };
  const reacomodar = (ms = 350) => globo && globo.setPad(pads(), ms);

  function minimizar() { if (esAncho() || postal.classList.contains('mini')) return; postal.classList.add('mini'); Sonido.play('papel'); reacomodar(); }
  function expandir() { postal.classList.remove('mini'); Sonido.play('papel'); setTimeout(() => reacomodar(), 30); }

  // ---- rondas ----
  async function ronda() {
    const l = rondas[S.i];
    S.estado = 'cargando'; S.pin = null; S.pista = false;
    sub.textContent = `Postal ${S.i + 1} de ${N}`;
    $$('i', progreso).forEach((x, k) => x.classList.toggle('actual', k === S.i));
    btnAqui.disabled = true; btnPista.disabled = false;
    hoja.classList.remove('abierta', 'grande');
    escena.classList.remove('con-resultado');
    globo.limpiar();
    postal.classList.remove('mini', 'llega');
    postal.classList.add('sale');
    const src = Foto.url(l, 0) || Foto.respaldo(l);
    const [img] = await Promise.all([Foto.cargar(src), sleep(260)]);
    fotoImg.src = img ? img.src : Foto.respaldo(l);
    fotoImg.style.objectPosition = l.fotos[0] && l.fotos[0].fo ? `${l.fotos[0].fo[0] * 100}% ${l.fotos[0].fo[1] * 100}%` : '';
    nota.textContent = pick(POSTAL_TEXTOS);
    postal.classList.remove('sale'); void postal.offsetWidth; postal.classList.add('llega');
    Sonido.play('papel');
    S.estado = 'jugando';
    ayuda.classList.toggle('oculta', S.i > 0);
    await sleep(60);
    reacomodar(400);
    globo.vuela([clamp(globo.centro[0], -180, 180), 15], 1, 700);
  }

  function ponerPin(ll) {
    if (S.estado !== 'jugando' || !ll) return;
    if (S.pin) globo.quitaPin(S.pin);
    const iso = Mapa.paisEn(ll);
    S.pin = globo.pin(ll, { color: '#3E7CC4', texto: iso ? nombrePais(iso) : 'Océano', icono: 'estrella' });
    S.pinIso = iso;
    btnAqui.disabled = false;
    ayuda.classList.add('oculta');
    Sonido.play('pin'); vibrar(12);
  }

  function pista() {
    if (S.estado !== 'jugando' || S.pista) return;
    const l = rondas[S.i];
    S.pista = true; btnPista.disabled = true;
    const col = {};
    for (const p of PAISES) col[p.iso] = p.c === l.c ? ajustaColor(CONTINENTES[l.c].color, -.12) : '#EEF2F4';
    globo.colores = col; globo.sucio = true;
    const cen = { EU: [15, 50], AS: [90, 30], AF: [20, 3], NA: [-95, 35], SA: [-60, -18], OC: [140, -22] }[l.c];
    globo.vuela(cen, 1.3, 900);
    UI.toast(`Está en ${CONTINENTES[l.c].n}`);
    Sonido.play('pop');
  }

  async function confirmar() {
    if (S.estado !== 'jugando' || !S.pin) return;
    S.estado = 'revelando';
    btnAqui.disabled = true; btnPista.disabled = true;
    const l = rondas[S.i];
    const real = [l.lon, l.lat], tu = S.pin.ll;
    const km = Geo.km(tu, real);
    let pts = puntosPostal(km); if (S.pista) pts = Math.round(pts * .7);
    const est = estrellasPostal(km);
    const q = S.pista ? Math.min(.7, calidadPostal(km)) : calidadPostal(km);
    const dom = Progreso.registrar(l.id, q);
    S.res.push({ l, km, pts, est, tu, iso: S.pinIso, dom });
    S.puntos += pts;
    globo.colores = {}; globo.sucio = true;
    S.pin.texto = null;
    minimizar();
    Sonido.play('sello'); vibrar(20);
    const rPin = globo.pin(real, { color: '#5DBB88', pulso: true });
    // preparar espacio para la hoja y encuadrar los dos puntos
    llenarHoja(l, km, pts, est, dom);
    S.estado = 'resultado';
    escena.classList.add('con-resultado');
    await globo.setPad(pads(), 300);
    if (km > 30) {
      globo.encuadra(tu, real, 900);
      await sleep(500);
      Sonido.play('avion');
      await globo.arco(tu, real, { ms: Math.min(1700, 700 + km / 6) });
    } else {
      await globo.vuela(real, 3, 900);
    }
    rPin.texto = l.n;
    globo.sucio = true;
    hoja.classList.add('abierta');
    Sonido.play(est >= 3 ? 'genial' : est === 2 ? 'bien' : est === 1 ? 'medio' : 'lejos');
    if (est >= 3) UI.confeti(40);
    const marca = $$('i', progreso)[S.i];
    marca.classList.remove('actual'); marca.classList.add(est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    UI.contar($('.res-km b', hojaCont), 0, km, 900, fmt.km);
    const desde = S.puntos - pts;
    UI.contar(numPuntos, desde, S.puntos, 900).then(() => { numPuntos.classList.remove('salta'); void numPuntos.offsetWidth; numPuntos.classList.add('salta'); });
    setTimeout(() => $('.pie .btn', hoja) && $('.pie .btn', hoja).focus({ preventScroll: true }), 400);
  }

  function llenarHoja(l, km, pts, est, dom) {
    hojaCont.innerHTML = ''; hojaPie.innerHTML = '';
    const subio = dom.despues > dom.antes;
    hojaCont.append(...[
      h('div.res-cabeza',
        h('div.res-izq', UI.estrellas(est), h('h3', mensajePostal(km)),
          h('p.res-km', 'Tu pin quedó a ', h('b', '0 km'))),
        h('div.res-pts', h('b', `+${fmt.n(pts)}`), h('small', S.pista ? 'con pista' : 'puntos'))),
      S.iso && !l.iso.includes(S.iso) ? h('p.res-nota', `Tu pin cayó en ${nombrePais(S.iso)}; la postal venía de ${paisesDe(l)}.`) : null,
      subio ? h('p.res-sube', h('span', { html: I.estrella }), `Tu dominio de este lugar subió a ${dom.despues} de 5`) : null,
      fichaLugar(l, { foto: false })].filter(Boolean));
    const ultima = S.i === N - 1;
    hojaPie.append(h('button.btn.ancho.grande', { onclick: () => siguiente() }, ultima ? 'Ver mi viaje' : 'Siguiente postal'));
  }

  function siguiente() {
    if (S.estado !== 'resultado') return;
    Sonido.play('tap');
    if (S.i >= N - 1) return terminar();
    S.i++;
    ronda();
  }

  function terminar() {
    S.estado = 'fin';
    let viaje = 0;
    for (let k = 1; k < S.res.length; k++) viaje += Geo.km([S.res[k - 1].l.lon, S.res[k - 1].l.lat], [S.res[k].l.lon, S.res[k].l.lat]);
    Progreso.sumar(viaje, N);
    const rec = Progreso.record('postal_' + N, S.puntos);
    UI.ir('resumen', { modo: 'postal', cfg, puntos: S.puntos, max: N * 1000, res: S.res, viaje, record: rec });
  }

  async function salir() {
    if (S.res.length && S.estado !== 'fin') {
      const v = await UI.dialogo({ titulo: '¿Terminar el viaje?', texto: 'Lo que aprendiste se guarda, pero esta partida no cuenta para tus récords.', botones: [{ texto: 'Seguir jugando', valor: false }, { texto: 'Salir', valor: true, clase: 'blanco' }] });
      if (!v) return;
    }
    UI.ir('inicio');
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (e.key === 'Enter') { e.preventDefault(); if (S.estado === 'jugando') confirmar(); else if (S.estado === 'resultado') siguiente(); }
    else if (e.key === '+' || e.key === '=') globo.vuela(globo.centro, globo.zoom * 1.6, 250);
    else if (e.key === '-') globo.vuela(globo.centro, globo.zoom / 1.6, 250);
    else if (e.key.startsWith('Arrow')) { const d = 28; globo.parar(); globo.girarPx(e.key === 'ArrowLeft' ? d : e.key === 'ArrowRight' ? -d : 0, e.key === 'ArrowUp' ? d : e.key === 'ArrowDown' ? -d : 0); }
    else if (e.key === ' ') { e.preventDefault(); postal.classList.contains('mini') ? expandir() : minimizar(); }
    else if (e.key.toLowerCase() === 'p') pista();
  };
  document.addEventListener('keydown', teclas);
  const alRedim = () => reacomodar(0);
  window.addEventListener('resize', alRedim);

  requestAnimationFrame(() => {
    globo = new Globo(globoCont, { centro: [-30, 15], margen: .88 });
    globo.on('tap', ll => ponerPin(ll));
    globo.on('arrastra', () => { if (S.estado === 'jugando' && esTactil()) minimizar(); });
    Mapa.cargarHi();
    if (!N) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'postal'); }
    ronda();
  });
  return { el, salir: () => { document.removeEventListener('keydown', teclas); window.removeEventListener('resize', alRedim); globo && globo.destruir(); } };
};

// estampilla de la postal: un avioncito sobre el cielo
function estampillaSVG() {
  const perf = (n, eje, fijo, paso) => Array.from({ length: n }, (_, i) => eje === 'x' ? `<circle cx="${3 + i * paso}" cy="${fijo}" r="2.4"/>` : `<circle cx="${fijo}" cy="${3 + i * paso}" r="2.4"/>`).join('');
  return `<svg viewBox="0 0 54 64" aria-hidden="true"><defs><mask id="perf"><rect width="54" height="64" fill="#fff"/>${perf(8, 'x', 0, 6.9)}${perf(8, 'x', 64, 6.9)}${perf(10, 'y', 0, 6.5)}${perf(10, 'y', 54, 6.5)}</mask></defs><g mask="url(#perf)"><rect width="54" height="64" fill="#fff"/><rect x="5" y="5" width="44" height="54" fill="#CFE6F5"/><circle cx="36" cy="17" r="6.5" fill="#FFC94D"/><path d="M5 44c9-7 15-1 22-5s14-3 22-7v27H5z" fill="#5DBB88"/><path d="M5 50c10-4 18 1 26-2s12-1 18-3v14H5z" fill="#3E9F6C"/><path d="M12 28l16-5 2 1.5-7 4.5 7 1.5-1.5 2-8-1-5 2.5z" fill="#3E7CC4"/></g></svg>`;
}
function matasellosSVG() {
  return `<svg viewBox="0 0 120 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="30" cy="30" r="24"/><circle cx="30" cy="30" r="18"/><path d="M58 18c8-4 14 4 22 0s14 4 22 0s10-2 14-2M58 30c8-4 14 4 22 0s14 4 22 0s10-2 14-2M58 42c8-4 14 4 22 0s14 4 22 0s10-2 14-2"/></g><text x="30" y="34" font-size="9" font-weight="800" text-anchor="middle" fill="currentColor" font-family="Nunito, sans-serif">CORREO</text></svg>`;
}

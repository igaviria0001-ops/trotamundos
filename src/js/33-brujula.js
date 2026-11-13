// ===== Modo: Brújula =====
// Estás en un lugar famoso (centro del globo). Gira la aguja de la brújula hacia otro lugar del mundo.
// Con el globo centrado en el punto de partida, la dirección en pantalla es el rumbo real de salida.
function puntosBrujula(err) { return err <= 5 ? 1000 : Math.round(1000 * Math.pow(Math.max(0, 1 - (err - 5) / 115), 1.2)); }
function estrellasBrujula(err) { return err <= 12 ? 3 : err <= 30 ? 2 : err <= 60 ? 1 : 0; }

function brujulaSVG() {
  const marcas = [];
  for (let g = 0; g < 360; g += 15) {
    const largo = g % 90 === 0 ? 10 : g % 45 === 0 ? 7 : 4;
    const a = g * RAD, r1 = 86, r2 = 86 - largo;
    marcas.push(`<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * r2}" y2="${100 - Math.cos(a) * r2}" stroke="#8A6A2E" stroke-width="${g % 90 === 0 ? 2.6 : 1.6}" stroke-linecap="round" opacity=".75"/>`);
  }
  const letras = [['N', 0, '#E0503C'], ['E', 90, '#5B4420'], ['S', 180, '#5B4420'], ['O', 270, '#5B4420']].map(([t, g, c]) => {
    const a = g * RAD; return `<text x="${100 + Math.sin(a) * 66}" y="${100 - Math.cos(a) * 66 + 6}" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="17" fill="${c}">${t}</text>`;
  }).join('');
  return `<svg viewBox="0 0 200 200" class="brujula-svg" aria-hidden="true">
    <defs>
      <radialGradient id="bjAro" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF0B8"/><stop offset=".5" stop-color="#FFC94D"/><stop offset="1" stop-color="#D88E12"/></radialGradient>
      <radialGradient id="bjCara" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="rgba(255,253,244,.34)"/><stop offset=".7" stop-color="rgba(255,248,225,.16)"/><stop offset="1" stop-color="rgba(255,236,190,.42)"/></radialGradient>
      <linearGradient id="bjRoja" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF8A78"/><stop offset=".5" stop-color="#EF5A47"/><stop offset=".5" stop-color="#C93C2C"/><stop offset="1" stop-color="#E04B39"/></linearGradient>
      <linearGradient id="bjBlanca" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#F1F5F9"/><stop offset=".5" stop-color="#C9D5E0"/><stop offset="1" stop-color="#E4ECF2"/></linearGradient>
      <linearGradient id="bjVerde" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8BE0AE"/><stop offset=".5" stop-color="#4FBF7F"/><stop offset=".5" stop-color="#2F9A5F"/><stop offset="1" stop-color="#46B276"/></linearGradient>
    </defs>
    <circle cx="100" cy="104" r="97" fill="rgba(30,60,90,.18)"/>
    <circle cx="100" cy="100" r="97" fill="url(#bjAro)"/>
    <circle cx="100" cy="100" r="88" fill="url(#bjCara)" stroke="#B57A14" stroke-width="2"/>
    <path d="M30 60 A80 80 0 0 1 120 22" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="4" stroke-linecap="round"/>
    ${marcas.join('')}${letras}
    <path class="bj-cuna" d="" fill="rgba(239,111,94,.3)" stroke="#EF6F5E" stroke-width="1.6" stroke-dasharray="4 3"/>
    <g class="bj-real" opacity="0"><path d="M100 18 L108 100 L92 100 Z" fill="url(#bjVerde)" stroke="#23794A" stroke-width="1.2" stroke-linejoin="round"/></g>
    <g class="bj-aguja">
      <path d="M100 16 L109 100 L91 100 Z" fill="url(#bjRoja)" stroke="#9E2E21" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M100 184 L109 100 L91 100 Z" fill="url(#bjBlanca)" stroke="#8FA3B6" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="97" cy="54" rx="2.2" ry="16" fill="rgba(255,255,255,.6)"/>
    </g>
    <circle cx="100" cy="100" r="11" fill="#FFC94D" stroke="#B57A14" stroke-width="2"/>
    <circle cx="97" cy="97" r="4" fill="rgba(255,255,255,.8)"/>
  </svg>`;
}

Pantallas.juego_brujula = (cfg) => {
  Progreso.load();
  const pool = poolModo('brujula', cfg);
  const destinos = Progreso.elegir(pool, Math.min(escalaModo('brujula', cfg.rondas), pool.length));
  const N = destinos.length;
  const P = crearPartida({ modo: 'brujula', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', ang: null, desde: null };
  const dist = (a, b) => Geo.km([a.lon, a.lat], [b.lon, b.lat]);
  const minKm = cfg.cont === 'EU' ? 450 : cfg.cont === 'todo' ? 1500 : 900;
  // punto de partida: otro lugar conocido, ni muy cerca ni del otro lado del mundo
  const usados = new Set();
  const partidas = destinos.map(b => {
    const cand = shuffle(pool.length > 6 ? pool : LUGARES.filter(l => l.t === 1)).filter(a => a.id !== b.id && !usados.has(a.id) && !a.iso.some(i => b.iso.includes(i)));
    let a = cand.find(a => { const d = dist(a, b); return d > minKm && d < 8500 && a.t <= b.t + 1; }) || cand.find(a => dist(a, b) > 300 && dist(a, b) < 9500) || cand[0];
    if (a) usados.add(a.id);
    return a;
  });

  const globoCont = h('div.globo-cont');
  const fotoB = h('img', { alt: '' });
  const nombreB = h('b.destino-nombre');
  const paisB = h('small.destino-pais');
  const desdeTxt = h('span');
  const tarjeta = h('div.destino', h('div.destino-foto', fotoB), h('div.destino-txt', h('small', '¿Hacia dónde queda…?'), nombreB, paisB));
  const salida = h('div.salida', h('span.salida-punto'), 'Estás en ', desdeTxt);
  const brujula = h('div.brujula', { html: brujulaSVG() });
  const rayo = h('div.brujula-rayo');
  const capa = h('div.brujula-capa', rayo, brujula);
  const btnAqui = h('button.btn.grande.aqui', { disabled: true, onclick: () => confirmar() }, h('span', { html: I.check }), '¡Por aquí!');
  const ayuda = h('div.ayuda-toque.ayuda-centro', 'Arrastra para girar la aguja');
  P.escena.append(globoCont, capa, h('div.orden-zona', tarjeta, salida), ayuda, h('div.accion', btnAqui), P.hoja);

  let globo;
  const geomCompas = () => {
    const g = globo.geom();
    return { x: g.cx, y: g.cy, r: Math.min(150, g.R * .62, (P.escena.clientWidth - 24) / 2) };
  };
  function colocarCompas() {
    const c = geomCompas();
    Object.assign(brujula.style, { left: c.x + 'px', top: c.y + 'px', width: c.r * 2 + 'px', height: c.r * 2 + 'px' });
    const L = globo.geom().R * .98;
    Object.assign(rayo.style, { left: c.x + 'px', top: (c.y - L) + 'px', height: L + 'px' });
  }
  function apuntar(ang, suave = false) {
    S.ang = (ang + 360) % 360;
    const ag = $('.bj-aguja', brujula);
    ag.style.transition = suave ? 'transform .35s cubic-bezier(.3,1.5,.5,1)' : 'none';
    ag.style.transform = `rotate(${S.ang}deg)`;
    rayo.style.transform = `rotate(${S.ang}deg)`;
    rayo.classList.add('ve');
    btnAqui.disabled = S.estado !== 'jugando';
  }

  async function ronda() {
    const b = destinos[P.i], a = partidas[P.i];
    S.estado = 'cargando'; S.ang = null; S.desde = a;
    P.ronda(P.i, `Rumbo ${P.i + 1} de ${N}`);
    globo.limpiar();
    capa.classList.remove('oculta', 'revelado');
    rayo.classList.remove('ve');
    $('.bj-real', brujula).setAttribute('opacity', '0');
    $('.bj-cuna', brujula).setAttribute('d', '');
    btnAqui.disabled = true;
    fotoB.src = Foto.url(b, 0, true) || Foto.respaldo(b);
    nombreB.textContent = b.n; paisB.innerHTML = ''; paisB.append(...b.iso.map(i => Banderas.el(i)), ' ', paisesDe(b));
    desdeTxt.textContent = a.n;
    tarjeta.classList.remove('llega'); void tarjeta.offsetWidth; tarjeta.classList.add('llega');
    globo.setPad({ top: $('.orden-zona', P.escena).offsetHeight + 14, bottom: 92 }, 300);
    await globo.vuela([a.lon, a.lat], 1, 900);
    const img = await Foto.cargar(Foto.url(a, 0, true));
    globo.pin([a.lon, a.lat], img ? { tipo: 'foto', img, esc: 1.1 } : { color: '#3E7CC4' });
    globo.etiquetas = [{ ll: [a.lon, a.lat], texto: a.n, dy: 18 }];
    colocarCompas();
    $('.bj-aguja', brujula).style.transform = 'rotate(0deg)';
    S.estado = 'jugando';
    Sonido.play('papel');
  }

  // girar la aguja arrastrando en cualquier parte del globo
  let girando = false;
  const angDe = e => { const r = capa.getBoundingClientRect(), c = geomCompas(); return Math.atan2(e.clientX - r.left - c.x, -(e.clientY - r.top - c.y)) / RAD; };
  capa.addEventListener('pointerdown', e => {
    if (S.estado !== 'jugando') return;
    girando = true; capa.setPointerCapture(e.pointerId);
    ayuda.classList.add('oculta');
    apuntar(angDe(e), S.ang == null);
    Sonido.play('tap');
  });
  capa.addEventListener('pointermove', e => { if (girando && S.estado === 'jugando') apuntar(angDe(e)); });
  const soltar = () => { if (girando) { girando = false; vibrar(8); } };
  capa.addEventListener('pointerup', soltar); capa.addEventListener('pointercancel', soltar);

  async function confirmar() {
    if (S.estado !== 'jugando' || S.ang == null) return;
    S.estado = 'revelando'; btnAqui.disabled = true;
    const b = destinos[P.i], a = S.desde;
    const real = Geo.rumbo([a.lon, a.lat], [b.lon, b.lat]);
    const err = Math.round(difAngulo(S.ang, real));
    const km = dist(a, b);
    // aguja verde con el rumbo real y la cuña del error
    const re = $('.bj-real', brujula);
    re.style.transformOrigin = '100px 100px'; re.style.transformBox = 'view-box';
    re.style.transform = `rotate(${real}deg)`; re.setAttribute('opacity', '1');
    $('.bj-cuna', brujula).setAttribute('d', cunaPath(S.ang, real));
    capa.classList.add('revelado');
    Sonido.play('sello');
    await sleep(1100);
    capa.classList.add('oculta');
    globo.etiquetas = [];
    const imgB = await Foto.cargar(Foto.url(b, 0, true));
    globo.encuadra([a.lon, a.lat], [b.lon, b.lat], 1200);
    await sleep(300);
    await globo.arco([a.lon, a.lat], [b.lon, b.lat], { ms: 1500 });
    globo.pin([b.lon, b.lat], imgB ? { tipo: 'foto', img: imgB } : { color: '#EF6F5E' });
    const est = estrellasBrujula(err), pts = puntosBrujula(err);
    const dom = Progreso.registrar(b.id, est >= 3 ? 1 : est === 2 ? .7 : est === 1 ? .45 : .1);
    P.res.push({ l: b, est, pts, det: `desvío de ${err}°`, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    P.sumar(pts);
    P.resultado({
      est, pts, l: b, dom, ultima: P.i === N - 1,
      titulo: err <= 12 ? '¡Rumbo perfecto!' : err <= 30 ? '¡Buen rumbo!' : err <= 60 ? 'Casi, casi' : `Era hacia el ${rumboTexto(real)}`,
      detalle: `${b.n} queda al ${rumboTexto(real)} de ${a.n}, a ${fmt.km(km)}. Te desviaste ${err}°.`,
      nota: km > 6000 ? 'En un globo, el camino más corto se curva: por eso a veces el rumbo sorprende.' : null,
      alSiguiente: () => { if (P.i >= N - 1) return P.terminar(); P.i++; ronda(); },
    });
    setTimeout(() => { globo.setPad({ top: 8, bottom: P.hoja.offsetHeight }, 400); globo.encuadra([a.lon, a.lat], [b.lon, b.lat], 500); }, 60);
  }
  function cunaPath(a1, a2) {
    let d = ((a2 - a1) % 360 + 540) % 360 - 180;
    const r = 80, p = g => [100 + Math.sin(g * RAD) * r, 100 - Math.cos(g * RAD) * r];
    const [x1, y1] = p(a1), [x2, y2] = p(a1 + d);
    return `M100 100 L${x1} ${y1} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${x2} ${y2} Z`;
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (S.estado === 'jugando' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); apuntar((S.ang || 0) + (e.key === 'ArrowLeft' ? -5 : 5)); }
    else if (e.key === 'Enter' && S.estado === 'jugando') confirmar();
    else if (e.key === 'Enter' && S.estado === 'resultado') { const bt = $('.pie .btn', P.hoja); bt && bt.click(); }
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); globo && globo.destruir(); }

  requestAnimationFrame(() => {
    if (N < 1 || partidas.some(a => !a)) { UI.toast('No hay lugares con esa combinación'); return UI.ir('tiquete', 'brujula'); }
    globo = new Globo(globoCont, { centro: [partidas[0].lon, partidas[0].lat], zoom: 1, dobleToque: false, alfaNubes: .5, cuantasNubes: 7 });
    globo.setPad({ top: 140, bottom: 92 });
    const pasa = () => { if (S.estado === 'jugando') colocarCompas(); };
    new ResizeObserver(pasa).observe(P.escena);
    ronda();
  });
  return { el: P.el, salir: limpiar };
};

// ===== Modo: Rompecabezas de países =====
// Un mapa plano del continente con huecos. Las piezas (países) esperan en una bandeja;
// se arrastran a su sitio y encajan con un "clic" si caen cerca.
function piezaSVG(d, b, color, { pad = 3, sombra = true } = {}) {
  const id = 'pz' + (++_silId);
  const w = b[1][0] - b[0][0], hh = b[1][1] - b[0][1], m = Math.max(w, hh) * .06 + pad;
  const vb = `${b[0][0] - m} ${b[0][1] - m} ${w + 2 * m} ${hh + 2 * m}`;
  const e = Math.max(w, hh) / 60;
  return `<svg viewBox="${vb}" aria-hidden="true" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ajustaColor(color, .35)}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${ajustaColor(color, -.22)}"/></linearGradient><clipPath id="${id}c"><path d="${d}"/></clipPath></defs>
    ${sombra ? `<path d="${d}" transform="translate(${e * .8} ${e * 2.2})" fill="rgba(30,60,90,.25)"/>` : ''}
    <path d="${d}" fill="url(#${id}g)" stroke="${ajustaColor(color, -.4)}" stroke-width="${e * .6}" stroke-linejoin="round"/>
    <g clip-path="url(#${id}c)"><path d="${d}" transform="translate(${e} ${e * 1.4})" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="${e * 2.2}" stroke-linejoin="round"/></g>
  </svg>`;
}

Pantallas.juego_rompepaises = (cfg) => {
  Progreso.load();
  const pool = poolModo('rompepaises', cfg);
  const piezas = elegirPaises(pool, escalaModo('rompepaises', cfg.rondas));
  const N = piezas.length;
  const P = crearPartida({ modo: 'rompepaises', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', puestos: 0, cola: piezas.slice(), bandeja: [], errores: {}, colores: {}, listos: new Set() };
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, at = {}) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };

  const svg = svgEl('svg', { class: 'rp-svg' });
  const mundo = svgEl('g');
  const capaFijos = svgEl('g'), capaHuecos = svgEl('g'), capaPuestos = svgEl('g');
  mundo.append(capaFijos, capaHuecos, capaPuestos);
  svg.append(mundo);
  const mapaEl = h('div.rp-mapa', svg);
  const bandeja = h('div.rp-bandeja');
  const quedan = h('b', String(N));
  const aviso = h('div.orden-aviso.rp-aviso');
  const controles = h('div.zoom-ctrl.rp-zoom',
    h('button.icono-btn', { 'aria-label': 'Acercar', html: I.mas, onclick: () => zoomCentro(1.6) }),
    h('button.icono-btn', { 'aria-label': 'Alejar', html: I.menos, onclick: () => zoomCentro(1 / 1.6) }),
    h('button.icono-btn', { 'aria-label': 'Ver todo', html: I.centrar, onclick: () => { animVista({ k: 1, x: 0, y: 0 }); } }));
  P.escena.append(mapaEl, aviso, controles, h('div.rp-pie', h('div.rp-quedan', 'Piezas: ', quedan), bandeja));

  // ----- proyección y dibujo -----
  let proj, path, W = 0, H = 0;
  const vista = { k: 1, x: 0, y: 0 };
  const datos = {}; // iso -> { d, b, c }
  function construir() {
    W = mapaEl.clientWidth; H = mapaEl.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const feats = piezas.map(p => partesPais(p.iso)).filter(Boolean).map(x => x.feat);
    const todo = { type: 'FeatureCollection', features: pool.map(p => partesPais(p.iso)).filter(Boolean).map(x => x.feat) };
    if (cfg.cont === 'todo') proj = D3.geoNaturalEarth1().fitExtent([[10, 10], [W - 10, H - 10]], { type: 'Sphere' });
    else {
      const cen = D3.geoCentroid(todo);
      proj = D3.geoOrthographic().rotate([-cen[0], -cen[1]]).clipAngle(90).fitExtent([[14, 14], [W - 14, H - 14]], todo);
    }
    path = D3.geoPath(proj);
    capaFijos.innerHTML = ''; capaHuecos.innerHTML = '';
    // mar con olitas y la tierra de fondo
    const m = Mapa.lo;
    const enJuego = new Set(piezas.map(p => p.iso));
    capaFijos.append(svgEl('path', { d: path({ type: 'Sphere' }) || '', class: 'rp-mar' }));
    capaFijos.append(svgEl('path', { d: path(m.tierra) || '', class: 'rp-sombra' }));
    for (const f of m.features) {
      const d = path(f); if (!d) continue;
      capaFijos.append(svgEl('path', { d, class: 'rp-fijo' + (pool.some(p => p.iso === f.iso) && !enJuego.has(f.iso) ? ' rp-vecino' : '') }));
    }
    for (const p of piezas) {
      const pt = partesPais(p.iso); if (!pt) continue;
      const d = path(pt.feat) || '';
      datos[p.iso] = { d, b: path.bounds(pt.feat), c: path.centroid(pt.feat) };
      const hueco = svgEl('path', { d, class: 'rp-hueco', 'data-iso': p.iso });
      capaHuecos.append(hueco);
      datos[p.iso].hueco = hueco;
    }
    // las que ya estaban puestas se redibujan
    capaPuestos.innerHTML = '';
    for (const iso of S.listos) ponerEnMapa(iso, false);
    aplicarVista();
  }
  function aplicarVista() { mundo.setAttribute('transform', `translate(${vista.x} ${vista.y}) scale(${vista.k})`); svg.style.setProperty('--k', vista.k); }
  const limitar = v => { v.k = clamp(v.k, 1, 10); v.x = clamp(v.x, W * (1 - v.k) - W * .3, W * .3); v.y = clamp(v.y, H * (1 - v.k) - H * .3, H * .3); return v; };
  function animVista(dest, ms = 350) {
    limitar(dest);
    const de = Object.assign({}, vista);
    return tween(ms, t => { vista.k = lerp(de.k, dest.k, t); vista.x = lerp(de.x, dest.x, t); vista.y = lerp(de.y, dest.y, t); aplicarVista(); });
  }
  function zoomEn(px, py, f) {
    const k = clamp(vista.k * f, 1, 10), r = k / vista.k;
    Object.assign(vista, limitar({ k, x: px - (px - vista.x) * r, y: py - (py - vista.y) * r }));
    aplicarVista();
  }
  function zoomCentro(f) { const k = clamp(vista.k * f, 1, 10), r = k / vista.k; animVista({ k, x: W / 2 - (W / 2 - vista.x) * r, y: H / 2 - (H / 2 - vista.y) * r }); }
  const aPantalla = ([x, y]) => { const r = mapaEl.getBoundingClientRect(); return [r.left + x * vista.k + vista.x, r.top + y * vista.k + vista.y]; };

  // mover y acercar el mapa con los dedos
  (() => {
    const ptrs = new Map(); let pinch = null;
    mapaEl.addEventListener('pointerdown', e => { mapaEl.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; } });
    mapaEl.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId), cur = [e.clientX, e.clientY]; ptrs.set(e.pointerId, cur);
      if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = mapaEl.getBoundingClientRect();
        zoomEn((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, d / pinch.d); pinch.d = d;
        return;
      }
      if (ptrs.size === 1) { vista.x += cur[0] - prev[0]; vista.y += cur[1] - prev[1]; limitar(vista); aplicarVista(); }
    });
    const fin = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
    mapaEl.addEventListener('pointerup', fin); mapaEl.addEventListener('pointercancel', fin);
    mapaEl.addEventListener('wheel', e => { e.preventDefault(); const r = mapaEl.getBoundingClientRect(); zoomEn(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * .0016)); }, { passive: false });
  })();

  // ----- bandeja de piezas -----
  function llenarBandeja() {
    while (S.bandeja.length < 3 && S.cola.length) {
      const p = S.cola.shift();
      S.colores[p.iso] = S.colores[p.iso] || crayonPara(p.iso, S.colores);
      S.bandeja.push(p);
    }
    bandeja.innerHTML = '';
    S.bandeja.forEach(p => {
      const dt = datos[p.iso];
      const ficha = h('button.rp-pieza', { 'data-iso': p.iso, 'aria-label': p.n },
        h('div.rp-pieza-forma', { html: dt ? piezaSVG(dt.d, dt.b, S.colores[p.iso]) : '' }),
        h('span.rp-pieza-nombre', Banderas.el(p.iso), h('b', p.n)));
      ficha.addEventListener('pointerdown', e => agarrar(e, p, ficha));
      bandeja.append(ficha);
    });
    quedan.textContent = String(N - S.puestos);
  }

  // ----- arrastrar -----
  let drag = null;
  function agarrar(e, p, ficha) {
    if (S.estado !== 'jugando') return;
    e.preventDefault(); e.stopPropagation();
    const dt = datos[p.iso]; if (!dt) return;
    const bw = (dt.b[1][0] - dt.b[0][0]), bh = (dt.b[1][1] - dt.b[0][1]);
    const esc = Math.max(vista.k, 34 / Math.max(bw, bh, .1)); // las piezas muy chiquitas se ven más grandes al llevarlas
    const flota = h('div.rp-flota', { html: piezaSVG(dt.d, dt.b, S.colores[p.iso], { pad: 0 }) });
    const m = Math.max(bw, bh) * .06;
    const w = (bw + 2 * m) * esc, hh = (bh + 2 * m) * esc;
    Object.assign(flota.style, { width: w + 'px', height: hh + 'px' });
    document.body.append(flota);
    // el dedo queda debajo de la pieza para no taparla
    const ox = w / 2, oy = hh + 28;
    drag = { p, ficha, flota, esc, m, ox, oy, w, hh, x: e.clientX, y: e.clientY, id: e.pointerId };
    mover(e.clientX, e.clientY);
    ficha.classList.add('vacia');
    ficha.setPointerCapture(e.pointerId);
    Sonido.play('tap'); vibrar(8);
  }
  function mover(x, y) { if (!drag) return; drag.x = x; drag.y = y; drag.flota.style.transform = `translate(${x - drag.ox}px, ${y - drag.oy}px)`; }
  const arrastra = e => { if (drag && e.pointerId === drag.id) mover(e.clientX, e.clientY); };
  const soltar = e => { if (drag && e.pointerId === drag.id) soltarPieza(); };
  document.addEventListener('pointermove', arrastra);
  document.addEventListener('pointerup', soltar); document.addEventListener('pointercancel', soltar);

  async function soltarPieza() {
    const dr = drag; drag = null;
    const { p, flota, esc, m } = dr;
    const dt = datos[p.iso];
    // dónde quedó el centro de la pieza vs dónde va
    const x0 = dr.x - dr.ox, y0 = dr.y - dr.oy;
    const cx = x0 + (dt.c[0] - dt.b[0][0] + m) * esc, cy = y0 + (dt.c[1] - dt.b[0][1] + m) * esc;
    const [tx, ty] = aPantalla(dt.c);
    const tam = Math.sqrt((dt.b[1][0] - dt.b[0][0]) * (dt.b[1][1] - dt.b[0][1])) * vista.k;
    const tol = Math.max(24, tam * .32);
    const dist = Math.hypot(cx - tx, cy - ty);
    const r = mapaEl.getBoundingClientRect();
    const enMapa = dr.y < r.bottom;
    if (enMapa && dist <= tol) return encajar(dr, tx - cx, ty - cy);
    // vuelve a la bandeja
    S.errores[p.iso] = (S.errores[p.iso] || 0) + (enMapa ? 1 : 0);
    const fr = dr.ficha.getBoundingClientRect();
    flota.style.transition = 'transform .35s cubic-bezier(.3,1.3,.5,1), opacity .35s';
    flota.style.transform = `translate(${fr.left + fr.width / 2 - dr.w / 2}px, ${fr.top + fr.height / 2 - dr.hh / 2}px) scale(.4)`;
    flota.style.opacity = '0';
    setTimeout(() => { flota.remove(); dr.ficha.classList.remove('vacia'); }, 350);
    if (!enMapa) return;
    Sonido.play('lejos'); vibrar([15, 30, 15]);
    dr.ficha.classList.remove('tiembla'); void dr.ficha.offsetWidth; dr.ficha.classList.add('tiembla');
    const err = S.errores[p.iso];
    decir(dist < tol * 3 ? '¡Muy cerca! Ajusta un poquito' : err >= 2 ? `Mira el hueco que brilla: ahí va ${p.n}` : 'Por ahí no va', dist < tol * 3 ? 'suave' : 'mal');
    if (err >= 2) dt.hueco.classList.add('pista');
    if (err >= 4) { await sleep(400); autoPoner(p); }
  }

  async function encajar(dr, dx, dy) {
    const { p, flota } = dr;
    S.estado = 'encajando';
    flota.style.transition = 'transform .22s ease-out';
    flota.style.transform = `translate(${dr.x - dr.ox + dx}px, ${dr.y - dr.oy + dy}px) scale(${vista.k / dr.esc})`;
    flota.style.transformOrigin = `${(datos[p.iso].c[0] - datos[p.iso].b[0][0] + dr.m) * dr.esc}px ${(datos[p.iso].c[1] - datos[p.iso].b[0][1] + dr.m) * dr.esc}px`;
    await sleep(220);
    flota.remove();
    const err = S.errores[p.iso] || 0;
    ponerEnMapa(p.iso, true);
    Sonido.play('pin'); vibrar(14);
    chispas(...aPantalla(datos[p.iso].c));
    const est = [3, 2, 1, 1][err] || 1, pts = [1000, 600, 300, 150][err] || 150;
    terminarPieza(p, est, pts, err ? `${err + 1} intentos` : '¡a la primera!');
    decir(p.cap ? `¡${p.n}! Capital: ${p.cap}` : `¡${p.n}!`, 'bien');
  }
  async function autoPoner(p) {
    S.estado = 'encajando';
    S.colores[p.iso] = ajustaColor(S.colores[p.iso], .45);
    ponerEnMapa(p.iso, true);
    decir(`Quinde puso ${p.n} en su sitio`, 'mal');
    terminarPieza(p, 0, 0, 'Quinde la puso');
  }
  function ponerEnMapa(iso, anim) {
    const dt = datos[iso]; if (!dt) return;
    S.listos.add(iso);
    dt.hueco.classList.remove('pista'); dt.hueco.classList.add('lleno');
    const g = svgEl('g', { class: 'rp-puesto' + (anim ? ' nuevo' : '') });
    g.style.transformOrigin = `${dt.c[0]}px ${dt.c[1]}px`;
    const cid = 'rpc' + iso + (++_silId);
    g.innerHTML = `<clipPath id="${cid}"><path d="${dt.d}"/></clipPath><path d="${dt.d}" class="rp-puesto-sombra"/><path d="${dt.d}" fill="${S.colores[iso]}" class="rp-puesto-forma"/>` +
      `<g clip-path="url(#${cid})"><path d="${dt.d}" class="rp-puesto-luz"/><path d="${dt.d}" class="rp-puesto-osc"/></g>`;
    capaPuestos.append(g);
  }
  async function terminarPieza(p, est, pts, det) {
    S.bandeja = S.bandeja.filter(x => x !== p);
    const q = est >= 3 ? 1 : est === 2 ? .6 : est === 1 ? .35 : 0;
    const dom = Progreso.registrar(idPais(p.iso), q);
    P.res.push({ l: paisComoLugar(p), est, pts, det, dom });
    P.marcar(S.puestos, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    S.puestos++;
    P.sumar(pts);
    llenarBandeja();
    if (S.puestos >= N) return final();
    P.ronda(S.puestos, `Pieza ${S.puestos + 1} de ${N}`);
    S.estado = 'jugando';
  }
  async function final() {
    S.estado = 'fin';
    animVista({ k: 1, x: 0, y: 0 }, 600);
    decir('¡Rompecabezas completo!', 'bien');
    P.escena.classList.add('rp-completo');
    UI.confeti(90); Sonido.play('fin');
    await sleep(2200);
    P.terminar();
  }

  function decir(texto, clase = '') {
    aviso.className = 'orden-aviso rp-aviso ' + clase; aviso.textContent = texto;
    void aviso.offsetWidth; aviso.classList.add('ve');
    clearTimeout(decir.t); decir.t = setTimeout(() => aviso.classList.remove('ve'), 1800);
  }
  function chispas(x, y) {
    const c = h('div.chispas', { style: { left: x + 'px', top: y + 'px' } }, Array.from({ length: 9 }, (_, k) => h('i', { style: { '--a': (k * 40) + 'deg', '--c': CRAYONES[k % CRAYONES.length] } })));
    document.body.append(c); setTimeout(() => c.remove(), 800);
  }

  const ro = new ResizeObserver(() => { if (S.estado !== 'cargando' && (Math.abs(mapaEl.clientWidth - W) > 4 || Math.abs(mapaEl.clientHeight - H) > 4)) { construir(); llenarBandeja(); } });
  function limpiar() {
    ro.disconnect(); if (drag) drag.flota.remove(); drag = null;
    document.removeEventListener('pointermove', arrastra);
    document.removeEventListener('pointerup', soltar); document.removeEventListener('pointercancel', soltar);
  }

  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay países con esa combinación'); return UI.ir('tiquete', 'rompepaises'); }
    Banderas.cargar();
    construir();
    llenarBandeja();
    P.ronda(0, `Pieza 1 de ${N}`);
    S.estado = 'jugando';
    ro.observe(mapaEl);
    setTimeout(() => decir('Arrastra cada pieza a su hueco', 'suave'), 400);
  });
  return { el: P.el, salir: limpiar };
};

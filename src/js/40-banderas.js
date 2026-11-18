// ===== Banderas: piezas comunes =====
// Una bandera "pintable" se arma leyendo su SVG: cada color distinto es una zona que se puede pintar.
const BLANCO_BANDERA = '#F7F2E6';
const rgbDe = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const hexDe = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const distCol = (a, b) => Math.sqrt(2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2);
const COLORES_BANDERA = ['#D52B1E', '#0038A8', '#009B3A', '#FCD116', '#FFFFFF', '#111111', '#FF8200', '#75AADB', '#7B2D26', '#00A3DD', '#E8112D', '#006233'];

let _medidor = null;
function medidorBanderas() {
  if (!_medidor) { _medidor = h('div', { style: { position: 'fixed', left: '-9999px', top: '0', width: '320px', height: '240px', visibility: 'hidden', pointerEvents: 'none' } }); document.body.append(_medidor); }
  return _medidor;
}
// arma el SVG de la bandera listo para pintar; devuelve null si la bandera es muy compleja
const _analisis = {};
function analizarBandera(iso) {
  if (iso in _analisis) return _analisis[iso];
  const src = Banderas.data && Banderas.data[iso.toLowerCase()];
  if (!src || /<image|<marker|url\(#[^)]*(grad|Grad)|linearGradient|radialGradient|<text/.test(src)) return (_analisis[iso] = null);
  const caja = medidorBanderas();
  caja.innerHTML = src;
  const svg = caja.firstElementChild;
  svg.setAttribute('width', '320'); svg.setAttribute('height', '240');
  // los <use> se cambian por copias de verdad para poder pintar cada pieza
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const usos = [...svg.querySelectorAll('use')].filter(u => !u.closest('defs,clipPath,marker,mask,pattern,symbol'));
    if (!usos.length) break;
    for (const u of usos) {
      const ref = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').slice(1);
      const orig = ref && svg.querySelector('#' + CSS.escape(ref));
      if (!orig) { u.remove(); continue; }
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (const a of [...u.attributes]) if (!/^(href|xlink:href|x|y|width|height)$/.test(a.name)) g.setAttribute(a.name, a.value);
      const x = +u.getAttribute('x') || 0, y = +u.getAttribute('y') || 0;
      if (x || y) g.setAttribute('transform', `${g.getAttribute('transform') || ''} translate(${x} ${y})`);
      const c = orig.cloneNode(true); c.removeAttribute('id');
      c.querySelectorAll && c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      g.append(c); u.replaceWith(g);
    }
  }
  const hojas = [...svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')].filter(e => !e.closest('defs,clipPath,marker,mask,pattern,symbol'));
  const grupos = [];
  const grupoDe = rgb => { let g = grupos.find(g => distCol(g.rgb, rgb) < 46); if (!g) { g = { rgb, col: hexDe(rgb), entradas: [], area: 0 }; grupos.push(g); } return g; };
  let k = 0;
  for (const e of hojas) {
    const cs = getComputedStyle(e);
    if (parseFloat(cs.opacity) < .5 || parseFloat(cs.fillOpacity) < .5) { _medidor.innerHTML = ''; return (_analisis[iso] = null); }
    const bb = e.getBoundingClientRect();
    const f = cs.fill, s = cs.stroke, sw = parseFloat(cs.strokeWidth) || 0;
    e.setAttribute('data-z', String(k++));
    if (f && f !== 'none' && !/url/.test(f)) { const rgb = rgbDe(f); if (rgb) { const g = grupoDe(rgb); g.entradas.push({ z: e.getAttribute('data-z'), prop: 'fill' }); g.area += bb.width * bb.height; } }
    if (s && s !== 'none' && sw > 0 && !/url/.test(s)) { const rgb = rgbDe(s); if (rgb) { const g = grupoDe(rgb); g.entradas.push({ z: e.getAttribute('data-z'), prop: 'stroke' }); g.area += (bb.width + bb.height) * sw * .9; } }
  }
  const html = svg.outerHTML;
  caja.innerHTML = '';
  const total = 320 * 240;
  grupos.forEach(g => { g.chica = g.area < total * .012; });
  const pintables = grupos.filter(g => !g.chica);
  const ok = grupos.length <= 7 && pintables.length >= 2 && pintables.length <= 6;
  return (_analisis[iso] = ok ? { html, grupos } : null);
}

// bandera ondeando: tiras verticales con la misma imagen y un vaivén desfasado
function banderaOndea(iso, { tiras = 24, clase = '' } = {}) {
  const src = Banderas.src(iso);
  const el = h('div.ondea' + clase);
  for (let i = 0; i < tiras; i++) {
    el.append(h('i', { style: { backgroundImage: src ? `url("${src}")` : '', backgroundSize: `${tiras * 100}% 100%`, backgroundPosition: `${(i / (tiras - 1)) * 100}% 0`, animationDelay: `${-i * .06}s`, '--sombra': (Math.sin(i / tiras * Math.PI * 2) * .5 + .5).toFixed(2) } }));
  }
  return el;
}
function mastilSVG() {
  return `<svg viewBox="0 0 24 200" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mastilG" x1="0" x2="1"><stop offset="0" stop-color="#C98B4E"/><stop offset=".4" stop-color="#F2C18A"/><stop offset="1" stop-color="#A5662E"/></linearGradient></defs>
    <rect x="8" y="10" width="8" height="190" rx="4" fill="url(#mastilG)"/><circle cx="12" cy="9" r="7" fill="#FFC94D" stroke="#C98A00" stroke-width="1.5"/><circle cx="10" cy="7" r="2.2" fill="#fff" opacity=".8"/></svg>`;
}

// ===== Modo: Pinta la bandera =====
Pantallas.juego_pintabandera = (cfg) => {
  Progreso.load();
  const P = crearPartida({ modo: 'pintabandera', cfg, n: 1, onSalir: () => limpiar() });
  const S = { estado: 'cargando', color: null, pintado: {}, rondas: [], N: 0 };
  const nombre = h('b.pb-nombre'), cont = h('small.pb-cont');
  const lienzo = h('div.pb-lienzo');
  const real = h('div.pb-real');
  const paleta = h('div.pb-paleta');
  const btn = h('button.btn.grande.ancho', { disabled: true, onclick: () => revisar() }, h('span', { html: I.check }), 'Revisar');
  const ayuda = h('p.pb-ayuda', 'Elige un color y toca la zona de la bandera');
  P.escena.append(h('div.pb-zona',
    h('div.pb-cab', h('small', 'Pinta la bandera de'), nombre, cont),
    h('div.pb-mesa', h('div.pb-mastil', { html: mastilSVG() }), h('div.pb-marco', lienzo, real)),
    ayuda, paleta, h('div.pb-pie', btn)), P.hoja);

  let grupos = [];
  const ahora = () => S.rondas[P.i];

  function ronda() {
    const p = ahora(), an = analizarBandera(p.iso);
    S.estado = 'jugando'; S.color = null; S.pintado = {};
    P.ronda(P.i, `Bandera ${P.i + 1} de ${S.N}`);
    nombre.textContent = p.n; cont.textContent = CONTINENTES[p.c].n;
    lienzo.innerHTML = an.html; real.innerHTML = ''; real.classList.remove('ve');
    const svg = $('svg', lienzo); svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('preserveAspectRatio', 'none');
    grupos = an.grupos.map((g, i) => ({ ...g, i, els: g.entradas.map(en => ({ el: svg.querySelector(`[data-z="${en.z}"]`), prop: en.prop })).filter(x => x.el) }));
    for (const g of grupos) {
      if (g.chica) continue;
      for (const { el, prop } of g.els) {
        el.style[prop] = BLANCO_BANDERA;
        if (prop === 'fill' && !(el.getAttribute('stroke'))) { el.style.stroke = '#A89F8C'; el.style.strokeWidth = '1.6px'; el.style.vectorEffect = 'non-scaling-stroke'; }
        el.dataset.g = g.i;
      }
    }
    svg.addEventListener('click', e => { const t = e.target.closest('[data-g]'); if (t) pintar(+t.dataset.g, e); });
    // paleta: los colores de verdad y algunos que no van
    const verdad = grupos.filter(g => !g.chica).map(g => g.col);
    const extra = shuffle(COLORES_BANDERA).filter(c => grupos.every(g => distCol(g.rgb, rgbDe(hexToRgbStr(c))) > 80)).slice(0, p.t === 1 ? 2 : 3);
    paleta.innerHTML = '';
    shuffle(verdad.concat(extra)).forEach(c => paleta.append(h('button.pb-color', { style: { '--c': c }, 'aria-label': 'Color', onclick: e => elegirColor(c, e.currentTarget) })));
    btn.disabled = true;
    $('.pb-mesa', P.escena).classList.remove('llega'); void lienzo.offsetWidth; $('.pb-mesa', P.escena).classList.add('llega');
    Sonido.play('papel');
  }
  function elegirColor(c, b) {
    if (S.estado !== 'jugando') return;
    S.color = c;
    $$('.pb-color', paleta).forEach(x => x.classList.toggle('activo', x === b));
    Sonido.play('tap'); vibrar(6);
    ayuda.textContent = 'Ahora toca una zona de la bandera';
  }
  function pintar(gi, e) {
    if (S.estado !== 'jugando') return;
    if (!S.color) { ayuda.textContent = 'Primero elige un color de abajo'; paleta.classList.remove('tiembla'); void paleta.offsetWidth; paleta.classList.add('tiembla'); return; }
    const g = grupos[gi];
    S.pintado[gi] = S.color;
    for (const { el, prop } of g.els) { el.style[prop] = S.color; if (prop === 'fill' && el.style.stroke) el.style.stroke = 'rgba(0,0,0,.18)'; }
    // gotita que salpica donde se tocó
    const r = lienzo.getBoundingClientRect();
    const gota = h('i.pb-gota', { style: { left: (e.clientX - r.left) + 'px', top: (e.clientY - r.top) + 'px', background: S.color } });
    lienzo.append(gota); setTimeout(() => gota.remove(), 500);
    Sonido.play('pop'); vibrar(8);
    btn.disabled = grupos.some(g => !g.chica && !S.pintado[g.i]);
  }
  async function revisar() {
    if (S.estado !== 'jugando') return;
    S.estado = 'resultado';
    const p = ahora();
    const pint = grupos.filter(g => !g.chica);
    let bien = 0;
    for (const g of pint) {
      const ok = distCol(g.rgb, rgbDe(hexToRgbStr(S.pintado[g.i]))) < 46;
      if (ok) bien++;
      else for (const { el, prop } of g.els) { el.classList.add('pb-mal'); setTimeout(() => { el.style[prop] = g.col; el.classList.remove('pb-mal'); }, 900); }
    }
    const frac = bien / pint.length;
    const est = frac === 1 ? 3 : pint.length - bien === 1 && pint.length >= 3 ? 2 : frac >= .5 ? 1 : 0;
    const pts = Math.round(1000 * frac * frac);
    real.append(Banderas.el(p.iso)); real.classList.add('ve');
    const dom = Progreso.registrar(idPais(p.iso, 'b'), frac === 1 ? 1 : frac >= .6 ? .55 : 0);
    P.res.push({ l: paisComoLugar(p, 'b'), est, pts, det: `${bien} de ${pint.length} colores`, dom });
    P.marcar(P.i, est >= 2 ? 'hecho' : est === 1 ? 'medio' : 'lejos');
    await sleep(1000);
    P.sumar(pts);
    P.resultado({
      est, pts, l: paisComoLugar(p, 'b'), dom, ultima: P.i === S.N - 1,
      titulo: frac === 1 ? '¡Idéntica!' : est === 2 ? '¡Casi perfecta!' : est === 1 ? 'Vas bien' : `Así es la de ${p.n}`,
      detalle: `Acertaste ${bien} de ${pint.length} colores.`,
      alSiguiente: () => { if (P.i >= S.N - 1) return P.terminar(); P.i++; ronda(); },
    });
  }

  function limpiar() { }
  requestAnimationFrame(async () => {
    await Banderas.cargar();
    const pool = filtrarPaises(cfg).filter(p => analizarBandera(p.iso));
    S.rondas = elegirPaises(pool, escalaModo('pintabandera', cfg.rondas), undefined, 'b');
    S.N = S.rondas.length;
    if (!S.N) { UI.toast('No hay banderas con esa combinación'); return UI.ir('tiquete', 'pintabandera'); }
    P.reiniciar(S.N);
    ronda();
  });
  return { el: P.el, salir: limpiar };
};
function hexToRgbStr(hex) { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; }

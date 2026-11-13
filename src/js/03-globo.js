// ===== geografía =====
const RAD = Math.PI / 180;
const Geo = {
  // distancia en km entre [lon,lat]
  km(a, b) { return D3.geoDistance(a, b) * 6371; },
  rumbo(a, b) { // grados desde el norte
    const [l1, f1] = [a[0] * RAD, a[1] * RAD], [l2, f2] = [b[0] * RAD, b[1] * RAD];
    const y = Math.sin(l2 - l1) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(l2 - l1);
    return (Math.atan2(y, x) / RAD + 360) % 360;
  },
  medio(a, b) { return D3.geoInterpolate(a, b)(.5); },
};

// ===== el mapa en memoria =====
const Mapa = {
  lo: null, hi: null, hiProm: null,
  prep(topo) {
    const obj = topo.objects.countries;
    const fs = D3.feature(topo, obj).features;
    for (const f of fs) {
      const key = f.id || (f.properties && f.properties.name);
      f.iso = DATA.shape[key] || null;
    }
    return {
      features: fs,
      bordes: D3.mesh(topo, obj, (a, b) => a !== b),
      tierra: D3.merge(topo, obj.geometries),
    };
  },
  init() { this.lo = this.prep(DATA.mapaLo); },
  cargarHi() {
    if (!this.hiProm) this.hiProm = fetch('datos/mapa-hi.json').then(r => r.json()).then(t => { this.hi = this.prep(t); return this.hi; }).catch(() => null);
    return this.hiProm;
  },
  // país que está en [lon,lat] (usa el mapa detallado si ya cargó)
  paisEn(ll) {
    const m = this.hi || this.lo;
    for (const f of m.features) if (f.iso && D3.geoContains(f, ll)) return f.iso;
    return null;
  },
};

// color de papel para cada país: tono del continente con una variación pequeña
function colorPais(iso) {
  const p = PAIS[iso];
  const base = (CONTINENTES[p ? p.c : 'AN'] || CONTINENTES.AN).color;
  const k = [0, .06, -.05, .1, -.02][hash(iso || 'x') % 5];
  return ajustaColor(base, k);
}
function ajustaColor(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)), 0, 255);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

// ===== el globo =====
class Globo {
  constructor(contenedor, op = {}) {
    this.op = Object.assign({ interactivo: true, zoomMin: .9, zoomMax: 14, giro: 0, margen: .9 }, op);
    this.cv = h('canvas.globo-canvas');
    contenedor.append(this.cv);
    this.cont = contenedor;
    this.ctx = this.cv.getContext('2d');
    this.centro = op.centro || [-30, 15]; // [lon, lat] que mira la cámara
    this.zoom = op.zoom || 1;
    this.proj = D3.geoOrthographic().clipAngle(90).precision(.6);
    this.path = D3.geoPath(this.proj, this.ctx);
    this.grat = D3.geoGraticule10();
    this.pines = []; this.arcos = []; this.colores = {}; this.etiquetas = [];
    this.pad = { top: 0, bottom: 0, left: 0, right: 0 };
    this.vel = [0, 0]; this.sucio = true; this.vivo = true; this.anim = 0;
    this.ultimoToque = 0; this.padAnim = 0;
    this.oyentes = {};
    this.redim();
    this.ro = new ResizeObserver(() => { this.redim(); this.pinta(); });
    this.ro.observe(contenedor);
    if (this.op.interactivo) this.eventos();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  on(ev, fn) { (this.oyentes[ev] = this.oyentes[ev] || []).push(fn); return this; }
  emit(ev, ...a) { (this.oyentes[ev] || []).forEach(f => f(...a)); }
  destruir() { this.vivo = false; this.ro.disconnect(); this.cv.remove(); }

  redim() {
    const r = this.cont.getBoundingClientRect();
    this.w = Math.max(10, r.width); this.h = Math.max(10, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.w * this.dpr); this.cv.height = Math.round(this.h * this.dpr);
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.sucio = true;
  }
  // radio y centro en pantalla, dejando libre lo que tapan barras y hojas
  geom() {
    const p = this.pad;
    const vh = Math.max(60, this.h - (p.top || 0) - (p.bottom || 0));
    const vw = Math.max(60, this.w - (p.left || 0) - (p.right || 0));
    const R0 = Math.min(vw, vh) / 2 * this.op.margen;
    return { R: R0 * this.zoom, R0, cx: (p.left || 0) + vw / 2, cy: (p.top || 0) + vh / 2 };
  }
  setPad(p, ms = 0) {
    if (!ms) { Object.assign(this.pad, p); this.sucio = true; return Promise.resolve(); }
    const de = Object.assign({}, this.pad), id = ++this.padAnim;
    return tween(ms, t => { if (id !== this.padAnim) return; for (const k in p) this.pad[k] = lerp(de[k] || 0, p[k], t); this.sucio = true; });
  }
  aplicar() {
    const g = this.geom();
    this.proj.scale(g.R).translate([g.cx, g.cy]).rotate([-this.centro[0], -this.centro[1]]);
    return g;
  }
  // de pantalla a [lon,lat] (null si cae fuera del globo)
  invertir(x, y) {
    const g = this.aplicar();
    if (Math.hypot(x - g.cx, y - g.cy) > g.R) return null;
    return this.proj.invert([x, y]);
  }
  visible(ll) { return D3.geoDistance(ll, this.centro) < Math.PI / 2 - .01; }
  pantalla(ll) { this.aplicar(); return this.proj(ll); }

  // ---------- interacción ----------
  eventos() {
    const cv = this.cv, ptrs = new Map();
    let arrastre = false, inicio = null, ult = null, pinch = null;
    cv.style.touchAction = 'none';
    const xy = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, xy(e));
      this.parar();
      if (ptrs.size === 1) { inicio = { p: xy(e), t: performance.now() }; ult = { p: xy(e), t: performance.now() }; arrastre = false; this.vel = [0, 0]; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: this.zoom, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; arrastre = true; }
      this.emit('toca');
    });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) { this.hover(xy(e)); return; }
      const p = xy(e), prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, p);
      if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        this.setZoom(pinch.z * d / pinch.d);
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        this.girarPx(m[0] - pinch.m[0], m[1] - pinch.m[1]); pinch.m = m;
        return;
      }
      if (!inicio) return;
      if (!arrastre && Math.hypot(p[0] - inicio.p[0], p[1] - inicio.p[1]) > 7) { arrastre = true; this.emit('arrastra'); }
      if (arrastre) {
        const dx = p[0] - prev[0], dy = p[1] - prev[1];
        this.girarPx(dx, dy);
        const now = performance.now(), dt = Math.max(1, now - ult.t);
        this.vel = [dx / dt * 16, dy / dt * 16]; ult = { p, t: now };
      }
    });
    const fin = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size === 1) { const p = [...ptrs.values()][0]; inicio = { p, t: performance.now() }; ult = { p, t: performance.now() }; pinch = null; return; }
      if (ptrs.size > 0) return;
      pinch = null;
      const p = xy(e);
      if (!arrastre && inicio && performance.now() - inicio.t < 600) {
        const now = performance.now();
        const ll = this.invertir(p[0], p[1]);
        const pin = this.pinEn(p);
        if (now - this.ultimoToque < 320 && ll && this.op.dobleToque !== false) { this.ultimoToque = 0; this.emit('doble', ll, p); }
        else { this.ultimoToque = now; this.emit('tap', ll, p, pin); }
      } else if (performance.now() - (ult ? ult.t : 0) > 80) this.vel = [0, 0];
      inicio = null;
    };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);
    cv.addEventListener('pointerleave', () => { this.hoverLL = null; });
    cv.addEventListener('wheel', e => {
      e.preventDefault(); this.parar();
      const f = Math.exp(-e.deltaY * (e.deltaMode ? .05 : .0016));
      this.zoomEn(xy(e), this.zoom * f);
    }, { passive: false });
    this.on('doble', (ll, p) => { if (this.op.zoomDoble !== false) this.vuela(ll, Math.min(this.op.zoomMax, this.zoom * 2.2), 450); });
  }
  hover(p) { if (this.oyentes.hover) this.emit('hover', this.invertir(p[0], p[1]), p); }
  girarPx(dx, dy) {
    const g = this.geom();
    const k = 1 / g.R / RAD;
    this.centro = [((this.centro[0] - dx * k + 540) % 360) - 180, clamp(this.centro[1] + dy * k, -88, 88)];
    this.sucio = true; this.emit('mueve');
  }
  setZoom(z) { this.zoom = clamp(z, this.op.zoomMin, this.op.zoomMax); this.sucio = true; this.emit('mueve'); }
  zoomEn(p, z) {
    // acerca hacia el punto bajo el cursor
    const antes = this.invertir(p[0], p[1]);
    this.setZoom(z);
    const despues = this.invertir(p[0], p[1]);
    if (antes && despues) {
      this.centro = [this.centro[0] + (antes[0] - despues[0]), clamp(this.centro[1] + (antes[1] - despues[1]), -88, 88)];
    }
  }
  parar() { this.vel = [0, 0]; this.anim++; }

  // vuelo suave de la cámara a [lon,lat] con zoom
  vuela(ll, zoom = this.zoom, ms = 1200) {
    const id = ++this.anim;
    const c0 = this.centro.slice(), z0 = this.zoom, z1 = clamp(zoom, this.op.zoomMin, this.op.zoomMax);
    const interp = D3.geoInterpolate(c0, ll);
    const dist = D3.geoDistance(c0, ll);
    const salto = Math.min(.6, dist / 2.2);
    return tween(ms, t => {
      if (id !== this.anim) return;
      const c = interp(t);
      this.centro = [c[0], clamp(c[1], -88, 88)];
      const base = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * t);
      this.zoom = clamp(base * (1 - salto * Math.sin(Math.PI * t)), this.op.zoomMin * .8, this.op.zoomMax);
      this.sucio = true;
    }, ease.inOut);
  }
  // encuadra dos puntos
  encuadra(a, b, ms = 1100) {
    const m = Geo.medio(a, b);
    const ang = D3.geoDistance(a, b); // radianes
    // a qué zoom caben los dos con margen: el arco ocupa ~ sin(ang/2) del radio
    const frac = Math.sin(Math.min(ang, Math.PI * .9) / 2);
    const z = clamp(.62 / Math.max(frac, .02), .95, this.op.zoomMax * .6);
    return this.vuela(m, z, ms);
  }

  // ---------- dibujo ----------
  loop(now) {
    if (!this.vivo) return;
    if (this.op.giro && !this.quieto) {
      const dt = this.ultT ? Math.min(50, now - this.ultT) : 16;
      this.centro = [((this.centro[0] + this.op.giro * dt / 1000 + 540) % 360) - 180, this.centro[1]];
      this.sucio = true;
    }
    this.ultT = now;
    if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > .05) {
      this.girarPx(this.vel[0], this.vel[1]);
      this.vel = [this.vel[0] * .93, this.vel[1] * .93];
    }
    const animando = this.pines.some(p => p.t0 && now - p.t0 < 700) || this.arcos.some(a => a.prog < 1) || this.pines.some(p => p.pulso);
    if (this.sucio || animando) { this.pinta(now); this.sucio = false; }
    requestAnimationFrame(this.loop);
  }
  pinta(now = performance.now()) {
    const ctx = this.ctx, d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const g = this.aplicar();
    const { R, cx, cy } = g;
    const m = (R > 700 && Mapa.hi) ? Mapa.hi : Mapa.lo;
    if (R > 600 && !Mapa.hi) Mapa.cargarHi().then(() => { this.sucio = true; });

    // halo de atmósfera
    const halo = ctx.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.13);
    halo.addColorStop(0, 'rgba(160,214,236,.75)'); halo.addColorStop(.35, 'rgba(190,228,244,.35)'); halo.addColorStop(1, 'rgba(220,240,250,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.13, 0, 7); ctx.fill();

    // océano
    const mar = ctx.createRadialGradient(cx - R * .35, cy - R * .42, R * .05, cx, cy, R);
    mar.addColorStop(0, '#B4E4F2'); mar.addColorStop(.55, '#7FC7E0'); mar.addColorStop(1, '#5AAED0');
    ctx.fillStyle = mar; ctx.beginPath(); this.path({ type: 'Sphere' }); ctx.fill();

    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    // retícula
    ctx.beginPath(); this.path(this.grat); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = .7; ctx.stroke();
    // sombra de papel bajo la tierra
    ctx.save(); ctx.translate(.8, 1.8);
    ctx.beginPath(); this.path(m.tierra); ctx.fillStyle = 'rgba(28,92,128,.28)'; ctx.fill();
    ctx.restore();
    // países por color
    const grupos = new Map();
    for (const f of m.features) {
      const c = this.colores[f.iso] || f.col || (f.col = colorPais(f.iso));
      if (!grupos.has(c)) grupos.set(c, []);
      grupos.get(c).push(f);
    }
    for (const [c, fs] of grupos) { ctx.beginPath(); for (const f of fs) this.path(f); ctx.fillStyle = c; ctx.fill(); }
    // fronteras y costa
    ctx.beginPath(); this.path(m.bordes); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = R > 900 ? 1.1 : .75; ctx.stroke();
    ctx.beginPath(); this.path(m.tierra); ctx.strokeStyle = 'rgba(42,98,128,.38)'; ctx.lineWidth = .7; ctx.stroke();
    if (this.resalte) { ctx.beginPath(); for (const f of m.features) if (f.iso === this.resalte) this.path(f); ctx.strokeStyle = '#24476B'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();

    // luz y volumen
    const luz = ctx.createRadialGradient(cx - R * .38, cy - R * .45, 0, cx, cy, R * 1.02);
    luz.addColorStop(0, 'rgba(255,255,255,.30)'); luz.addColorStop(.45, 'rgba(255,255,255,0)'); luz.addColorStop(.82, 'rgba(18,60,92,.06)'); luz.addColorStop(1, 'rgba(18,60,92,.24)');
    ctx.fillStyle = luz; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();

    for (const a of this.arcos) this.pintaArco(a, now);
    const pines = this.pines.filter(p => this.visible(p.ll)).sort((a, b) => this.proj(a.ll)[1] - this.proj(b.ll)[1]);
    for (const p of pines) this.pintaPin(p, now);
    for (const e of this.etiquetas) if (this.visible(e.ll)) this.pintaEtiqueta(e);
  }

  // pin con forma de alfiler de mapa
  pintaPin(p, now) {
    const ctx = this.ctx;
    const [x, y0] = this.proj(p.ll);
    let y = y0, esc = p.esc || 1;
    if (p.t0) {
      const t = clamp((now - p.t0) / 600, 0, 1);
      y = y0 - (1 - ease.back(t)) * 46; esc *= .6 + .4 * Math.min(1, t * 2);
      if (t < 1) this.sucio = true;
    }
    const col = p.color || '#EF6F5E';
    // sombra en el suelo
    ctx.fillStyle = 'rgba(20,50,70,.22)'; ctx.beginPath(); ctx.ellipse(x, y0 + 1, 7 * esc, 2.6 * esc, 0, 0, 7); ctx.fill();
    if (p.pulso) {
      const t = (now % 1600) / 1600;
      ctx.strokeStyle = col; ctx.globalAlpha = 1 - t; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(x, y0, 8 + t * 26, (8 + t * 26) * .45, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (p.tipo === 'foto' && p.img) {
      const r = 19 * esc;
      ctx.save(); ctx.translate(x, y - 30 * esc);
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(20,50,70,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.beginPath(); ctx.moveTo(-6 * esc, r - 2); ctx.lineTo(0, 30 * esc); ctx.lineTo(6 * esc, r - 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
      const im = p.img, s = Math.max(2 * r / im.width, 2 * r / im.height);
      ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc);
    ctx.shadowColor = 'rgba(20,50,70,.28)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-4, -9, -12, -15, -12, -25); ctx.arc(0, -25, 12, Math.PI, 0); ctx.bezierCurveTo(12, -15, 4, -9, 0, 0); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -25, 5.2, 0, 7); ctx.fill();
    if (p.icono === 'estrella') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -25, 2.4, 0, 7); ctx.fill(); }
    ctx.restore();
    if (p.texto) this.pintaEtiqueta({ ll: p.ll, texto: p.texto, dy: -44 * esc, color: p.colorTexto || '#24476B' }, x, y);
  }
  pintaEtiqueta(e, x, y) {
    const ctx = this.ctx;
    if (x == null) [x, y] = this.proj(e.ll);
    y += e.dy || 0;
    ctx.font = `800 ${e.tam || 13}px 'Nunito', sans-serif`;
    const w = ctx.measureText(e.texto).width + 16;
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.shadowColor = 'rgba(20,50,70,.2)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    const rx = x - w / 2, ry = y - 12;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(rx, ry, w, 24, 12) : ctx.rect(rx, ry, w, 24); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = e.color || '#24476B'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(e.texto, x, y + 1);
  }
  // arco de vuelo punteado con avioncito
  pintaArco(a, now) {
    const ctx = this.ctx;
    if (a.prog < 1) { a.prog = clamp((now - a.t0) / a.ms, 0, 1); this.sucio = true; }
    const t = ease.inOut(a.prog);
    const f = D3.geoInterpolate(a.de, a.a);
    const n = 64, pts = [];
    for (let i = 0; i <= n * t; i++) pts.push(f(i / n));
    pts.push(f(t));
    ctx.save();
    ctx.beginPath(); this.path({ type: 'LineString', coordinates: pts });
    ctx.setLineDash([2, 7]); ctx.lineCap = 'round'; ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
    ctx.setLineDash([2, 7]); ctx.lineWidth = 2.6; ctx.strokeStyle = a.color || '#2F64A6'; ctx.stroke();
    ctx.restore();
    if (a.prog < 1 || a.avion) {
      const p = f(t), q = f(Math.min(1, t + .01));
      if (!this.visible(p)) return;
      const [x, y] = this.proj(p), [x2, y2] = this.proj(q);
      const ang = Math.atan2(y2 - y, x2 - x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2);
      ctx.shadowColor = 'rgba(20,50,70,.3)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2F64A6'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -11); ctx.quadraticCurveTo(2.2, -9, 2.2, -4); ctx.lineTo(11, 2); ctx.lineTo(11, 4.5); ctx.lineTo(2.2, 2);
      ctx.lineTo(1.6, 8); ctx.lineTo(4.6, 10.5); ctx.lineTo(4.6, 12); ctx.lineTo(0, 11); ctx.lineTo(-4.6, 12); ctx.lineTo(-4.6, 10.5);
      ctx.lineTo(-1.6, 8); ctx.lineTo(-2.2, 2); ctx.lineTo(-11, 4.5); ctx.lineTo(-11, 2); ctx.lineTo(-2.2, -4); ctx.quadraticCurveTo(-2.2, -9, 0, -11);
      ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
      ctx.restore();
    }
  }
  pinEn(p) {
    for (const pin of this.pines.slice().reverse()) {
      if (!pin.tocable || !this.visible(pin.ll)) continue;
      const [x, y] = this.proj(pin.ll);
      if (Math.hypot(p[0] - x, p[1] - (y - 28)) < 26) return pin;
    }
    return null;
  }
  // ---------- elementos ----------
  pin(ll, o = {}) { const p = Object.assign({ ll, t0: o.caer === false ? 0 : performance.now() }, o); this.pines.push(p); this.sucio = true; return p; }
  quitaPin(p) { this.pines = this.pines.filter(x => x !== p); this.sucio = true; }
  arco(de, a, o = {}) { const x = Object.assign({ de, a, t0: performance.now(), ms: 1400, prog: 0 }, o); this.arcos.push(x); this.sucio = true; return new Promise(r => setTimeout(r, x.ms)); }
  limpiar() { this.pines = []; this.arcos = []; this.etiquetas = []; this.colores = {}; this.resalte = null; this.sucio = true; }
}

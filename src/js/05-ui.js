// ===== pantallas y piezas comunes =====
const UI = {
  actual: null, limpieza: null,
  // cambia de pantalla; cada pantalla es una función que devuelve {el, salir?}
  ir(nombre, ...args) {
    const app = $('#app');
    const vieja = this.actual;
    if (this.limpieza) { try { this.limpieza(); } catch (e) { console.error(e); } this.limpieza = null; }
    $('#capa').innerHTML = '';
    const pant = Pantallas[nombre](...args);
    pant.el.classList.add('pantalla');
    pant.el.dataset.pantalla = nombre;
    document.body.dataset.p = nombre;
    if (vieja) { vieja.classList.add('sale'); setTimeout(() => vieja.remove(), 260); }
    app.append(pant.el);
    this.actual = pant.el;
    this.limpieza = pant.salir || null;
    if (location.hash !== '#' + nombre && ['inicio', 'modos'].includes(nombre)) try { history.replaceState(null, '', '#' + nombre); } catch (e) { }
  },
  toast(txt) { const t = h('div.toast', txt); $('#toasts').append(t); setTimeout(() => t.remove(), 2700); },
  dialogo({ titulo, texto, botones }) {
    return new Promise(res => {
      const cerrar = v => { $('#capa').innerHTML = ''; res(v); };
      const d = h('div.dialogo', { role: 'dialog', 'aria-modal': 'true' },
        h('h3', titulo), texto ? h('p', texto) : null,
        h('div.botones', botones.map(b => h('button.btn' + (b.clase ? '.' + b.clase : ''), { onclick: () => { Sonido.play('tap'); cerrar(b.valor); } }, b.texto))));
      $('#capa').append(h('div.fondo-capa', { onclick: () => cerrar(null) }), d);
      setTimeout(() => { const b = $('button', d); b && b.focus(); }, 50);
    });
  },
  // foto grande con su crédito
  visor(src, credito) {
    const cerrar = () => { $('#capa').innerHTML = ''; document.removeEventListener('keydown', tecla); };
    const tecla = e => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', tecla);
    $('#capa').append(
      h('div.fondo-capa', { onclick: cerrar }),
      h('div.visor', { onclick: e => { if (e.target === e.currentTarget) cerrar(); } },
        h('img', { src, alt: '' }),
        h('p.credito', credito || ''),
        h('button.icono-btn.cerrar', { 'aria-label': 'Cerrar', html: I.cerrar, onclick: cerrar })));
  },
  confeti(n = 70) {
    if (Ajustes.get('menosMov') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#EF6F5E', '#3E7CC4', '#FFC94D', '#5DBB88', '#FFFFFF', '#C9B8E8'];
    const c = h('div.confeti');
    for (let i = 0; i < n; i++) {
      c.append(h('i', { style: { left: Math.random() * 100 + '%', background: pick(cols), animationDelay: Math.random() * .5 + 's', '--dx': (Math.random() * 160 - 80) + 'px', '--rot': (Math.random() * 900 - 450) + 'deg', transform: `rotate(${Math.random() * 180}deg)` } }));
    }
    document.body.append(c);
    setTimeout(() => c.remove(), 3200);
  },
  estrellas(n, total = 3) {
    const s = h('span.estrellas', { 'aria-label': `${n} de ${total} estrellas` });
    for (let i = 0; i < total; i++) { const e = svgEl(I.estrella); e.classList.add(i < n ? 'on' : 'off'); s.append(e); }
    return s;
  },
  quinde(texto, clase = '') {
    return h('div.quinde-dice' + clase, h('div.quinde', { html: I.quinde }), texto ? h('div.globo-texto', texto) : null);
  },
  // número que cuenta hacia arriba
  contar(el, desde, hasta, ms = 900, fmtFn = fmt.n) {
    let ult = 0;
    return tween(ms, t => { el.textContent = fmtFn(lerp(desde, hasta, t)); const now = performance.now(); if (now - ult > 70 && t < 1) { Sonido.play('cuenta'); ult = now; } }, ease.out);
  },
};
const Pantallas = {};

// teclas globales: Escape vuelve
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#capa').children.length) { $('#capa').innerHTML = ''; }
});

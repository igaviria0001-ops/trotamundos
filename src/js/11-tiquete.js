// ===== tiquete de viaje: configurar la partida =====
Pantallas.tiquete = (modoId) => {
  const m = MODO[modoId];
  const cfg = cfgModo(modoId);
  const cuenta = h('b');
  const boton = h('button.btn.grande', { onclick: () => abordar() }, h('span', { html: I.avion }), 'Abordar');
  const actualizar = () => {
    const n = filtrarLugares(cfg).length;
    cuenta.textContent = n === 1 ? '1 lugar' : `${n} lugares`;
    boton.disabled = n < 1;
  };
  const grupoChips = (clave, opciones, clase = '') => {
    const cont = h('div.chips' + clase, { role: 'radiogroup' });
    const pintar = () => $$('.chip', cont).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === String(cfg[clave]))));
    for (const o of opciones) {
      cont.append(h('button.chip', { 'data-v': String(o.v), onclick: () => { cfg[clave] = typeof o.v === 'number' ? o.v : String(o.v); Sonido.play('tap'); pintar(); actualizar(); } },
        o.color ? h('span.punto', { style: { background: o.color } }) : null,
        h('span', o.n, o.d ? h('small', o.d) : null)));
    }
    pintar();
    return cont;
  };
  const abordar = () => {
    Store.set('cfg_' + modoId, { cont: cfg.cont, nivel: cfg.nivel, rondas: cfg.rondas });
    Sonido.play('sello');
    UI.ir('juego_' + modoId, Object.assign({}, cfg));
  };
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const el = h('div.pant-tiquete',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('modos') }),
      h('div.titulo', h('h2', 'Tu tiquete'), h('div.sub', m.n))),
    h('div.scroll.tiquete-zona',
      h('div.tiquete',
        h('div.cabeza',
          h('div.cab-fila', h('span.cab-chico', 'Tiquete de viaje'), h('span.cab-chico', hoy)),
          h('div.cab-modo', h('div.cab-ilus', { html: I.m[ICO_MODO[modoId]] }), h('div', h('h3', m.n), h('p', m.d))),
          h('div.aereo.cab-franja')),
        h('div.cuerpo',
          h('div.campo', h('span.lbl', 'Destino'),
            grupoChips('cont', [{ v: 'todo', n: 'Todo el mundo' }].concat(['EU', 'AS', 'AF', 'NA', 'SA', 'OC'].map(k => ({ v: k, n: CONTINENTES[k].corto || CONTINENTES[k].n, color: CONTINENTES[k].color }))))),
          h('div.campo', h('span.lbl', 'Nivel'),
            grupoChips('nivel', [1, 2, 3].map(k => ({ v: String(k), n: NIVELES[k].n, d: NIVELES[k].d }))
              .concat([{ v: 'mezcla', n: 'Mezcla', d: 'Un poco de todo' }]), '.rejilla')),
          h('div.campo', h('span.lbl', 'Escalas'),
            grupoChips('rondas', [5, 10, 15].map(k => ({ v: k, n: `${k} postales` }))))),
        h('div.corte'),
        h('div.talon', h('div.talon-info', h('small', 'Lugares en este viaje'), cuenta), h('div.codigo', { html: codigoBarras() })))),
    h('div.pie-fijo', boton));
  actualizar();
  return { el };
};

function codigoBarras() {
  let x = 0, r = '';
  const anchos = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2];
  anchos.forEach((w, i) => { if (i % 2 === 0) r += `<rect x="${x}" y="0" width="${w * 2}" height="34" fill="#24476B"/>`; x += w * 2 + 1; });
  return `<svg viewBox="0 0 ${x} 34" aria-hidden="true">${r}</svg>`;
}

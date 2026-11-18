// ===== Viaje a la medida =====
// Se escogen los modos (cada uno es una parada), el destino y el nivel; el viaje los encadena.
Pantallas.medida = () => {
  const guardado = Store.get('medida', { modos: ['postal', 'silueta', 'banderasviento', 'masalto'], cont: 'todo', nivel: '1' });
  const S = { modos: new Set(guardado.modos.filter(m => MODO[m] && modoListo(MODO[m]) && PASO_CORTO[m] != null)), cont: guardado.cont, nivel: guardado.nivel };
  const elegibles = MODOS.filter(m => modoListo(m) && PASO_CORTO[m.id] != null);
  const cuenta = h('b');
  const boton = h('button.btn.grande', { onclick: () => despegar() }, h('span', { html: I.avion }), 'Despegar');
  const actualizar = () => {
    const n = S.modos.size;
    cuenta.textContent = n === 1 ? '1 parada' : `${n} paradas`;
    boton.disabled = n < 1;
    $$('.me-modo', el).forEach(b => b.setAttribute('aria-pressed', String(S.modos.has(b.dataset.m))));
  };
  const grupoChips = (clave, opciones, clase = '') => {
    const cont = h('div.chips' + clase, { role: 'radiogroup' });
    const pintar = () => $$('.chip', cont).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === String(S[clave]))));
    for (const o of opciones) cont.append(h('button.chip', { 'data-v': String(o.v), onclick: () => { S[clave] = String(o.v); Sonido.play('tap'); pintar(); } },
      o.color ? h('span.punto', { style: { background: o.color } }) : null, h('span', o.n, o.d ? h('small', o.d) : null)));
    pintar();
    return cont;
  };
  function despegar() {
    if (!S.modos.size) return;
    Store.set('medida', { modos: [...S.modos], cont: S.cont, nivel: S.nivel });
    Sonido.play('sello');
    const orden = elegibles.filter(m => S.modos.has(m.id)).map(m => m.id);
    Cadena.iniciar({ tipo: 'medida', titulo: 'Tu viaje', nivel: S.nivel, pasos: orden.map(m => ({ modo: m, cfg: { cont: S.cont, nivel: S.nivel } })) });
  }
  const el = h('div.pant-tiquete.medida',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'Viaje a la medida'), h('div.sub', 'Tú escoges las paradas'))),
    h('div.scroll.tiquete-zona',
      h('div.tiquete',
        h('div.cabeza',
          h('div.cab-fila', h('span.cab-chico', 'Itinerario'), h('span.cab-chico', new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }))),
          h('div.cab-modo', h('div.cab-ilus', { html: I.m.explorar }), h('div', h('h3', 'Arma tu viaje'), h('p', 'Toca los modos que quieres jugar. Cada uno será una parada corta.'))),
          h('div.aereo.cab-franja')),
        h('div.cuerpo',
          h('div.campo', h('span.lbl', 'Paradas'),
            h('div.me-modos', elegibles.map(m => h('button.me-modo', { 'data-m': m.id, 'aria-pressed': 'false', onclick: () => { S.modos.has(m.id) ? S.modos.delete(m.id) : S.modos.add(m.id); Sonido.play('tap'); actualizar(); } },
              h('span.me-ilus', { html: I.m[ICO_MODO[m.id]] }), h('b', m.n), h('span.me-check', { html: I.check }))))),
          h('div.campo', h('span.lbl', 'Destino'),
            grupoChips('cont', [{ v: 'todo', n: 'Todo el mundo' }].concat(['EU', 'AS', 'AF', 'NA', 'SA', 'OC'].map(k => ({ v: k, n: CONTINENTES[k].corto || CONTINENTES[k].n, color: CONTINENTES[k].color }))))),
          h('div.campo', h('span.lbl', 'Nivel'),
            grupoChips('nivel', [1, 2, 3].map(k => ({ v: String(k), n: NIVELES[k].n, d: NIVELES[k].d })).concat([{ v: 'mezcla', n: 'Mezcla', d: 'Un poco de todo' }]), '.rejilla'))),
        h('div.corte'),
        h('div.talon', h('div.talon-info', h('small', 'Tu viaje tiene'), cuenta), h('div.codigo', { html: codigoBarras() })))),
    h('div.pie-fijo', boton));
  requestAnimationFrame(actualizar);
  return { el };
};

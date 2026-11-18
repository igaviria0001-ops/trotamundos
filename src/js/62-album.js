// ===== Álbum de sellos =====
// Cada lugar es un sello. Se ve en color cuando ya lo descubriste (lo jugaste o lo visitaste en Explorar)
// y brilla en dorado cuando lo dominas del todo.
Pantallas.album = () => {
  Progreso.load();
  const vis = Visitados.get();
  const visto = l => Progreso.de(l.id).v > 0 || vis.has(l.id);
  let cont = 'todo', soloMios = false;
  const lista = h('div.al-lista');
  const cuenta = h('b');
  const chips = h('div.al-filtros',
    [['todo', 'Todo'], ...Object.keys(CONTINENTES).filter(k => k !== 'AN').map(k => [k, CONTINENTES[k].corto || CONTINENTES[k].n])].map(([k, n]) =>
      h('button.chip.al-chip', { 'aria-pressed': String(k === cont), 'data-k': k, style: k !== 'todo' ? { '--cc': CONTINENTES[k].color } : {}, onclick: e => { cont = k; $$('.al-chip', chips).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.k === k))); Sonido.play('tap'); pintar(); } }, n)));
  const interr = h('button.interruptor', { role: 'switch', 'aria-checked': 'false', onclick: () => { soloMios = !soloMios; interr.setAttribute('aria-checked', String(soloMios)); Sonido.play('tap'); pintar(); } }, h('i'));
  function pintar() {
    const ls = LUGARES.filter(l => (cont === 'todo' || l.c === cont) && (!soloMios || visto(l)))
      .sort((a, b) => (visto(b) - visto(a)) || (Progreso.dominio(b.id) - Progreso.dominio(a.id)) || a.t - b.t || a.n.localeCompare(b.n, 'es'));
    const total = LUGARES.filter(l => cont === 'todo' || l.c === cont);
    cuenta.textContent = `${total.filter(visto).length} de ${total.length}`;
    lista.innerHTML = '';
    // de a pedazos para que el celular no se trabe con 470 sellos
    let k = 0;
    const tanda = () => {
      const frag = document.createDocumentFragment();
      for (const l of ls.slice(k, k + 60)) frag.append(sello(l));
      lista.append(frag); k += 60;
      if (k < ls.length) requestAnimationFrame(tanda);
    };
    tanda();
    if (!ls.length) lista.append(h('p.al-vacio', 'Todavía no tienes sellos aquí. ¡Juega para descubrirlos!'));
  }
  function sello(l) {
    const v = visto(l), dom = Progreso.dominio(l.id);
    return h('button.al-sello' + (v ? '' : '.oculto') + (dom >= 5 ? '.oro' : ''), {
      style: { '--cc': CONTINENTES[l.c].color }, 'aria-label': v ? l.n : 'Sello por descubrir',
      onclick: () => { if (v) { Sonido.play('pop'); abrirFicha(l); } else { Sonido.play('tap'); UI.toast(`Un lugar de ${CONTINENTES[l.c].n} te espera. ¡Juega para descubrirlo!`); } },
    },
      h('div.al-foto', v ? h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '', loading: 'lazy' }) : h('span.al-inc', '?')),
      h('div.al-pie', h('b', v ? l.n : '¿?'), v ? h('span.al-dom', Array.from({ length: 5 }, (_, i) => h('i' + (i < dom ? '.on' : '')))) : h('small', CONTINENTES[l.c].corto || CONTINENTES[l.c].n)));
  }
  const el = h('div.album',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'Mi álbum'), h('div.sub', h('span', 'Sellos: '), cuenta)),
      h('div.barra-hueco')),
    h('div.al-cab', chips, h('label.al-solo', h('span', 'Solo los míos'), interr)),
    h('div.scroll.al-zona', lista));
  requestAnimationFrame(pintar);
  return { el };
};

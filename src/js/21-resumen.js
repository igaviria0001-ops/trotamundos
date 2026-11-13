// ===== fin del viaje =====
Pantallas.resumen = (d) => {
  const pct = d.puntos / d.max;
  const titulo = pct >= .8 ? '¡Viaje de leyenda!' : pct >= .55 ? '¡Gran viaje!' : pct >= .3 ? '¡Buen viaje!' : '¡Viaje terminado!';
  const subieron = d.res.filter(r => r.dom.despues > r.dom.antes).length;
  const num = h('b.res-total', '0');
  const el = h('div.resumen',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Inicio', html: I.casa, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', MODO[d.modo].n), h('div.sub', `${d.res.length} postales`))),
    h('div.scroll.resumen-zona',
      h('section.resumen-cabeza',
        h('div.sello-grande', { html: selloFinSVG(titulo) }),
        h('div.resumen-puntos', num, h('span', `de ${fmt.n(d.max)} puntos`)),
        d.record.nuevo && d.record.antes != null ? h('p.insignia', '¡Nuevo récord personal!') : null,
        h('div.resumen-stats',
          h('div', h('b', fmt.km(d.viaje)), h('small', 'de vuelo entre postales')),
          h('div', h('b', String(subieron)), h('small', subieron === 1 ? 'lugar subió de dominio' : 'lugares subieron de dominio')))),
      h('section.resumen-lista',
        d.res.map((r, k) => h('button.res-item', { onclick: () => abrirFicha(r.l), style: { animationDelay: (k * 70 + 300) + 'ms' } },
          h('img', { src: Foto.url(r.l, 0, true) || Foto.respaldo(r.l), alt: '', loading: 'lazy' }),
          h('div.res-item-txt', h('b', r.l.n), h('small', ...r.l.iso.map(i => Banderas.el(i)), ' ', paisesDe(r.l))),
          h('div.res-item-der', UI.estrellas(r.est), h('small', r.km <= 25 ? '¡exacto!' : `a ${fmt.km(r.km)}`))))),
      h('section.resumen-botones',
        h('button.btn.grande.ancho', { onclick: () => UI.ir('juego_' + d.modo, Object.assign({}, d.cfg)) }, h('span', { html: I.repetir }), 'Otro viaje igual'),
        h('div.fila-btns',
          h('button.btn.blanco', { onclick: () => UI.ir('tiquete', d.modo) }, h('span', { html: I.tiquete }), 'Cambiar tiquete'),
          h('button.btn.blanco', { onclick: () => UI.ir('inicio') }, h('span', { html: I.casa }), 'Inicio')))));
  requestAnimationFrame(async () => {
    await sleep(350);
    Sonido.play('sello');
    await sleep(250);
    UI.contar(num, 0, d.puntos, 1200);
    if (pct >= .55) { await sleep(600); Sonido.play('fin'); UI.confeti(90); }
  });
  return { el };
};

function selloFinSVG(texto) {
  return `<svg viewBox="0 0 260 150" aria-hidden="true"><g transform="rotate(-6 130 75)"><rect x="14" y="16" width="232" height="118" rx="16" fill="none" stroke="#EF6F5E" stroke-width="5"/><rect x="24" y="26" width="212" height="98" rx="10" fill="none" stroke="#EF6F5E" stroke-width="2" stroke-dasharray="5 5"/><text x="130" y="72" font-family="Baloo 2, sans-serif" font-weight="800" font-size="27" text-anchor="middle" fill="#EF6F5E">${texto}</text><text x="130" y="102" font-family="Nunito, sans-serif" font-weight="800" font-size="13" letter-spacing="3" text-anchor="middle" fill="#EF6F5E">TROTAMUNDOS · ${new Date().getFullYear()}</text></g></svg>`;
}

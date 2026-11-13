// ===== piezas comunes de una partida por rondas =====
function crearPartida({ modo, cfg, n, onSalir }) {
  const numPuntos = h('span.num', '0');
  const sub = h('div.sub');
  const progreso = h('div.progreso', Array.from({ length: n }, () => h('i')));
  const escena = h('div.escena');
  const hojaCont = h('div.contenido');
  const hojaPie = h('div.pie');
  const hoja = h('div.hoja', h('button.asa', { 'aria-label': 'Agrandar o achicar', onclick: () => { hoja.classList.toggle('grande'); Sonido.play('papel'); } }), h('div.scroll.hoja-scroll', hojaCont), hojaPie);
  const P = {
    puntos: 0, i: 0, res: [], fin: false,
    el: h('div.juego.juego-' + modo,
      h('div.barra',
        h('button.icono-btn', { 'aria-label': 'Salir', html: I.cerrar, onclick: () => P.salir() }),
        h('div.titulo', h('h2', MODO[modo].n), sub, progreso),
        h('div.marcador', numPuntos, h('small', 'puntos'))),
      escena),
    escena, hoja,
    ronda(i, texto) {
      P.i = i; sub.textContent = texto || `${i + 1} de ${n}`;
      $$('i', progreso).forEach((x, k) => x.classList.toggle('actual', k === i));
      hoja.classList.remove('abierta', 'grande');
      escena.classList.remove('con-resultado');
    },
    marcar(i, clase) { const m = $$('i', progreso)[i]; m.classList.remove('actual'); m.classList.add(clase); },
    sumar(pts) {
      const desde = P.puntos; P.puntos += pts;
      return UI.contar(numPuntos, desde, P.puntos, 800).then(() => { numPuntos.classList.remove('salta'); void numPuntos.offsetWidth; numPuntos.classList.add('salta'); });
    },
    // resultado de una ronda en la hoja inferior
    resultado({ est, titulo, detalle, pts, nota, l, dom, ultima, alSiguiente }) {
      hojaCont.innerHTML = ''; hojaPie.innerHTML = '';
      const subio = dom && dom.despues > dom.antes;
      hojaCont.append(...[
        h('div.res-cabeza',
          h('div.res-izq', UI.estrellas(est), h('h3', titulo), detalle ? h('p.res-km', detalle) : null),
          h('div.res-pts', h('b', `+${fmt.n(pts)}`), h('small', 'puntos'))),
        nota ? h('p.res-nota', nota) : null,
        subio ? h('p.res-sube', h('span', { html: I.estrella }), `Tu dominio de este lugar subió a ${dom.despues} de 5`) : null,
        l ? fichaLugar(l, { foto: false }) : null].filter(Boolean));
      hojaPie.append(h('button.btn.ancho.grande', { onclick: () => { Sonido.play('tap'); alSiguiente(); } }, ultima ? 'Ver mi viaje' : 'Siguiente'));
      escena.classList.add('con-resultado');
      hoja.classList.add('abierta');
      Sonido.play(est >= 3 ? 'genial' : est === 2 ? 'bien' : est === 1 ? 'medio' : 'lejos');
      if (est >= 3) UI.confeti(36);
      setTimeout(() => { const b = $('.btn', hojaPie); b && b.focus({ preventScroll: true }); }, 400);
    },
    terminar(extra = {}) {
      P.fin = true;
      Progreso.sumar(extra.viaje || 0, n);
      const rec = Progreso.record(modo + '_' + n, P.puntos);
      UI.ir('resumen', Object.assign({ modo, cfg, puntos: P.puntos, max: n * 1000, res: P.res, viaje: extra.viaje || 0, record: rec }, extra));
    },
    async salir() {
      if (P.res.length && !P.fin) {
        const v = await UI.dialogo({ titulo: '¿Terminar el viaje?', texto: 'Lo que aprendiste se guarda, pero esta partida no cuenta para tus récords.', botones: [{ texto: 'Seguir jugando', valor: false }, { texto: 'Salir', valor: true, clase: 'blanco' }] });
        if (!v) return;
      }
      onSalir && onSalir();
      UI.ir('inicio');
    },
  };
  return P;
}

// opciones de respuesta: el correcto y otros parecidos según el nivel
function opcionesPara(l, n = 4, rnd = Math.random) {
  const hayFotos = LUGARES.some(x => x.fotos.length);
  const con = LUGARES.filter(x => x.id !== l.id && (x.fotos.length || !hayFotos));
  const mismoCont = con.filter(x => x.c === l.c), mismaCat = con.filter(x => x.k === l.k);
  const usados = new Set([l.id]);
  const out = [l];
  const tomar = lista => { for (const x of shuffle(lista, rnd)) { if (out.length >= n) return; if (!usados.has(x.id) && !x.iso.some(i => l.iso.includes(i) && l.t === 1)) { usados.add(x.id); out.push(x); return; } } };
  const fuente = l.t === 1 ? [con, mismaCat, con] : l.t === 2 ? [mismoCont, mismaCat, con] : [mismoCont, mismoCont, mismaCat];
  for (const f of fuente) tomar(f);
  for (let k = 0; out.length < n && k < 12; k++) tomar(con);
  return shuffle(out, rnd);
}

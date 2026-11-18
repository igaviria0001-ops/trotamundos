// ===== Modo: ¿Más alto o más bajo? =====
// Dos postales: de la primera se sabe la altura; de la segunda hay que decir si es más alta o más baja.
// La segunda pasa a ser la primera de la siguiente comparación (una cadena, con racha).
const valorAltura = l => l.k === 'naturaleza' ? l.elev : l.alto;
const tipoAltura = l => l.k === 'naturaleza' ? 'elev' : 'alto';
function lugaresAltura(cfg) {
  const es = l => (l.k !== 'naturaleza' && l.alto > 5) || (l.k === 'naturaleza' && l.elev > 300);
  let p = filtrarLugares(cfg).filter(es);
  if (p.length < 12) p = filtrarLugares(Object.assign({}, cfg, { nivel: 'mezcla' })).filter(es);
  if (p.length < 12) p = filtrarLugares({ cont: 'todo', nivel: 'mezcla' }).filter(es);
  return p;
}
function cadenaAlturas(pool, n) {
  const out = [];
  const porTipo = { alto: shuffle(pool.filter(l => tipoAltura(l) === 'alto')), elev: shuffle(pool.filter(l => tipoAltura(l) === 'elev')) };
  let tipo = porTipo.alto.length >= porTipo.elev.length ? 'alto' : 'elev';
  let a = null;
  const usados = new Set();
  while (out.length < n) {
    const lista = porTipo[tipo].filter(l => !usados.has(l.id));
    if (!a) { a = lista[0]; if (!a) break; usados.add(a.id); continue; }
    const b = lista.find(l => { const r = valorAltura(l) / valorAltura(a); return r > 1.12 || r < 1 / 1.12; });
    if (!b) { a = null; tipo = tipo === 'alto' ? 'elev' : 'alto'; if (!porTipo[tipo].some(l => !usados.has(l.id))) break; continue; }
    usados.add(b.id); out.push({ a, b, tipo }); a = b;
  }
  return out;
}

Pantallas.juego_masalto = (cfg) => {
  Progreso.load();
  const pool = lugaresAltura(cfg);
  const rondas = cadenaAlturas(pool, escalaModo('masalto', cfg.rondas));
  const N = rondas.length;
  const P = crearPartida({ modo: 'masalto', cfg, n: N, onSalir: () => limpiar() });
  const S = { estado: 'cargando', racha: 0, mejor: 0 };

  const pregunta = h('b');
  const racha = h('span.ma-racha', h('span', { html: I.estrella }), h('b', '0'));
  const cartaA = h('div.ma-carta.a'), cartaB = h('div.ma-carta.b');
  const medidor = h('div.ma-medidor');
  const btnMas = h('button.btn.grande.ma-mas', { onclick: () => responder(1) }, h('span', { html: flechaSVG }), 'Más alto');
  const btnMenos = h('button.btn.grande.ma-menos', { onclick: () => responder(-1) }, h('span', { html: flechaSVG, style: { transform: 'rotate(180deg)' } }), 'Más bajo');
  const btnSig = h('button.btn.grande.ancho.ma-sig', { onclick: () => siguiente() }, 'Siguiente');
  P.escena.append(h('div.ma-zona',
    h('div.ma-cab', h('div.ns-cinta.ma-cinta', pregunta), racha),
    h('div.ma-cartas', cartaA, h('div.ma-vs', 'vs'), cartaB),
    medidor,
    h('div.ma-pie', h('div.ma-botones', btnMenos, btnMas), btnSig)));

  const ahora = () => rondas[P.i];
  const etiqueta = (l, v) => `${fmt.m(v)}${tipoAltura(l) === 'elev' ? ' sobre el mar' : ' de alto'}`;
  function llenar(carta, l, conValor) {
    carta.innerHTML = '';
    carta.append(
      h('img', { src: Foto.url(l, 0, true) || Foto.respaldo(l), alt: '' }),
      h('div.ma-info', h('b', l.n), h('small', ...l.iso.map(i => Banderas.el(i)), ' ', paisesDe(l))),
      h('div.ma-valor' + (conValor ? '' : '.oculto'), conValor ? etiqueta(l, valorAltura(l)) : '?'));
    carta.onclick = () => abrirFicha(l);
  }

  function ronda(primera) {
    const { a, b, tipo } = ahora();
    S.estado = 'jugando';
    P.ronda(P.i, `${P.i + 1} de ${N}`);
    pregunta.textContent = tipo === 'elev' ? '¿Está más alto o más bajo sobre el mar?' : '¿Es más alto o más bajo?';
    if (primera || cartaA.dataset.id !== a.id) llenar(cartaA, a, true);
    cartaA.dataset.id = a.id;
    llenar(cartaB, b, false); cartaB.dataset.id = b.id;
    cartaB.classList.remove('bien', 'mal'); cartaB.classList.remove('entra'); void cartaB.offsetWidth; cartaB.classList.add('entra');
    P.escena.classList.remove('ma-revelado');
    medidor.innerHTML = '';
    medidor.append(h('div.ma-escena.vacia', h('div.ma-suelo'), h('span.ma-espera', '¿Cuál llega más arriba?')));
    btnMas.disabled = btnMenos.disabled = false;
    Sonido.play('papel');
  }

  async function responder(dir) {
    if (S.estado !== 'jugando') return;
    S.estado = 'revelando'; btnMas.disabled = btnMenos.disabled = true;
    const { a, b } = ahora();
    const va = valorAltura(a), vb = valorAltura(b);
    const ok = (vb > va) === (dir > 0);
    // el número sube como una cinta métrica
    const val = $('.ma-valor', cartaB); val.classList.remove('oculto');
    const num = h('span', '0'); val.innerHTML = ''; val.append(num, tipoAltura(b) === 'elev' ? ' m sobre el mar' : ' m de alto');
    pintarMedidor(a, b);
    Sonido.play('cuenta');
    await UI.contar(num, 0, vb, 900);
    cartaB.classList.add(ok ? 'bien' : 'mal');
    if (ok) { S.racha++; S.mejor = Math.max(S.mejor, S.racha); } else S.racha = 0;
    $('b', racha).textContent = String(S.racha);
    racha.classList.remove('sube'); void racha.offsetWidth; if (ok) racha.classList.add('sube');
    Sonido.play(ok ? (S.racha >= 3 ? 'genial' : 'bien') : 'lejos');
    if (ok && S.racha >= 3 && S.racha % 3 === 0) { UI.confeti(30); UI.toast(`¡Racha de ${S.racha}!`); }
    if (!ok) vibrar([20, 40, 20]);
    const veces = vb > va ? vb / va : va / vb;
    const nota = veces >= 1.95 ? `${b.n} es ${veces >= 10 ? 'unas ' + Math.round(veces) : 'como ' + (Math.round(veces * 10) / 10).toLocaleString('es-CO')} veces ${vb > va ? 'más alto' : 'más bajo'} que ${a.n}.` : `Diferencia: ${fmt.m(Math.abs(vb - va))}.`;
    medidor.append(h('p.ma-nota', nota));
    const pts = ok ? 1000 : 0;
    const dom = Progreso.registrar(b.id, ok ? .6 : .2);
    P.res.push({ l: b, est: ok ? 3 : 0, pts, det: ok ? '¡acertaste!' : 'no esta vez', dom });
    P.marcar(P.i, ok ? 'hecho' : 'lejos');
    P.sumar(pts);
    P.escena.classList.add('ma-revelado');
    $('.ma-sig', P.escena).textContent = P.i >= N - 1 ? 'Ver mi viaje' : 'Siguiente';
    S.estado = 'resultado';
  }
  // dos barras a escala sobre el suelo
  function pintarMedidor(a, b) {
    const va = valorAltura(a), vb = valorAltura(b), m = Math.max(va, vb);
    const barra = (l, v, cls) => h('div.ma-barra.' + cls, { style: { '--h': (Math.max(.04, v / m) * 100).toFixed(1) + '%' } },
      h('div.ma-barra-foto', { style: { backgroundImage: `url("${Foto.url(l, 0, true) || Foto.respaldo(l)}")` } }), h('span', fmt.m(v)));
    medidor.innerHTML = '';
    medidor.append(h('div.ma-escena', barra(a, va, 'a'), barra(b, vb, 'b'), h('div.ma-suelo')));
  }
  function siguiente() {
    if (S.estado !== 'resultado') return;
    Sonido.play('tap');
    if (P.i >= N - 1) return P.terminar({ racha: S.mejor });
    const sig = rondas[P.i + 1];
    P.i++;
    // la de la derecha pasa a la izquierda si la cadena sigue
    if (sig.a.id === cartaB.dataset.id) {
      cartaA.innerHTML = cartaB.innerHTML; cartaA.dataset.id = cartaB.dataset.id; cartaA.onclick = () => abrirFicha(sig.a);
      const v = $('.ma-valor', cartaA); v.classList.remove('oculto'); v.textContent = etiqueta(sig.a, valorAltura(sig.a));
      cartaA.classList.remove('desliza'); void cartaA.offsetWidth; cartaA.classList.add('desliza');
    }
    ronda(false);
  }

  const teclas = e => {
    if ($('#capa').children.length) return;
    if (S.estado === 'jugando' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); responder(e.key === 'ArrowUp' ? 1 : -1); }
    else if (e.key === 'Enter' && S.estado === 'resultado') siguiente();
  };
  document.addEventListener('keydown', teclas);
  function limpiar() { document.removeEventListener('keydown', teclas); }
  requestAnimationFrame(() => {
    if (!N) { UI.toast('No hay lugares suficientes con esa combinación'); return UI.ir('tiquete', 'masalto'); }
    Banderas.cargar();
    ronda(true);
  });
  return { el: P.el, salir: limpiar };
};

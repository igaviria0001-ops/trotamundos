// ===== Pasaporte del viajero =====
// Rango, kilómetros, lo aprendido por continente, el mapa que se va coloreando y los logros.
Pantallas.pasaporte = () => {
  Progreso.load(); Logros.revisar();
  const c = Logros.cuentas(), r = rango();
  const nombre = Store.get('nombre', '');
  const retoD = Reto.get();
  const inputNombre = h('input.pa-nombre', { value: nombre, placeholder: 'Tu nombre de viajero', maxlength: 24, 'aria-label': 'Tu nombre' });
  inputNombre.addEventListener('change', () => Store.set('nombre', inputNombre.value.trim()));
  const globoCont = h('div.pa-globo');
  const porCont = Object.keys(CONTINENTES).filter(k => k !== 'AN').map(k => {
    const tot = LUGARES.filter(l => l.c === k).length, ap = c.porCont[k] || 0;
    return h('div.pa-cont', { style: { '--cc': CONTINENTES[k].color } },
      h('div.pa-cont-sello', { html: selloContSVG(CONTINENTES[k], ap / tot) }),
      h('b', CONTINENTES[k].corto || CONTINENTES[k].n), h('small', `${ap} de ${tot}`));
  });
  const logros = Logros.LISTA.map(l => {
    const gano = Logros.tiene(l.id);
    return h('div.pa-logro' + (gano ? '' : '.bloq'), { title: l.d }, h('div.pa-medalla', { html: medallaSVG(l, gano) }), h('b', l.n), h('small', l.d));
  });
  const dato = (num, txt) => h('div.pa-dato', h('b', num), h('small', txt));
  const el = h('div.pasaporte',
    h('div.barra',
      h('button.icono-btn', { 'aria-label': 'Volver', html: I.atras, onclick: () => UI.ir('inicio') }),
      h('div.titulo', h('h2', 'Mi pasaporte'), h('div.sub', 'Todo lo que has viajado')),
      h('div.barra-hueco')),
    h('div.scroll.pa-zona',
      h('section.pa-hoja.pa-portada',
        h('div.pa-foto', { html: I.quinde }),
        h('div.pa-id', h('small', 'Pasaporte de'), inputNombre,
          h('div.pa-rango', h('span.pa-sello-rango', r.n), r.sig ? h('small', `Faltan ${fmt.km(r.sig.km - Progreso.st.km)} para ser ${r.sig.n}`) : h('small', '¡Llegaste al rango más alto!')),
          h('div.barra-rango', h('i', { style: { width: (r.prog * 100).toFixed(1) + '%' } })))),
      h('section.pa-hoja',
        h('h3', 'Mis números'),
        h('div.pa-datos',
          dato(fmt.km(Progreso.st.km), 'recorridos'), dato(String(c.partidas), c.partidas === 1 ? 'viaje' : 'viajes'),
          dato(String(c.lugares), 'lugares aprendidos'), dato(String(c.paises), 'países en el mapa'),
          dato(String(c.banderas), 'banderas'), dato(String(c.capitales), 'capitales'),
          dato(String(retoD.racha && retoD.ultimo && (retoD.ultimo === hoyClave() || retoD.ultimo === hoyClave(new Date(Date.now() - 864e5))) ? retoD.racha : 0), 'días de racha'), dato(String(c.visitados), 'visitados en Explorar'))),
      h('section.pa-hoja',
        h('h3', 'Mi mapa'),
        h('p.pa-nota', 'Los países se van pintando con lo que aprendes: sus lugares, su forma, su bandera y su capital.'),
        globoCont,
        h('div.pa-leyenda', h('span', h('i.n1'), 'Empezando'), h('span', h('i.n2'), 'Conocido'), h('span', h('i.n3'), 'Dominado'))),
      h('section.pa-hoja', h('h3', 'Sellos por continente'), h('div.pa-conts', porCont)),
      h('section.pa-hoja', h('h3', `Logros (${Logros.LISTA.filter(l => Logros.tiene(l.id)).length} de ${Logros.LISTA.length})`), h('div.pa-logros', logros))));
  let globo;
  requestAnimationFrame(() => {
    globo = new Globo(globoCont, { centro: [-20, 20], zoom: 1, giro: 4, paginable: true, zoomDoble: false, nubes: false, margen: .92 });
    globo.colores = coloresAprendidos();
    globo.colorResto = '#E7E1D3';
    globo.on('toca', () => { globo.quieto = true; });
  });
  return { el, salir: () => globo && globo.destruir() };
};
// cuánto sabes de cada país: lugares aprendidos + forma, bandera y capital
function puntajePais(iso) {
  const d = Progreso.d || {};
  let s = 0;
  for (const l of LUGARES) if (l.iso.includes(iso)) { const r = d[l.id]; if (r) s += r.dom >= 3 ? 1.2 : r.v > 0 ? .4 : 0; }
  for (const pref of ['p', 'b', 'c']) { const r = d[pref + ':' + iso]; if (r) s += r.dom >= 3 ? 1 : r.v > 0 ? .35 : 0; }
  return s;
}
function coloresAprendidos() {
  const col = {};
  for (const p of PAISES) {
    const s = puntajePais(p.iso);
    if (s <= 0) continue;
    col[p.iso] = s >= 3 ? ajustaColor(CONTINENTES[p.c].color, -.08) : s >= 1.2 ? ajustaColor(CONTINENTES[p.c].color, .25) : ajustaColor(CONTINENTES[p.c].color, .58);
  }
  return col;
}
function selloContSVG(cont, f) {
  const c = cont.color, a = Math.max(.001, Math.min(.999, f)) * Math.PI * 2;
  const x = 30 + Math.sin(a) * 24, y = 30 - Math.cos(a) * 24;
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="#fff" stroke="${ajustaColor(c, -.3)}" stroke-width="2" stroke-dasharray="3 2.4"/>
    <circle cx="30" cy="30" r="24" fill="${ajustaColor(c, .62)}"/>
    ${f > 0 ? `<path d="M30 30 L30 6 A24 24 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="${c}"/>` : ''}
    <circle cx="30" cy="30" r="12" fill="#fff"/><text x="30" y="35" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="13" fill="${ajustaColor(c, -.45)}">${Math.round(f * 100)}%</text></svg>`;
}

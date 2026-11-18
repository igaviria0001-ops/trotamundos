// ===== lista de tarjetas que se ordenan arrastrando (vertical u horizontal) =====
// Se usa en Línea del tiempo. Cada tarjeta debe tener data-id; orden() devuelve los ids en su orden actual.
function hacerOrdenable(tablero, { eje = 'y', gap = 8, minAlto = 52, maxAlto = 86, alCambiar } = {}) {
  let cartas = [], orden = [], paso = 0, activo = true;
  const medir = () => {
    const n = cartas.length; if (!n) return;
    if (eje === 'y') {
      const alto = clamp(Math.floor((tablero.clientHeight - gap * (n - 1)) / n), minAlto, maxAlto);
      paso = alto + gap;
      cartas.forEach(c => { c.style.height = alto + 'px'; c.style.width = '100%'; });
    } else {
      const ancho = Math.floor((tablero.clientWidth - gap * (n - 1)) / n);
      paso = ancho + gap;
      cartas.forEach(c => { c.style.width = ancho + 'px'; c.style.height = '100%'; });
    }
  };
  const ubicar = (sin = null) => orden.forEach((id, k) => {
    const c = cartas.find(x => x.dataset.id === id);
    if (c && c !== sin) c.style.transform = eje === 'y' ? `translate(0, ${k * paso}px)` : `translate(${k * paso}px, 0)`;
  });
  const arrastrable = c => {
    let ini = null;
    c.addEventListener('pointerdown', e => {
      if (!activo) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      const k = orden.indexOf(c.dataset.id);
      ini = { x: e.clientX, y: e.clientY, base: k * paso };
      c.classList.add('alzada'); c.style.transition = 'none';
      Sonido.play('tap'); vibrar(8);
    });
    c.addEventListener('pointermove', e => {
      if (!ini) return;
      const d = eje === 'y' ? e.clientY - ini.y : e.clientX - ini.x;
      const pos = clamp(ini.base + d, -paso * .3, paso * (cartas.length - 1 + .3));
      c.style.transform = eje === 'y' ? `translate(0, ${pos}px) scale(1.04)` : `translate(${pos}px, 0) scale(1.04)`;
      const nk = clamp(Math.round(pos / paso), 0, cartas.length - 1), k = orden.indexOf(c.dataset.id);
      if (nk !== k) { orden.splice(k, 1); orden.splice(nk, 0, c.dataset.id); ubicar(c); Sonido.play('papel'); alCambiar && alCambiar(orden); }
    });
    const soltar = () => { if (!ini) return; ini = null; c.classList.remove('alzada'); c.style.transition = ''; ubicar(); vibrar(6); };
    c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
  };
  const ro = new ResizeObserver(() => { medir(); ubicar(); });
  ro.observe(tablero);
  return {
    poner(lista) {
      cartas = lista; orden = lista.map(c => c.dataset.id);
      tablero.innerHTML = ''; tablero.append(...cartas);
      cartas.forEach(arrastrable);
      requestAnimationFrame(() => { medir(); cartas.forEach(c => c.style.transition = 'none'); ubicar(); requestAnimationFrame(() => cartas.forEach(c => c.style.transition = '')); });
      activo = true;
    },
    orden: () => orden.slice(),
    ordenar(ids) { orden = ids.slice(); ubicar(); },
    activar(v) { activo = v; },
    centro(id) { const k = orden.indexOf(id); return k * paso + (paso - gap) / 2; },
    destruir() { ro.disconnect(); },
  };
}

// ===== lo que el jugador sabe: dominio y repaso espaciado =====
const Progreso = {
  d: null, st: null,
  INTERVALOS: [0, 8 * 60e3, 60 * 60e3, 20 * 3600e3, 3 * 86400e3, 8 * 86400e3], // según dominio 0..5
  load() {
    this.d = Store.get('prog', {});
    this.st = Object.assign({ km: 0, partidas: 0, rondas: 0, records: {} }, Store.get('stats', {}));
  },
  save() { Store.set('prog', this.d); Store.set('stats', this.st); },
  de(id) { if (!this.d) this.load(); return this.d[id] || { v: 0, ok: 0, dom: 0, ult: 0, prox: 0 }; },
  dominio(id) { return this.de(id).dom; },
  // calidad: 0 (mal) .. 1 (perfecto)
  registrar(id, calidad) {
    const r = Object.assign({}, this.de(id));
    const antes = r.dom;
    r.v++; r.ult = Date.now();
    if (calidad >= .8) { r.ok++; r.dom = Math.min(5, r.dom + 1); }
    else if (calidad >= .45) { r.ok += .5; r.dom = Math.max(r.dom, Math.min(2, r.dom + (r.dom < 2 ? 1 : 0))); }
    else r.dom = Math.max(0, r.dom - 1);
    r.prox = Date.now() + this.INTERVALOS[r.dom] * (calidad >= .45 ? 1 : .5);
    this.d[id] = r; this.save();
    return { antes, despues: r.dom };
  },
  // elige n lugares de la lista mezclando nuevos y repaso
  elegir(lista, n, rnd = Math.random) {
    const now = Date.now();
    const vistos = lista.filter(l => this.de(l.id).v > 0);
    const repaso = shuffle(vistos.filter(l => this.de(l.id).prox <= now), rnd).sort((a, b) => this.de(a.id).dom - this.de(b.id).dom);
    const nuevos = shuffle(lista.filter(l => this.de(l.id).v === 0), rnd);
    const nRep = Math.min(repaso.length, Math.max(nuevos.length ? Math.round(n * .3) : n, n - nuevos.length));
    let out = repaso.slice(0, nRep).concat(nuevos.slice(0, n - nRep));
    if (out.length < n) {
      const resto = shuffle(lista.filter(l => !out.includes(l)), rnd).sort((a, b) => this.de(a.id).dom - this.de(b.id).dom || this.de(a.id).ult - this.de(b.id).ult);
      out = out.concat(resto.slice(0, n - out.length));
    }
    return shuffle(out, rnd);
  },
  record(modo, valor) {
    const r = this.st.records[modo];
    const nuevo = r == null || valor > r;
    if (nuevo) { this.st.records[modo] = valor; this.save(); }
    return { nuevo, antes: r };
  },
  sumar(km, rondas) { this.st.km += km; this.st.rondas += rondas; this.st.partidas++; this.save(); },
  aprendidos() { if (!this.d) this.load(); return Object.values(this.d).filter(r => r.dom >= 3).length; },
};

// rangos de viajero por kilómetros recorridos en el juego
const RANGOS = [
  { n: 'Turista', km: 0 }, { n: 'Mochilero', km: 20000 }, { n: 'Viajero', km: 80000 },
  { n: 'Explorador', km: 200000 }, { n: 'Aventurero', km: 450000 }, { n: 'Trotamundos', km: 900000 }, { n: 'Leyenda', km: 1800000 },
];
function rango(km = Progreso.st.km) {
  let i = 0; while (i + 1 < RANGOS.length && km >= RANGOS[i + 1].km) i++;
  const sig = RANGOS[i + 1];
  return { i, n: RANGOS[i].n, sig, prog: sig ? (km - RANGOS[i].km) / (sig.km - RANGOS[i].km) : 1 };
}

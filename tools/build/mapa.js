// Genera data/mapa-lo.json (globo en movimiento) y data/mapa-hi.json (detalle) desde Natural Earth 1:50m
const ts = require('topojson-simplify');
const fs = require('fs');
const base = require('world-atlas/countries-50m.json');
const tc = require('topojson-client');

function simplified(q) {
  const t = JSON.parse(JSON.stringify(base));
  const p = ts.presimplify(t);
  const w = q >= 1 ? 0 : ts.quantile(p, q);
  const s = ts.simplify(p, w);
  const arcs = s.arcs.map(a => a.map(pt => [pt[0], pt[1]]));
  // cuantizar con codificacion delta
  const n = 1e5;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of arcs) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const kx = (x1 - x0) / (n - 1) || 1, ky = (y1 - y0) / (n - 1) || 1;
  const qa = arcs.map(a => {
    let px = 0, py = 0; const out = [];
    for (const [x, y] of a) {
      const qx = Math.round((x - x0) / kx), qy = Math.round((y - y0) / ky);
      if (out.length && qx === px && qy === py) continue;
      out.push([qx - px, qy - py]); px = qx; py = qy;
    }
    if (out.length === 1) out.push([0, 0]);
    return out;
  });
  return { type: 'Topology', transform: { scale: [kx, ky], translate: [x0, y0] }, objects: s.objects, arcs: qa };
}
const lo = simplified(0.22), hi = simplified(1);
for (const [name, t] of [['lo', lo], ['hi', hi]]) {
  const s = JSON.stringify(t);
  fs.writeFileSync(`data/mapa-${name}.json`, s);
  const f = tc.feature(t, t.objects.countries);
  console.log(name, 'bytes', s.length, 'pts', t.arcs.reduce((a, b) => a + b.length, 0), 'features', f.features.length);
}

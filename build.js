// Arma el juego en la raiz del repositorio (GitHub Pages: rama main, carpeta / (root)):
//   index.html (todo el codigo, estilos, letras y datos) + datos/ ; las fotos ya viven en fotos/
// Uso: node build.js
const fs = require('fs');
const path = require('path');
const R = (...p) => path.join(__dirname, ...p);
const read = p => fs.readFileSync(R(p), 'utf8');
const OUT = R('.');

function fonts() {
  const list = [
    ['Baloo 2', '@fontsource/baloo-2/files/baloo-2-latin-600-normal.woff2', 600],
    ['Baloo 2', '@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2', 700],
    ['Baloo 2', '@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2', 800],
    ['Nunito', '@fontsource/nunito/files/nunito-latin-400-normal.woff2', 400],
    ['Nunito', '@fontsource/nunito/files/nunito-latin-600-normal.woff2', 600],
    ['Nunito', '@fontsource/nunito/files/nunito-latin-700-normal.woff2', 700],
    ['Nunito', '@fontsource/nunito/files/nunito-latin-800-normal.woff2', 800],
    ['Caveat', '@fontsource/caveat/files/caveat-latin-600-normal.woff2', 600],
  ];
  return list.map(([fam, file, w]) => {
    const b64 = fs.readFileSync(R('node_modules', file)).toString('base64');
    return `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  }).join('\n');
}

function copyDir(src, dst, filter = () => true) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) n += copyDir(s, d, filter);
    else if (filter(e.name)) { fs.copyFileSync(s, d); n++; }
  }
  return n;
}

function flags() {
  // banderas SVG (flag-icons, MIT) en un solo archivo
  const dir = R('node_modules/flag-icons/flags/4x3');
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    const code = f.replace('.svg', '');
    if (code.length !== 2) continue;
    out[code] = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  }
  return out;
}

function build() {
  const data = require('./tools/build/datos.js').build();
  fs.mkdirSync(path.join(OUT, 'datos'), { recursive: true });
  const css = fs.readdirSync(R('src/css')).filter(f => f.endsWith('.css')).sort().map(f => read('src/css/' + f)).join('\n');
  const js = fs.readdirSync(R('src/js')).filter(f => f.endsWith('.js')).sort()
    .map(f => `/* ===== ${f} ===== */\n` + read('src/js/' + f)).join('\n');
  const version = new Date().toISOString().slice(0, 16).replace('T', ' ');
  let html = read('src/template.html')
    .replace('/*FONTS*/', () => fonts())
    .replace('/*CSS*/', () => css)
    .replace('/*VENDOR*/', () => read('vendor/d3geo.min.js'))
    .replace('/*DATA*/', () => 'window.TMD_DATA=' + JSON.stringify(data.embed) + ';window.TMD_VERSION=' + JSON.stringify(version) + ';')
    .replace('/*JS*/', () => js);
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  fs.writeFileSync(path.join(OUT, 'datos', 'mapa-hi.json'), read('data/mapa-hi.json'));
  fs.writeFileSync(path.join(OUT, 'datos', 'banderas.json'), JSON.stringify(flags()));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  const nf = fs.readdirSync(R('fotos')).filter(n => n.endsWith('.webp')).length;
  console.log('index.html', (html.length / 1024).toFixed(0) + ' KB', '| fotos', nf, '| lugares', data.embed.lugares.length);
}

build();

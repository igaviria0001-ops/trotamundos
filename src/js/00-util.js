'use strict';
// ===== utilidades =====
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// h('div.clase#id', {attr}, hijos...)
function h(tag, attrs, ...kids) {
  const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(tag);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? el.classList.add(t.slice(1)) : (el.id = t.slice(1)));
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = k => {
    if (k == null || k === false) return;
    if (Array.isArray(k)) k.forEach(add);
    else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  };
  kids.forEach(add);
  return el;
}
const svgEl = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };

// guardado local con prefijo propio
const Store = {
  p: 'tmd_',
  get(k, d) { try { const v = localStorage.getItem(this.p + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(this.p + k, JSON.stringify(v)); } catch (e) { /* sin espacio o bloqueado */ } },
  del(k) { try { localStorage.removeItem(this.p + k); } catch (e) { } },
  all() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(this.p)) o[k] = localStorage.getItem(k); } } catch (e) { } return o; },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = (a, rnd = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };

const fmt = {
  n: v => Math.round(v).toLocaleString('es-CO'),
  km: v => v < 10 ? `${v.toFixed(1).replace('.', ',')} km` : `${Math.round(v).toLocaleString('es-CO')} km`,
  m: v => `${(Math.round(v * 10) / 10).toLocaleString('es-CO')} m`,
};
// quita tildes para comparar textos escritos
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// animación con requestAnimationFrame que se puede esperar
function tween(ms, fn, easing = ease.inOut) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      fn(easing(t), t);
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
const vibrar = p => { try { if (Ajustes.get('vibrar') && navigator.vibrate) navigator.vibrate(p); } catch (e) { } };
const esTactil = () => matchMedia('(pointer: coarse)').matches;

// ajustes del jugador
const Ajustes = {
  def: { sonido: true, vibrar: true, letra: false, menosMov: false },
  v: null,
  load() { this.v = Object.assign({}, this.def, Store.get('ajustes', {})); this.apply(); },
  get(k) { if (!this.v) this.load(); return this.v[k]; },
  set(k, val) { this.v[k] = val; Store.set('ajustes', this.v); this.apply(); },
  apply() {
    document.body.classList.toggle('letra-grande', !!this.v.letra);
    document.body.classList.toggle('sin-mov', !!this.v.menosMov);
  },
};

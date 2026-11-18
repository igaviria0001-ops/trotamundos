// ===== sonidos suaves hechos con WebAudio (sin archivos) =====
const Sonido = {
  ctx: null, master: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = .55;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  ok() { if (!Ajustes.get('sonido')) return false; this.init(); if (!this.ctx) return false; if (this.ctx.state === 'suspended') this.ctx.resume(); return true; },
  tono(f, t0, dur, { tipo = 'triangle', vol = .25, f2 = null, ataque = .008 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + .05);
  },
  ruido(t0, dur, { vol = .2, desde = 800, hasta = 3000, q = 1, tipo = 'bandpass' } = {}) {
    const c = this.ctx, n = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = tipo; f.Q.value = q;
    f.frequency.setValueAtTime(desde, t0); f.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + dur * .3); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0); s.stop(t0 + dur);
  },
  play(nombre) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + .01;
    switch (nombre) {
      case 'tap': this.tono(720, t, .06, { tipo: 'sine', vol: .12 }); break;
      case 'pin': this.tono(420, t, .12, { tipo: 'sine', vol: .22, f2: 880 }); break;
      case 'papel': this.ruido(t, .28, { vol: .12, desde: 1800, hasta: 5200, q: .7 }); break;
      case 'avion': this.ruido(t, 1.5, { vol: .1, desde: 300, hasta: 1400, q: .8 }); this.tono(180, t, 1.4, { tipo: 'sine', vol: .03, f2: 260, ataque: .4 }); break;
      case 'sello':
        this.tono(130, t, .18, { tipo: 'sine', vol: .5, f2: 60 });
        this.ruido(t, .12, { vol: .18, desde: 600, hasta: 300, tipo: 'lowpass' }); break;
      case 'bien': [659, 988].forEach((f, i) => this.tono(f, t + i * .09, .45, { vol: .18 })); break;
      case 'genial': [523, 659, 784, 1047].forEach((f, i) => this.tono(f, t + i * .08, .6, { vol: .17 })); this.tono(2093, t + .34, .7, { tipo: 'sine', vol: .05 }); break;
      case 'medio': [587, 740].forEach((f, i) => this.tono(f, t + i * .1, .35, { vol: .15 })); break;
      case 'lejos': [440, 370].forEach((f, i) => this.tono(f, t + i * .13, .4, { tipo: 'sine', vol: .16 })); break;
      case 'raspa': this.ruido(t, .07, { vol: .06, desde: 2600, hasta: 4200, q: .9 }); break;
      case 'pop': this.tono(560, t, .08, { tipo: 'sine', vol: .14, f2: 1100 }); break;
      case 'cuenta': this.tono(1200 + Math.random() * 200, t, .04, { tipo: 'square', vol: .02 }); break;
      case 'fin': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tono(f, t + i * .11, .9, { vol: .16 })); break;
    }
  },
};

// ===== música de fondo: una cancioncita suave que se va armando sola (marimba, bajo y un colchón) =====
const Musica = {
  on: false, timer: null, sig: 0, paso: 0, gain: null, semilla: 7,
  BPM: 88,
  ACORDES: [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]],
  ESCALA: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66],
  iniciar() {
    if (!Ajustes.get('musica') || this.on) return;
    Sonido.init(); const c = Sonido.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    this.gain = c.createGain(); this.gain.gain.value = 0;
    this.gain.gain.linearRampToValueAtTime(.075, c.currentTime + 2.5);
    this.gain.connect(c.destination);
    this.on = true; this.sig = c.currentTime + .15; this.paso = 0; this.r = rng(this.semilla); this.nota = 2;
    this.timer = setInterval(() => this.programar(), 100);
  },
  parar() {
    if (!this.on) return;
    const c = Sonido.ctx, g = this.gain;
    this.on = false; clearInterval(this.timer);
    try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setValueAtTime(g.gain.value, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + .8); } catch (e) { }
    setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 1000);
  },
  programar() {
    const c = Sonido.ctx; if (!c || !this.on) return;
    const corchea = 60 / this.BPM / 2;
    while (this.sig < c.currentTime + .5) { this.tocar(this.paso, this.sig, corchea); this.sig += corchea; this.paso++; }
  },
  osc(f, t, dur, tipo, vol, ataque = .01) {
    const c = Sonido.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g); g.connect(this.gain); o.start(t); o.stop(t + dur + .05);
  },
  tocar(k, t, cor) {
    const compas = Math.floor(k / 8) % 4, paso = k % 8, ac = this.ACORDES[compas];
    // colchón suave al empezar cada compás
    if (paso === 0) ac.forEach(f => { this.osc(f, t, cor * 8.5, 'sine', .05, .5); this.osc(f * 2.003, t, cor * 6, 'sine', .012, .6); });
    // bajo en el pulso 1 y 3
    if (paso === 0 || paso === 4) this.osc(ac[0] / 2, t, cor * 3, 'triangle', .11, .02);
    // marimba: un paseo por la escala pentatónica que cae en notas del acorde
    const ritmo = [[1, 0, 1, 0, 1, 1, 0, 1], [1, 0, 0, 1, 0, 1, 0, 0], [1, 1, 0, 1, 0, 1, 1, 0], [0, 0, 1, 0, 1, 0, 1, 1]][(Math.floor(k / 32) + compas) % 4];
    if (ritmo[paso] && this.r() < .9) {
      this.nota = clamp(this.nota + Math.round((this.r() - .5) * 3), 0, this.ESCALA.length - 1);
      let f = this.ESCALA[this.nota];
      if (paso === 0) f = ac[Math.floor(this.r() * 3)] * 2;
      this.osc(f, t, .55, 'triangle', .07, .004);
      this.osc(f * 4, t, .12, 'sine', .012, .002);
    }
    // sonajero muy suave a contratiempo
    if (paso % 2 === 1) Sonido.ruido.call({ ctx: Sonido.ctx, master: this.gain }, t, .06, { vol: .025, desde: 6000, hasta: 9000, q: 1.2 });
  },
};
document.addEventListener('visibilitychange', () => {
  if (!Sonido.ctx) return;
  if (document.hidden) Sonido.ctx.suspend(); else Sonido.ctx.resume();
});

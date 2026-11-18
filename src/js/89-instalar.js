// ===== instalar como app =====
const Instalar = {
  aviso: null,
  ios: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  instalada() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
  preparar() {
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
    const b = document.body;
    b.classList.toggle('instalada', this.instalada());
    if (this.ios && !this.instalada()) b.classList.add('se-puede-instalar');
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.aviso = e; b.classList.add('se-puede-instalar'); });
    addEventListener('appinstalled', () => { this.aviso = null; b.classList.remove('se-puede-instalar'); UI.toast('¡Listo! Trotamundos ya está en tu pantalla de inicio'); });
  },
  async pedir() {
    Sonido.play('tap');
    if (this.instalada()) return UI.toast('Ya estás usando la app instalada');
    if (this.aviso) {
      this.aviso.prompt();
      const r = await this.aviso.userChoice.catch(() => null);
      if (r && r.outcome === 'accepted') { this.aviso = null; document.body.classList.remove('se-puede-instalar'); }
      return;
    }
    const comp = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style="vertical-align:-5px"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" fill="none" stroke="#3E7CC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2" fill="none" stroke="#3E7CC4" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const d = h('div', h('p', { html: this.ios
      ? `En el iPhone o iPad, ábrelo en <b>Safari</b> y toca ${comp} <b>Compartir</b>. Luego elige <b>Agregar a inicio</b>.`
      : 'Abre el menú del navegador (los tres puntos) y elige <b>Instalar app</b> o <b>Agregar a la pantalla de inicio</b>.' }));
    UI.dialogo({ titulo: 'Instalar Trotamundos', texto: '', botones: [{ texto: 'Entendido', valor: true }] });
    const dl = $('#capa .dialogo'); dl && dl.insertBefore(d, $('.botones', dl));
  },
};

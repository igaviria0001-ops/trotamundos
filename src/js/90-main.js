// ===== arranque =====
(function arrancar() {
  Ajustes.load();
  Progreso.load();
  Mapa.init();
  Banderas.cargar();
  // el primer toque despierta el audio (los navegadores lo exigen)
  const despertar = () => { Sonido.init(); document.removeEventListener('pointerdown', despertar); };
  document.addEventListener('pointerdown', despertar);
  const inicio = (location.hash || '').slice(1);
  UI.ir(inicio === 'modos' ? 'modos' : 'inicio');
  window.TMD = { UI, Progreso, LUGARES, PAISES, Mapa }; // para pruebas
})();

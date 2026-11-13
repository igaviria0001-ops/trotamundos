// ===== íconos e ilustraciones (SVG propios) =====
const I = {};
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
I.cerrar = ic('<path d="M6 6l12 12M18 6L6 18"/>');
I.atras = ic('<path d="M15 5l-7 7 7 7"/>');
I.ajustes = ic('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/><circle cx="12" cy="12" r="7"/>');
I.mas = ic('<path d="M12 5v14M5 12h14"/>');
I.menos = ic('<path d="M5 12h14"/>');
I.centrar = ic('<circle cx="12" cy="12" r="7.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>');
I.avion = ic('<path d="M10.5 3.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v6l7 4v2l-7-2v4.5l2.5 2V22L12 21l-4 1v-2l2.5-2v-4.5l-7 2v-2l7-4z" fill="currentColor" stroke="none"/>');
I.foto = ic('<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>');
I.ampliar = ic('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>');
I.sonido = ic('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>');
I.check = ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
I.bombillo = ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0012 3z"/>');
I.info = ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>');
I.casa = ic('<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>');
I.repetir = ic('<path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5"/>');
I.tiquete = ic('<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>');
I.estrella = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" stroke-width="1.4" stroke-linejoin="round"/></svg>';

// Quinde: el colibrí guía (con su bufanda de viajero)
I.quinde = `<svg viewBox="0 0 124 100" aria-hidden="true">
<defs>
 <linearGradient id="qc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FD1A5"/><stop offset="1" stop-color="#169383"/></linearGradient>
 <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6FAE"/><stop offset="1" stop-color="#9B5CF6"/></linearGradient>
 <linearGradient id="qa" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7FE0C2"/><stop offset="1" stop-color="#E8FFF7"/></linearGradient>
</defs>
<g class="cuerpo">
 <path class="ala ala-atras" d="M60 50 C44 40 34 22 34 6 C46 12 58 28 66 46 Z" fill="#2BA88E"/>
 <path d="M38 70 L14 82 L22 74 L10 74 L30 64 Z" fill="#127466"/>
 <ellipse cx="56" cy="60" rx="25" ry="14" transform="rotate(-28 56 60)" fill="url(#qc)"/>
 <ellipse cx="59" cy="66" rx="15" ry="7" transform="rotate(-28 59 66)" fill="#EFFFF8" opacity=".9"/>
 <circle cx="82" cy="38" r="14" fill="url(#qc)"/>
 <path d="M80 46 C84 52 93 50 95 44 C91 41 85 41 80 46 Z" fill="url(#qg)"/>
 <path d="M70 48 C78 54 88 53 94 47 L96 51 C88 59 76 59 68 52 Z" fill="#EF6F5E"/>
 <path d="M70 51 C62 56 56 58 48 58 C54 62 62 62 70 56 Z" fill="#EF6F5E"/>
 <path d="M56 58.5 l4 -1.4 M62 57 l3 -1.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
 <path d="M95 35 L121 30" stroke="#24333C" stroke-width="2.8" stroke-linecap="round"/>
 <circle cx="87" cy="34" r="5" fill="#fff"/><circle cx="88.3" cy="34.2" r="3.1" fill="#16222B"/><circle cx="89.4" cy="33" r="1.1" fill="#fff"/>
 <path class="ala ala-frente" d="M62 52 C50 38 46 20 50 4 C60 14 66 32 70 48 Z" fill="url(#qa)" stroke="#5BCFAF" stroke-width="1.2"/>
</g>
</svg>`;

// ilustraciones de cada modo (escenas pequeñas para los sellos)
const esc = (fondo, cuerpo) => `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="${fondo}"/>${cuerpo}</svg>`;
const T = '#24476B';
I.m = {
  postal: esc('#D7EEF8', `<circle cx="96" cy="16" r="9" fill="#FFE29A"/><g transform="rotate(-7 60 50)"><rect x="22" y="22" width="70" height="50" rx="3" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="27" y="27" width="40" height="40" fill="#9ED8EA"/><path d="M27 60l12-14 9 9 7-6 12 12v6H27z" fill="#5DBB88"/><path d="M72 32h14M72 38h14M72 44h10" stroke="#93A7BB" stroke-width="2"/><rect x="78" y="26" width="10" height="12" fill="#EF6F5E"/></g><path d="M92 46c0-6 5-10 10-10s10 4 10 10c0 7-10 18-10 18s-10-11-10-18z" fill="#EF6F5E" stroke="#fff" stroke-width="2"/><circle cx="102" cy="46" r="3.6" fill="#fff"/>`),
  raspa: esc('#FDEBD3', `<rect x="18" y="16" width="84" height="58" rx="6" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="24" y="22" width="72" height="46" rx="3" fill="#8FD0E6"/><path d="M24 58l18-18 14 12 12-10 28 22v4H24z" fill="#6CC096"/><path d="M24 22h72v46H24z" fill="#C9D3DD"/><path d="M30 64 C40 40 52 66 62 40 S82 58 92 30" stroke="#8FD0E6" stroke-width="10" stroke-linecap="round" fill="none"/><circle cx="96" cy="70" r="11" fill="#FFC94D" stroke="#F2AE1C" stroke-width="2.5"/><text x="96" y="74.5" font-size="11" text-anchor="middle" font-weight="800" fill="#7A5200">$</text>`),
  lupa: esc('#E3F1E6', `<rect x="14" y="16" width="70" height="52" rx="4" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="19" y="21" width="60" height="42" fill="#A9DCEB"/><path d="M19 56l16-16 12 10 10-8 22 18v3H19z" fill="#5DBB88"/><circle cx="74" cy="50" r="20" fill="rgba(255,255,255,.55)" stroke="${T}" stroke-width="5"/><path d="M88 64l16 16" stroke="${T}" stroke-width="8" stroke-linecap="round"/>`),
  pistas: esc('#FFF1CC', `<rect x="56" y="12" width="52" height="26" rx="8" fill="#fff" stroke="${T}" stroke-width="2"/><path d="M62 38l-6 8 12-8z" fill="#fff" stroke="${T}" stroke-width="2"/><path d="M64 22h36M64 29h24" stroke="#93A7BB" stroke-width="3" stroke-linecap="round"/><g transform="translate(6 30) scale(.62)">${'<path d="M30 52 L6 66 L12 56 L2 54 L16 48 Z" fill="#1B7F72"/><ellipse cx="44" cy="48" rx="22" ry="13" transform="rotate(-22 44 48)" fill="#2BB591"/><circle cx="66" cy="33" r="12" fill="#2BB591"/><path d="M58 40 q8 9 18 0 q-3 -6 -9 -6 q-6 0 -9 6z" fill="#E0559F"/><path d="M76 31 L106 27" stroke="#2B3A42" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="30" r="4" fill="#fff"/><circle cx="71" cy="30" r="2.4" fill="#1E2A33"/><ellipse cx="40" cy="26" rx="20" ry="9" transform="rotate(-38 46 38)" fill="#DFF8EF"/>'}</g><rect x="64" y="50" width="22" height="30" rx="3" fill="#fff" stroke="${T}" stroke-width="2" transform="rotate(8 75 65)"/><rect x="86" y="48" width="22" height="30" rx="3" fill="#3E7CC4" stroke="${T}" stroke-width="2" transform="rotate(-6 97 63)"/>`),
  parejas: esc('#E9E3F7', `<rect x="16" y="18" width="38" height="54" rx="6" fill="#3E7CC4" stroke="${T}" stroke-width="2" transform="rotate(-8 35 45)"/><circle cx="35" cy="45" r="9" fill="none" stroke="#fff" stroke-width="2.5" transform="rotate(-8 35 45)"/><g transform="rotate(7 82 45)"><rect x="62" y="18" width="40" height="54" rx="6" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="68" y="25" width="28" height="22" fill="#9ED8EA"/><path d="M68 44l8-8 6 5 5-4 9 7v3H68z" fill="#5DBB88"/><rect x="70" y="53" width="24" height="13" fill="#EF6F5E"/><rect x="70" y="57.3" width="24" height="4.3" fill="#fff"/></g>`),
  rompepostal: esc('#DDEEF8', `<rect x="16" y="14" width="88" height="62" rx="4" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="21" y="19" width="78" height="52" fill="#A3D8EA"/><path d="M21 62l20-22 16 13 14-12 28 22v8H21z" fill="#5DBB88"/><path d="M60 19v18a5 5 0 110 10v24M21 45h18a5 5 0 1010 0h50" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M72 46h22v12a5 5 0 110 8v5H72v-6a5 5 0 100-9z" fill="#FFC94D" stroke="${T}" stroke-width="2" transform="translate(6 -26) rotate(12 83 58)"/>`),
  colorea: esc('#E0F2F8', `<path d="M14 30l18-8 14 6 12-10 20 4 8 12-6 14 10 12-14 14-18-6-14 8-16-10-12 2-4-14 10-8z" fill="#fff" stroke="${T}" stroke-width="2"/><path d="M32 22l14 6 4 16-12 8-12-4-10 4 4-12z" fill="#F5C29E"/><path d="M58 18l20 4 8 12-6 14-16-2-10-12z" fill="#A6D7A3"/><path d="M64 48l16 2 10 12-14 14-18-6z" fill="#F3D98F"/><path d="M92 18l12 14-14 8z" fill="#3E7CC4"/><rect x="88" y="44" width="20" height="26" rx="4" fill="#EF6F5E" stroke="${T}" stroke-width="2" transform="rotate(25 98 57)"/>`),
  rompepaises: esc('#FDE6E1', `<path d="M16 26l22-6 10 10-4 14 8 10-10 14-18-2-10-14z" fill="#A6D7A3" stroke="${T}" stroke-width="2"/><path d="M48 30l20-8 18 8 4 16-14 8-14-2z" fill="#F5C29E" stroke="${T}" stroke-width="2" stroke-dasharray="4 4" opacity=".6"/><path d="M58 38l20-8 18 8 4 16-14 8-14-2z" fill="#F5C29E" stroke="${T}" stroke-width="2" transform="translate(4 14)"/><path d="M92 26c4-4 10-2 10 4" stroke="${T}" stroke-width="2.5" fill="none" marker-end=""/><path d="M100 26l2 5 4-3" stroke="${T}" stroke-width="2.5" fill="none"/>`),
  silueta: esc('#E8F4EC', `<path d="M34 18l16 4 6 12 14 4-2 14 10 10-12 14-14-6-10 8-10-10 4-12-10-8 4-16z" fill="${T}"/><circle cx="92" cy="30" r="16" fill="#fff" stroke="${T}" stroke-width="2"/><path d="M92 18l5 12h-10z" fill="#EF6F5E"/><path d="M92 42l-5-12h10z" fill="#93A7BB"/><rect x="70" y="58" width="44" height="18" rx="9" fill="#fff" stroke="${T}" stroke-width="2"/><text x="92" y="71" font-size="11" text-anchor="middle" font-weight="800" fill="${T}">820 km</text>`),
  brujula: esc('#FFF1CC', `<circle cx="60" cy="45" r="32" fill="#fff" stroke="${T}" stroke-width="3"/><circle cx="60" cy="45" r="25" fill="none" stroke="#C9D3DD" stroke-width="2" stroke-dasharray="2 4"/><path d="M60 16l7 29h-14z" fill="#EF6F5E" transform="rotate(35 60 45)"/><path d="M60 74l7-29h-14z" fill="#93A7BB" transform="rotate(35 60 45)"/><circle cx="60" cy="45" r="4.5" fill="${T}"/><text x="60" y="12" font-size="10" text-anchor="middle" font-weight="800" fill="${T}">N</text>`),
  nortesur: esc('#DCEAF8', `<path d="M24 12v66" stroke="${T}" stroke-width="3"/><path d="M24 8l-6 9h12z" fill="${T}"/><text x="24" y="88" font-size="9" text-anchor="middle" font-weight="800" fill="${T}">S</text><rect x="36" y="14" width="66" height="16" rx="5" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="36" y="37" width="66" height="16" rx="5" fill="#FFC94D" stroke="${T}" stroke-width="2" transform="rotate(-3 69 45)"/><rect x="36" y="60" width="66" height="16" rx="5" fill="#fff" stroke="${T}" stroke-width="2"/><path d="M42 22h30M42 68h24" stroke="#93A7BB" stroke-width="3" stroke-linecap="round"/>`),
  pintabandera: esc('#F7E7F0', `<path d="M20 12v68" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/><rect x="22" y="16" width="62" height="42" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="22" y="16" width="62" height="14" fill="#FFC94D"/><rect x="22" y="30" width="34" height="14" fill="#3E7CC4"/><path d="M80 66l22-30 6 4-20 32z" fill="#8C6239"/><path d="M76 70c-4 6-8 6-10 10 6 1 14-2 14-8z" fill="#EF6F5E"/>`),
  banderasviento: esc('#D7EEF8', `<path d="M24 14v66M60 22v58M96 14v66" stroke="${T}" stroke-width="3" stroke-linecap="round"/><path d="M26 16c10-4 16 4 28 0v20c-12 4-18-4-28 0z" fill="#EF6F5E"/><path d="M26 22.6c10-4 16 4 28 0v6.6c-12 4-18-4-28 0z" fill="#fff"/><path d="M62 24c10-4 16 4 28 0v20c-12 4-18-4-28 0z" fill="#5DBB88"/><circle cx="76" cy="34" r="4.5" fill="#fff"/><path d="M98 16c8-3 12 3 20 0v20c-8 3-12-3-20 0z" fill="#3E7CC4"/><path d="M98 26c8-3 12 3 20 0" stroke="#FFC94D" stroke-width="4"/>`),
  capitales: esc('#E3F1E6', `<rect x="10" y="16" width="40" height="20" rx="7" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="10" y="54" width="40" height="20" rx="7" fill="#fff" stroke="${T}" stroke-width="2"/><rect x="72" y="16" width="38" height="20" rx="7" fill="#FFC94D" stroke="${T}" stroke-width="2"/><rect x="72" y="54" width="38" height="20" rx="7" fill="#FFC94D" stroke="${T}" stroke-width="2"/><path d="M50 26 C64 28 58 62 72 64" stroke="#EF6F5E" stroke-width="3" fill="none"/><circle cx="50" cy="26" r="4" fill="#EF6F5E"/><circle cx="72" cy="64" r="4" fill="#EF6F5E"/>`),
  lineatiempo: esc('#FFF1CC', `<path d="M8 62h104" stroke="${T}" stroke-width="3" stroke-linecap="round"/><path d="M22 56v12M52 56v12M82 56v12" stroke="${T}" stroke-width="3"/><path d="M14 46l8-22 8 22z" fill="#F3D98F" stroke="${T}" stroke-width="2"/><rect x="44" y="26" width="16" height="20" fill="#F5C29E" stroke="${T}" stroke-width="2"/><path d="M44 26l8-8 8 8" fill="#EF6F5E" stroke="${T}" stroke-width="2"/><path d="M80 46V16l4 0v30zM76 46h12" fill="#93A7BB" stroke="${T}" stroke-width="2"/><rect x="92" y="20" width="22" height="28" rx="3" fill="#fff" stroke="${T}" stroke-width="2" stroke-dasharray="3 3"/>`),
  masalto: esc('#E0F2F8', `<path d="M8 78h104" stroke="${T}" stroke-width="3"/><path d="M22 78V40l6-14 6 14v38z" fill="#93A7BB" stroke="${T}" stroke-width="2"/><path d="M46 78V20l4-10 4 10v58z" fill="#3E7CC4" stroke="${T}" stroke-width="2"/><path d="M66 78l12-34 12 34z" fill="#F3D98F" stroke="${T}" stroke-width="2"/><path d="M96 78V56h12v22z" fill="#F5C29E" stroke="${T}" stroke-width="2"/><circle cx="102" cy="74" r="2" fill="${T}"/>`),
  expedicion: esc('#E8F4EC', `<path d="M12 70 C30 40 50 76 66 50 S92 30 104 18" stroke="${T}" stroke-width="3" stroke-dasharray="4 5" fill="none"/><circle cx="12" cy="70" r="6" fill="#5DBB88" stroke="#fff" stroke-width="2"/><circle cx="46" cy="58" r="6" fill="#5DBB88" stroke="#fff" stroke-width="2"/><circle cx="76" cy="40" r="6" fill="#FFC94D" stroke="#fff" stroke-width="2"/><path d="M104 18v-12" stroke="${T}" stroke-width="2.5"/><path d="M104 6l12 4-12 4z" fill="#EF6F5E"/>`),
  maleta: esc('#FDEBD3', `<rect x="26" y="28" width="68" height="48" rx="8" fill="#C9844B" stroke="${T}" stroke-width="2.5"/><path d="M48 28v-8a4 4 0 014-4h16a4 4 0 014 4v8" stroke="${T}" stroke-width="3" fill="none"/><path d="M26 44h68" stroke="${T}" stroke-width="2"/><circle cx="40" cy="60" r="7" fill="#3E7CC4"/><rect x="66" y="54" width="18" height="12" rx="2" fill="#FFC94D" transform="rotate(-10 75 60)"/><text x="102" y="30" font-size="28" font-weight="800" fill="#EF6F5E">?</text>`),
  reto: esc('#E9E3F7', `<rect x="22" y="18" width="76" height="60" rx="8" fill="#fff" stroke="${T}" stroke-width="2.5"/><rect x="22" y="18" width="76" height="16" rx="8" fill="#EF6F5E"/><rect x="22" y="28" width="76" height="6" fill="#EF6F5E"/><path d="M38 12v12M82 12v12" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/><path d="M60 40l5 10 11 1.5-8 7.5 2 11-10-5.5-10 5.5 2-11-8-7.5 11-1.5z" fill="#FFC94D" stroke="#F2AE1C" stroke-width="1.5"/>`),
  explorar: esc('#D7EEF8', `<circle cx="56" cy="46" r="32" fill="#7FC7E0" stroke="${T}" stroke-width="2"/><path d="M36 30c8-6 18-4 20 4s-8 10-6 18-10 8-14 0-8-16 0-22zM64 22c10 0 18 8 20 18-6 0-10-6-14-4s-8-8-6-14zM62 56c8-2 14 4 12 12-6 4-12 2-14-4z" fill="#A6D7A3"/><path d="M92 50c0-5 4-9 9-9s9 4 9 9c0 6-9 16-9 16s-9-10-9-16z" fill="#EF6F5E" stroke="#fff" stroke-width="2"/><circle cx="101" cy="50" r="3" fill="#fff"/>`),
};

// íconos pequeños de las fichas
I.d = {
  cal: ic('<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
  alto: ic('<path d="M7 3v18M4.5 5.5L7 3l2.5 2.5M4.5 18.5L7 21l2.5-2.5M13 6h6M13 10h4M13 14h6M13 18h4"/>'),
  monte: ic('<path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z"/><path d="M8 10.5l1.5 1.5 1.5-1.5"/>'),
  dato: ic('<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z"/>'),
};

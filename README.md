# Trotamundos

Juego para aprender los lugares reconocidos del mundo jugando: 470 lugares con fotos reales, los 194 países con su forma, su bandera y su capital. Está hecho primero para celular (vertical) y también funciona en computador.

**Jugar:** https://igaviria0001-ops.github.io/trotamundos/

## Modos (20)
- **Lugares:** Postal misteriosa (clavar el pin), Raspa y descubre, Lupa viajera, Pistas de Quinde, Parejas del mundo, Rompecabezas postal.
- **Mapa:** Colorea el mapa, Rompecabezas de países, Silueta y rumbo, Brújula, De norte a sur.
- **Banderas y capitales:** Pinta la bandera, Banderas al viento, Capitales: conecta.
- **Tiempo y escala:** Línea del tiempo, ¿Más alto o más bajo?
- **Aventuras:** Explorar (globo libre con buscador), Reto del día (6 paradas, con racha), La gran expedición (9 capítulos de lo más famoso a lo menos conocido), La maleta perdida.

También hay viaje rápido, viaje a la medida (tú escoges las paradas), álbum de sellos, pasaporte con mapa que se colorea, 25 logros y música suave.

## Cómo aprende
Cada lugar, país, bandera y capital tiene un dominio de 0 a 5. Lo nuevo y lo que toca repasar se mezclan solos (repaso espaciado), y siempre que fallas ves la respuesta con su ficha.

## Carpetas
- `index.html`, `datos/`, `fotos/` — el juego publicado (GitHub Pages: rama `main`, carpeta raíz).
- `src/` — código (`js/`, `css/`, `template.html`). Se arma con `node build.js`.
- `data/` — fichas escritas a mano, mapas y ajustes de países.
- `tools/fotos/` — lista de lugares y scripts que bajan datos y fotos (corren en GitHub Actions).
- `tools/test/` — pruebas con capturas de pantalla.

## Créditos
Fotos de [Wikimedia Commons](https://commons.wikimedia.org) con licencias libres (autor y licencia de cada una en `fotos/creditos.json` y dentro del juego). Mapa: Natural Earth. Países: world-countries y Wikidata. Banderas: flag-icons (MIT). Letras: Baloo 2, Nunito y Caveat (SIL OFL).

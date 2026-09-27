# CLEANER

Herramienta web que hace una **limpieza forense** de imágenes, en lote y 100 % en el navegador. Quita los metadatos (EXIF, GPS, XMP, IPTC, C2PA, comentarios, textos y prompts de PNG). Después reconstruye cada imagen como si la hubiera tomado una cámara real, con la misma resolución.

- Inspiración: https://twotensors.ai/app?page=inference
- Verificación: https://imagedetector.com/es/

## Funciones completadas
- **Carga múltiple**: arrastrar y soltar, selector de archivos o pegar con Ctrl+V. Acepta JPG, PNG y WebP; AVIF, GIF y BMP se recodifican.
- **Escaneo previo**: bloques de metadatos, campos EXIF, GPS, marcas de IA (C2PA, IPTC `trainedAlgorithmicMedia`, OpenAI, Midjourney, Firefly, Gemini, SD, ComfyUI…), datos después del final de la imagen y nombres de archivo delatores.
- **Modo único: Forense** (intensidad Suave / Media / Fuerte; Fuerte por defecto):
  1. Borrado sin pérdida de los metadatos del archivo original.
  2. Ciclo de remuestreo.
  3. Efectos de lente: micro-rotación, desplazamiento sub-píxel, distorsión, aberración cromática y viñeteo.
  4. Mosaico Bayer RGGB con ruido de disparo y de lectura.
  5. Demosaico bilineal.
  6. Nitidez, balance de blancos y dithering.
  7. Recompresión nueva.
- Formato de salida: original, JPG, PNG o WebP. Calidad ajustable entre 80 y 100. Renombrado estilo cámara `IMG_…`.
- **Experiencia de proceso** (modal por imagen), con una ilustración SVG animada por paso:
  1. Quitando metadatos C2PA: Claude se pone un disfraz.
  2. Eliminando EXIF, XMP, IPTC :) — Claude le da un katanazo a cada formato **por separado**. Cada etiqueta tiene carita (se asusta y queda KO), hay un contador "cortes n/3" y al final Claude pide perdón con ternura. Son 35 frames.
  3. Reconstruyendo imagen a partir de modelos matemáticos: gráfica en movimiento.
  4. Calculando lente de exposición f/1.xx: cámara con flash. La apertura se inventa con `inventAperture()`.
  5. Haciendo simulación de fórmula de Bayer: pizarrón con fórmulas que se escriben solas.
  6. Remodelando el sensor y apertura de API 23: Claude vestido de hombre de negro.
  7. Empaquetando todo: Claude mete todo en una caja.
  8. ¡Listo!: Claude avisa, con confeti.
- Cubo de agua y jabón animado mientras se procesa. Barra general y barra por imagen dentro de la cola.
- Cada paso dura un mínimo de ~2,3 s; son unos 18 s por imagen.
- Re-escaneo del resultado, comparador antes/después, descarga individual o en ZIP.

## Novedades de UX (v3)
- **Título CLEANER en SVG**: letras hechas a mano que tiemblan a 7 fps. Una esponja barre la mugre grunge y la deja brillando, en un loop de 6 s.
- **Cejilla "La gran pelea"**: 84 frames (12 s) de mini-Claudes contra Chrome.
  - Jalan la cuerda y se les rompe.
  - Llega el katanazo samurái y Chrome grita "¡Aw, Snap!".
  - Chrome escupe pestañas y un Claude cansado las barre ("¡47 pestañas!").
  - Le cae un cubetazo de agua con jabón.
  - Termina en una nube de pelea con ¡PUM! ¡PAF!
  - Durante toda la animación, un medidor de RAM llega al 99 % y el dinosaurio de Chrome cruza perseguido por un Claude con red.
- **CTA "Empezar a limpiar"** (v2, 4 s): Claude, con cara de hartazgo, talla al robot hasta que queda rechinando (^^ y brillos). Se seca el sudor ("ufff…"), ¡splat!, le cae lodo al robot y Claude, furioso, dice "¿otra vez?" y vuelve a empezar.
- **Logo del Modo Forense**: Claude detective con sombrero, pipa humeante y lupa con ojo que mira a todos lados.
- **Intensidad**: cada opción tiene su icono animado: esponja (Suave), escoba (Media) y lanzallamas-hidrolavadora (Fuerte). Al seleccionarla se colorea (azul, amarillo o naranja), rebota y su pista cambia de texto y color.
- **Botones** con iconos SVG SMIL propios: escoba, bote de basura que abre la tapa, caja ZIP, descarga, comparar y burbujas de jabón.
- **Tarjetas de enlaces** con escenas propias (Claude con foco de idea; Claude con lupa "IA: ??? → 0 %") y una flecha dibujada.
- **Bordes vivos** (`js/wobble.js`): cada `.wobbly` recibe un SVG con un trazo irregular generado a su medida exacta (con ResizeObserver) y 4 variantes que se alternan con SMIL a 7 fps. La sombra "cartoon" (`--wb-off`) también tiembla. Ya no se cortan como pasaba con los filtros CSS. Variables: `--wb-w`, `--wb-off`, `--wb-dash`.
- **Cejilla en móvil**: versión con "cámara" que sigue la acción (anima el `viewBox`), así los personajes se ven grandes.
- **Nav** flotante tipo etiqueta, con wordmark CLEANER en SVG, iconos animados y botón "Limpiar". **Footer** oscuro con onda animada, Claude dormido en su escoba, columnas de enlaces y badges.

## Estilo
- Tipografías: **Geist** (texto principal) y **Caveat** (manuscrita).
- Estética de papel y tinta con acentos naranja (Claude), azul jabón y amarillo.
- Animaciones **SVG SMIL a 7 fps** (`calcMode="discrete"`) con efecto "boil" de dibujo a mano, que cambia la semilla de `feTurbulence` 7 veces por segundo.

## Rutas
- `index.html` — la app completa.
- `index.html?preview=<paso>` — vista previa de una escena del proceso. Pasos: `c2pa`, `exif`, `rebuild`, `lens`, `bayer`, `sensor`, `pack`, `done`.

## Estructura
- `css/style.css`
- `js/doodles.js` — base: helpers, filtros, Claude, piezas y escenas del proceso (`Doodles.mount()`, `Doodles.scenes`).
- `js/doodles-ui.js` — título, CTA, forense, intensidad, iconos de botones (`Doodles.icon(name)`) y enlaces.
- `js/doodles-brawl.js` — cejilla "mini-Claudes vs. Chrome" (`brawl` y `brawlMobile`).
- `js/wobble.js` — bordes vivos.
- `js/cleaner-engine.js` — motor (`scan`, `strip`, `clean` con `onStage`).
- `js/app.js` — interfaz, cola, ritmo de los pasos, comparador y ZIP.

## Datos
No usa servidor ni base de datos. Todo se procesa en memoria dentro del navegador.

## Limitaciones y siguientes pasos
- No se garantiza pasar el 100 % de los detectores. Las marcas invisibles en los píxeles (como SynthID) pueden resistir en parte.
- Idea: mover el cálculo a un Web Worker con OffscreenCanvas para lotes grandes.
- Idea: botón de "saltar animación" para usuarios con prisa.

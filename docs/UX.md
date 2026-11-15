# UX — Earth Trend Detective (Web)

**Versión:** 2.0
**Fecha:** 2026-11-14
**Evento:** NASA Space Apps Challenge 2026 · Reto "Be An Earth System Trend Detective!"
**Tema visual:** Espacial oscuro con paleta magenta–púrpura y acento por variable solo en textos y elementos
**Estilo:** Minimalista
**Base de diseño:** Tailwind CSS + shadcn/ui
**Framework UI:** React 19 + TypeScript + Vite

> Este documento es la fuente única de verdad del diseño visual del proyecto. Cualquier pantalla, componente o decisión de color, tipografía o espaciado debe respetar estos lineamientos.

**Cambios respecto a la v1.0**

- Paleta base nueva: los 5 colores magenta–púrpura elegidos por el equipo.
- Al cambiar de variable **solo cambian textos y elementos**; los fondos nunca cambian.
- Pantalla principal con **carrusel transparente** de variables: una al centro y las vecinas atenuadas a los lados.
- Explorador de 3 columnas basado en el diseño aprobado, depurado a estilo minimalista.
- **Se quitan los niveles de dificultad** de todas las interfaces.
- Imágenes de variable en formato cuadrado (1:1) con fondo transparente.


> **Cambios v2.1 (decididos por el equipo, prevalecen sobre lo anterior si hay conflicto)**
> - Navegación: barra lateral izquierda contraíble (Inicio, 6 variables, Reto detective, Mi lugar, Más información). Barra superior solo con nombre, Explorer/Scientific, idioma y Compartir.
> - Pantalla a todo el ancho, sin márgenes laterales máximos.
> - Mapa por **estados** (polígonos de Natural Earth admin-1) en lugar de rejilla; hover resalta el borde en cian y muestra nombre, dato y insignia.
> - Escala del mapa: **Bajo = verde azulado / azul / morado, Alto = café / rojo / naranja** (BrBG_r, RdBu_r, PuOr_r).
> - Filtros (región, detalle, periodo) debajo del mapa; la pista de detective es un botón que se despliega.
> - Gráfica interactiva: puntos, crosshair, tooltip con año, valor y % vs. promedio; selección por arrastre para recalcular el periodo; interruptor Anomalías / Valores absolutos.
> - Carrusel de Inicio con tarjeta activa ancha (2:1, dos columnas, borde y degradado en el acento, botón relleno en el acento con texto oscuro) y vecinas colapsadas. Esto sustituye la regla "el acento nunca es fondo" **solo** en esta tarjeta y en su botón.
> - Acentos más saturados: #38BDF8, #F59E0B, #10B981, #22D3EE, #F472B6, #A78BFA.
> - Explorador v2.2: el mapa ocupa toda la altura de la pantalla; las columnas de descripción y de gráficas son paneles laterales que se ocultan con un botón en las esquinas del encabezado del mapa (el mapa se ensancha). El mapa queda fijo en México con algo de frontera: solo permite alejar, nunca acercar más.
> - "Método" ahora se llama "Más información".

---

## TABLA DE CONTENIDOS

1. [Principios de diseño](#1-principios-de-diseño)
2. [Paleta base](#2-paleta-base)
3. [Acento por variable](#3-acento-por-variable)
4. [Imágenes](#4-imágenes)
5. [Paletas científicas del mapa](#5-paletas-científicas-del-mapa)
6. [Tipografía](#6-tipografía)
7. [Espaciado y layout](#7-espaciado-y-layout)
8. [Pantalla principal y carrusel](#8-pantalla-principal-y-carrusel)
9. [Explorador de variable](#9-explorador-de-variable)
10. [Componentes](#10-componentes)
11. [Iconografía](#11-iconografía)
12. [Bordes, formas y elevación](#12-bordes-formas-y-elevación)
13. [Movimiento](#13-movimiento)
14. [Estados de UI](#14-estados-de-ui)
15. [Otras pantallas](#15-otras-pantallas)
16. [Accesibilidad](#16-accesibilidad)
17. [Textos e idioma](#17-textos-e-idioma)
18. [Tokens (CSS + Tailwind)](#18-tokens-css--tailwind)

---

## 1. PRINCIPIOS DE DISEÑO

1. **Minimalista.** Cada elemento responde una de las preguntas del reto o ayuda a llegar a la respuesta. Sin decoración: sin cruces en las esquinas, sin brillos, sin degradados, sin sombras negras.
2. **Fondos fijos, acentos variables.** El fondo y las superficies siempre usan la paleta base. La variable elegida solo tiñe textos clave y elementos (íconos, bordes de botones, pestaña activa, línea de la gráfica, controles).
3. **El color identifica, no juzga.** El acento dice *qué variable* estás viendo, nunca si un cambio es bueno o malo. La dirección de la tendencia se dice con flecha + palabra + paleta del mapa.
4. **Consistencia.** Inicio, explorador y demás pantallas comparten tipografía, radios, espaciado y la misma forma de mostrar números (siempre con unidades, periodo y fuente).
5. **Sin niveles de dificultad en la interfaz.** La dificultad de integración es un dato interno del equipo, no del usuario.

---

## 2. PALETA BASE

### 2.1 Paleta del equipo

| # | Nombre        | Hex        | Rol en la interfaz                                                       |
|---|---------------|------------|--------------------------------------------------------------------------|
| 1 | Crimson       | `#8C114A`  | Segmento activo de controles globales (modo Explorer/Scientific), línea indicadora bajo la barra superior en Inicio |
| 2 | Wine          | `#731251`  | Estado *hover* y *pressed* de botones rellenos                           |
| 3 | Magenta       | `#8E1D6F`  | Botón principal relleno ("Choose a variable")                            |
| 4 | Purple        | `#612073`  | Divisores y bordes de paneles; opción seleccionada en controles segmentados (Annual / Monthly) |
| 5 | Deep Purple   | `#2F1740`  | Superficie elevada: tarjetas internas, menús, inspector de punto, botones de flecha del carrusel |

Contraste de texto `#FFFFFF` sobre cada color: 9.2:1, 10.9:1, 8.2:1, 10.7:1 y 15.9:1 (todos AAA).

**Regla:** los 5 colores de la paleta se usan **como fondo o como borde**, nunca como color de texto sobre el fondo oscuro (ahí su contraste es de 1.2:1 a 2.3:1).

### 2.2 Neutros derivados

Se derivan de la paleta para completar el sistema.

| Rol                 | Hex        | Uso                                                      | Contraste            |
|---------------------|------------|----------------------------------------------------------|----------------------|
| `Background`        | `#140A1E`  | Fondo general (espacio profundo)                         | —                    |
| `Surface`           | `#1E1029`  | Paneles del explorador                                   | —                    |
| `SurfaceRaised`     | `#2F1740`  | Igual a Deep Purple (paleta #5)                          | —                    |
| `OnSurface`         | `#F4ECF7`  | Texto principal                                          | 16.7:1 sobre Background |
| `OnSurfaceVariant`  | `#C4B2CF`  | Texto secundario, unidades, metadatos                    | 9.1:1 sobre Surface  |
| `InputBorder`       | `#8F6BA3`  | Borde de inputs, selects y sliders en reposo             | 4.1:1 sobre Surface  |
| `NoData`            | `#4A3D58`  | Celdas sin datos en el mapa (con patrón diagonal)        | —                    |
| `Error`             | `#FF8A80`  | Mensajes de error                                        | 7.9:1 sobre Surface  |

### 2.3 Regla 60-30-10

- **60%** `Background` y `Surface`.
- **30%** texto (`OnSurface`, `OnSurfaceVariant`) y superficies elevadas (`#2F1740`).
- **10%** acento de la variable + botones de la paleta (`#8E1D6F`, `#8C114A`).

### 2.4 Campo de estrellas

Imagen estática muy sutil en el fondo de Inicio (puntos blancos al 30–50%). En el explorador no hay estrellas: el fondo es liso para no competir con el mapa.

---

## 3. ACENTO POR VARIABLE

### 3.1 Colores

Tonos claros, distintos entre sí, para que se lean sobre el fondo oscuro.

| Variable              | ID (código)       | Acento     | Contraste sobre Surface |
|-----------------------|-------------------|------------|-------------------------|
| Precipitación         | `precipitation`   | `#6FB6FF`  | 8.5:1                   |
| Radiación solar       | `solar_radiation` | `#FFC266`  | 11.3:1                  |
| Humedad del suelo     | `soil_moisture`   | `#6EDBA6`  | 10.6:1                  |
| Escurrimiento         | `surface_runoff`  | `#5FE0E8`  | 11.5:1                  |
| Dióxido de nitrógeno  | `no2`             | `#FF8CC6`  | 8.5:1                   |
| Ozono total           | `ozone`           | `#B9A6FF`  | 8.6:1                   |
| Inicio (sin variable) | `home`            | `#F2A6DE`  | 9.7:1                   |

### 3.2 Qué cambia y qué no

| Cambia con la variable (texto y elementos)            | No cambia nunca (fondos y semántica)             |
|-------------------------------------------------------|--------------------------------------------------|
| Título de la variable y su ícono                      | `Background`, `Surface`, `SurfaceRaised`         |
| Etiquetas de sección pequeñas ("SENSOR", "WHAT IT MEASURES") | Botones rellenos de la paleta              |
| Texto, punto y subrayado de la pestaña activa         | Segmento activo de controles globales            |
| Borde y texto de botones contorneados ("Investigate") | Paleta científica del mapa                       |
| Pista y manija de sliders, foco de teclado            | Insignias de significancia                       |
| Línea de la serie de tiempo y marcador del punto en el mapa | Mensajes de error                          |
| Valor grande de "Rate of change"                      | Texto de párrafos                                |
| Punto activo del indicador del carrusel               |                                                  |

### 3.3 Cómo cambia

1. El usuario elige una variable (carrusel o pestañas) → Zustand guarda `selectedVariable`.
2. Un efecto escribe `data-variable="<id>"` en `<html>`.
3. El CSS redefine solo `--accent` (sección 18).
4. Transición de 300 ms en `color`, `border-color`, `fill` y `stroke`. Nunca en `background-color`.

---

## 4. IMÁGENES

### 4.1 Imagen de Inicio

Imagen de la Tierra desde el espacio a la derecha del título. 16:9, 1600 × 900 px, WebP ≤ 250 KB. Si es generada con IA lleva la etiqueta visible "AI-generated" en la esquina inferior derecha.

### 4.2 Imágenes de variable (1:1, fondo transparente)

Un juego por variable con 5 estados. El estado `idle` se usa en el carrusel; los demás en el explorador según el resultado.

| Estado          | ID             | Cuándo se muestra                                                   |
|-----------------|----------------|---------------------------------------------------------------------|
| En espera       | `idle`         | Carrusel de Inicio; explorador mientras calcula                     |
| Al alza         | `rising`       | Tendencia regional significativa y pendiente > 0                    |
| A la baja       | `falling`      | Tendencia regional significativa y pendiente < 0                    |
| Sin tendencia   | `no_trend`     | p ≥ 0.05                                                            |
| Datos insuficientes | `insufficient` | Menos de 10 años o más de 30% de datos faltantes              |

Total: 6 variables × 5 estados = **30 imágenes** + 1 de Inicio. Mínimo para la demo: `idle`, `rising`, `falling` y `no_trend` de cada variable (24); los faltantes usan `idle`.

```
public/images/
├── home/earth.webp
└── variables/
    ├── precipitation/   idle.webp  rising.webp  falling.webp  no_trend.webp  insufficient.webp
    ├── solar_radiation/ …
    ├── soil_moisture/   …
    ├── surface_runoff/  …
    ├── no2/             …
    └── ozone/           …
```

| Propiedad      | Valor                                                                 |
|----------------|-----------------------------------------------------------------------|
| Proporción     | 1:1                                                                   |
| Tamaño         | 1024 × 1024 px                                                        |
| Formato        | WebP con canal alfa (fondo transparente), calidad 80                  |
| Peso máximo    | 150 KB                                                                |
| Estilo         | Ilustración luminosa sobre transparencia, en el tono del acento de la variable, sin texto |
| Márgenes       | 10% libre en cada borde para que no se corte en el carrusel           |

Reglas: sin texto dentro de la imagen, sin logotipos de agencias, marca "AI-generated" si se hizo con IA, y `alt` descriptivo en `i18n`. La imagen sugiere el resultado, pero el texto siempre lo dice.

---

## 5. PALETAS CIENTÍFICAS DEL MAPA

Divergentes, centradas en cero, simétricas y aptas para daltonismo. Sobre el fondo oscuro, el punto medio es un neutro `#2A1F38` para que las celdas sin cambio no parezcan huecos.

| Variable                                    | Paleta          | Baja      | Sube           |
|---------------------------------------------|-----------------|-----------|----------------|
| Precipitación, humedad del suelo, escurrimiento | BrBG        | Café      | Verde azulado  |
| Radiación solar                             | PuOr invertida  | Morado    | Naranja        |
| Dióxido de nitrógeno, ozono total           | RdBu invertida  | Azul      | Rojo           |

- Celdas significativas: color completo. No significativas: 25% de opacidad. Sin datos: `NoData` con patrón.
- Leyenda con unidades por década y periodo: "mm/month per decade · 2001–2025".
- El mapa muestra **celdas de una rejilla**, no estaciones: los datos son satelitales y de modelos.
- Mapa base oscuro, fronteras en `#612073`.

---

## 6. TIPOGRAFÍA

| Token              | Tamaño | Peso | Fuente          | Uso                                              |
|--------------------|--------|------|-----------------|--------------------------------------------------|
| `display`          | 56 px  | 600  | Space Grotesk   | Título de Inicio ("Find what's changing…")       |
| `variable-title`   | 48 px  | 600  | Space Grotesk   | Nombre de la variable en el carrusel             |
| `title`            | 24 px  | 600  | Space Grotesk   | Nombre de la variable en el explorador           |
| `section`          | 12 px  | 600  | Inter, mayúsculas, espaciado 0.08em | Etiquetas de sección ("TIME SERIES & TREND") |
| `body`             | 16 px  | 400  | Inter           | Texto general, definiciones                      |
| `small`            | 14 px  | 400  | Inter           | Metadatos, controles                             |
| `caption`          | 12 px  | 500  | Inter           | Ejes, leyendas, fuentes                          |
| `metric`           | 28 px  | 600  | JetBrains Mono  | Valor de "Rate of change"                        |
| `metric-sm`        | 14 px  | 500  | JetBrains Mono  | p-valor, Z, t, R², IC                            |

- JetBrains Mono **solo para números**. Etiquetas y textos van en Inter (el diseño de referencia usaba monoespaciada en todo; se limita para un estilo más limpio).
- En móvil: `display` 36 px, `variable-title` 32 px.
- Todo en `rem` para respetar el zoom del navegador.

---

## 7. ESPACIADO Y LAYOUT

### 7.1 Espaciado (múltiplos de 4 px)

```
4   chips, gap ícono-texto pequeño
8   padding de chips y badges
12  filas de datos
16  padding de paneles en móvil, gap entre controles
24  padding de paneles en escritorio, gap entre columnas
32  separación entre bloques
64  separación entre secciones de Inicio
```

### 7.2 Breakpoints

| Breakpoint   | Ancho        | Inicio                                      | Explorador                                        |
|--------------|--------------|---------------------------------------------|---------------------------------------------------|
| Móvil        | < 768 px     | Título arriba, imagen debajo; carrusel con slide al 78% y vecinos al 11% | Una columna: variable → mapa → serie → veredicto |
| Tableta      | 768–1023 px  | Igual que escritorio con imagen más chica   | Variable arriba; mapa y serie en 2 columnas; veredicto abajo |
| Escritorio   | ≥ 1024 px    | Título a la izquierda, imagen a la derecha; slide al 56% y vecinos al 18% | 3 columnas: 320 px · flexible · 400 px |

### 7.3 Alturas

```
Barra superior          64 px
Botones                 44 px
Pestañas de variable    40 px
Inputs y selects        44 px
Objetivo táctil mínimo  44 × 44 px
```

---

## 8. PANTALLA PRINCIPAL Y CARRUSEL

### 8.1 Estructura

```
┌────────────────────────────────────────────────────────────────────┐
│ [logo] Earth Trend Detective                    EN | ES   [Share]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Find what's changing                     ┌──────────────────────┐ │
│  on Earth, where,                         │   IMAGEN DE LA       │ │
│  and if it's real.                        │   TIERRA (16:9)      │ │
│                                           │        AI-generated  │ │
│  Six variables measured by NASA           └──────────────────────┘ │
│  satellites and models.                                            │
│  [ Choose a variable ↓ ]   ← relleno #8E1D6F                       │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  Choose a variable                     ← → to browse    1 / 6      │
│                                                                    │
│   ░░░░░░░         ┌──────────────────────┐          ░░░░░░░        │
│   ░ Ozone ░       │    [IMAGEN 1:1]      │          ░ Solar ░      │
│   ░ (35%) ░       │                      │          ░ (35%) ░      │
│   ░░░░░░░         │    Precipitation     │ ← acento ░░░░░░░        │
│                   │  Total amount of …   │                         │
│                   │  NASA POWER · 1981–2025                        │
│                   │  ( Investigate → )   │ ← contorno en acento    │
│                   └──────────────────────┘                         │
│        [‹]            ━━ ● ● ● ● ●              [›]                │
├────────────────────────────────────────────────────────────────────┤
│  Watch an example:  ▶ Demo 1   ▶ Demo 2                            │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 Reglas del carrusel

| Aspecto               | Especificación                                                                 |
|-----------------------|--------------------------------------------------------------------------------|
| Fondo de las tarjetas | **Ninguno.** Las tarjetas son transparentes, sin borde ni relleno              |
| Slide central         | 56% del ancho en escritorio, 78% en móvil; opacidad 100%; escala 1             |
| Slides vecinos        | Se ven a la izquierda (anterior) y a la derecha (siguiente); opacidad 35%; escala 0.88; recortados por el borde de la pantalla |
| Contenido del slide   | Imagen `idle` 1:1 centrada (360 px escritorio, 240 px móvil) → título en acento → definición de 1–2 frases → fuente y periodo → botón "Investigate →" |
| Sin nivel             | No se muestra la dificultad de la variable                                     |
| Navegación            | Deslizar, scroll horizontal del trackpad, flechas ‹ › y teclas ← → con foco en el carrusel; clic en un vecino lo trae al centro |
| Orden                 | Precipitación → Radiación solar → Humedad del suelo → Escurrimiento → NO₂ → Ozono; al final vuelve al inicio |
| Indicador             | Puntos abajo; el activo es una píldora alargada en el acento de la variable; contador "1 / 6" |
| Color                 | Al centrar un slide, solo cambian el título, el ícono, el botón contorneado y el punto activo. El fondo de la página no cambia |
| Sin autoplay          | El carrusel nunca avanza solo                                                  |
| Implementación        | `scroll-snap-type: x mandatory` con `scroll-snap-align: center`; la opacidad y escala de los vecinos se calculan con IntersectionObserver |

### 8.3 Botones de Inicio

- **Choose a variable ↓:** relleno `#8E1D6F`, texto blanco, *hover* `#731251`. Hace scroll al carrusel.
- **Investigate →:** contorno de 1.5 px y texto en el acento de la variable, sin relleno. Abre el explorador con esa variable.
- **Flechas ‹ ›:** círculo de 44 px, relleno `#2F1740`, ícono `OnSurface`.

---

## 9. EXPLORADOR DE VARIABLE

Se conserva el diseño aprobado de 3 columnas, con estos ajustes para hacerlo minimalista y consistente: sin niveles, sin cruces decorativas, monoespaciada solo en números, mapa de celdas (no de estaciones) y veredicto coherente con la significancia.

### 9.1 Estructura

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Home  Earth Trend Detective   ●Precipitation ●Solar ●Soil ●Runoff ●NO₂ ●O₃  [Explorer|Scientific] │
├──────────────────┬──────────────────────────────┬──────────────────────────┤
│ [IMAGEN 1:1      │ SPATIAL TREND MAP   Low ▬▬ High│ TIME SERIES & TREND      │
│  según estado]   │ ┌──────────────────────────┐ │ Remove seasonal cycle [on]│
│ Precipitation    │ │ Selected point            │ │ ┌──────────────────────┐ │
│ SENSOR: MERRA-2  │ │ Valley of Mexico · 66 mm  │ │ │  ~~~~ serie (acento) │ │
│                  │ └──────────────────────────┘ │ │  - - tendencia       │ │
│ WHAT IT MEASURES │      rejilla de celdas        │ │  ░░ IC 95%           │ │
│ Total amount of… │      coloreadas                │ │ └──────────────────────┘ │
│                  │                              │ ├──────────────────────────┤
│ PARAMETERS       │                              │ SIGNIFICANCE   [No clear trend] │
│ Region ▾         │                              │ Rate of change  −2.1%/dec │
│ Annual | Monthly │                              │ Direction  No clear trend │
│ Period 2001–2025 │                              │ (Scientific: Sen, p, Z,   │
│                  │                              │  t, R², IC 95%, n)        │
│ DETECTIVE CLUE   │ ▶ ━━━━━●━━━━  Year 2009 (D)  │ Method ⓘ                  │
└──────────────────┴──────────────────────────────┴──────────────────────────┘
```

### 9.2 Barra superior

- **← Home** a la izquierda y nombre del proyecto.
- **Pestañas de las 6 variables:** punto de color + nombre. La activa tiene texto y subrayado de 2 px en el acento; las demás en `OnSurfaceVariant`. Sin relleno en ninguna.
- **Modo Explorer | Scientific:** control segmentado global. Segmento activo relleno `#8C114A` con texto blanco. *Explorer* muestra lo esencial en lenguaje claro; *Scientific* agrega todos los estadísticos.

### 9.3 Columna izquierda — la variable

1. Imagen 1:1 de la variable según el estado del resultado (160 px).
2. Nombre de la variable (`title`, acento) y línea de sensor/modelo (`caption`, acento).
3. **What it measures:** definición simple de 1–2 frases.
4. **Parameters:**
   - *Region / Biome:* select con regiones preset (desierto, selva, estuario, gran ciudad, zona metropolitana).
   - *Temporal resolution:* segmentado Annual | Monthly; opción activa con relleno `#612073`.
   - *Study period:* slider de dos manijas en el acento; mínimo 10 años.
5. **Detective clue:** recuadro con borde `#612073`, etiqueta en acento y una pista sobre regiones con tendencias opuestas.

### 9.4 Columna central — mapa

- Título "Spatial trend map" + coordenadas del punto seleccionado (`caption`).
- Leyenda compacta Low → High con la paleta científica de la variable y sus unidades por década.
- Rejilla de celdas; la celda seleccionada se marca con contorno de 2 px en el acento.
- **Inspector del punto:** tarjeta `#2F1740` con nombre del lugar y valor.
- **Línea de tiempo (deseable):** botón ▶ y slider de año para ver la anomalía de cada año. Si no da tiempo, se omite: el mapa por defecto muestra la tendencia.

### 9.5 Columna derecha — serie y veredicto

**Time series & trend**
- Interruptor *Remove seasonal cycle* (activado por defecto, porque el análisis usa anomalías).
- Serie mensual en el acento; línea de tendencia punteada en `OnSurface`; banda del IC 95% en `OnSurface` al 12%.
- Leyenda: Serie · Tendencia (Sen) · IC 95%.

**Significance**

| Modo       | Muestra                                                                                         |
|------------|-------------------------------------------------------------------------------------------------|
| Explorer   | Insignia de significancia · *Rate of change* por década (unidades y %) · *Direction* · resumen de una frase |
| Scientific | Todo lo anterior + pendiente de Sen · p-valor · Z de Mann-Kendall · t · R² · IC 95% · n · insignia "Two methods agree" |

**Regla de coherencia:** *Direction* siempre coincide con la insignia. Si p ≥ 0.05, la dirección dice "No clear trend" aunque la pendiente sea negativa o positiva; el signo se muestra solo como "slight decrease/increase, not significant".

### 9.6 Fuera de alcance

El botón de chat con IA que aparecía en el diseño de referencia no se incluye en la v1.0. Si el equipo lo agrega, debe declararlo en la entrega como uso de IA.

---

## 10. COMPONENTES

| Componente          | Descripción                                                                    | Base shadcn/ui        |
|---------------------|--------------------------------------------------------------------------------|-----------------------|
| `AppBar`            | Logo/nombre, EN/ES, Share; en el explorador agrega ← Home, pestañas y modo      | —                     |
| `HomeHero`          | Título, subtítulo, botón principal e imagen de la Tierra                        | Button                |
| `VariableCarousel`  | Carrusel transparente con slide central y vecinos atenuados (sección 8)         | — (scroll-snap propio)|
| `VariableSlide`     | Imagen 1:1, título, definición, fuente y botón contorneado                      | Button (outline)      |
| `CarouselDots`      | Indicador con píldora activa en el acento y contador                            | —                     |
| `VariableTabs`      | 6 pestañas con punto de color; activa con texto y subrayado en acento           | Tabs                  |
| `ModeToggle`        | Explorer \| Scientific; activo relleno `#8C114A`                                | ToggleGroup           |
| `VariablePanel`     | Imagen por estado, nombre, sensor y definición                                  | —                     |
| `ParametersPanel`   | Región, resolución temporal y periodo                                           | Select, ToggleGroup, Slider |
| `DetectiveClue`     | Pista de regiones con tendencias opuestas                                       | —                     |
| `TrendMap`          | Rejilla de celdas, leyenda, inspector y línea de tiempo opcional                | —                     |
| `TimeSeriesChart`   | Serie, tendencia, IC 95% e interruptor de ciclo estacional                      | Switch                |
| `VerdictPanel`      | Insignia, tasa de cambio, dirección y estadísticos según el modo                | Badge, Tooltip        |
| `SignificanceBadge` | "Significant ↑", "Significant ↓", "No clear trend", "Not enough data"; contorno neutro `OnSurfaceVariant`, nunca en acento | Badge |
| `GlossaryTooltip`   | Definición corta de "p-value", "anomaly", "Sen slope"…                          | Tooltip               |
| `States`            | Skeleton, EmptyState, ErrorState con "Try again"                                | Skeleton, Alert       |

---

## 11. ICONOGRAFÍA

Librería **Lucide**, trazo 1.75 px. Tamaños: 24 px en navegación, 20 px en paneles, 16 px en etiquetas.

| Uso                    | Ícono          |
|------------------------|----------------|
| Precipitación          | `CloudRain`    |
| Radiación solar        | `Sun`          |
| Humedad del suelo      | `Sprout`       |
| Escurrimiento          | `Waves`        |
| Dióxido de nitrógeno   | `Factory`      |
| Ozono total            | `ShieldHalf`   |
| Sube / Baja / Sin tendencia | `TrendingUp` / `TrendingDown` / `Minus` |
| Datos insuficientes    | `CircleDashed` |
| Inicio                 | `ArrowLeft`    |
| Carrusel               | `ChevronLeft` / `ChevronRight` |
| Línea de tiempo        | `Play` / `Pause` |
| Pista                  | `Lightbulb`    |
| Método                 | `FlaskConical` |
| Compartir / Idioma     | `Share2` / `Languages` |

---

## 12. BORDES, FORMAS Y ELEVACIÓN

| Elemento                         | Radio | Borde                         |
|----------------------------------|-------|-------------------------------|
| Paneles del explorador           | 16 px | 1 px `#612073`                |
| Tarjetas internas (inspector, métricas) | 12 px | ninguno, relleno `#2F1740` |
| Botones y controles segmentados  | 10 px | según tipo                    |
| Inputs y selects                 | 10 px | 1 px `InputBorder`            |
| Imagen de Inicio                 | 24 px | ninguno                       |
| Botones de flecha                | círculo | ninguno, relleno `#2F1740`  |

Sin sombras. La elevación se marca con el tono: `Background` → `Surface` → `#2F1740`.

---

## 13. MOVIMIENTO

| Animación                                 | Duración | Curva        |
|-------------------------------------------|----------|--------------|
| Hover y foco                              | 150 ms   | ease-out     |
| Cambio de acento (texto y elementos)      | 300 ms   | ease-in-out  |
| Desplazamiento del carrusel               | 400 ms   | ease-out (scroll suave nativo) |
| Opacidad y escala de los vecinos          | 300 ms   | ease-out     |
| Cambio de imagen por estado               | 400 ms (fundido) | ease-out |
| Ajuste del mapa a la región               | 400 ms   | MapLibre     |

Con `prefers-reduced-motion: reduce`: sin escalas, sin fundidos y desplazamiento inmediato.

---

## 14. ESTADOS DE UI

| Estado              | Qué se ve                                                                       |
|---------------------|---------------------------------------------------------------------------------|
| Inicio              | Hero, carrusel en la primera variable, demos                                    |
| Calculando          | Imagen `idle`; skeleton en serie y veredicto; barra fina en el acento sobre el mapa; "Analyzing N cells…" |
| Resultado           | Imagen del estado; mapa coloreado; serie; veredicto                             |
| Sin tendencia       | "No clear trend (p = 0.17)". Nunca "no change". Sugerencia: ampliar el periodo  |
| Datos insuficientes | Imagen `insufficient`; aviso con el mínimo requerido y botón para ampliar periodo o región |
| Error               | Alerta en `Error`, causa en lenguaje claro y "Try again"                        |
| Sin conexión        | "You're offline. Showing saved results."                                        |

---

## 15. OTRAS PANTALLAS

Todas usan la misma barra, fondo, tipografía y reglas de color.

- **Modo Detective (`/detective`):** imagen `idle` 1:1 centrada como en el carrusel; lugar + variable; pregunta "Rising, falling or no clear trend?" con 3 botones contorneados en el acento; al responder, la imagen cambia al estado real y aparece una explicación de 2 líneas; botón "Next case".
- **Mi lugar (`/place`):** buscador de ciudad + "Use my location"; lista de las 6 variables con punto de color, flecha, valor por década e insignia; tocar una fila abre el explorador.
- **Método (`/method`):** texto en una columna de 720 px con anomalías, Mann-Kendall, Sen, regresión con t-test, IC, FDR, validación y fuentes.
- **Acerca de (`/about`):** equipo, reto, repositorio y declaración de uso de IA.

---

## 16. ACCESIBILIDAD

- [ ] Texto con contraste AA o mejor (verificado en secciones 2 y 3)
- [ ] Ningún color de la paleta base usado como color de texto sobre el fondo
- [ ] La tendencia nunca se comunica solo con color: flecha + palabra + valor
- [ ] Carrusel: `role="region"` con `aria-roledescription="carousel"`; cada slide `aria-label="3 of 6: Soil moisture"`; los vecinos tienen `inert` para que el teclado no entre a sus botones
- [ ] Sin autoplay
- [ ] Flechas del carrusel con `aria-label` ("Previous variable", "Next variable")
- [ ] Pestañas de variable con roles de `tablist` y navegación con flechas
- [ ] Mapa con alternativa en tabla y `aria-label`
- [ ] Veredicto anunciado con `aria-live="polite"`
- [ ] Imágenes con `alt` descriptivo; la información nunca depende solo de la imagen
- [ ] Objetivos táctiles de 44 px; probado a 360 px de ancho y con zoom al 200%
- [ ] Respeta `prefers-reduced-motion`
- [ ] Lighthouse: 90 o más en Accesibilidad y Rendimiento

---

## 17. TEXTOS E IDIOMA

- Inglés por defecto con selector EN/ES (i18next). Todos los textos en `i18n/en.json` y `i18n/es.json`.
- Frases de menos de 20 palabras, voz activa, verbo primero en botones: "Choose a variable", "Investigate", "Try again".
- Etiquetas de sección en mayúsculas pequeñas: "WHAT IT MEASURES", "PARAMETERS", "DETECTIVE CLUE", "SPATIAL TREND MAP", "TIME SERIES & TREND", "SIGNIFICANCE".
- Nombres de variables: Precipitation, Solar radiation, Soil moisture, Surface runoff, Nitrogen dioxide (NO₂), Total ozone (O₃).

---

## 18. TOKENS (CSS + TAILWIND)

### 18.1 Variables CSS

```css
:root {
  /* Paleta del equipo */
  --crimson: 140 17 74;        /* #8C114A */
  --wine: 115 18 81;           /* #731251 */
  --magenta: 142 29 111;       /* #8E1D6F */
  --purple: 97 32 115;         /* #612073 */
  --deep-purple: 47 23 64;     /* #2F1740 */

  /* Neutros derivados */
  --background: 20 10 30;      /* #140A1E */
  --surface: 30 16 41;         /* #1E1029 */
  --on-surface: 244 236 247;   /* #F4ECF7 */
  --on-surface-variant: 196 178 207; /* #C4B2CF */
  --input-border: 143 107 163; /* #8F6BA3 */
  --nodata: 74 61 88;          /* #4A3D58 */
  --error: 255 138 128;        /* #FF8A80 */

  /* Acento (solo texto y elementos) */
  --accent: 242 166 222;       /* home #F2A6DE */
}

[data-variable="precipitation"]   { --accent: 111 182 255; }  /* #6FB6FF */
[data-variable="solar_radiation"] { --accent: 255 194 102; }  /* #FFC266 */
[data-variable="soil_moisture"]   { --accent: 110 219 166; }  /* #6EDBA6 */
[data-variable="surface_runoff"]  { --accent: 95 224 232; }   /* #5FE0E8 */
[data-variable="no2"]             { --accent: 255 140 198; }  /* #FF8CC6 */
[data-variable="ozone"]           { --accent: 185 166 255; }  /* #B9A6FF */

body {
  background-color: rgb(var(--background));
  color: rgb(var(--on-surface));
}
.accent-transition { transition: color 300ms, border-color 300ms, fill 300ms, stroke 300ms; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0ms !important; animation: none !important; scroll-behavior: auto !important; }
}
```

### 18.2 tailwind.config

```ts
theme: {
  extend: {
    colors: {
      crimson: 'rgb(var(--crimson) / <alpha-value>)',
      wine: 'rgb(var(--wine) / <alpha-value>)',
      magenta: 'rgb(var(--magenta) / <alpha-value>)',
      purple: 'rgb(var(--purple) / <alpha-value>)',
      'deep-purple': 'rgb(var(--deep-purple) / <alpha-value>)',
      background: 'rgb(var(--background) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      ink: {
        DEFAULT: 'rgb(var(--on-surface) / <alpha-value>)',
        muted: 'rgb(var(--on-surface-variant) / <alpha-value>)',
      },
      'input-border': 'rgb(var(--input-border) / <alpha-value>)',
      nodata: 'rgb(var(--nodata) / <alpha-value>)',
      danger: 'rgb(var(--error) / <alpha-value>)',
      accent: 'rgb(var(--accent) / <alpha-value>)',   // usar SOLO en text-, border-, fill-, stroke-, ring-
    },
    fontFamily: {
      display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
    },
    borderRadius: { lg: '10px', xl: '12px', '2xl': '16px', '3xl': '24px' },
  },
}
```

Regla de código: `bg-accent` está prohibido. Para revisarlo, agregar una regla de ESLint o un `grep` en CI que falle si aparece `bg-accent`.

### 18.3 Catálogo de variables en el frontend

```ts
export const VARIABLES = {
  precipitation:   { accent: '#6FB6FF', icon: 'CloudRain',  map: 'BrBG'   },
  solar_radiation: { accent: '#FFC266', icon: 'Sun',        map: 'PuOr_r' },
  soil_moisture:   { accent: '#6EDBA6', icon: 'Sprout',     map: 'BrBG'   },
  surface_runoff:  { accent: '#5FE0E8', icon: 'Waves',      map: 'BrBG'   },
  no2:             { accent: '#FF8CC6', icon: 'Factory',    map: 'RdBu_r' },
  ozone:           { accent: '#B9A6FF', icon: 'ShieldHalf', map: 'RdBu_r' },
} as const;
```

---

## REFERENCIAS

- [WCAG 2.1 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [WAI-ARIA Authoring Practices — Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
- [MDN — CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap)
- [ColorBrewer — paletas BrBG, PuOr, RdBu](https://colorbrewer2.org/)
- [shadcn/ui](https://ui.shadcn.com/) · [Lucide icons](https://lucide.dev/)
- [NASA Space Apps — Project Submission Guide (uso de IA)](https://www.spaceappschallenge.org/resources/project-submission-guide/)

---

**Documento preparado para:** Earth Trend Detective — NASA Space Apps Challenge 2026
**Versión:** 2.0
**Fecha:** 2026-11-14

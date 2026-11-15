# ROADMAP — Earth Trend Detective (Web)
## Stack: React · TypeScript · FastAPI · Python

**Versión:** 2.0
**Evento:** NASA Space Apps Challenge 2026 · Reto "Be An Earth System Trend Detective!"
**Inicio:** Sábado 14 de noviembre de 2026, 09:00
**Cierre interno:** Domingo 15 de noviembre de 2026, 21:00
**Cierre oficial:** Domingo 15 de noviembre, 23:59 hora del evento local (así fue en ediciones pasadas; confirmar con el Local Lead)
**Duración:** 48 horas · 7 bloques
**Metodología:** SCRUM adaptado a hackatón (bloques de 3 a 5 horas con checkpoint)
**Repositorio:** `earth-trend-detective` (monorepo `web/` + `api/`)

> Este roadmap cubre el desarrollo completo (frontend, backend y datos) y la entrega. El diseño visual está en `UX.md` v2.0 y los requisitos en el SRS.
>
> **Cambios v2.0:** paleta magenta–púrpura del equipo; el acento por variable solo cambia textos y elementos (nunca fondos); pantalla principal con carrusel transparente; explorador de 3 columnas con modos Explorer y Scientific; sin niveles de dificultad en la interfaz; imágenes de variable 1:1 con fondo transparente.

---

## EQUIPO

| # | Rol | Perfil | Responsabilidad principal | Disponibilidad |
|---|-----|--------|---------------------------|----------------|
| 1 | **Datos e ingesta** | Programador · Python | Descarga y preprocesamiento de las 6 variables a Zarr; catálogo | 100% |
| 2 | **Backend y motor estadístico** | Programador · Python | FastAPI, TrendService (Mann-Kendall, Sen, regresión + t-test, FDR) | 100% |
| 3 | **Frontend — mapa** | Programador · React | MapLibre, rejilla de tendencias, leyenda, regiones, "Mi lugar" | 100% |
| 4 | **Frontend — experiencia** | Programador · React | Inicio y carrusel, acento por variable, imágenes por estado, panel de variable, serie, veredicto, Modo Detective, EN/ES | 100% |
| 5 | **Integración, deploy y QA** | Programador · full-stack | Docker, Vercel + Render, estado en URL, pruebas móviles, Lighthouse; apoya al frontend | 100% |
| 6 | **Estadística, contenido y demo** | Ingeniería Financiera | Validar tendencias en Giovanni y KNMI; definiciones de variables; página Método; 2 demos guiadas; video/diapositivas; formulario de entrega en inglés | 100% |

Las imágenes (1 de Inicio + 30 de variables en 1:1 con fondo transparente, ver `UX.md` sección 4) las produce quien el equipo designe; el rol 6 coordina la lista.

---

## VARIABLES DEL PROYECTO

| Dificultad | Variable | Fuente | Acceso | Datos desde |
|------------|----------|--------|--------|-------------|
| Fácil | Precipitación | MERRA-2 (modelo) | NASA POWER, sin cuenta | 1981 |
| Fácil | Radiación solar en superficie | Derivada de satélite (CERES) | NASA POWER, sin cuenta | 1984 |
| Media | Humedad del suelo (0–10 cm) | GLDAS Noah (modelo) | Data Rods (punto) + earthaccess (rejilla), Earthdata Login | 2000 |
| Media | Escurrimiento superficial | GLDAS Noah (modelo) | Data Rods (punto) + earthaccess (rejilla), Earthdata Login | 2000 |
| Difícil | Dióxido de nitrógeno troposférico | OMI (misión Aura) | Giovanni (punto) + earthaccess (rejilla diaria → mensual) | oct 2004 |
| Difícil | Ozono total | OMI (misión Aura) | Giovanni (punto) + earthaccess (rejilla diaria → mensual) | oct 2004 |

Orden de construcción: fáciles → medias → difíciles. La dificultad es solo para planear: **no se muestra en la interfaz**. Si una variable difícil no queda lista al feature freeze, se quita del carrusel y de las pestañas; no se presenta a medias.

---

## STACK TECNOLÓGICO

| Categoría | Paquete / Tecnología | Versión |
|-----------|----------------------|---------|
| Lenguaje frontend | TypeScript | 5.x |
| Framework frontend | React + Vite | 19 / 6 |
| Estado de UI | Zustand | 5.x |
| Estado del servidor | TanStack Query | 5.x |
| Navegación | React Router | 7.x |
| Validación de datos | Zod | 3.x |
| Estilos | Tailwind CSS + shadcn/ui | 4.x |
| Mapa | MapLibre GL JS | 5.x |
| Gráficas | Plotly.js (react-plotly.js) | 2.x |
| Idiomas | i18next + react-i18next | — |
| Lenguaje backend | Python | 3.12 |
| API | FastAPI + Uvicorn | 0.11x |
| Datos | xarray, numpy, pandas, zarr, h5netcdf | — |
| Estadística | pymannkendall, scipy, statsmodels | — |
| Acceso NASA | requests (POWER, Data Rods, Giovanni), earthaccess | — |
| Infraestructura | Docker Compose · Vercel (web) · Render (api) | — |
| Calidad | ESLint, Prettier, Vitest · Ruff, pytest | — |

---

## ESTRUCTURA DEL PROYECTO

```
earth-trend-detective/
├── web/
│   └── src/
│       ├── core/              ← config, apiClient, i18n, theme (data-variable)
│       ├── features/
│       │   ├── catalog/
│       │   │   ├── domain/        ← Variable, CatalogRepository (interfaz)
│       │   │   ├── data/          ← catalogApi.ts, CatalogRepositoryImpl
│       │   │   └── presentation/  ← useCatalog
│       │   ├── explorer/      ← store Zustand (variable, región, años), RegionSelector
│       │   ├── home/          ← HomeHero, VariableCarousel, VariableSlide, CarouselDots
│       │   ├── trends/        ← VariableTabs, ModeToggle, VariablePanel, ParametersPanel, TrendMap, TimeSeriesChart, VerdictPanel
│       │   ├── detective/     ← DetectiveCard, CluePanel, casos
│       │   ├── place/         ← PlaceSearch, tabla de 6 variables
│       │   └── method/        ← página de metodología y validación
│       ├── shared/components/ ← AppBar, States, GlossaryTooltip
│       └── i18n/              ← en.json, es.json
│   └── public/images/         ← home/earth.webp + variables/<id>/<estado>.webp
├── api/
│   ├── app/
│   │   ├── domain/            ← TrendResult, Variable, Region
│   │   ├── services/          ← trend_service.py, anomalies.py, regression.py
│   │   ├── ports/             ← DatasetRepository (interfaz)
│   │   ├── adapters/          ← zarr_repository.py, power_client.py, datarods_client.py, giovanni_client.py
│   │   └── routers/           ← variables.py, trends.py, series.py, export.py
│   ├── scripts/               ← preprocess_<variable>.py
│   ├── data/                  ← *.zarr (subconjuntos de las regiones preset)
│   └── tests/
├── docker-compose.yml
└── README.md
```

---

## ESTRATEGIA DE DATOS (precalculado + en vivo)

```
Mapas (precalculados):
  scripts/preprocess_<variable>.py
    ├── POWER / earthaccess  →  rejilla mensual por región preset
    ├── anomalías + Mann-Kendall + Sen + regresión + FDR por celda
    └── guarda data/<variable>.zarr  (datos + resultados por celda)

Series de un punto (en vivo, modo "Mi lugar"):
  GET /api/v1/series?var=…&lat=…&lon=…
    try { POWER / Data Rods / Giovanni → calcular → responder }
    catch { usar la celda más cercana de la caché Zarr }
```

Las credenciales de Earthdata viven solo en `api/.env`. El frontend nunca llama a NASA directamente, salvo las teselas del mapa base.

---

## RITUALES

| Ritual | Cuándo | Duración |
|--------|--------|----------|
| Planning | Sábado 09:00 | 45 min |
| Checkpoint | Al final de cada bloque | 10 min |
| Standup corto | Cada 3 horas | 5 min |
| Feature freeze | Domingo 12:00 | — |
| Retro rápida | Después de enviar | 15 min |

---

## DEFINICIÓN DE HECHO (DoD)

- [ ] Rama `feature/<descripcion>` mergeada a `main` con revisión de otro integrante
- [ ] `npm run lint` y `ruff check` sin errores; pruebas del motor en verde
- [ ] Se ve bien a 360 px y a 1280 px
- [ ] UI respeta `UX.md` (paleta base, acento solo en texto y elementos, sin `bg-accent`, sin niveles)
- [ ] Cada número muestra unidades, periodo y fuente
- [ ] Error de usuario siempre visible (nunca fallo silencioso)
- [ ] Textos en `en.json` y `es.json`

---

## ESTIMACIÓN

| Talla | SP | Tiempo |
|-------|----|--------|
| XS | 1 | < 30 min |
| S | 2 | 30 min – 1 h |
| M | 3 | 1 – 2 h |
| L | 5 | 2 – 4 h |
| XL | 8 | 4 – 6 h |

---

## TIMELINE

```
SÁBADO 14 DE NOVIEMBRE
Bloque 1 │ 09:00 – 12:00 │ Arranque y setup
Bloque 2 │ 12:00 – 16:00 │ Variables fáciles + motor estadístico
Bloque 3 │ 16:00 – 20:00 │ Integración → MVP con 2 variables
Bloque 4 │ 20:00 – 01:00 │ Variables medias + deploy
          │ 01:00 – 08:00 │ Descanso por turnos

DOMINGO 15 DE NOVIEMBRE
Bloque 5 │ 08:00 – 12:00 │ Variables difíciles + experiencia completa → FEATURE FREEZE
Bloque 6 │ 12:00 – 16:00 │ QA, validación y documentación
Bloque 7 │ 16:00 – 21:00 │ Demo y entrega
```

---

## BLOQUE 1
**Horario:** Sábado 09:00 – 12:00
**Meta:** Repositorio, entornos y cuentas listos; datos fáciles descargándose.

#### US-01 · Monorepo y entornos `M (3 SP)` · Rol 5
- [ ] Crear `web/` con Vite + React + TS + Tailwind + shadcn/ui
- [ ] Crear `api/` con FastAPI, Ruff y pytest
- [ ] `docker-compose.yml` que levante ambos
- [ ] Ramas protegidas y plantilla de PR

#### US-02 · Cuentas y tokens de NASA `S (2 SP)` · Roles 1 y 6
- [ ] Crear 2–3 cuentas de Earthdata Login
- [ ] Generar token y guardarlo en `api/.env` (nunca en Git)
- [ ] Probar una llamada a POWER, Data Rods y Giovanni

#### US-03 · Catálogo de variables `S (2 SP)` · Rol 6
- [ ] Definición simple en inglés y español de las 6 variables
- [ ] Unidades, fuente, periodo y por qué importa cada una

**Checkpoint 12:00:** `docker compose up` funciona y hay respuesta real de POWER.

---

## BLOQUE 2
**Horario:** Sábado 12:00 – 16:00
**Meta:** Precipitación y radiación solar en caché; motor estadístico probado.

#### US-04 · Ingesta de variables fáciles `L (5 SP)` · Rol 1
- [ ] `preprocess_precipitation.py` y `preprocess_solar_radiation.py` con POWER regional (una variable por petición)
- [ ] Regiones preset: desierto, selva, estuario, gran ciudad + México completo
- [ ] Guardar `data/<variable>.zarr`

#### US-05 · TrendService `XL (8 SP)` · Rol 2
- [ ] Anomalías mensuales (quitar ciclo estacional)
- [ ] Mann-Kendall + pendiente de Sen por celda
- [ ] Regresión lineal con t-test e intervalo de confianza del 95%
- [ ] Corrección FDR (Benjamini-Hochberg) sobre el mapa
- [ ] Reglas de datos insuficientes (< 10 años o > 30% faltante)
- [ ] Pruebas con series sintéticas (con tendencia, sin tendencia, con estacionalidad)

#### US-06 · Tokens, Inicio y carrusel `L (5 SP)` · Rol 4
- [ ] Tokens de `UX.md` sección 18 en Tailwind (paleta del equipo + neutros + `--accent`)
- [ ] `HomeHero` con imagen de la Tierra y botón "Choose a variable"
- [ ] `VariableCarousel` transparente: slide central, vecinos al 35% de opacidad, scroll-snap, flechas, teclado y puntos
- [ ] Cambio de acento con `data-variable` solo en texto y elementos

#### US-07 · Mapa base `M (3 SP)` · Rol 3
- [ ] MapLibre con mapa base oscuro y selector de regiones preset

**Checkpoint 16:00:** `/api/v1/trends` devuelve resultados reales de precipitación.

---

## BLOQUE 3
**Horario:** Sábado 16:00 – 20:00
**Meta:** MVP de punta a punta con 2 variables.

#### US-08 · Endpoints `M (3 SP)` · Rol 2
- [ ] `GET /variables`, `POST /trends`, `GET /series`, `GET /health`

#### US-09 · Mapa de tendencias `L (5 SP)` · Rol 3
- [ ] Rejilla coloreada con la paleta científica de la variable
- [ ] Celdas no significativas al 25%; sin datos con patrón
- [ ] Leyenda y tooltip por celda

#### US-10 · Explorador de 3 columnas `XL (8 SP)` · Rol 4
- [ ] Barra con ← Home, `VariableTabs` y `ModeToggle` (Explorer | Scientific)
- [ ] `VariablePanel` con imagen por estado (respaldo a `idle`), definición y `ParametersPanel` (región, Annual | Monthly, periodo)
- [ ] `TimeSeriesChart` con serie en acento, tendencia, IC 95% e interruptor de ciclo estacional
- [ ] `VerdictPanel`: insignia, tasa por década, dirección coherente con la significancia; estadísticos completos en modo Scientific

#### US-11 · Validación manual `M (3 SP)` · Rol 6
- [ ] Reproducir 2 series en Giovanni o KNMI y comparar pendiente y p-valor con la app

**Checkpoint 20:00 — MVP:** desde el carrusel elegir precipitación o radiación solar, abrir el explorador, cambiar región y ver mapa, serie, veredicto e imagen del estado correctos.

---

## BLOQUE 4
**Horario:** Sábado 20:00 – 01:00
**Meta:** Variables medias en caché y app desplegada.

#### US-12 · Ingesta GLDAS `XL (8 SP)` · Rol 1
- [ ] Humedad del suelo y escurrimiento mensuales con earthaccess (rejilla) por región preset
- [ ] Cliente de Data Rods para series de un punto

#### US-13 · Deploy `M (3 SP)` · Rol 5
- [ ] Web en Vercel, API en Render; CORS; variables de entorno
- [ ] Estado del análisis en la URL (compartible)

#### US-14 · Pista de detective y EN/ES `M (3 SP)` · Rol 4
- [ ] `DetectiveClue` en el panel izquierdo
- [ ] i18next con inglés por defecto

#### US-15 · Mi lugar `M (3 SP)` · Rol 3
- [ ] `PlaceSearch` + tabla de variables en ese punto

#### US-16 · Guion de la demo `S (2 SP)` · Rol 6
- [ ] Borrador del guion de 30 s o de las 7 diapositivas

**Checkpoint 01:00:** URL pública con 4 variables.

---

## BLOQUE 5
**Horario:** Domingo 08:00 – 12:00
**Meta:** Variables difíciles y experiencia completa. **Feature freeze a las 12:00.**

#### US-17 · Ingesta OMI `XL (8 SP)` · Rol 1
- [ ] NO₂ y ozono: rejillas diarias → promedios mensuales por región preset
- [ ] Cliente de Giovanni para series de un punto

#### US-18 · Modo Detective y pistas `L (5 SP)` · Roles 4 y 2
- [ ] Pantalla `/detective` con imagen 1:1, 3 botones contorneados en acento y revelación del resultado
- [ ] Endpoint `/clues`: dos regiones con tendencias opuestas por variable

#### US-19 · Página Método y demos guiadas `M (3 SP)` · Roles 6 y 4
- [ ] Método en lenguaje simple + validación
- [ ] 2 ejemplos guiados en la página de inicio

#### US-20 · Integrar imágenes `S (2 SP)` · Rol 4
- [ ] Cargar `home/earth.webp` y las imágenes 1:1 de cada variable
- [ ] Precargar los 5 estados al abrir una variable
- [ ] Línea de tiempo del mapa (deseable, solo si sobra tiempo)

---

## BLOQUE 6
**Horario:** Domingo 12:00 – 16:00
**Meta:** Sin bugs críticos y documentación lista.

#### US-21 · QA `L (5 SP)` · Roles 5 y 6

| # | Escenario | Resultado esperado |
|---|-----------|--------------------|
| T01 | Recorrer el carrusel con deslizar, flechas y teclado | Una variable al centro, vecinos atenuados, sin cambios de fondo |
| T01b | Abrir cada una de las 6 variables | Cambian solo textos y elementos; mapa, serie y veredicto cargan |
| T01c | Cambiar Explorer ↔ Scientific | Se muestran u ocultan los estadísticos; la dirección coincide con la insignia |
| T02 | Región con datos insuficientes | Imagen `insufficient` y mensaje claro |
| T03 | Modo Detective completo | 6 casos sin errores |
| T04 | Mi lugar con una ciudad | Tabla de variables en menos de 5 s |
| T05 | Enlace compartido | Abre el mismo análisis |
| T06 | Móvil 360 px | Todo usable, sin cortes |
| T07 | API caída | Mensaje de error y botón "Try again" |
| T08 | Teclado y lector de pantalla | Navegación completa; resultados anunciados |

#### US-22 · Documentación `M (3 SP)` · Roles 5 y 6
- [ ] README: instalación, datos de NASA usados, método
- [ ] Lista de datos y herramientas con licencias
- [ ] Declaración de uso de IA

---

## BLOQUE 7
**Horario:** Domingo 16:00 – 21:00
**Meta:** Demo grabada y proyecto enviado.

#### US-23 · Demo `L (5 SP)` · Rol 6 con apoyo del equipo
- [ ] Video de 30 s como máximo con subtítulos en inglés, o 7 diapositivas como máximo en inglés
- [ ] Alojado en YouTube o Drive con acceso sin iniciar sesión

#### US-24 · Entrega `S (2 SP)` · Rol 6
- [ ] Campos de la entrega en inglés
- [ ] Datos de NASA usados y cómo se usaron
- [ ] Enlaces: app desplegada, repositorio, demo
- [ ] "Submit for Judging" antes de las 21:00

---

## RESUMEN DE BLOQUES

| Bloque | Horario | SP | Foco |
|--------|---------|----|------|
| 1 | Sáb 09–12 | 7 | Setup y cuentas |
| 2 | Sáb 12–16 | 21 | Variables fáciles + motor |
| 3 | Sáb 16–20 | 19 | MVP con 2 variables |
| 4 | Sáb 20–01 | 19 | Variables medias + deploy |
| 5 | Dom 08–12 | 18 | Variables difíciles + experiencia |
| 6 | Dom 12–16 | 8 | QA y documentación |
| 7 | Dom 16–21 | 7 | Demo y entrega |
| **TOTAL** | **48 h** | **99** | |

---

## RIESGOS

| ID | Riesgo | Probabilidad | Mitigación |
|----|--------|--------------|------------|
| R01 | Descargas lentas de Earthdata | Alta | Regiones preset pequeñas; empezar con POWER; no descargar durante la demo |
| R02 | OMI (NO₂, ozono) no queda listo | Media | Construirlas al final; si no están al freeze, se ocultan |
| R03 | Mann-Kendall por celda es lento | Media | Precalcular en los scripts; rejilla de 0.5° |
| R04 | El servidor gratuito se duerme | Media | Despertarlo antes de evaluar; el video es respaldo |
| R05 | Faltan imágenes de variable | Media | Respaldo automático a `idle` |
| R08 | Carrusel con mal rendimiento en móvil | Baja | Scroll-snap nativo, sin librerías pesadas; probar en un teléfono real |
| R06 | Lectura equivocada de la significancia | Media | "No clear trend" en vez de "no change"; página Método |
| R07 | Cansancio y bugs de madrugada | Alta | Turnos de descanso; feature freeze estricto |

---

## CONFIGURACIÓN INICIAL

### Herramientas
- [ ] Node.js 22 LTS y Python 3.12
- [ ] Docker Desktop
- [ ] Cuenta de Earthdata Login por persona de datos
- [ ] Acceso al repositorio
- [ ] Lectura obligatoria: SRS y `UX.md`

### Arranque rápido
```bash
# Frontend
npm create vite@latest web -- --template react-ts
cd web && npm i zustand @tanstack/react-query react-router-dom zod maplibre-gl plotly.js react-plotly.js i18next react-i18next
npx shadcn@latest init

# Backend
cd api && python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn xarray zarr h5netcdf pandas numpy scipy statsmodels pymannkendall earthaccess requests python-dotenv
uvicorn app.main:app --reload
```

### Variables de entorno
```bash
# api/.env  (nunca en Git)
EARTHDATA_TOKEN=***
CORS_ORIGINS=http://localhost:5173,https://<app>.vercel.app

# web/.env
VITE_API_BASE_URL=http://localhost:8000/api/v1/
```

### Convenciones de commits
```
feat(trends): add Mann-Kendall and Sen slope per cell
feat(home): add transparent variable carousel with neighbor previews
feat(theme): switch accent on text and elements by selected variable
feat(explorer): load variable image by trend state
fix(api): handle regions with insufficient data
docs: list NASA datasets and AI tools in README
```

---

**Documento:** Roadmap.md v2.0 · Earth Trend Detective · NASA Space Apps Challenge 2026

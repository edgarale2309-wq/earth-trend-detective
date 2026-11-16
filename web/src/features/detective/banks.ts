import type { VariableId } from '../../core/variables'

/** Text in both interface languages. */
export interface T { en: string; es: string }
export const tr = (t: T, lang: string) => (lang.startsWith('es') ? t.es : t.en)

export interface Choice { id: string; label: T }
export interface Mcq {
  id: string
  /** correct choice first; the game shuffles before showing */
  choices: T[]
  prompt: T
  explain: T
}
export interface Story extends Mcq {
  title: T
  /** short narrative shown above the question */
  body: T
  variable?: VariableId
  region?: string
}

// ---------- Bank 2: how to read trends (concepts) ----------
export const CONCEPTS: Mcq[] = [
  {
    id: 'p-value',
    prompt: { en: 'A trend has p = 0.03. What does that mean?', es: 'Una tendencia tiene p = 0.03. ¿Qué significa?' },
    choices: [
      { en: 'If there were no real trend, a pattern this strong would show up only about 3% of the time.', es: 'Si no hubiera tendencia real, un patrón así de fuerte aparecería solo cerca del 3 % de las veces.' },
      { en: 'There is a 97% chance the trend will continue next year.', es: 'Hay 97 % de probabilidad de que la tendencia continúe el próximo año.' },
      { en: 'The variable changed by 3%.', es: 'La variable cambió 3 %.' },
      { en: 'The data are 3% wrong.', es: 'Los datos tienen 3 % de error.' },
    ],
    explain: { en: 'The p-value measures how surprising the data would be if nothing were changing. Below 0.05 we call the trend significant.', es: 'El valor p mide qué tan sorprendentes serían los datos si nada estuviera cambiando. Por debajo de 0.05 decimos que la tendencia es significativa.' },
  },
  {
    id: 'no-trend',
    prompt: { en: 'The test gives p = 0.20. What is the honest conclusion?', es: 'La prueba da p = 0.20. ¿Cuál es la conclusión honesta?' },
    choices: [
      { en: 'We cannot tell: the data do not show a clear trend (yet).', es: 'No podemos saberlo: los datos no muestran una tendencia clara (todavía).' },
      { en: 'The variable is definitely not changing.', es: 'La variable definitivamente no está cambiando.' },
      { en: 'The satellite is broken.', es: 'El satélite está descompuesto.' },
      { en: 'The trend is real but small.', es: 'La tendencia es real pero pequeña.' },
    ],
    explain: { en: 'Not seeing a clear trend is not proof of no change. A longer record can turn an unclear trend into a significant one.', es: 'No ver una tendencia clara no prueba que no haya cambio. Un registro más largo puede convertir una tendencia dudosa en significativa.' },
  },
  {
    id: 'sen',
    prompt: { en: 'Why do we use Sen’s slope for the rate of change?', es: '¿Por qué usamos la pendiente de Sen para la tasa de cambio?' },
    choices: [
      { en: 'It is the median of the slopes between all pairs of points, so a few extreme years barely move it.', es: 'Es la mediana de las pendientes entre todos los pares de puntos, así que unos pocos años extremos casi no la mueven.' },
      { en: 'It always gives the largest slope.', es: 'Siempre da la pendiente más grande.' },
      { en: 'It only needs two data points.', es: 'Solo necesita dos datos.' },
      { en: 'It removes the seasonal cycle.', es: 'Elimina el ciclo estacional.' },
    ],
    explain: { en: 'Using a median makes the estimate robust to outliers such as a single very wet or very dry year.', es: 'Usar una mediana hace la estimación robusta ante valores atípicos, como un solo año muy lluvioso o muy seco.' },
  },
  {
    id: 'anomaly',
    prompt: { en: 'What is an “anomaly” in a time series?', es: '¿Qué es una “anomalía” en una serie de tiempo?' },
    choices: [
      { en: 'How far a value is from what is typical for that time of year.', es: 'Qué tan lejos está un valor de lo habitual para esa época del año.' },
      { en: 'An error in the sensor.', es: 'Un error del sensor.' },
      { en: 'The highest value ever recorded.', es: 'El valor más alto jamás registrado.' },
      { en: 'A missing data point.', es: 'Un dato faltante.' },
    ],
    explain: { en: 'We subtract the typical value of each month, so July is compared with other Julys and not with January.', es: 'Restamos el valor típico de cada mes, de modo que julio se compara con otros julios y no con enero.' },
  },
  {
    id: 'season',
    prompt: { en: 'Why remove the seasonal cycle before looking for a trend?', es: '¿Por qué se quita el ciclo estacional antes de buscar una tendencia?' },
    choices: [
      { en: 'Because the yearly up-and-down is much bigger than a slow trend and would hide it.', es: 'Porque el sube y baja de cada año es mucho mayor que una tendencia lenta y la ocultaría.' },
      { en: 'Because seasons do not exist in the tropics.', es: 'Porque en los trópicos no hay estaciones.' },
      { en: 'To make the chart look smoother.', es: 'Para que la gráfica se vea más suave.' },
      { en: 'It is required by NASA.', es: 'Lo exige la NASA.' },
    ],
    explain: { en: 'Seasonality is a predictable cycle, not a change. Removing it leaves only the departures we want to test.', es: 'La estacionalidad es un ciclo predecible, no un cambio. Quitarla deja solo las desviaciones que queremos probar.' },
  },
  {
    id: 'mk',
    prompt: { en: 'What is the Mann-Kendall test good for?', es: '¿Para qué sirve la prueba de Mann-Kendall?' },
    choices: [
      { en: 'Checking whether values tend to go up or down over time, without assuming a bell-shaped distribution.', es: 'Comprobar si los valores tienden a subir o bajar con el tiempo, sin suponer una distribución en forma de campana.' },
      { en: 'Predicting next year’s value exactly.', es: 'Predecir con exactitud el valor del próximo año.' },
      { en: 'Filling in missing data.', es: 'Rellenar datos faltantes.' },
      { en: 'Converting units.', es: 'Convertir unidades.' },
    ],
    explain: { en: 'It is a non-parametric test: it only looks at whether later values are generally higher or lower than earlier ones.', es: 'Es una prueba no paramétrica: solo mira si los valores posteriores suelen ser más altos o más bajos que los anteriores.' },
  },
  {
    id: 'ci',
    prompt: { en: 'The 95% confidence band around the trend line includes a flat line. What does that suggest?', es: 'La banda de confianza del 95 % alrededor de la línea de tendencia incluye una línea plana. ¿Qué sugiere?' },
    choices: [
      { en: 'A zero change is still plausible, so the trend is not clearly different from none.', es: 'Un cambio nulo sigue siendo plausible, así que la tendencia no se distingue claramente de ninguna.' },
      { en: 'The trend is very strong.', es: 'La tendencia es muy fuerte.' },
      { en: 'The data are perfect.', es: 'Los datos son perfectos.' },
      { en: 'The unit is wrong.', es: 'La unidad está mal.' },
    ],
    explain: { en: 'The band shows the range of slopes consistent with the data. If zero sits inside it, we cannot rule out no change.', es: 'La banda muestra el rango de pendientes compatibles con los datos. Si el cero cae dentro, no podemos descartar que no haya cambio.' },
  },
  {
    id: 'years',
    prompt: { en: 'Why does this tool ask for at least 10 years of data?', es: '¿Por qué esta herramienta pide al menos 10 años de datos?' },
    choices: [
      { en: 'Year-to-year swings (like El Niño) are large, and a short record can fake a trend.', es: 'Las oscilaciones de un año a otro (como El Niño) son grandes y un registro corto puede fingir una tendencia.' },
      { en: 'Because the satellites launched ten years ago.', es: 'Porque los satélites se lanzaron hace diez años.' },
      { en: 'To make the download bigger.', es: 'Para que la descarga sea más grande.' },
      { en: 'There is no reason.', es: 'No hay razón.' },
    ],
    explain: { en: 'Natural variability can dominate a few years. A longer window separates a lasting trend from a temporary swing.', es: 'La variabilidad natural puede dominar unos pocos años. Una ventana más larga separa una tendencia duradera de una oscilación pasajera.' },
  },
  {
    id: 'fdr',
    prompt: { en: 'We test 669 states at once. Why correct for multiple comparisons?', es: 'Probamos 669 estados a la vez. ¿Por qué corregir por comparaciones múltiples?' },
    choices: [
      { en: 'Because with so many tests, some will look “significant” purely by chance.', es: 'Porque con tantas pruebas, algunas parecerán “significativas” solo por azar.' },
      { en: 'To make the map load faster.', es: 'Para que el mapa cargue más rápido.' },
      { en: 'To remove small states.', es: 'Para quitar los estados pequeños.' },
      { en: 'Because p-values are always wrong.', es: 'Porque los valores p siempre están mal.' },
    ],
    explain: { en: 'At the 5% level, about 1 test in 20 passes by luck alone. The false discovery rate correction keeps the map honest.', es: 'Al nivel del 5 %, aproximadamente 1 prueba de cada 20 pasa solo por suerte. La corrección de la tasa de falsos descubrimientos mantiene honesto el mapa.' },
  },
  {
    id: 'significant',
    prompt: { en: 'Does “statistically significant” mean “important”?', es: '¿“Estadísticamente significativo” significa “importante”?' },
    choices: [
      { en: 'No. It only says the change is unlikely to be chance; it can still be tiny.', es: 'No. Solo dice que el cambio difícilmente es azar; aun así puede ser diminuto.' },
      { en: 'Yes, always.', es: 'Sí, siempre.' },
      { en: 'Only for satellite data.', es: 'Solo para datos de satélite.' },
      { en: 'Only in the tropics.', es: 'Solo en los trópicos.' },
    ],
    explain: { en: 'Significance and size are different questions. Always read the rate of change next to the p-value.', es: 'Significancia y tamaño son preguntas distintas. Lee siempre la tasa de cambio junto al valor p.' },
  },
  {
    id: 'reanalysis',
    prompt: { en: 'MERRA-2 is a “reanalysis”. What does that mean?', es: 'MERRA-2 es un “reanálisis”. ¿Qué significa?' },
    choices: [
      { en: 'A weather model that blends many observations into a consistent, gap-free record.', es: 'Un modelo del tiempo que combina muchas observaciones en un registro consistente y sin huecos.' },
      { en: 'A single satellite photo.', es: 'Una sola foto de satélite.' },
      { en: 'A weather station network.', es: 'Una red de estaciones meteorológicas.' },
      { en: 'A forecast for next week.', es: 'Un pronóstico para la próxima semana.' },
    ],
    explain: { en: 'Reanalyses are great for long, uniform records, but they are model output guided by data, not direct measurements.', es: 'Los reanálisis son excelentes para registros largos y uniformes, pero son salida de modelo guiada por datos, no mediciones directas.' },
  },
  {
    id: 'grid',
    prompt: { en: 'The data come on a 1° grid (about 110 km). What does that imply for a small state?', es: 'Los datos vienen en una malla de 1° (unos 110 km). ¿Qué implica para un estado pequeño?' },
    choices: [
      { en: 'It may share a grid cell with its neighbours, so its values describe the surrounding area.', es: 'Puede compartir celda con sus vecinos, así que sus valores describen el área circundante.' },
      { en: 'It gets a more precise value than a big state.', es: 'Obtiene un valor más preciso que un estado grande.' },
      { en: 'It is left out of the analysis.', es: 'Se deja fuera del análisis.' },
      { en: 'Nothing.', es: 'Nada.' },
    ],
    explain: { en: 'Coarse grids blur small places. That is why we say the values describe an area, not a street.', es: 'Las mallas gruesas difuminan los lugares pequeños. Por eso decimos que los valores describen un área, no una calle.' },
  },
  {
    id: 'per-decade',
    prompt: { en: 'Why is the rate of change given “per decade”?', es: '¿Por qué la tasa de cambio se da “por década”?' },
    choices: [
      { en: 'It is a human-friendly scale: per month is too tiny to read, per century too far from the data.', es: 'Es una escala cómoda: por mes es demasiado pequeño y por siglo queda muy lejos de los datos.' },
      { en: 'Because data are collected every ten years.', es: 'Porque los datos se recogen cada diez años.' },
      { en: 'Because of a NASA rule.', es: 'Por una regla de la NASA.' },
      { en: 'To hide the real value.', es: 'Para ocultar el valor real.' },
    ],
    explain: { en: 'A per-decade rate lets you compare variables and places at a scale people can picture.', es: 'Una tasa por década permite comparar variables y lugares en una escala que la gente puede imaginar.' },
  },
  {
    id: 'missing',
    prompt: { en: 'A state has 40% missing months. What does the tool do?', es: 'Un estado tiene 40 % de meses sin datos. ¿Qué hace la herramienta?' },
    choices: [
      { en: 'Marks it “not enough data” instead of guessing.', es: 'Lo marca como “datos insuficientes” en lugar de adivinar.' },
      { en: 'Fills the gaps with random values.', es: 'Rellena los huecos con valores al azar.' },
      { en: 'Shows the strongest trend.', es: 'Muestra la tendencia más fuerte.' },
      { en: 'Deletes the state.', es: 'Borra el estado.' },
    ],
    explain: { en: 'A trend built on too many gaps would not be trustworthy, so we say so rather than invent a result.', es: 'Una tendencia construida sobre demasiados huecos no sería confiable, así que lo decimos en vez de inventar un resultado.' },
  },
  {
    id: 'spike',
    prompt: { en: 'One extremely wet year stands out in a 40-year record. Is that a trend?', es: 'Un año extremadamente lluvioso destaca en un registro de 40 años. ¿Es una tendencia?' },
    choices: [
      { en: 'Not by itself: a trend is a consistent direction over many years.', es: 'No por sí solo: una tendencia es una dirección consistente a lo largo de muchos años.' },
      { en: 'Yes, any big year is a trend.', es: 'Sí, cualquier año grande es una tendencia.' },
      { en: 'Yes, if it is the last year.', es: 'Sí, si es el último año.' },
      { en: 'It proves the climate is changing.', es: 'Prueba que el clima está cambiando.' },
    ],
    explain: { en: 'A single extreme is an event. Trend tests look at the whole sequence, so one spike barely moves the result.', es: 'Un solo extremo es un evento. Las pruebas de tendencia miran toda la secuencia, así que un pico casi no mueve el resultado.' },
  },
  {
    id: 'lat-weights',
    prompt: { en: 'When averaging grid cells over a region, why weight them by the cosine of latitude?', es: 'Al promediar celdas de una región, ¿por qué se ponderan por el coseno de la latitud?' },
    choices: [
      { en: 'Cells get narrower toward the poles, so they cover less area and should count less.', es: 'Las celdas se hacen más angostas hacia los polos, cubren menos área y deben contar menos.' },
      { en: 'Because it is easier to compute.', es: 'Porque es más fácil de calcular.' },
      { en: 'To favour the tropics on purpose.', es: 'Para favorecer a propósito los trópicos.' },
      { en: 'It is a mistake.', es: 'Es un error.' },
    ],
    explain: { en: 'Area weighting keeps a regional mean from over-counting the cramped cells near the poles.', es: 'La ponderación por área evita que la media regional cuente de más las celdas apretadas cerca de los polos.' },
  },
  {
    id: 'linear',
    prompt: { en: 'What is a limit of a straight-line (linear) trend?', es: '¿Cuál es un límite de una tendencia de línea recta (lineal)?' },
    choices: [
      { en: 'It can miss changes that speed up, slow down or reverse over time.', es: 'Puede pasar por alto cambios que se aceleran, frenan o se invierten con el tiempo.' },
      { en: 'It cannot be drawn on a map.', es: 'No se puede dibujar en un mapa.' },
      { en: 'It only works for rainfall.', es: 'Solo funciona con la lluvia.' },
      { en: 'It needs no data.', es: 'No necesita datos.' },
    ],
    explain: { en: 'A line summarises the overall direction. Real systems can curve, which is why the challenge calls linear trends a good start.', es: 'Una línea resume la dirección general. Los sistemas reales pueden curvarse, por eso el reto considera las tendencias lineales un buen comienzo.' },
  },
]

// ---------- Bank 3: real stories ----------
export const STORIES: Story[] = [
  {
    id: 'covid-no2',
    title: { en: 'The day the air cleared', es: 'El día que se despejó el aire' },
    body: {
      en: 'In spring 2020, lockdowns emptied the roads of many big cities. Satellite instruments such as OMI saw less nitrogen dioxide (NO₂) over urban areas, and NASA scientists reported the drop.',
      es: 'En la primavera de 2020, los confinamientos vaciaron las calles de muchas ciudades. Instrumentos satelitales como OMI vieron menos dióxido de nitrógeno (NO₂) sobre las zonas urbanas, y científicos de la NASA reportaron la caída.',
    },
    prompt: { en: 'Why did NO₂ react so fast to the lockdowns?', es: '¿Por qué el NO₂ reaccionó tan rápido a los confinamientos?' },
    choices: [
      { en: 'It comes mostly from burning fuel and lasts only hours in the air, so it follows emissions closely.', es: 'Viene sobre todo de quemar combustibles y dura solo horas en el aire, así que sigue de cerca a las emisiones.' },
      { en: 'It is made by the ocean and changes with tides.', es: 'Lo produce el océano y cambia con las mareas.' },
      { en: 'It lasts for centuries in the atmosphere.', es: 'Dura siglos en la atmósfera.' },
      { en: 'The satellites were turned off.', es: 'Los satélites estaban apagados.' },
    ],
    explain: { en: 'A short lifetime makes NO₂ a sharp “fingerprint” of traffic and industry. Note: our NO₂ layer is demo data; real OMI records are available through NASA Giovanni.', es: 'Su vida corta hace del NO₂ una “huella” nítida del tráfico y la industria. Nota: nuestra capa de NO₂ es de demostración; los registros reales de OMI están en Giovanni de la NASA.' },
    variable: 'no2',
  },
  {
    id: 'ozone-recovery',
    title: { en: 'A hole that is slowly healing', es: 'Un agujero que sana despacio' },
    body: {
      en: 'The Montreal Protocol of 1987 phased out ozone-destroying chemicals. Total ozone over Antarctica fell sharply in the 1980s and 1990s; since around the year 2000 it has stopped getting worse and is slowly recovering.',
      es: 'El Protocolo de Montreal de 1987 eliminó de forma gradual las sustancias que destruyen el ozono. El ozono total sobre la Antártida cayó con fuerza en los años 80 y 90; desde aproximadamente el año 2000 dejó de empeorar y se recupera lentamente.',
    },
    prompt: { en: 'Why do scientists need decades of data before calling it a recovery?', es: '¿Por qué los científicos necesitan décadas de datos para hablar de recuperación?' },
    choices: [
      { en: 'Year-to-year swings are large compared with the slow change, so only a long record reveals the trend.', es: 'Las oscilaciones de un año a otro son grandes frente al cambio lento, así que solo un registro largo revela la tendencia.' },
      { en: 'Because the ozone layer cannot be measured.', es: 'Porque la capa de ozono no se puede medir.' },
      { en: 'Because the protocol was never enforced.', es: 'Porque el protocolo nunca se aplicó.' },
      { en: 'There is no need for decades of data.', es: 'No hacen falta décadas de datos.' },
    ],
    explain: { en: 'Slow recoveries hide behind natural variability. This is exactly why the 10-year minimum exists in our tool.', es: 'Las recuperaciones lentas se esconden tras la variabilidad natural. Por eso existe el mínimo de 10 años en nuestra herramienta.' },
    variable: 'ozone',
  },
  {
    id: 'seasonal-trap',
    title: { en: 'The rainy-season illusion', es: 'La ilusión de la temporada de lluvias' },
    body: {
      en: 'A student plots monthly rainfall for a Yucatán state from February to September and sees it climbing steeply. “Rainfall is increasing!” she announces.',
      es: 'Una estudiante grafica la lluvia mensual de un estado de Yucatán de febrero a septiembre y la ve subir con fuerza. “¡La lluvia está aumentando!”, anuncia.',
    },
    prompt: { en: 'What should she do first?', es: '¿Qué debería hacer primero?' },
    choices: [
      { en: 'Remove the seasonal cycle (use anomalies) and use many years, not a few months.', es: 'Quitar el ciclo estacional (usar anomalías) y usar muchos años, no unos meses.' },
      { en: 'Publish the result right away.', es: 'Publicar el resultado de inmediato.' },
      { en: 'Delete the dry months.', es: 'Borrar los meses secos.' },
      { en: 'Switch to a different state.', es: 'Cambiar de estado.' },
    ],
    explain: { en: 'The rise is the normal start of the wet season, not a trend. Comparing each month with its own typical value removes that illusion.', es: 'El aumento es el inicio normal de la temporada de lluvias, no una tendencia. Comparar cada mes con su propio valor típico quita esa ilusión.' },
    variable: 'precipitation',
    region: 'mexico',
  },
  {
    id: 'enso-opposites',
    title: { en: 'Same cause, opposite signs', es: 'Misma causa, signos opuestos' },
    body: {
      en: 'During El Niño years, northern South America (Colombia, Venezuela) tends to get drier, while southern Brazil, Uruguay and northern Argentina tend to get wetter. One climate pattern, two opposite effects.',
      es: 'En los años de El Niño, el norte de Sudamérica (Colombia, Venezuela) tiende a ser más seco, mientras que el sur de Brasil, Uruguay y el norte de Argentina tienden a ser más húmedos. Un patrón climático, dos efectos opuestos.',
    },
    prompt: { en: 'What does this teach about averaging a whole continent?', es: '¿Qué enseña esto sobre promediar todo un continente?' },
    choices: [
      { en: 'Opposite trends can cancel out, so a continental average may hide real regional changes.', es: 'Las tendencias opuestas pueden cancelarse, así que un promedio continental puede ocultar cambios regionales reales.' },
      { en: 'A continental average is always the most accurate view.', es: 'El promedio continental siempre es la vista más precisa.' },
      { en: 'El Niño only affects the ocean.', es: 'El Niño solo afecta al océano.' },
      { en: 'Opposite signs mean the data are wrong.', es: 'Los signos opuestos significan que los datos están mal.' },
    ],
    explain: { en: 'This is the heart of the challenge: look region by region. Try the “South America” zone and compare states.', es: 'Este es el corazón del reto: mira región por región. Prueba la zona “Sudamérica” y compara estados.' },
    variable: 'precipitation',
    region: 'south_america',
  },
  {
    id: 'short-window',
    title: { en: 'Five years that fooled a team', es: 'Cinco años que engañaron a un equipo' },
    body: {
      en: 'A team studies 2015–2019, sees values jumping upward, and declares a strong trend. Those years include one of the strongest El Niño events on record.',
      es: 'Un equipo estudia 2015–2019, ve que los valores suben de golpe y declara una tendencia fuerte. Esos años incluyen uno de los eventos de El Niño más intensos registrados.',
    },
    prompt: { en: 'What is the main problem with their conclusion?', es: '¿Cuál es el problema principal de su conclusión?' },
    choices: [
      { en: 'A short window can be dominated by a natural event; it cannot show a lasting trend.', es: 'Una ventana corta puede estar dominada por un evento natural; no puede mostrar una tendencia duradera.' },
      { en: 'Five years is too long.', es: 'Cinco años es demasiado.' },
      { en: 'El Niño is not natural.', es: 'El Niño no es natural.' },
      { en: 'Data from 2015 do not exist.', es: 'No existen datos de 2015.' },
    ],
    explain: { en: 'Try it in the Explorer: drag the year slider to a short period and watch the verdict change.', es: 'Pruébalo en el Explorador: mueve el control de años a un periodo corto y mira cómo cambia el veredicto.' },
    variable: 'precipitation',
  },
  {
    id: 'soil-early',
    title: { en: 'Drought starts underfoot', es: 'La sequía empieza bajo los pies' },
    body: {
      en: 'Farmers often notice dry fields weeks before rivers drop. Soil moisture reacts quickly to missing rain, while streamflow responds later as groundwater slowly drains.',
      es: 'Los agricultores suelen notar los campos secos semanas antes de que bajen los ríos. La humedad del suelo reacciona rápido a la falta de lluvia, mientras el caudal responde más tarde, cuando el agua subterránea se va vaciando.',
    },
    prompt: { en: 'Why is soil moisture a useful early warning of drought?', es: '¿Por qué la humedad del suelo es una buena alerta temprana de sequía?' },
    choices: [
      { en: 'It responds first to a lack of rain, before rivers and groundwater do.', es: 'Responde primero a la falta de lluvia, antes que los ríos y el agua subterránea.' },
      { en: 'It never changes.', es: 'Nunca cambia.' },
      { en: 'It only matters in winter.', es: 'Solo importa en invierno.' },
      { en: 'Rivers always change first.', es: 'Los ríos siempre cambian primero.' },
    ],
    explain: { en: 'Comparing soil moisture and runoff on the map can show which one reacts first in a region.', es: 'Comparar humedad del suelo y escurrimiento en el mapa puede mostrar cuál reacciona primero en una región.' },
    variable: 'soil_moisture',
  },
  {
    id: 'dimming',
    title: { en: 'Is the Sun getting dimmer?', es: '¿Se está apagando el Sol?' },
    body: {
      en: 'Many ground stations recorded less sunlight reaching the surface from the 1950s to the 1980s (“global dimming”), then a partial recovery (“brightening”) in several regions. The Sun itself barely changed.',
      es: 'Muchas estaciones en tierra registraron menos luz solar llegando a la superficie de los años 50 a los 80 (“oscurecimiento global”), y luego una recuperación parcial (“aclarado”) en varias regiones. El Sol casi no cambió.',
    },
    prompt: { en: 'What can change the sunlight reaching the ground besides the Sun?', es: '¿Qué puede cambiar la luz solar que llega al suelo además del Sol?' },
    choices: [
      { en: 'Clouds and airborne particles (aerosols), such as those from air pollution.', es: 'Las nubes y las partículas en el aire (aerosoles), como las de la contaminación.' },
      { en: 'The Moon’s phase.', es: 'La fase de la Luna.' },
      { en: 'Ocean tides.', es: 'Las mareas del océano.' },
      { en: 'Nothing; it is constant.', es: 'Nada; es constante.' },
    ],
    explain: { en: 'Surface radiation records mix the Sun with the atmosphere in between, which makes them a window into air quality as well.', es: 'Los registros de radiación en superficie mezclan al Sol con la atmósfera intermedia, así que también son una ventana a la calidad del aire.' },
    variable: 'solar_radiation',
  },
  {
    id: 'urban-runoff',
    title: { en: 'When the city paves the soil', es: 'Cuando la ciudad pavimenta el suelo' },
    body: {
      en: 'As a city grows, roofs and asphalt replace soil and plants. The same storm that once soaked into the ground now runs quickly into drains and streams.',
      es: 'Cuando una ciudad crece, los techos y el asfalto sustituyen al suelo y las plantas. La misma tormenta que antes se absorbía ahora corre rápido hacia drenajes y arroyos.',
    },
    prompt: { en: 'What would you expect to see in the surface runoff of a rapidly urbanising area?', es: '¿Qué esperarías ver en el escurrimiento superficial de un área que se urbaniza rápido?' },
    choices: [
      { en: 'More runoff for the same rain, with a higher flood risk.', es: 'Más escurrimiento con la misma lluvia y mayor riesgo de inundación.' },
      { en: 'Less runoff, because pavement absorbs water.', es: 'Menos escurrimiento, porque el pavimento absorbe agua.' },
      { en: 'No change at all.', es: 'Ningún cambio.' },
      { en: 'Runoff turns into snow.', es: 'El escurrimiento se convierte en nieve.' },
    ],
    explain: { en: 'Land cover matters as much as rainfall. Note: our runoff layer is demo data until real GLDAS records are loaded.', es: 'La cobertura del suelo importa tanto como la lluvia. Nota: nuestra capa de escurrimiento es de demostración hasta cargar registros reales de GLDAS.' },
    variable: 'surface_runoff',
  },
]

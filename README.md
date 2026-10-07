# Tisenda Web

Ejemplo de cliente web para el RAG (generación aumentada por recuperación) de Tisenda. Permite consultar documentos mediante preguntas en lenguaje natural y se conecta a `tisenda-api`, que recupera información de los documentos indexados y genera respuestas con fuentes.

La aplicación es una SPA renderizada en el navegador. Este repositorio contiene el frontend; el backend y la indexación de documentos se ejecutan por separado.

## Contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración](#configuración)
- [Uso](#uso)
- [Comandos disponibles](#comandos-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Integración con la API](#integración-con-la-api)
- [Compilación y despliegue](#compilación-y-despliegue)
- [Desarrollo](#desarrollo)

## Características

- Consulta de documentos desde una interfaz de chat.
- Respuestas en Markdown con citas que permiten abrir y enfocar la fuente correspondiente.
- Fuentes con nombre de archivo, ruta, encabezados, páginas de PDF cuando están disponibles y fragmento consultado.
- Cancelación de consultas, reintento manual y limpieza del historial.
- Indicador de conexión con la API.
- Tema claro y oscuro, con preferencia guardada en el navegador.

## Tecnologías

| Área | Herramientas |
| --- | --- |
| Interfaz | React 19 y TypeScript |
| Desarrollo y compilación | Vite 8 y Bun |
| Rutas | TanStack Router, con rutas basadas en archivos |
| Consultas y estado remoto | TanStack Query |
| Estilos y componentes | Tailwind CSS 4, shadcn/ui y Base UI |
| Renderizado de respuestas | react-markdown y remark-gfm |
| Formato y análisis de código | Biome |

## Requisitos

- Bun instalado para gestionar dependencias y ejecutar los comandos del proyecto.
- El backend `tisenda-api` en ejecución, con sus servicios e índice de documentos configurados según su propio README.
- Un navegador moderno.

## Instalación y ejecución

Desde la raíz del repositorio, instala las dependencias:

```bash
bun install --frozen-lockfile
```

Inicia `tisenda-api` por separado. Por defecto, el frontend espera encontrarlo en `http://127.0.0.1:3000`.

Arranca el servidor de desarrollo:

```bash
bun run dev
```

Abre <http://localhost:5173>. El puerto es fijo: si está ocupado, Vite detendrá el arranque.

## Configuración

| Variable | Valor predeterminado | Propósito |
| --- | --- | --- |
| `API_PROXY_TARGET` | `http://127.0.0.1:3000` | Dirección del backend al que Vite reenvía las consultas durante el desarrollo. |

Para usar otro puerto o servidor, proporciona la variable al iniciar Vite:

```bash
API_PROXY_TARGET=http://127.0.0.1:4000 bun run dev
```

El proxy de desarrollo reenvía únicamente `/api/query` y `/api/health`, eliminando el prefijo `/api`. `API_PROXY_TARGET` configura ese proxy y no se incorpora al código del navegador. Las credenciales del modelo se configuran exclusivamente en el backend.

## Uso

1. Escribe una pregunta y pulsa **Enter** para enviarla. Usa **Shift+Enter** para insertar un salto de línea.
2. Consulta la respuesta y pulsa una cita, como `[1]`, para ver el fragmento asociado en **Fuentes**.
3. Si la consulta falla o se cancela, usa **Reintentar** para enviarla de nuevo.
4. Pulsa **Nueva consulta** para cancelar la espera actual y borrar el historial.

Solo se procesa una consulta a la vez. El historial permanece en memoria y se pierde al recargar la página. Cada pregunta se envía de forma independiente: la API no recibe las preguntas ni las respuestas anteriores y devuelve la respuesta completa, sin streaming.

El botón de sol/luna cambia el tema. Inicialmente se sigue la preferencia del sistema; una selección manual se guarda en `localStorage` con la clave `tisenda-theme`.

Las fuentes muestran el contexto indexado que recibió el modelo. Sus rutas son informativas y no permiten descargar documentos. Una respuesta sin fuentes se presenta como falta de evidencia suficiente. Esta interfaz no incluye carga ni indexación de archivos.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `bun run dev` | Inicia el servidor de desarrollo en el puerto 5173. |
| `bun run generate-routes` | Genera el árbol de rutas de TanStack Router. |
| `bun run tsc --noEmit` | Comprueba los tipos de TypeScript sin generar archivos. |
| `bun run lint` | Ejecuta el análisis de código con Biome. |
| `bun run format` | Comprueba el formato con Biome. |
| `bun run check` | Ejecuta las comprobaciones de Biome. |
| `bun run build` | Genera la aplicación de producción en `dist/`. |
| `bun run preview` | Sirve localmente la compilación de producción. |

Para aplicar las correcciones de formato, ejecuta `bun run format --write`.

## Estructura del proyecto

```text
src/
├── components/
│   ├── ui/                  # Componentes de interfaz compartidos
│   ├── rag-chat.tsx         # Interfaz de consulta
│   ├── rag-answer.tsx       # Markdown y citas de las respuestas
│   ├── rag-sources.tsx      # Fuentes y fragmentos consultados
│   └── theme-provider.tsx   # Estado y persistencia del tema
├── hooks/
│   └── use-rag-chat.ts      # Consultas, historial, cancelación y salud de la API
├── integrations/
│   └── tanstack-query/     # Configuración de TanStack Query
├── lib/
│   └── rag-api.ts           # Cliente HTTP y validación de respuestas
├── routes/                 # Rutas basadas en archivos
├── main.tsx                # Punto de entrada de React
├── router.tsx              # Configuración del router
├── routeTree.gen.ts        # Árbol de rutas generado automáticamente
└── styles.css              # Estilos globales
```

`index.html` define el documento HTML y `vite.config.ts` configura los plugins, el servidor de desarrollo y el proxy de la API.

## Integración con la API

El contrato del cliente está definido en [`src/lib/rag-api.ts`](src/lib/rag-api.ts) y corresponde a los tipos y endpoints de `tisenda-api`. El backend documenta su API en `/openapi.json` y `/docs`.

| Petición del frontend | Endpoint del backend | Función |
| --- | --- | --- |
| `POST /api/query` | `POST /query` | Envía una pregunta y obtiene una respuesta con fuentes. |
| `GET /api/health` | `GET /health` | Comprueba la disponibilidad HTTP de la API. |

La consulta envía únicamente este cuerpo JSON:

```json
{
  "question": "¿Qué información contienen los documentos sobre este tema?"
}
```

La respuesta contiene `text` y `sources`. Cada fuente incluye `id`, `filename`, `source_key`, `location` y `excerpt`. En `location`, `kind` indica el formato; `page_numbers` y `headings` son opcionales y se omiten cuando no están disponibles. El cliente valida la estructura y rechaza identificadores duplicados. Las citas se resuelven mediante `sources[].id`, no por su posición en la lista.

Los errores de la API usan el cuerpo `{ "error": "..." }` y los estados HTTP 400, 500, 502 o 503. La interfaz permite reintentos manuales, sin repetir automáticamente la generación. El backend controla la recuperación, incluido `TOP_K`, y valida las citas; si siguen siendo inválidas tras un intento de corrección, devuelve 502.

El endpoint de salud solo confirma disponibilidad HTTP; no comprueba el índice ni los servicios de recuperación y generación. Cancelar una consulta detiene la espera del navegador, pero no garantiza detener la generación en el backend.

## Compilación y despliegue

Valida y compila el proyecto:

```bash
bun run generate-routes
bun run tsc --noEmit
bun run check
bun run build
```

Publica el contenido de `dist/` en el servidor de alojamiento. Configura el servidor para:

- Reenviar `/api/query` y `/api/health` al backend, eliminando `/api` antes de enviar la petición.
- Devolver 404 para otras rutas `/api/*`.
- Servir `index.html` como fallback para las rutas del frontend, después de resolver las peticiones de la API, de modo que los enlaces directos y las recargas funcionen.

El alojamiento estático por sí solo no proporciona el proxy de la API. El proxy configurado para desarrollo no forma parte de los archivos generados en `dist/`.

Puedes revisar la compilación localmente con `bun run preview`; para probar consultas, el entorno de previsualización también debe proporcionar acceso a la API en `/api/query` y `/api/health`.

## Desarrollo

Añade nuevas rutas en `src/routes/`. El layout raíz se encuentra en `src/routes/__root.tsx` y la página de consulta en `src/routes/index.tsx`. TanStack Router genera `src/routeTree.gen.ts` durante el desarrollo y la compilación; evita editarlo manualmente.

El router comparte una instancia de `QueryClient` con los componentes mediante `QueryClientProvider`. Los componentes de UI viven en `src/components/ui/` y los estilos globales en `src/styles.css`.

Las respuestas se renderizan como Markdown sin ejecutar HTML ni cargar imágenes incrustadas. Conserva este comportamiento y la relación entre los identificadores de las fuentes y las citas al modificar la interfaz de respuestas.

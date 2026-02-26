<p align="center">
  <img src="assets/logo.png" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-sfx"><img src="https://img.shields.io/npm/v/claude-sfx" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Retroalimentación de audio procedimental para [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Cada llamada a una herramienta, edición de archivo, búsqueda, envío a Git y despliegue de agente genera un sonido distinto, sintetizado a partir de matemáticas, no de archivos de audio.

## Inicio rápido

```bash
npm install -g claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

Eso es todo. Claude Code ahora reproducirá sonidos mientras trabaja.

## ¿Por qué retroalimentación de audio?

Cuando un agente de IA lee, escribe, busca y despliega en su nombre, pierde visibilidad. Está mirando texto que se desplaza. La retroalimentación de audio restablece la conciencia:

- **Accesibilidad** — escuche los cambios de estado, los errores y las finalizaciones sin tener que mirar la terminal.
- **Flujo** — sepa si una prueba ha pasado o si un envío se ha completado sin tener que cambiar de contexto.
- **Presencia** — el agente se siente como un colaborador, no como una caja negra.

## Los 7 verbos

Cada acción de Claude Code se corresponde con uno de 7 verbos principales. Los modificadores (estado, alcance, dirección) alteran el sonido sin romper la coherencia.

| Verb | Disparadores | Sound |
|---|---|---|
| **entrada** | `Leer`, `WebFetch`, `WebSearch` | Onda sinusoidal ascendente — algo que entra. |
| **transformación** | `Edit` | Pulso texturizado con FM — remodelación. |
| **confirmación** | `Escribir`, `NotebookEdit`, `git commit` | Tono de sello nítido — sellado. |
| **navegación** | `Grep`, `Glob` | Eco de sonar — escaneo. |
| **ejecución** | `Bash`, `npm test`, `tsc` | Estallido de ruido + tono — acción mecánica. |
| **movimiento** | `mv`, `cp`, inicio de subagente. | Sonido de viento — desplazamiento de aire. |
| **sincronización** | `git push`, `git pull` | Sonido de viento dramático + ancla tonal. |

### Modificadores

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Detección inteligente de Bash

El controlador de ganchos inspecciona los comandos de Bash para seleccionar el sonido correcto:

| Comando de Bash | Verb | Estado |
|---|---|---|
| `git push` | sincronización (subida) | según el código de salida |
| `git pull` | sincronización (bajada) | según el código de salida |
| `npm test`, `pytest` | ejecución | según el código de salida |
| `tsc`, `npm run build` | ejecución | según el código de salida |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| todo lo demás | ejecución | según el código de salida |

## Perfiles

Paletas de sonido que cambian todo el carácter con una sola opción.

| Perfil | Carácter |
|---|---|
| **mínimo** (predeterminado) | Tonos de onda sinusoidal — sutil, profesional, para uso diario. |
| **retro** | Sonidos chirriantes de onda cuadrada de 8 bits — divertido pero controlado. |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Perfiles personalizados

Copie `profiles/minimal.json`, edite los parámetros de síntesis y cárguelo:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Cada número en el archivo JSON se corresponde directamente con el motor de síntesis: forma de onda, frecuencia, duración, envolvente (ADSR), profundidad de FM, ancho de banda, ganancia.

## Anti-molestias

Lo que diferencia un producto de un juguete.

| Función | Comportamiento |
|---|---|
| **Debounce** | El mismo verbo dentro de 200 ms → un sonido. |
| **Rate limit** | Máximo 8 sonidos por ventana de 10 segundos. |
| **Quiet hours** | Todos los sonidos se suprimen durante las horas configuradas. |
| **Mute** | Alternancia instantánea, persiste al reiniciar la sesión. |
| **Volume** | Control de ganancia de 0 a 100. |
| **Per-verb disable** | Desactive los verbos específicos que no desee. |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambiente (operaciones de larga duración)

Para comandos que tardan un tiempo (compilaciones, despliegues, conjuntos de pruebas grandes):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Sonidos de sesión

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Todos los comandos

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## Cómo funciona

Sin archivos de audio. Cada sonido se sintetiza en tiempo de ejecución a partir de matemáticas:

- **Osciladores** — seno, cuadrada, diente de sierra, triángulo, ruido blanco.
- **Envolventes ADSR** — ataque, decaimiento, sostenimiento, liberación.
- **Síntesis FM** — modulación de frecuencia para crear texturas.
- **Filtro de estado variable** — ruido filtrado en banda para efectos de "whoosh".
- **Barridos de frecuencia** — interpolación lineal para crear movimiento.
- **Limitador de volumen** — compresión de rodilla suave, límite máximo.

Todo el paquete tiene aproximadamente 2800 líneas de código TypeScript y no tiene dependencias para producción. Los sonidos se generan como buffers PCM, se codifican a WAV en memoria y se reproducen a través del reproductor de audio nativo del sistema operativo (PowerShell en Windows, afplay en macOS, aplay en Linux).

## Requisitos:

- Node.js 18 o superior.
- Claude Code.
- Salida de audio del sistema (altavoces o auriculares).

## Licencia:

[MIT](LICENSE)

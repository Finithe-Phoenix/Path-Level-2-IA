# M02 · El pedido de cero unidades

El taller sigue un fallo de límite en una función Python. La cámara pasa del pedido mínimo de una unidad a la terminal, sigue la traza hasta la aserción y se acerca al operador que se modifica en el editor. El último capítulo plantea otro límite en un ejercicio independiente. La imagen se compone a 1920 × 1080 sobre un reloj de 24 fotogramas por segundo.

## De dónde sale lo que se ve

| Material | Procedencia y edición |
| --- | --- |
| Función, tres pruebas y ticket | La carpeta `fixture/` conserva el ejercicio público de partida. `5d0254a9` identifica el commit de origen. [Abrir el ejercicio original](https://github.com/Finithe-Phoenix/Path-Level-2-IA/tree/5d0254a9f129834b8d0a8d7c8c1e59bb7367335b/lab) |
| Consola | `record.py` inicia Bash en un pseudoterminal, teclea los comandos en copias temporales del ejercicio y conserva lo que imprimieron Python y Git. Los diez archivos `.cast` retienen las pulsaciones que aparecieron en pantalla y sus marcas de tiempo. Los `.txt` retienen la salida completa. |
| Imágenes de la terminal | `evidence/native-baseline.png`, `native-red.png` y `native-green.png` son capturas de Xfce Terminal durante tres nuevas ejecuciones. El directorio y el prompt que se rotulan en pantalla identifican el entorno de demostración. El tiempo de ejecución y la ruta temporal pueden diferir de los del pseudoterminal. |
| Toma continua | [Abrir la grabación de terminal](evidence/terminal-run.mp4). La ventana muestra una corrida que falla, la edición del archivo con `sed`, el diff real y una nueva corrida del mismo comando. El proceso automatiza pulsaciones normales en X11. |
| Cambio en el editor | `editor/before.png` y `editor/after.png` recogen una edición real de la línea 3 en OpenVSCode Server 1.109.5. El registro de captura comprueba el archivo guardado. [Repetir la captura de Code OSS](editor/README.md) |
| Comparador mecánico | `art/zero-instrument.png` es una ilustración original generada para este episodio. El indicador en cero enlaza la metáfora con el límite numérico. El movimiento de cámara, el corte de la apertura y los signos animados se editan en `scene.cjs`. |
| Plan y Agent | Las instrucciones en pantalla son ejemplos que el alumno puede introducir en VS Code. Las ampliaciones tipográficas, la recta y las indicaciones de foco son animaciones del taller. |

## Repetir la ejecución

Desde este directorio, usa Bash, Git y Python 3 en el workspace. El ejecutable `python` debe corresponder a Python 3. Cada corrida crea su propio checkout temporal. El script compara el resultado de los casos de cero y del límite superior antes de escribir el índice.

```sh
python3 record.py --out /tmp/quantity-capture
cat /tmp/quantity-capture/red.txt
cat /tmp/quantity-capture/green.txt
```

El comando de validación se mantiene en las tres corridas.

```sh
python -B -m unittest discover -s tests -v
```

La suite inicial pasa tres métodos. Con solo la regresión añadida, `test_rejects_zero` falla con `AssertionError: True is not false`. Después del cambio de `>=` a `>`, el mismo comando pasa los cuatro métodos. Las tomas `upper-red` y `upper-green` pertenecen al ejercicio separado. Muestran qué ocurre con la unidad 100 cuando el pedido admite de 1 a 100 inclusive.

Para renovar las capturas nativas instala Xfce Terminal, X11 e ImageMagick en el workspace. Usa un display reservado para el ejercicio y da a la utilidad su identificador. El programa abre cada caso en su propia ventana y captura solo esa ventana. La toma continua requiere también FFmpeg con x11grab y la biblioteca XTest. Las capturas del editor tienen su propio procedimiento enlazado en la tabla.

```sh
python3 capture-terminal.py --display "$TRAINING_DISPLAY" --out /tmp/quantity-screens
python3 capture-film.py --display "$TRAINING_DISPLAY" --out /tmp/quantity-run.mp4
```

Para empaquetar una nueva versión, revisa las salidas temporales, copia las tomas elegidas a `evidence/` y ejecuta las comprobaciones antes de rehacer el episodio. Si sustituyes la ilustración con Pillow, genera el JPEG usado en pantalla con `Image.open(source).convert("RGB").save(target, quality=88, subsampling=1, optimize=True)`.

## Montaje y sincronía

`scene.cjs` expone `frame({scene,progress,seconds,index,episode})`. Devuelve un SVG autónomo. `seconds` está en segundos desde el comienzo del capítulo. `scene.beats[].start` fija el comienzo de cada acción de acuerdo con la voz, y `scene.durationFrames` fija el final. Para un fragmento corto se puede pasar el subconjunto ordenado de beats que se escucha en ese fragmento. `castingFrame()` devuelve la misma vista fija del editor para todos los candidatos de voz.

La cámara del terminal está expresada en píxeles de las capturas nativas. Cuando cambie el tamaño de una captura, ajusta los encuadres de `terminalShot` o `sourceView`, según corresponda. El plano mecánico del cambio en `operator` conserva el ángulo y retira las dos barras del signo igual. El reto del último capítulo mantiene las tres respuestas ocultas durante el beat `challenge`. La revelación empieza en el siguiente beat de voz.

## Comprobación

La verificación revisa la correspondencia entre las diez grabaciones y sus transcripciones, el fallo y el éxito de ambos ejercicios y el ocultamiento de la solución durante la práctica. Evalúa seis instantes por cada uno de los 23 beats. Desde este directorio se pueden usar los tiempos de muestra o los tiempos reales de la voz.

```sh
node verify.cjs
node verify.cjs --timing ../audio/episode.json
```

Para inspeccionar fotogramas individualmente, añade `--frames /tmp/quantity-frames` a cualquiera de los comandos. Cada SVG incluye las imágenes que necesita.

En la toma provisional inglesa de esta edición, M02 dura 7.113 fotogramas, unos 4 minutos y 56 segundos. Se comprobó la entrada de los ocho capítulos con sus tiempos reales. Durante la práctica se observaron los tres signos de interrogación al comienzo, a la mitad y hasta el último fotograma completo de la pausa de cinco segundos. La revisión de los 138 fotogramas de muestra en Chromium incluyó la apertura, el fallo ampliado y el corte óptico que conecta la traza real con su explicación.

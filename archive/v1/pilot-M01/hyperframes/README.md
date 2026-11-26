# Demo animada en HyperFrames

`build-v2.mjs` lee `../episodio-v2.json` y escribe `v2/index.html` a 1920 × 1080 y 24 fps. El arreglo de acciones de cada escena indica el momento, el comando o fragmento, y el resultado que se muestra. Los comandos son texto de demostración. La revisión representa a una persona con su propia cuenta.

```sh
npm ci
node build-v2.mjs
DO_NOT_TRACK=1 npx --no-install hyperframes browser ensure
DO_NOT_TRACK=1 npx --no-install hyperframes lint v2
DO_NOT_TRACK=1 npx --no-install hyperframes render v2 --output ../piloto-hyperframes-v2.mp4 --quality looks
```

El generador toma la narración de `../narracion-v2.wav` si está disponible. Usa `node build-v2.mjs --silent` para renderizar primero la imagen y montar el audio después. `demo-v2.css` y `motion-v2.js` controlan el diseño y los movimientos, sincronizados con el tiempo de la composición.

Ejecuta los comandos desde esta carpeta, dentro del workspace remoto. El render usa Node.js 22 o superior, FFmpeg y un navegador headless. Para utilizar un navegador que ya está instalado, configura `PRODUCER_HEADLESS_SHELL_PATH` con su ruta. Si el workspace restringe la escritura en el directorio de usuario, configura `HYPERFRAMES_CACHE_DIR` y `HYPERFRAMES_CONFIG_DIR` con rutas escribibles. El CLI usa conexiones locales para comunicar el proceso de render y Chromium.

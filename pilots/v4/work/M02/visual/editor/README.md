# Captura del cambio en el editor

Las dos imágenes proceden de OpenVSCode Server 1.109.5, distribución de código abierto del editor basada en Code OSS. Chromium muestra un checkout sintético aislado a 1920 × 1080. La captura selecciona el operador en la línea de retorno, lo edita en el editor y comprueba en disco que el archivo guardado contiene `return quantity > 0`. Las tomas de terminal del episodio registran las ejecuciones correspondientes en el mismo tipo de fixture.

Para rehacer las tomas, instala Python con Playwright y un Chromium local en el workspace Linux. Descarga el binario de Linux x64 desde la [versión de OpenVSCode Server](https://github.com/gitpod-io/openvscode-server/releases/tag/openvscode-server-v1.109.5). El SHA-256 del archivo comprimido usado es `b433bf4f0227321a7014d8460d10a8f958adc0f45aa79bd889e84e65e8f88363`. Desde la carpeta visual, apunta el argumento al ejecutable descomprimido.

```bash
python editor/capture.py --engine /ruta/openvscode-server/bin/openvscode-server --fixture fixture --output editor
```

El script usa una copia temporal del ejercicio, un puerto de loopback y una credencial efímera para la sesión local. Las indicaciones de Plan y Agent en el taller son ejemplos editables que el participante puede usar con su cuenta autorizada.

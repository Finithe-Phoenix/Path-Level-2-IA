import {copyFile, mkdir, readFile} from 'node:fs/promises';
import {basename} from 'node:path';

const episode = JSON.parse(await readFile(new URL('../../episodio-v2.json', import.meta.url), 'utf8'));
if (typeof episode.audio !== 'string' || !episode.audio || basename(episode.audio) !== episode.audio) {
  throw new Error('El campo audio debe indicar el nombre de un archivo en la carpeta del episodio.');
}

const publicDirectory = new URL('../public/', import.meta.url);
await mkdir(publicDirectory, {recursive: true});
await copyFile(new URL(encodeURIComponent(episode.audio), new URL('../../', import.meta.url)),
  new URL(encodeURIComponent(episode.audio), publicDirectory));

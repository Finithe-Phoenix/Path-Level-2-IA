import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {animationWindows} from '../src/timing.ts';

const root = new URL('../', import.meta.url);
const episode = JSON.parse(await readFile(new URL('../episodio-v2.json', root), 'utf8'));
const source = process.argv[2] ?? fileURLToPath(new URL('out/motion-v2.mp4', root));
const output = process.argv[3] ?? fileURLToPath(new URL('../piloto-remotion-v2.mp4', root));
const windows = animationWindows(episode.scenes, episode.fps);
let compressedFrames = 0;
let totalFrames = 0;
const offsets = [];

for (const window of windows) {
  compressedFrames += window.rendered;
  totalFrames += window.duration;
  const hold = window.duration - window.rendered;
  if (hold > 0) offsets.push(`gte(N,${compressedFrames})*${hold}`);
}

const last = windows.at(-1);
const lastHold = last.duration - last.rendered;
const time = ['N', ...offsets].join('+');
const filter = [
  `setpts='(${time})/(${episode.fps}*TB)'`,
  `fps=${episode.fps}:eof_action=pass`,
  `tpad=stop_mode=clone:stop=${lastHold}`,
].join(',');

const check = spawnSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames',
  '-of', 'default=noprint_wrappers=1:nokey=1', source,
], {encoding: 'utf8'});
if (check.error) throw check.error;
if (check.status !== 0 || Number(check.stdout.trim()) !== compressedFrames) {
  throw new Error(`The compact render must have ${compressedFrames} frames. ${check.stderr.trim()}`);
}

const render = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-an',
  '-vf', filter, '-frames:v', String(totalFrames),
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
], {stdio: 'inherit'});

if (render.error) throw render.error;
if (render.status !== 0) process.exit(render.status ?? 1);

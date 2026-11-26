import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const parent = new URL('../', import.meta.url);
const buildDirectory = new URL('./v2/', import.meta.url);
const episode = JSON.parse(await readFile(new URL('episodio-v2.json', parent), 'utf8'));
const { width, height, fps, scenes, title, audio } = episode;
if (width !== 1920 || height !== 1080 || fps !== 24 || !scenes.length) {
  throw new Error('El piloto v2 requiere 1920 × 1080, 24 fps y un guion con escenas.');
}

const topics = {
  intro: ['Training workspace', 'Order validator', 'Repo'],
  issue: ['GitHub', 'Issue #17', 'Issue'],
  plan: ['Copilot in VS Code', 'Scope the change', 'Plan'],
  regression: ['VS Code · Terminal', 'Regression test', 'Tests'],
  fix: ['Copilot in VS Code', 'Change in the editor', 'Fix'],
  diff: ['VS Code · Source Control', 'Branch changes', 'Diff'],
  pr: ['Remote terminal · GitHub CLI', 'Pull request', 'PR'],
  review: ['Remote terminal · GitHub CLI', 'Independent review', 'Review'],
  closure: ['Training repository', 'Verified workflow', 'Practice'],
};

let frames = 0;
const timeline = scenes.map((scene) => {
  const durationFrames = Math.round(scene.duration * fps);
  if (!topics[scene.id] || durationFrames < 1 || !Number.isFinite(scene.duration) || !scene.actions?.length) {
    throw new Error(`La escena ${scene.id} necesita una duración y acciones.`);
  }
  const actions = [...scene.actions].sort((a, b) => a.at - b.at);
  if (actions.some(({ at, title, code }) => !Number.isFinite(at)
    || at < 0 || at >= scene.duration || typeof title !== 'string' || typeof code !== 'string')) {
    throw new Error(`Acción inválida en la escena ${scene.id}.`);
  }

  const [environment, tab, mode] = topics[scene.id];
  const sceneStart = frames / fps;
  frames += durationFrames;
  return { ...scene, actions, environment, tab, mode, sceneStart, duration: durationFrames / fps };
});
const duration = frames / fps;
const safeTitle = title.replace(/[&<>]/g, (value) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[value]);

await mkdir(buildDirectory, { recursive: true });
let sound = '';
if (audio && !process.argv.includes('--silent')) {
  if (audio !== 'narracion-v2.wav') throw new Error('Audio v2 inválido.');
  const target = new URL(audio, buildDirectory);
  try {
    await copyFile(new URL(audio, parent), target);
    sound = `<audio id="narracion-v2" src="${audio}" data-start="0" data-duration="${duration}"></audio>`;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await rm(target, { force: true });
    process.stderr.write('La composición se generó sin narración.\n');
  }
}

const [styles, motion] = await Promise.all([
  readFile(new URL('./demo-v2.css', import.meta.url), 'utf8'),
  readFile(new URL('./motion-v2.js', import.meta.url), 'utf8'),
]);

await writeFile(new URL('index.html', buildDirectory), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>${styles}</style>
</head>
<body>
<main id="film" data-composition-id="piloto-v2" data-start="0" data-duration="${duration}"
  data-width="${width}" data-height="${height}" data-fps="${fps}" data-no-timeline>
  <div class="background-light" aria-hidden="true"></div>
  <header class="film-header">
    <div class="series"><span class="series-mark" aria-hidden="true"></span><span>${safeTitle}</span></div>
    <div class="environment"><b></b><span id="environment"></span></div>
  </header>
  <aside class="teaching-copy">
    <div class="eyebrow" id="eyebrow"></div>
    <h1 id="scene-title"></h1>
    <p id="scene-body"></p>
    <ul id="focus-list" class="focus-list"></ul>
  </aside>
  <div class="app" id="app">
    <div class="app-titlebar">
      <div class="traffic" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="app-tab" id="app-tab"></div>
      <div class="app-context" id="app-context"></div>
    </div>
    <div class="app-main">
      <nav aria-label="Demo workflow" id="workflow"></nav>
      <div class="command-stage">
        <div class="surface" id="surface">
          <div class="action-label"><span class="action-icon" id="action-icon" aria-hidden="true"></span><span id="action-title"></span></div>
          <div class="command"><span id="prompt" aria-hidden="true"></span><pre><code id="command-code"></code><span id="caret" class="caret" aria-hidden="true"></span></pre></div>
          <div class="result" id="result-panel"><span class="result-marker" aria-hidden="true"></span><pre id="result"></pre></div>
          <ol class="action-trace" id="action-trace" aria-label="Actions in this step"></ol>
        </div>
        <div class="pointer" id="pointer" aria-hidden="true"></div>
      </div>
    </div>
    <div class="app-footer"><span id="status"></span><span id="action-progress"></span></div>
  </div>
  <footer class="film-footer">
    <ol id="step-rail" aria-label="Scenes"></ol>
    <span id="timecode"></span>
  </footer>
  ${sound}
</main>
<script id="episode-data" type="application/json">${JSON.stringify({ title, duration, timeline }).replaceAll('<', '\\u003c')}</script>
<script>${motion}</script>
</body>
</html>
`);

process.stdout.write(`v2/index.html: ${timeline.length} escenas, ${frames} cuadros, ${duration} s.\n`);

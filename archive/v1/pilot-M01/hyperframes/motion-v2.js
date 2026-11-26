(() => {
  const byId = (id) => document.getElementById(id);
  const { timeline, duration } = JSON.parse(byId('episode-data').textContent);
  const stage = byId('film');
  const app = byId('app');
  const workflow = byId('workflow');
  const rail = byId('step-rail');
  const title = byId('scene-title');
  const body = byId('scene-body');
  const eyebrow = byId('eyebrow');
  const list = byId('focus-list');
  const surface = byId('surface');
  const command = byId('command-code');
  const caret = byId('caret');
  const result = byId('result');
  const resultPanel = byId('result-panel');
  const pointer = byId('pointer');
  const writing = byId('status');
  const clock = byId('timecode');

  const makeTextNodes = (parent, tag, texts) => {
    const nodes = texts.map((text) => {
      const node = document.createElement(tag);
      node.textContent = text;
      return node;
    });
    parent.replaceChildren(...nodes);
    return nodes;
  };

  const workflowNodes = makeTextNodes(workflow, 'span', timeline.map(({ mode }) => mode));
  const railNodes = makeTextNodes(rail, 'li', timeline.map(({ mode }) => mode));
  const clamp = (number) => Math.max(0, Math.min(1, number));
  const easeOut = (number) => 1 - Math.pow(1 - clamp(number), 3);

  let activeScene = -1;
  let activeAction = -1;
  let listNodes = [];
  let actionNodes = [];
  let lastClock = '';
  let lastLetters = -1;
  let lastStatus = '';

  function markSteps(nodes, index) {
    nodes.forEach((node, position) => {
      node.className = position === index ? 'active' : position < index ? 'previous' : '';
    });
  }

  function setScene(scene, index) {
    activeScene = index;
    activeAction = -1;
    stage.dataset.mode = scene.id;
    title.textContent = scene.title;
    body.textContent = scene.body;
    eyebrow.textContent = scene.eyebrow;
    byId('environment').textContent = scene.environment;
    byId('app-tab').textContent = scene.tab;
    byId('app-context').textContent = scene.id === 'review' ? 'Peer reviewer' : 'Author · training repository';
    listNodes = makeTextNodes(list, 'li', scene.lines);
    actionNodes = makeTextNodes(byId('action-trace'), 'li', scene.actions.map(({ title }) => title));
    markSteps(workflowNodes, index);
    markSteps(railNodes, index);
  }

  function setAction(scene, action, index) {
    activeAction = index;
    lastLetters = -1;
    byId('action-title').textContent = action.title;

    const shell = /^(gh |python )/.test(action.code);
    const diff = /^[-+]/.test(action.code);
    byId('action-icon').textContent = shell ? '›_' : diff ? '±' : '◆';
    byId('prompt').textContent = shell ? '$' : diff ? '±' : '›';
    byId('action-progress').textContent = `Action ${index + 1} of ${scene.actions.length}`;
    markSteps(actionNodes, index);
    const focusIndex = scene.id === 'review' ? [0, 0, 1, 2, 2][index] : index;
    listNodes.forEach((node, position) => {
      node.classList.toggle('current', position === Math.min(focusIndex, listNodes.length - 1));
    });

    paintCode(result, action.result || '');
    resultPanel.hidden = !action.result;
    resultPanel.dataset.tone = /\b(?:FAIL|FAILED|AssertionError)\b/.test(action.result)
      ? 'failure' : /\b(?:pass|passed|OK|submitted|Created)\b/i.test(action.result) ? 'success' : 'information';
  }

  function paintCode(target, text) {
    if (!/^[+-]/m.test(text)) {
      target.textContent = text;
      return;
    }

    const nodes = text.split('\n').map((line, index) => {
      const node = document.createElement('span');
      if (line.startsWith('+')) node.className = 'diff-added';
      if (line.startsWith('-')) node.className = 'diff-removed';
      node.textContent = (index > 0 ? '\n' : '') + line;
      return node;
    });
    target.replaceChildren(...nodes);
  }

  function draw(rawTime) {
    const time = Math.max(0, Math.min(rawTime, duration));
    const sceneIndex = timeline.findLastIndex((scene) => scene.sceneStart <= time);
    const scene = timeline[sceneIndex];
    const local = time - scene.sceneStart;
    const actionIndex = Math.max(0, scene.actions.findLastIndex((action) => action.at <= local));
    const action = scene.actions[actionIndex];
    const nextAction = scene.actions[actionIndex + 1]?.at ?? scene.duration;
    const elapsed = Math.max(0, local - action.at);
    const hold = Math.max(0.1, nextAction - action.at);
    const typing = Math.min(2.1, Math.max(0.32, action.code.length / 60), hold * 0.52);
    const reveal = typing + Math.min(0.27, hold * 0.1);

    if (sceneIndex !== activeScene) setScene(scene, sceneIndex);
    if (actionIndex !== activeAction) setAction(scene, action, actionIndex);

    const letters = Math.ceil(clamp((elapsed - 0.08) / typing) * action.code.length);
    if (letters !== lastLetters) {
      paintCode(command, action.code.slice(0, letters));
      lastLetters = letters;
    }
    caret.style.opacity = letters < action.code.length || (elapsed < reveal + 0.9 && Math.floor(elapsed * 4) % 2 === 0) ? '1' : '0';

    const shown = easeOut((elapsed - reveal) / 0.48);
    resultPanel.style.opacity = shown.toFixed(3);
    resultPanel.style.transform = `translateY(${((1 - shown) * 9).toFixed(2)}px)`;

    const nextStatus = elapsed < reveal ? 'Entering action' : 'Evidence on screen';
    if (nextStatus !== lastStatus) {
      writing.textContent = nextStatus;
      lastStatus = nextStatus;
    }

    const arrive = easeOut(local / 0.65);
    const move = easeOut(elapsed / 0.8);
    const zoom = (scene.id === 'review' ? 0.024 : 0.012) * move;
    app.style.transform = `translateX(${((1 - arrive) * 56 - zoom * 306).toFixed(2)}px) scale(${(0.975 + 0.025 * arrive + zoom).toFixed(4)})`;
    app.style.opacity = (0.78 + 0.22 * arrive).toFixed(3);
    surface.style.transform = `translateY(${((1 - move) * 13).toFixed(2)}px)`;
    surface.style.borderColor = elapsed < 0.75 ? 'var(--accent)' : '#577086';

    const point = easeOut(elapsed / 0.5);
    pointer.style.transform = `translate(${Math.round(515 - 398 * point)}px,${Math.round(255 - 160 * point)}px)`;
    pointer.style.opacity = elapsed < 1.1 ? String(clamp((1.1 - elapsed) * 4)) : '0';
    railNodes[sceneIndex].style.setProperty('--progress', clamp(local / scene.duration).toFixed(4));

    const displayTime = Math.floor(time);
    const clockText = `${String(Math.floor(displayTime / 60)).padStart(2, '0')}:${String(displayTime % 60).padStart(2, '0')}`;
    if (clockText !== lastClock) {
      clock.textContent = clockText;
      lastClock = clockText;
    }
  }

  draw(0);
  window.addEventListener('hf-seek', (event) => draw(event.detail.time));
})();

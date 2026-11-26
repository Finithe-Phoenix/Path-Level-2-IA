export type Action = {
  at: number;
  title: string;
  code: string;
  result?: string;
};

export type Scene = {
  id: string;
  duration: number;
  eyebrow: string;
  title: string;
  body: string;
  lines: string[];
  actions?: Action[];
};

export const getActions = (scene: Scene) => scene.actions?.length
  ? scene.actions
  : [{at: 0, title: scene.eyebrow, code: scene.lines.join('\n')}];

export function getRevealTiming(action: Action, nextAt: number) {
  const characters = Array.from(action.code).length;
  const output = Array.from(action.result ?? '').length;
  const window = Math.max(0.55, nextAt - action.at);
  const typeFor = Math.min(2.1, window * 0.48, Math.max(0.30, characters / 58));
  const revealAt = typeFor + Math.min(0.27, window * 0.11);
  const revealFor = Math.min(0.82, window * 0.26, Math.max(0.30, output / 95));
  const settlesAt = Math.max(0.86, output > 0 ? revealAt + revealFor : typeFor);
  return {typeFor, revealAt, revealFor, settlesAt};
}

export function animationWindows(scenes: Scene[], fps: number) {
  return scenes.flatMap((scene, sceneIndex) => {
    const actions = getActions(scene);
    return actions.map((action, index) => {
      const start = index === 0 ? 0 : Math.ceil(action.at * fps);
      const nextAt = actions[index + 1]?.at ?? scene.duration;
      const end = index === actions.length - 1 ? Math.round(nextAt * fps) : Math.ceil(nextAt * fps);
      const duration = end - start;
      const lastRelevant = Math.ceil((action.at + getRevealTiming(action, nextAt).settlesAt) * fps) + 1;
      const rendered = Math.min(duration, lastRelevant - start);
      return {sceneIndex, start, duration, rendered};
    });
  });
}

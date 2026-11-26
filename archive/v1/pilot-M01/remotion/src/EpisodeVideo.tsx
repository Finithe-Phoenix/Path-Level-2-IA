import type {CSSProperties} from 'react';
import {
  AbsoluteFill, Easing, Html5Audio, interpolate, Sequence, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import type {Action, Scene} from './timing';
import {animationWindows, getActions, getRevealTiming} from './timing';
import './episode.css';

type Episode = {
  title: string;
  subtitle: string;
  fps: number;
  width: number;
  height: number;
  scenes: Scene[];
  audio: string;
};

type Surface = {
  app: string;
  nav: string;
  file: string;
  kind: 'editor' | 'github' | 'terminal';
};

const surfaces: Record<string, Surface> = {
  intro: {app: 'Training Lab', nav: 'Start', file: 'README.md', kind: 'editor'},
  issue: {app: 'GitHub', nav: 'Issue', file: 'Issues / #17', kind: 'github'},
  plan: {app: 'VS Code · Copilot', nav: 'Plan', file: 'Chat / Plan', kind: 'editor'},
  regression: {app: 'VS Code · Copilot', nav: 'Regression', file: 'Tests / Terminal', kind: 'editor'},
  fix: {app: 'VS Code · Copilot', nav: 'Fix', file: 'Editor / Terminal', kind: 'editor'},
  diff: {app: 'VS Code', nav: 'Diff', file: 'Source Control / Changes', kind: 'editor'},
  pr: {app: 'GitHub CLI', nav: 'Pull request', file: 'Authorized remote terminal · Author', kind: 'terminal'},
  review: {app: 'GitHub CLI', nav: 'Peer review', file: 'Authorized remote terminal · Peer reviewer', kind: 'terminal'},
  closure: {app: 'Training Lab', nav: 'Practice', file: 'README.md / Practice', kind: 'editor'},
};

const ease = (frame: number, start: number, duration: number) => interpolate(
  frame, [start, start + duration], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
);

const symbolPattern = /("[^"\n]*"|'[^'\n]*'|(?:--[\w-]+)|\b(?:def|return|assert|if|else|True|False|import|from|test|pytest|gh|git|python3?)\b|\b\d+\b)/gu;

function Syntax({line}: {line: string}) {
  const parts = line.split(symbolPattern);
  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    const token = /^['"]|^--/.test(part) ? 'string' : /^\d+$/.test(part) ? 'number' : 'keyword';
    return <span className={`syntax-${token}`} key={index}>{part}</span>;
  });
}

function Code({text, active, numbered, phase, prompt}: {text: string; active: boolean; numbered: boolean; phase: number; prompt?: boolean}) {
  const allRows = text.split('\n');
  const first = Math.max(0, allRows.length - 11);
  return (
    <div className="code-rows">
      {allRows.slice(first).map((line, row, visible) => {
        const last = row === visible.length - 1;
        const marker = /^\+(?!\+)|^[-−](?!-)/.test(line) ? (line[0] === '+' ? ' added' : ' removed') : '';
        return (
          <div className={`code-row${marker}${last && active ? ' active-line' : ''}`} key={first + row}>
            {numbered && <span className="line-number">{first + row + 1}</span>}
            {prompt && <span className="terminal-prompt">{first + row === 0 ? '❯' : ' '}</span>}
            <span className="line-content">
              <Syntax line={line} />
              {last && active && <span className="text-caret" style={{opacity: phase}} />}
              {line === '' && !active && '\u00a0'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActionPanel({action, actionFrame, nextAt, elapsed, fps, surface, sceneId}: {
  action: Action;
  actionFrame: number;
  nextAt: number;
  elapsed: number;
  fps: number;
  surface: Surface;
  sceneId: string;
}) {
  const code = Array.from(action.code);
  const result = Array.from(action.result ?? '');
  const {typeFor: timeToType, revealAt: resultFrom, revealFor: resultDuration} = getRevealTiming(action, nextAt);
  const shownCode = Math.min(code.length, Math.floor(code.length * elapsed / timeToType));
  const shownResult = Math.max(0, Math.min(result.length, Math.floor(result.length * (elapsed - resultFrom) / resultDuration)));
  const caretPhase = Math.floor(actionFrame / Math.max(1, Math.round(fps * 0.43))) % 2 === 0 ? 1 : 0.25;
  const outputAppears = result.length > 0 && elapsed >= resultFrom;
  const outputMotion = outputAppears ? ease(actionFrame, resultFrom * fps, fps * 0.36) : 0;
  const numbered = /^(def|[−+-]\s|return)\b/u.test(action.code) || sceneId === 'diff' && action.code.includes('\n');
  const failure = sceneId === 'regression' && /fail|error|fall[aó]|✗/iu.test(action.result ?? '');
  const dense = action.code.split('\n').length > 7 || action.code.length > 420;
  const command = /^(gh|git|python3?|pytest)\s/u.test(action.code);

  return (
    <div className={`action-panel${dense ? ' is-dense' : ''}`} style={{opacity: 0.65 + 0.35 * ease(actionFrame, 0, fps * 0.23)}}>
      <div className="action-label"><span className="active-indicator" />{action.title}</div>
      <div className={`code-panel${surface.kind === 'terminal' ? ' is-terminal' : ''}${outputAppears ? ' with-output' : ''}`}>
        <Code text={code.slice(0, shownCode).join('')} active={shownCode < code.length || !outputAppears} numbered={numbered} phase={caretPhase} prompt={command} />
        {outputAppears && (
          <div className={`output${failure ? ' is-failure' : ''}`} style={{opacity: outputMotion, transform: `translateY(${(1 - outputMotion) * 12}px)`}}>
            <div className="output-kicker"><span className="output-lamp" />{failure ? 'Test failed as expected' : 'Result'}</div>
            <Code text={result.slice(0, shownResult).join('')} active={false} numbered={false} phase={1} />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({scene, scenes, index, fps, subtitle, episodeTitle, sourceStart = 0}: {
  scene: Scene;
  scenes: Scene[];
  index: number;
  fps: number;
  subtitle: string;
  episodeTitle: string;
  sourceStart?: number;
}) {
  const frame = useCurrentFrame() + sourceStart;
  const {width} = useVideoConfig();
  const time = frame / fps;
  const surface = surfaces[scene.id] ?? surfaces.intro;
  const actions = getActions(scene);
  const actionIndex = Math.max(0, actions.findLastIndex((action) => action.at <= time));
  const action = actions[actionIndex];
  const actionTime = Math.max(0, time - action.at);
  const nextAt = actions[actionIndex + 1]?.at ?? scene.duration;
  const arrival = ease(frame, 0, fps * 0.72);
  const focus = ease(actionTime * fps, 0, fps * 0.83);
  const stageStyle = {
    '--canvas-scale': width / 1920,
    '--ambient-shift': `${14 * focus + actionIndex * 14}px`,
  } as CSSProperties;
  const cameraStyle = {
    transform: `translate(${(1 - arrival) * -29 + focus * -7}px, ${(1 - arrival) * 33}px) scale(${0.955 + arrival * 0.045 + focus * 0.011})`,
    opacity: 0.82 + arrival * 0.18,
  };
  const landmark = scene.id === 'intro' || scene.id === 'closure';

  return (
    <AbsoluteFill className={`episode scene-${scene.id} surface-${surface.kind}`}>
      <div className="canvas" style={stageStyle}>
        <div className="ambient" />
        <header className="episode-header">
          <div className="episode-identity"><span className="logo-mark" aria-hidden="true" />{subtitle}</div>
          <div className="episode-context"><span>DEMO</span>{episodeTitle}</div>
        </header>

        <section className={`scene-headline${landmark ? ' landmark' : ''}`} style={{transform: `translateX(${(1 - arrival) * -18}px)`}}>
          <div>
            <div className="scene-eyebrow"><span>{String(index + 1).padStart(2, '0')}</span>{scene.eyebrow}</div>
            <h1>{scene.title}</h1>
          </div>
          <p>{scene.body}</p>
        </section>

        <div className="workspace" style={cameraStyle}>
          <div className="app-top">
            <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
            <strong>{surface.app}</strong>
            <span className="demo-tag"><i />Training repository</span>
          </div>
          <div className="app-body">
            <aside className="app-sidebar">
              <div className="side-label">WORKFLOW</div>
              {scenes.map((item, step) => (
                <div className={`side-step${step === index ? ' current' : ''}${step < index ? ' done' : ''}`} key={item.id}>
                  <span className="step-node">{step < index ? '✓' : String(step + 1).padStart(2, '0')}</span>
                  <span>{surfaces[item.id]?.nav ?? item.eyebrow}</span>
                </div>
              ))}
            </aside>
            <main className="app-main">
              <div className="app-tab-row">
                <span className="app-tab"><i />{surface.file}</span>
                {actions.length > 1 && (
                  <div className="action-pips" aria-label={`Action ${actionIndex + 1} of ${actions.length}`}>
                    {actions.map((item, itemIndex) => <i className={itemIndex <= actionIndex ? ' reached' : ''} key={`${item.at}-${itemIndex}`} />)}
                  </div>
                )}
              </div>
              <ActionPanel action={action} actionFrame={actionTime * fps} nextAt={nextAt} elapsed={actionTime} fps={fps} surface={surface} sceneId={scene.id} />
            </main>
          </div>
        </div>

        <footer className="episode-footer">
          <div className="evidence">
            {scene.lines.map((line, item) => <span key={`${item}-${line}`}><i />{line}</span>)}
          </div>
          <div className="episode-progress" aria-hidden="true">
            {scenes.map((item, step) => <span key={item.id} style={{flex: item.duration}}>
              <i style={{transform: `scaleX(${step < index ? 1 : step === index ? (actionIndex + focus) / actions.length : 0})`}} />
            </span>)}
          </div>
        </footer>
      </div>
    </AbsoluteFill>
  );
}

export function EpisodeVideo({title, subtitle, fps, scenes, audio}: Episode) {
  let elapsedFrames = 0;

  return (
    <AbsoluteFill>
      <Html5Audio src={staticFile(audio)} />
      {scenes.map((scene, index) => {
        const from = elapsedFrames;
        const frames = Math.round(scene.duration * fps);
        elapsedFrames += frames;

        return (
          <Sequence key={scene.id} name={scene.eyebrow} from={from} durationInFrames={frames}>
            <Section scene={scene} scenes={scenes} index={index} fps={fps} subtitle={subtitle} episodeTitle={title} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

export function EpisodeCompact({title, subtitle, fps, scenes}: Episode) {
  let elapsedFrames = 0;

  return (
    <AbsoluteFill>
      {animationWindows(scenes, fps).map(({sceneIndex, start, rendered}) => {
        const scene = scenes[sceneIndex];
        const from = elapsedFrames;
        elapsedFrames += rendered;

        return (
          <Sequence key={`${scene.id}-${start}`} name={scene.eyebrow} from={from} durationInFrames={rendered}>
            <Section scene={scene} scenes={scenes} index={sceneIndex} fps={fps} subtitle={subtitle}
              episodeTitle={title} sourceStart={start} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

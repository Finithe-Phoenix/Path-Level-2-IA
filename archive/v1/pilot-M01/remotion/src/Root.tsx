import {Composition} from 'remotion';
import episode from '../../episodio-v2.json';
import {EpisodeCompact, EpisodeVideo} from './EpisodeVideo';
import {animationWindows} from './timing';

const durationInFrames = episode.scenes.reduce(
  (sum, scene) => sum + Math.round(scene.duration * episode.fps),
  0,
);
const compactFrames = animationWindows(episode.scenes, episode.fps).reduce((sum, window) => sum + window.rendered, 0);

export const Root = () => (
  <>
  <Composition
    id="Piloto"
    component={EpisodeVideo}
    durationInFrames={durationInFrames}
    fps={episode.fps}
    width={episode.width}
    height={episode.height}
    defaultProps={episode}
  />
  <Composition
    id="PilotoCompacto"
    component={EpisodeCompact}
    durationInFrames={compactFrames}
    fps={episode.fps}
    width={episode.width}
    height={episode.height}
    defaultProps={episode}
  />
  </>
);

# AI engineering training videos

**Current pilot: From issue to reviewed PR.** This intermediate walkthrough follows a small bug through a GitHub issue, Copilot Plan and Agent in VS Code, a failing and passing test, and an independent review with GitHub CLI. The English narration leads the learner through an animated practice workspace. The UI, repository identifiers and terminal output are illustrative. The included code exercise reproduces the behavior shown.

## Files

| File | Use |
|---|---|
| `episodio-v2.json` | Shared storyboard, narration and timed actions. Each action specifies a timestamp in seconds, a title, the code or command, and an optional result. |
| `narracion-v2.wav` · `subtitulos.en.srt` | English voice-over and caption timings. Upload the SRT separately when the training platform needs a sidecar file. |
| `demo/` | Training issue, starting code, tests, sample CI workflow, and author and reviewer commands. |
| `hyperframes/` · `remotion/` | Editable render projects. Both read the same storyboard and voice track. |

## Record or adapt the demo

1. Use a synthetic issue in a training repository and verify the starting state. Keep the two test runs and the diff visible long enough to read.
2. Show the author's work in VS Code, including the Plan-to-Agent handoff and the Source Control diff. GitHub hosts the issue, branch, PR and checks. In this team's workflow, a teammate performs the PR review with `gh` from an approved terminal. The example assumes the remote terminal has GitHub CLI and repository access.
3. Give each on-screen action a task, an input and observable evidence. Label simulated output or use approved captures. Use motion to focus attention on the line that changes, the test result, or the next command.
4. Check the audio against the actions. Keep commands readable and leave time for learners to follow before revealing the next step.
5. Render on an approved production station or runner. VS Code with Copilot is the local editing surface. Claude Code and OpenCode run in the corporate GCP workspace. The pilot was rendered in the production workspace for this task.

The `gh pr review` approval shown in the pilot is a human review submitted by a separate authorized reviewer. The approval and change-request examples are separate branches of the workflow. Use the [recording guide](demo/README.md) for the exact CLI sequence and a command that reads the saved review. [GitHub CLI PR commands](https://cli.github.com/manual/gh_pr) · [GitHub CLI review](https://cli.github.com/manual/gh_pr_review)

## Rebuild the voice track

The pilot uses Kokoro with the English `af_heart` voice at 0.96 speed. Synthesis ran locally in the production workspace using the synthetic script. The model and voice weights are a separate download.

```bash
python3 -m pip install kokoro-onnx==0.6.1
python3 generar_narracion_v2.py /path/kokoro-v1.0.onnx /path/voices-v1.0.bin
```

The script produces the WAV and SRT, and checks that narration fits each scene. Subtitle breaks within a sentence are estimated from text length. [Kokoro ONNX and model files](https://github.com/thewh1teagle/kokoro-onnx)

## Render

Run the commands for one engine from the unpacked project.

**HyperFrames**

```bash
cd hyperframes
npm ci
node build-v2.mjs
DO_NOT_TRACK=1 npx --no-install hyperframes browser ensure
DO_NOT_TRACK=1 npx --no-install hyperframes lint ./v2
DO_NOT_TRACK=1 npx --no-install hyperframes render ./v2 --fps 24 --output ../piloto-hyperframes-v2.mp4 --quality looks
```

See [HyperFrames notes](hyperframes/README.md) for the browser and cache configuration. Run npm and the render in the approved production environment.

**Remotion**

```bash
cd remotion
npm ci
npm run check
npm run render
```

To use the managed browser, pass `-- --browser-executable=/path/to/chromium` to the npm render command. Check Remotion's company licensing terms for ongoing workplace use. [Remotion licensing](https://www.remotion.dev/pricing)

On a CPU-only renderer, `npm run render:motion` followed by `npm run expand:motion` renders the entry and typing of each action, then holds the finished frame long enough for the learner to read it. This produces the picture track. To carry English captions and narration to an LMS, combine the track with `narracion-v2.wav` and `subtitulos.en.srt`, or upload the SRT alongside the completed MP4.

## Mux English captions and chapter markers

After rendering a picture, run this from the pilot directory. Substitute the Remotion picture filename to use that engine. The narration and captions supplied here are the pilot masters.

```bash
ffmpeg -i piloto-hyperframes-v2.mp4 -i narracion-v2.wav -i subtitulos.en.srt -f ffmetadata -i chapters.ffmeta \
  -map 0:v:0 -map 1:a:0 -map 2:s:0 -map_metadata 3 -map_chapters 3 \
  -c:v copy -c:a aac -b:a 112k -c:s mov_text -metadata:s:a:0 language=eng \
  -metadata:s:s:0 language=eng -movflags +faststart M01.mp4
```

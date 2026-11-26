"""Generate the English voice-over and captions from the shared storyboard."""
import argparse
import json
import math
import re
import textwrap
import wave
from pathlib import Path

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent

PRONUNCIATION = {
    "gh pr": "G H P R",
    "VS Code": "V S Code",
    "CI": "C I",
}


def spoken_text(text):
    for term, pronunciation in PRONUNCIATION.items():
        text = re.sub(rf"\b{re.escape(term)}\b", pronunciation, text, flags=re.IGNORECASE)
    return text


def timestamp(seconds):
    milliseconds = round(seconds * 1000)
    seconds, milliseconds = divmod(milliseconds, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"


def caption_pages(sentence):
    rows = textwrap.wrap(sentence, width=42, break_long_words=False)
    return ["\n".join(rows[index:index + 2]) for index in range(0, len(rows), 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path)
    parser.add_argument("voices", type=Path)
    args = parser.parse_args()
    episode = json.loads((ROOT / "episodio-v2.json").read_text(encoding="utf-8"))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(args.model), options, providers=["CPUExecutionProvider"])
    synth = Kokoro.from_session(session, str(args.voices))
    audio_track = []
    captions = []
    elapsed_frames = 0
    overflows = []
    for scene in episode["scenes"]:
        fps = episode["fps"]
        start = elapsed_frames / fps
        frames = math.floor(scene["duration"] * fps + 0.5)
        elapsed_frames += frames
        end = elapsed_frames / fps
        beats = scene.get("narrationBeats", [{"at": 0, "text": scene["narration"]}])
        position = 0
        clips = []
        for beat in beats:
            sentences = re.split(r"(?<=[.!?])\s+", beat["text"])
            for index, sentence in enumerate(sentences):
                samples, sample_rate = synth.create(
                    spoken_text(sentence), voice="af_heart", speed=0.96, lang="en-us"
                )
                if index == 0:
                    beat_start = round((beat["at"] + 0.35) * sample_rate)
                    gap = max(0, beat_start - position)
                    clips.append(np.zeros(gap, dtype=np.float32))
                    position += gap
                cap_start = start + position / sample_rate
                span = len(samples) / sample_rate
                pages = caption_pages(sentence)
                total = sum(len(page) for page in pages)
                for page in pages:
                    cap_end = cap_start + span * len(page) / total
                    captions.append(f"{len(captions) + 1}\n{timestamp(cap_start)} --> {timestamp(cap_end)}\n{page}")
                    cap_start = cap_end
                pause = np.zeros(round(0.18 * sample_rate), dtype=np.float32)
                clips.extend((samples, pause))
                position += len(samples) + len(pause)

        target = round(end * sample_rate) - round(start * sample_rate)
        print(f"{scene['id']}: {position / sample_rate:.2f}s of {target / sample_rate:.2f}s", flush=True)
        if position > target:
            overflows.append(scene["id"])
        else:
            clips.append(np.zeros(target - position, dtype=np.float32))
        audio_track.extend(clips)

    if overflows:
        raise ValueError("Extend these scenes before generating audio: " + ", ".join(overflows))

    waveform = np.concatenate(audio_track)
    peak = np.max(np.abs(waveform))
    if peak > 0:
        waveform *= 0.72 / peak
    with wave.open(str(ROOT / episode["audio"]), "wb") as wav:
        wav.setparams((1, 2, sample_rate, 0, "NONE", "not compressed"))
        wav.writeframes((waveform * 32767).astype("<i2").tobytes())
    (ROOT / "subtitulos.en.srt").write_text("\n\n".join(captions) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

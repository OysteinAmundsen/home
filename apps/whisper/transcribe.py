#!/usr/bin/env python3
import sys
from io import BytesIO
from faster_whisper import WhisperModel

def main():
    # Ensure stdout uses UTF-8 encoding
    sys.stdout.reconfigure(encoding='utf-8')

    # Read binary data from stdin
    audio_file = BytesIO(sys.stdin.buffer.read())
    model = WhisperModel("NbAiLab/nb-whisper-small", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_file, beam_size=5)
    for segment in segments:
        print(segment.text, flush=True)

if __name__ == "__main__":
    main()

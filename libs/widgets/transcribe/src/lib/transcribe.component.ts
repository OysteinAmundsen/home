import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { getComputedStyle } from '@home/shared/utils/color';
import { doSafeTransition } from '@home/shared/utils/transitions';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'lib-transcribe',
  imports: [CommonModule, WidgetComponent, ReactiveFormsModule],
  templateUrl: './transcribe.component.html',
  styleUrl: './transcribe.component.scss',
})
export default class TranscribeComponent extends AbstractWidgetComponent {
  private readonly http = inject(HttpClient);

  id = signal('transcribe');

  visualizer = viewChild<ElementRef<HTMLCanvasElement>>('visualizer');
  canvasCtx = computed<CanvasRenderingContext2D | undefined>(() => {
    const canvas = this.visualizer();
    return canvas?.nativeElement.getContext('2d') ?? undefined;
  });

  stream?: MediaStream | undefined;
  mediaRecorder?: MediaRecorder | undefined;
  chunks: Blob[] = [];

  isRecording = signal(false);
  isProcessing = signal(false);

  // Holds the info message to display to the user
  defaultInfo = 'This tool can transcribe your voice to text. Upload audio or click record to speak.';
  info = signal<string | undefined>(this.defaultInfo);
  setInfo = (msg: string | undefined) => doSafeTransition(() => this.info.set(msg));
  private onInfoChanged = effect(() => {
    const isProcessing = this.isProcessing();
    if (isProcessing) return;
    if (this.info() != this.defaultInfo) {
      setTimeout(() => this.setInfo(this.defaultInfo), 5000);
    }
  });

  // Holds the transcription result
  transcription = signal<string | undefined>(undefined);
  setTranscription = (msg: string | undefined) => doSafeTransition(() => this.transcription.set(msg));

  private async getStream(): Promise<MediaStream> {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      return this.stream;
    }
    throw new Error('getUserMedia not supported on your browser!');
  }

  private getRecorder(stream: MediaStream): MediaRecorder {
    if (!this.mediaRecorder) {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e: BlobEvent) => this.chunks.push(e.data);
      recorder.onstop = () => {
        // Get the audio data as a blob and upload it
        this.isRecording.set(false);
        this.upload(new Blob(this.chunks, { type: recorder.mimeType }));
        // Cleanup
        this.chunks = [];
        this.stream?.getTracks().forEach((track) => track.stop());
        this.mediaRecorder = undefined;
        this.stream = undefined;
      };
      this.mediaRecorder = recorder;
    }
    return this.mediaRecorder;
  }

  async toggleRecord() {
    try {
      const stream = await this.getStream();
      const mediaRecorder = this.getRecorder(stream);
      this.setTranscription(undefined);
      if (!this.isRecording()) {
        // Start recording
        try {
          mediaRecorder.start();
          this.isRecording.set(true);

          // Visualize the audio stream
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          const dataArray = new Uint8Array(analyser.fftSize);
          source.connect(analyser);
          this.draw(analyser, dataArray);
        } catch (err) {
          this.setInfo(`Cannot record: ${err}`);
        }
      } else {
        // Stop recording (fires onstop event)
        mediaRecorder.stop();
      }
    } catch (err) {
      this.setInfo(`Cannot record: ${err}`);
    }
  }

  filePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.upload(input.files[0]);
  }

  async upload(blob: Blob) {
    this.isProcessing.set(true);
    this.info.set(undefined);
    const formData = new FormData();
    formData.append('file', blob);
    try {
      const res = await firstValueFrom(
        this.http.post<{ status: string; transcription: string }>('/api/transcribe', formData),
      );
      if (res.transcription?.length) {
        this.setTranscription(res.transcription);
      } else {
        this.setInfo('No audible voice data to process');
      }
    } catch (err) {
      this.setInfo(`Cannot upload: ${err}`);
    }
    this.isProcessing.set(false);
  }

  draw(analyser: AnalyserNode, dataArray: Uint8Array) {
    const canvas = this.visualizer()!.nativeElement;
    const ctx = this.canvasCtx()!;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    ctx.strokeStyle = getComputedStyle(document.body, '--color-warn');
    ctx.lineWidth = 2;

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      if (!this.isRecording()) return;

      ctx.beginPath();

      analyser.getByteTimeDomainData(dataArray);
      const sliceWidth = (WIDTH * 1.0) / analyser.fftSize;
      let x = 0;

      for (let i = 0; i < analyser.fftSize; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  }
}

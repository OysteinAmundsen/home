import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { serviceWorkerActivated } from '@home/shared/browser/service-worker/service-worker';
import {
  CreateServiceWorkerMLCEngine,
  InitProgressReport,
  MLCEngineConfig,
  MLCEngineInterface,
  WebWorkerMLCEngine,
} from '@mlc-ai/web-llm';
import { ChatMessage } from './chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly platformId = inject(PLATFORM_ID);

  selectedModel = linkedSignal(() => 'Llama-3.1-8B-Instruct-q4f32_1-MLC');
  currentModel: string | undefined = this.selectedModel();
  private engine?: MLCEngineInterface;
  private progress = signal<InitProgressReport | undefined>(undefined);
  progressText = linkedSignal(() => {
    const progress = this.progress();
    if (progress?.progress === 1) return '';
    return progress?.text ?? '';
  });
  isInitialized = computed(() => this.progress()?.progress === 1);

  chatHistory = signal<ChatMessage[]>([]);

  constructor() {
    this.init();
  }

  async init() {
    if (isPlatformBrowser(this.platformId)) {
      const options: MLCEngineConfig = {
        initProgressCallback: (report: any) => this.progress.set(report),
      };
      this.progressText.set('Waiting for service worker to be activated...');
      try {
        if ('serviceWorker' in navigator && (await serviceWorkerActivated())) {
          this.progressText.set('Loading model using service-worker...');
          this.engine = await CreateServiceWorkerMLCEngine(this.selectedModel(), options);
          setTimeout(() => {
            if (!this.progress()) {
              this.progress.set({
                progress: 1,
                timeElapsed: 0,
                text: 'Model loaded successfully.',
              } as InitProgressReport);
            }
          });
          this.resetChat();
        } else {
          this.progressText.set('Loading model using a web-worker...');
          const worker = new Worker(new URL('./chat.worker.ts', import.meta.url), { type: 'module' });
          this.engine = new WebWorkerMLCEngine(worker, options);
          await this.loadModel();
        }
      } catch (e) {
        // Retry loading the model in case of failure
        if (!this.engine) {
          this.init();
        } else {
          this.currentModel = undefined;
          this.loadModel();
        }
      }
    }
  }

  async resetChat() {
    this.chatHistory.set([
      // Give in contextual data. This will make our chatbot be able to answer
      // questions about the app and its tech stack
      {
        role: 'system',
        content: `
          I'm a conversational AI installed on the "Home" app, located at ${window.location.origin}. When replying to the user, I must not hallucinate or fabricate information. I should only provide information available on the "Home" app and its tech stack. If I can gather information from the provided URLs, I may use it. Additionally, I can use information from my training to explain further, as long as it does not contradict this prompt.

          # Overview of the "Home" App
          The "Home" app is a dashboard application containing several widgets:

          1. Weather Widget (${window.location.origin}/weather):
            * Provides weather information fetched from the met.no API.
            * Displays a 12-hour forecast.
            * Users can search for specific locations or grant browser location privileges for current location-based weather.
            * Location data is truncated to the nearest 100 meters to avoid excessive updates.
            * Data is cached and updated hourly.

          2. Fund Widget (${window.location.origin}/fund):
            * Uses APIs from nordnet.no to display fund performance graphs.
            * Users can search for funds and add them to a watchlist for comparison.

          3. Pyramid Widget (${window.location.origin}/pyramid):
            * An experiment using WebGPU to render a rotating pyramid.

          4. Starfield Widget (${window.location.origin}/starfield):
            * An experiment using the Canvas 2D context to render a starfield, simulating space travel.

          5. Transcribe Widget (${window.location.origin}/transcribe):
            * Uses a locally installed Whisper AI model (server-side) to transcribe audio files.
            * The model is loaded server-side via a python script.
            * Whisper model is especially trained for norwegian language.
            * Users can upload audio files and receive transcriptions.
            * By giving permission, users can also record audio directly from the browser using the microphone.

          6. Chat Widget (${window.location.origin}/chat):
            * A chat interface to interact with me.
            * Powered by WebLLM, running entirely in the browser using WebGPU for faster and more efficient inference.
            * The model is loaded via a service worker, enabling offline availability.

          ## Technical Details
            * Source Code: The app is open source and available on GitHub: https://github.com/OysteinAmundsen/home.
            * Preferred Environment: The app is designed to run using bun instead of Node.js.
            * Development Setup:
              * Includes a devContainer.json for isolated development environments.
              * Scripts in package.json allow for various build and run options:
                * bun start: Runs both backend and frontend in the same Express instance.
                * bun run back and bun run front: Runs backend and frontend separately.
                * bun run build && bun run prod: Builds and runs the app in production mode.
                * bun run docker:build && bun run docker:start: Spins up a Docker container.
            * Tech Stack:
              * Angular frontend.
              * NestJS backend.
              * SQLite database for lightweight storage.
              * Service worker integrated with the Angular build process using WorkBox.

          ## Developer Information
            * Developed by Øystein Amundsen, a consultant at Bouvet in Norway.
        `,
        timestamp: Date.now() - 1,
      },
    ]);
    if (this.engine) {
      await this.engine.resetChat();
    }
  }

  // Re-initialize engine on model change
  private onModelChange = effect(async () => this.loadModel());

  private async loadModel() {
    const model = this.selectedModel();
    if (model && this.engine && this.currentModel !== model) {
      this.currentModel = model;
      try {
        await this.resetChat();
        await this.engine.unload();
        await this.engine.reload(model);
      } catch (e) {
        if (typeof e === 'string' && e.startsWith('InvalidAccessError')) {
          this.progressText.set('Cannot initialize engine. Are you using a browser with no active profile?');
          console.error(e);
        } else {
          this.progressText.set('Error loading model: ' + e);
        }
        await this.engine.unload();
      }
    }
  }

  /**
   * Sends a message to the chat engine.
   *
   * @param userPrompt The prompt from the user.
   * @param systemPrompt The system prompt to guide the AI.
   * @returns The AI's response as a string.
   */
  async sendMessage(userPrompt: string): Promise<string> {
    if (this.engine === null || !this.isInitialized()) return '';
    try {
      // Create payload
      this.chatHistory.update((history) => [...history, { role: 'user', content: userPrompt, timestamp: Date.now() }]);
      const chunks = await this.engine!.chat.completions.create({
        stream: true,
        messages: this.chatHistory(),
        temperature: 1,
        stream_options: { include_usage: true },
      });
      let reply = '';
      for await (const chunk of chunks) {
        this.chatHistory.update((history) => {
          const lastMessage =
            history.find((msg) => msg.stream) ||
            ({
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              stream: true,
            } as ChatMessage);
          history = history.filter((msg) => msg.stream !== true);
          if (lastMessage) {
            lastMessage.content += chunk.choices[0]?.delta.content ?? '';
            lastMessage.timestamp = Date.now();
          }
          return [...history, lastMessage!];
        });

        reply += chunk.choices[0]?.delta.content ?? '';
        if (chunk.usage) {
          console.log(chunk.usage);
        }
      }

      const message = await this.engine!.getMessage();
      this.chatHistory.update((history) => {
        history = history.filter((msg) => msg.stream !== true);
        return [...history, { role: 'assistant', content: message, timestamp: Date.now() }];
      });
      return message;
    } catch (ex) {
      console.error('Error initializing chat:', ex);
    }
    return '';
  }
}

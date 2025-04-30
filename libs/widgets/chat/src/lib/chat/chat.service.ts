import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import { ChatMessage } from './chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly platformId = inject(PLATFORM_ID);

  selectedModel = linkedSignal(() => 'Llama-3.1-8B-Instruct-q4f32_1-MLC');
  private engine = isPlatformBrowser(this.platformId)
    ? new WebWorkerMLCEngine(new Worker(new URL('./chat.worker.ts', import.meta.url), { type: 'module' }), {
        logLevel: 'INFO',
      })
    : null;
  private progress = signal<InitProgressReport | undefined>(undefined);
  progressText = linkedSignal(() => {
    const progress = this.progress();
    if (progress?.progress === 1) return '';
    return progress?.text ?? '';
  });
  isInitialized = computed(() => this.progress()?.progress === 1);

  systemPrompt = linkedSignal(() => 'You are a helpful AI assistant.');
  chatHistory = linkedSignal<ChatMessage[]>(() => [
    { role: 'system', content: this.systemPrompt(), timestamp: Date.now() },
  ]);

  async resetChat() {
    this.chatHistory.set([{ role: 'system', content: this.systemPrompt(), timestamp: Date.now() }]);
    if (this.engine) {
      await this.engine.resetChat();
    }
  }

  // Re-initialize engine on model change
  private onModelChange = effect(async () => {
    const model = this.selectedModel();
    if (model && this.engine) {
      this.progressText.set('Loading model...');
      this.engine.setInitProgressCallback((report) => this.progress.set(report));
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
  });

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
      const chunks = await this.engine.chat.completions.create({
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
      console.log('Reply:', reply);

      const message = await this.engine.getMessage();
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

import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { serviceWorkerActivated } from '@home/shared/browser/service-worker/service-worker';
import { titleCase } from '@home/shared/utils/string';
import { widgetRoutes } from '@home/widgets/widget.routes';
import {
  InitProgressReport,
  MLCEngineConfig,
  MLCEngineInterface,
  prebuiltAppConfig,
  ServiceWorkerMLCEngine,
  WebWorkerMLCEngine,
} from '@mlc-ai/web-llm';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { ChatMessage, ChatModel } from './chat.model';

export enum ChatStatus {
  IDLE = '',
  ENGINE = 'Loading engine',
  MODEL = 'Loading model',
  TYPING = 'Typing',
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly platformId = inject(PLATFORM_ID);

  private engine?: MLCEngineInterface;
  selectedModel = linkedSignal(() => {
    // Large model (4Gb - 8B params). Takes a while to load and respond.
    // return 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
    // Smaller model (2Gb - 3B params). Loads faster and responds faster.
    return 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
  });
  loadedModel: string | undefined = undefined;

  status = signal<string>('');
  onProgress = (report: any) => this.progress.set(report);
  private progress = signal<InitProgressReport | undefined>(undefined);
  progressText = linkedSignal(() => {
    const progress = this.progress();
    if (progress?.progress === 1) return '';
    return progress?.text ?? '';
  });
  isInitialized = linkedSignal(() => {
    const progress = this.progress();
    return progress?.progress === 1;
  });
  modelLoaded$ = new BehaviorSubject<boolean>(false);
  modelLoaded = toSignal(this.modelLoaded$, { initialValue: false });

  private chat = signal<ChatMessage[]>([...this.getInitialChat()]);
  chatHistory = computed<ChatMessage[]>(() => [...this.chat(), ...this.messageQueue()]);
  private messageQueue = signal<ChatMessage[]>([]);
  private processingQueue = false;

  engineConfig: MLCEngineConfig = {
    initProgressCallback: this.onProgress,
    logLevel: 'INFO',
    appConfig: {
      ...prebuiltAppConfig,
      useIndexedDBCache: true,
    },
  };

  setStatus(status: ChatStatus) {
    this.status.set(status);
  }

  /**
   * Initializes the LLM engine
   */
  async getEngine(): Promise<MLCEngineInterface | undefined> {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    if (this.engine) return this.engine;

    console.debug('Initializing chat service...');
    this.setStatus(ChatStatus.ENGINE);
    this.loadedModel = undefined;
    let engine: MLCEngineInterface | undefined = undefined;
    if ('serviceWorker' in navigator) {
      if (await serviceWorkerActivated()) {
        console.debug('WebLLM: Creating service-worker engine...');
        engine = new ServiceWorkerMLCEngine(this.engineConfig, 5000);
      }
    }
    if (!engine) {
      console.debug('WebLLM: Creating web-worker engine...');
      engine = new WebWorkerMLCEngine(
        new Worker(new URL('./chat.worker.ts', import.meta.url), { type: 'module' }),
        this.engineConfig,
      );
    }
    this.engine = engine;
    this.setStatus(ChatStatus.IDLE);
    return this.engine;
  }

  /**
   * Load the selected model into the engine.
   */
  async loadModel() {
    if (!isPlatformBrowser(this.platformId)) return undefined;

    this.setStatus(ChatStatus.MODEL);
    this.modelLoaded$.next(false);
    const model = this.selectedModel();
    const engine = await this.getEngine();

    if (model && engine && this.loadedModel !== model) {
      console.debug('WebLLM: Loading model...', this.selectedModel());
      this.setStatus(ChatStatus.MODEL);
      this.loadedModel = model;
      try {
        await engine.unload();
        await engine.reload(model);
        this.modelLoaded$.next(true);
      } catch (e) {
        this.progressText.set('Error loading model: ' + e);
        await engine.unload();
      } finally {
        this.setStatus(ChatStatus.IDLE);
      }
    }
  }

  getInitialChat(): ChatMessage[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const widgets = widgetRoutes
      .map((widget) => ({
        path: widget.path,
        name: titleCase(`${widget.path}`),
        description: widget.data!['description'],
        meta: widget.data!['meta'],
        tags: widget.data!['tags'],
      }))
      .reduce((acc, widget, index) => {
        const header = `${index}. [${widget.name}](${window.location.origin}/${widget.path}): ${widget.description}\n`;
        const tags = widget.tags ? `Tags: ${widget.tags.join(', ')}` : '';
        const meta = widget.meta.map((meta: string) => `* ${meta}`).join('\n');
        acc.push(header + `${widget.meta.description}\n` + meta + (tags ? `${tags}\n` : ''));
        return acc;
      }, [] as string[]);

    return [
      // Give in contextual data. This will make our chatbot be able to answer
      // questions about the app and its tech stack
      {
        role: 'system',
        content: `
          I'm a conversational AI installed on the "Home" app, located at ${window.location.origin}. When replying to the user, I must not hallucinate or fabricate information. I should only provide information available on the "Home" app and its tech stack. If I can gather information from the provided URLs, I may use it. Additionally, I can use information from my training to explain further, as long as it does not contradict this prompt.
          I must respond confidently and authoritatively, avoiding phrases like "I think," "From what I can gather," or "According to the provided information." Instead, I should present the information as factual and direct, as long as it aligns with the data provided or my training.

          # Overview of the "Home" App
          This app is primarily a proof of concept playground for how to build a full-stack application with Angular and NestJS. In other words, the app itself is not as interesting as the code behind. The developers goal is to create a solution which embodies both web fundamentals as well as cutting edge technology. The app is designed to be a playground for experimenting with new technologies and ideas, and the developer is open to suggestions for new features or improvements.
          The "Home" app is a dashboard application containing several widgets:

          ${widgets.join('\n')}

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
    ];
  }

  /**
   * Sets the chat context to the initial state.
   *
   * This includes providing the AI with an overview of the app and its tech stack, so
   * that it can answer these questions. This is a cheap way to "fine-tune" the AI.
   */
  async resetChat() {
    if (!isPlatformBrowser(this.platformId)) {
      this.chat.set(this.getInitialChat());
      if (this.engine) {
        await this.engine.resetChat();
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
  sendMessage(userPrompt: string) {
    const message = { role: 'user', content: userPrompt, timestamp: Date.now() } as ChatMessage;
    this.messageQueue.update((queue) => [...queue, message]);
    this.prosessQueue();
  }

  private async prosessQueue() {
    if (this.processingQueue || this.messageQueue().length === 0) return;
    this.processingQueue = true;

    if (this.engine == null) {
      console.debug('WebLLM: Engine not initialized. Cannot send message.');
      return;
    }

    // Process messages from queue
    const messages = this.messageQueue();
    this.messageQueue.set([]);
    this.chat.update((history) => [
      ...history,
      ...messages,
      // Put a response placeholder in chat history
      {
        role: 'assistant',
        content: '',
        timestamp: Date.now() + 10,
        stream: true,
      } as ChatMessage,
    ]);

    // Wait for the model to be loaded
    if (!this.modelLoaded()) {
      // Do not call loadModel() if we are already loading the model
      if (this.status() !== ChatStatus.MODEL) {
        this.loadModel();
      }
      await firstValueFrom(this.modelLoaded$.pipe(filter((loaded) => loaded)));
      console.debug('WebLLM: Model loaded. Processing queue...');
    }

    try {
      // Create payload
      this.setStatus(ChatStatus.TYPING);
      const chunks = await this.engine.chat.completions.create({
        stream: true,
        messages: this.chatHistory().filter((msg) => !msg.stream),
        temperature: 1,
        stream_options: { include_usage: true },
      });
      let reply = '';

      console.debug('WebLLM: Waiting for reply');
      for await (const chunk of chunks) {
        this.chat.update((history) => {
          const lastMessage = history.find((msg) => msg.stream);
          history = history.filter((msg) => msg.stream !== true);
          if (lastMessage) {
            lastMessage.content += chunk.choices[0]?.delta.content ?? '';
          }
          return [...history, lastMessage!];
        });

        reply += chunk.choices[0]?.delta.content ?? '';
        if (chunk.usage) {
          console.debug(chunk.usage);
        }
      }

      const message = await this.engine!.getMessage();
      this.chat.update((history) => {
        history = history.filter((msg) => msg.stream !== true);
        return [...history, { role: 'assistant', content: message, timestamp: Date.now() }];
      });

      this.processingQueue = false;
      this.setStatus(ChatStatus.IDLE);
      if (this.messageQueue().length > 0) {
        this.prosessQueue();
      }
    } catch (ex) {
      console.error('WebLLM: Error initializing chat:', ex);
    }
  }

  getAvailableModels() {
    return prebuiltAppConfig.model_list;
  }

  getModelFamilies() {
    const regexp = /^(?<family>[A-Za-z]+(?:[A-Za-z]+)?)-?(?<identifier>.*?)-(?<quant>q[0-9]f(?:16|32))/;

    const grouped = prebuiltAppConfig.model_list.reduce((acc, model) => {
      const match = model.model_id.match(regexp);
      if (!match || !match.groups) return acc;

      const { family, identifier, quant } = match.groups;

      // Find or create the family group
      let familyGroup = acc.find((f) => f.family === family);
      if (!familyGroup) {
        familyGroup = { family, models: [] };
        acc.push(familyGroup);
      }

      // Find or create the identifier group within the family
      let identifierGroup = familyGroup.models.find((m) => m.identifier === identifier);
      if (!identifierGroup) {
        identifierGroup = {
          identifier,
          quantizations: [],
          models: [],
        };
        familyGroup.models.push(identifierGroup);
      }

      // Add quantization if not already present
      if (!identifierGroup.quantizations.includes(quant)) {
        identifierGroup.quantizations.push(quant);
      }

      // Add model_id if not already present
      if (!identifierGroup.models.includes(model.model_id)) {
        identifierGroup.models.push(model.model_id);
      }

      return acc;
    }, [] as ChatModel[]);

    return grouped;
  }
}

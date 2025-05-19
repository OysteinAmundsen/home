import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { logMsg } from '@home/shared/browser/logger/logger';
import { serviceWorkerActivated } from '@home/shared/browser/service-worker/service-worker';
import { interpolate, titleCase } from '@home/shared/utils/string';
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
import { ChatMessage, ChatModel, ChatSystemInfo } from './chat.model';
import systemPrompt from './system-prompt.md';

export enum ChatStatus {
  IDLE = '',
  ENGINE = 'Loading engine',
  MODEL = 'Loading model',
  TYPING = 'Typing',
  ERROR = 'Error',
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly platformId = inject(PLATFORM_ID);

  private engine?: MLCEngineInterface;
  private enginePromise?: Promise<MLCEngineInterface>;
  private adapter?: GPUAdapter;
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
  chatHistory = computed<ChatMessage[]>(() => [...this.chat(), ...this.promptQueue()]);
  private promptQueue = signal<ChatMessage[]>([]);
  private messageHistory = computed(() => this.chat().filter((msg) => msg != null && !msg.stream));
  private currentReply = computed<ChatMessage | undefined>(() => {
    const messages = this.chat();
    return messages.find((msg) => msg.stream);
  });
  isReplying = computed(() => this.currentReply() !== undefined);
  private processingQueue = false;

  engineConfig: MLCEngineConfig = {
    initProgressCallback: this.onProgress,
    logLevel: 'WARN',
    appConfig: {
      ...prebuiltAppConfig,
      useIndexedDBCache: true,
    },
  };

  setStatus(status: ChatStatus) {
    this.status.set(status);
  }

  systemInfo = signal<ChatSystemInfo>({} as ChatSystemInfo);
  onStatusChange = effect(async () => {
    const status = this.status(); // Trigger re-evaluation when status changes

    let engine: MLCEngineInterface | undefined = undefined;
    let bufferSize = 0;
    let gpuVendor = '';
    engine = await this.getEngine();
    if (engine) {
      bufferSize = await engine.getMaxStorageBufferBindingSize();
      gpuVendor = await engine.getGPUVendor();
    }
    this.systemInfo.set({
      model: this.selectedModel(),
      bufferSize,
      gpuVendor,
    });
  });

  /**
   * Initializes the LLM engine
   */
  async getEngine(): Promise<MLCEngineInterface | undefined> {
    // Do not run in SSR
    if (!isPlatformBrowser(this.platformId)) return undefined;
    // If the engine is already initialized, return it
    if (this.engine) return this.engine;
    // If the engine is already being initialized, wait for it to finish
    if (this.enginePromise) return await this.enginePromise;

    // Create a new engine
    const createEngine = async () => {
      this.setStatus(ChatStatus.ENGINE);
      console.debug(...logMsg('debug', 'WebLLM', 'Initializing chat service...'));
      this.adapter = (await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })) || undefined;
      this.loadedModel = undefined;
      let engine: MLCEngineInterface | undefined = undefined;
      if (await serviceWorkerActivated()) {
        console.debug(...logMsg('debug', 'WebLLM', 'Creating service-worker engine...'));
        engine = new ServiceWorkerMLCEngine(this.engineConfig, 5000);
      }
      if (!engine) {
        console.debug(...logMsg('debug', 'WebLLM', 'Creating web-worker engine...'));
        engine = new WebWorkerMLCEngine(
          new Worker(new URL('./chat.worker.ts', import.meta.url), { type: 'module' }),
          this.engineConfig,
        );
      }
      this.engine = engine;
      this.setStatus(ChatStatus.IDLE);
      return this.engine;
    };
    this.enginePromise = createEngine();
    return await this.enginePromise;
  }

  /**
   * Load the selected model into the engine.
   */
  async loadModel() {
    if (!isPlatformBrowser(this.platformId)) return undefined;

    const model = this.selectedModel();
    const engine = await this.getEngine();

    if (model && engine && this.loadedModel !== model) {
      try {
        this.modelLoaded$.next(false);
        this.setStatus(ChatStatus.MODEL);
        console.debug(...logMsg('debug', 'WebLLM', 'Loading model...', this.selectedModel()));
        this.loadedModel = model;
        await engine.unload();
        await engine.reload(model);
        this.modelLoaded$.next(true);
      } catch (e) {
        this.loadedModel = undefined;
        this.progressText.set('Error loading model: ' + e);
        await engine.unload();
      } finally {
        this.setStatus(ChatStatus.IDLE);
      }
    }
  }

  getInitialChat(): ChatMessage[] {
    if (!isPlatformBrowser(this.platformId)) return [];

    // Collect data from the widgetRoutes registry
    const widgetData = widgetRoutes.map((widget) => ({
      path: widget.path,
      name: titleCase(`${widget.path}`),
      description: widget.data!['description'],
      meta: widget.data!['meta'],
      tags: widget.data!['tags'],
    }));

    const origin = window.location.origin;

    // Compose the `{{ widgets }}` section
    const widgets = widgetData
      .map((widget, index) => {
        return `${index + 1}. Name: [${widget.name}](${origin}/${widget.path})
   Code path: './libs/widgets/${widget.path}'
   ${widget.tags ? `Tags: [${widget.tags.map((t: string) => `"${titleCase(t)}"`).join(', ')}]` : ''}
   Description: ${widget.description}
   Metadata: \n${widget.meta.map((meta: string) => `     * ${meta}`).join('\n')}\n`;
      })
      .join('');

    // Compose the `{{ widgetReadme }}` section
    const widgetReadme = widgetData
      .map(
        (widget) =>
          `    + [${widget.name}](https://raw.githubusercontent.com/OysteinAmundsen/home/refs/heads/master/libs/widgets/${widget.path}/README.md)`,
      )
      .join('\n')
      .trimStart();

    const content = interpolate(systemPrompt, { widgets, widgetReadme, origin });

    return [
      // Give in contextual data. This will make our chatbot be able to answer
      // questions about the app and its tech stack
      { role: 'system', content, timestamp: Date.now() - 1 },
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

  stopMessage() {
    if (this.engine) {
      this.engine.interruptGenerate();
    }
    this.chat.update(() => {
      const lastMessage = this.currentReply();
      if (lastMessage) {
        lastMessage.aborted = true;
        return [...this.messageHistory(), lastMessage];
      }
      return [...this.messageHistory()];
    });
    // Only halt the queue if it has not yet begun responding
    // Otherwise, let the `sendMessage` handle the message abortion.
    if (this.processingQueue && this.status() !== ChatStatus.TYPING) {
      this.promptQueue.set([]);
      this.processingQueue = false;
      this.setStatus(ChatStatus.IDLE);
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
    if (userPrompt.length === 0) return;
    const message = { role: 'user', content: userPrompt, timestamp: Date.now() } as ChatMessage;
    this.promptQueue.update((queue) => [...queue, message]);
    this.prosessQueue();
  }

  private async prosessQueue() {
    if (this.processingQueue || this.promptQueue().length === 0) return;
    this.processingQueue = true;

    if (this.engine == null) {
      console.debug(...logMsg('debug', 'WebLLM', 'Engine not initialized. Cannot send message.'));
      return;
    }

    // Process messages from queue
    const messages = this.promptQueue();
    this.promptQueue.set([]);
    this.chat.update(() => [
      ...this.messageHistory(),
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
      console.debug(...logMsg('debug', 'WebLLM', 'Model loaded. Processing queue...'));
    }

    // If the queue has been aborted, do not process it
    if (!this.processingQueue) return;
    try {
      // Create payload
      this.setStatus(ChatStatus.TYPING);
      const chunks = await this.engine.chat.completions.create({
        stream: true,
        messages: this.messageHistory(),
        temperature: 1,
        stream_options: { include_usage: true },
      });
      let reply = '';

      console.debug(...logMsg('debug', 'WebLLM', 'Waiting for reply'));
      for await (const chunk of chunks) {
        // Append the chunk to the reply
        reply += chunk.choices[0]?.delta.content ?? '';
        // Update the chat with the chunk
        this.chat.update(() => {
          const lastMessage = this.currentReply();
          if (lastMessage) {
            lastMessage.content = reply;
            return [...this.messageHistory(), lastMessage];
          }
          return [...this.messageHistory()];
        });

        if (chunk.usage) {
          // Message done
          console.debug(...logMsg('debug', 'WebLLM', 'Reply done!', chunk.usage));
        }
      }

      // Replace the last message with the final reply
      const message = await this.engine!.getMessage();
      if (message != null) {
        this.chat.update(() => {
          const lastMessage = this.currentReply();
          const isAborted = lastMessage?.aborted;
          return [
            ...this.messageHistory(),
            {
              role: 'assistant',
              content: message + (isAborted ? '...' : '') || '...',
              timestamp: Date.now(),
              aborted: isAborted,
            },
          ];
        });
      }

      // Clean up and make ready for next message
      this.processingQueue = false;
      this.setStatus(ChatStatus.IDLE);
      if (this.promptQueue().length > 0) {
        this.prosessQueue();
      }
    } catch (ex: any) {
      // Make sure that the chat is not stuck in processing mode
      console.error(...logMsg('error', 'WebLLM', 'Error:', ex));
      this.setStatus(ChatStatus.ERROR);
      this.processingQueue = false;
      this.chat.update(() => [
        ...this.messageHistory(),
        {
          role: 'assistant',
          content: `Error: ${ex}`,
          timestamp: Date.now(),
        },
      ]);
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

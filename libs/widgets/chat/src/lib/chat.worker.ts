// Serve the engine workload through web worker
import { logMsg } from '@home/shared/browser/logger/logger';
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

let handler: WebWorkerMLCEngineHandler;

self.onmessage = (msg: MessageEvent) => {
  if (!handler) {
    handler = new WebWorkerMLCEngineHandler();
    console.info(...logMsg('info', 'Web Worker', 'Web-LLM Engine Activated'));
  }
  handler.onmessage(msg);
};

import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

export type ChatMessage = { timestamp: number; stream?: boolean; aborted?: boolean } & ChatCompletionMessageParam;

export interface ChatModel {
  family: string;
  models: {
    identifier: string;
    quantizations: string[];
    models: string[];
  }[];
}

export interface ChatSystemInfo {
  model?: string;
  bufferSize?: number;
  gpuVendor?: string;
}

import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

export type ChatMessage = { timestamp: number; stream?: boolean } & ChatCompletionMessageParam;

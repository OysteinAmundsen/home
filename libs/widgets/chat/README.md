# chat

This is an experiment using [WebLLM](https://webllm.mlc.ai/). It downloads a model from huggingface.com down to the client, caches it using indexDB and allows you to chat with the model offline if you
like.

I wanted the model to be trained using information from this app, so that it can guide users on how to use the app and which technologies it used. So I created a [system prompt](./src/lib/system-prompt.md) which I feed into the engine the first time a user interacts with it.

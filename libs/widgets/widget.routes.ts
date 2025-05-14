import { Route } from '@angular/router';

/**
 * The widget repository
 *
 * All available widgets are looked up here.
 */
export const widgetRoutes: Route[] = [
  {
    path: 'weather',
    data: {
      widget: true,
      tags: ['integrations'],
      description: 'Shows the current weather and forecast for the next 12 hours.',
      meta: [
        'Weather information fetched from met.no API',
        'Allows location search by default',
        'Allows device geolocation if granted by user',
        'Location data is truncated to the nearest 100 meters to avoid excessive updates',
        'Data is cached and updated hourly',
      ],
    },
    loadComponent: () => import('@home/widgets/weather').then((m) => m.default),
  },
  {
    path: 'fund',
    data: {
      widget: true,
      tags: ['integrations', 'finance', 'canvas2D'],
      description: 'Compare funds historic performance against each other.',
      meta: [
        'Uses APIs from nordnet.no to display fund performance graphs',
        'Allows searching for funds and adding them to a watchlist for comparison',
        'Data is cached and updated once a day',
        'Allows searching for funds by name, ticker or instrument id',
      ],
    },
    loadComponent: () => import('@home/widgets/fund').then((m) => m.default),
  },
  {
    path: 'starfield',
    data: {
      widget: true,
      tags: ['graphics', 'canvas2D'],
      description: 'A simple starfield animation.',
      meta: [
        'A simple starfield animation',
        'Uses canvas2D for rendering',
        'No external dependencies',
        'Lightweight and fast',
      ],
    },
    loadComponent: () => import('@home/widgets/starfield').then((m) => m.default),
  },
  {
    path: 'pyramid',
    data: {
      widget: true,
      tags: ['graphics', 'webGPU'],
      description: 'An experiment using WebGPU.',
      meta: ['An experiment using WebGPU', 'No external dependencies'],
    },
    loadComponent: () => import('@home/widgets/pyramid').then((m) => m.default),
  },
  {
    path: 'transcribe',
    data: {
      widget: true,
      tags: ['ai'],
      description: 'Transcribe audio to text using server side installed AI.',
      meta: [
        'Uses a locally installed Whisper AI model (server-side) to transcribe audio files',
        'The model is loaded server-side via a python script',
        'Whisper model is especially trained for norwegian language',
        'Upload audio files to transcribe',
        'Record audio using microphone if granted access by user',
        'No files are stored on the server. The audio file is processed in memory and discarded after processing',
      ],
    },
    loadComponent: () => import('@home/widgets/transcribe').then((m) => m.default),
  },
  {
    path: 'chat',
    data: {
      widget: true,
      tags: ['ai'],
      description: 'Chatbot that uses WebLLM to operate entirely without server communication.',
      meta: [
        'Chatbot that uses WebLLM to operate entirely without server communication',
        'Model is loaded client-side using WebGPU and cached in the service-worker for faster and more efficient inference',
      ],
    },
    loadComponent: () => import('@home/widgets/chat').then((m) => m.default),
  },
];

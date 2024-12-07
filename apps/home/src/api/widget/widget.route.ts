import express from 'express';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
export function widgetRoutes(server: express.Express) {
  const widgetData = [
    { id: 1, name: 'Widget 1', componentName: 'widget1' },
    { id: 2, name: 'Widget 2', componentName: 'widget2' },
  ];

  /**
   * Fetch all widgets.
   */
  server.get('/api/widgets', (req, res) => {
    res.json(widgetData);
    console.log('request', req.url, res.statusCode);
  });

  /**
   * Fetch a single widget by ID.
   */
  server.get('/api/widgets/:id', (req, res) => {
    if (req.params.id) {
      const widget = widgetData.find((w) => w.id === +req.params.id);
      if (!widget) {
        res.status(404).json({ error: 'Widget not found' });
      } else {
        res.json([widget]);
      }
    } else {
      res.status(400).json({ error: 'Invalid widget ID' });
    }
    console.log('request', req.url, res.statusCode);
  });
}

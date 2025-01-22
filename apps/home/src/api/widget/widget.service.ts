import { Injectable } from '@nestjs/common';

@Injectable()
export class WidgetService {
  private widgetStore = [
    { id: 1, name: 'Weather', componentName: 'weather' },
    { id: 2, name: 'Taxes', componentName: 'widget2' },
    { id: 3, name: 'Something else', componentName: 'widget3' },
  ];

  getWidgets(id?: number) {
    return id ? this.widgetStore.find((w) => w.id === id) : this.widgetStore;
  }
}

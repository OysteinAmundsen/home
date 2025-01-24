import { Injectable } from '@nestjs/common';
import widgetStore from './widget.store.json';

@Injectable()
export class WidgetService {
  private widgetStore = widgetStore;

  getWidgets(id?: number) {
    return id ? this.widgetStore.find((w) => w.id === id) : this.widgetStore;
  }
}

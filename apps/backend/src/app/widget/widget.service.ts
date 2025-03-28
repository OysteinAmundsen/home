import { titleCase } from '@home/shared/utils/string';
// import { widgetRoutes } from '@home/widgets/widget.routes';
import { Injectable } from '@nestjs/common';

const widgetRoutes = [];

@Injectable()
export class WidgetService {
  private widgetStore = widgetRoutes.map((route, index) => ({
    id: index,
    name: titleCase(route.path || ''),
    tags: route.data?.tags ?? [],
    componentName: route.path,
  }));

  getWidgets(id?: number) {
    return id ? this.widgetStore.find((w) => w.id === id) : this.widgetStore;
  }

  getAvailableTags(): string[] {
    return Array.from(
      this.widgetStore.reduce((acc, curr) => {
        curr.tags.forEach((tag: string) => acc.add(tag.toLowerCase()));
        return acc;
      }, new Set<string>()),
    );
  }

  getWidgetsByTag(tag: string) {
    return this.widgetStore.filter((w) => w.tags.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase()));
  }
}

import {
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Widget, WidgetService } from './widget.service';

/**
 * Container for widget components.
 *
 * This renders a standard ui wrapper for all widgets when displayed in the dashboard.
 */
@Component({
  selector: 'app-widget',
  imports: [RouterModule],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  host: {
    class: 'widget-wrapper',
    '[style.--widget-id]': 'widgetId()',
  },
})
export class WidgetComponent {
  private readonly widgetService = inject(WidgetService);
  private container = viewChild('container', { read: ViewContainerRef });

  data = input<Widget>();

  widgetId = computed(() => `widget_${this.data()?.id}`);

  route = computed(() => {
    const data = this.data();
    const route = this.widgetService.getRoute(data?.componentName);
    return route ? [route.path] : [];
  });

  /**
   * Dynamically load a component based on the `componentName` input.
   *
   * @returns a reference to the component class
   */
  private innerComponentLoader = resource({
    // Triggers
    request: () => ({ componentName: this.data()?.componentName }),
    // Actions
    loader: async ({ request }) =>
      this.widgetService.loadWidget(request.componentName),
  });

  /**
   * Dynamically renders a component in the view container
   */
  private innerComponentRenderer = effect(() => {
    // Triggers
    const container = this.container();
    const component = this.innerComponentLoader.value();
    // Actions
    if (component) {
      container?.clear();
      try {
        const componentRef = container?.createComponent(component);
      } catch (error) {
        console.error('Error creating component:', error);
      }
    }
  });
}

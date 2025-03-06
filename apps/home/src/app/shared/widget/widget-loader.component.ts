import { Component, computed, effect, inject, input, resource, viewChild, ViewContainerRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Widget, WidgetService } from './widget.service';

/**
 * A loader for widgets
 *
 * This takes in a component name and dynamically loads and renders the component.
 * Useful for lazy loading components inside a dashboard where the components are not known
 * at compile time. For instance if the dashboard is user customizable and users can
 * choose themselves which widgets to display. This allows the application to load only
 * the components that should actually be visible.
 */
@Component({
  selector: 'app-widget-loader',
  imports: [RouterModule],
  template: `<ng-container #container></ng-container>`,
  host: { class: 'widget-loader' },
})
export class WidgetLoaderComponent {
  private readonly widgetService = inject(WidgetService);
  private container = viewChild('container', { read: ViewContainerRef });

  data = input<Widget>();

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
    request: () => this.data()?.componentName,
    // Actions
    loader: async ({ request }) => this.widgetService.loadWidget(request),
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
        componentRef?.setInput('data', this.data());
      } catch (error) {
        console.error('Error creating component:', error);
      }
    }
  });
}

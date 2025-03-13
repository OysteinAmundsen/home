import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AbstractWidgetComponent } from './abstract-widget.component';
import { WidgetService } from './widget.service';

/**
 * Container for widget components.
 *
 * This renders a standard ui wrapper for all widgets when displayed in the dashboard.
 */
@Component({
  selector: 'lib-widget',
  imports: [RouterModule, NgTemplateOutlet],
  template: `
    <ng-template #tpl>
      <ng-content></ng-content>
    </ng-template>

    @if (route().length > 0) {
      <header [attr.style]="'view-transition-name: ' + widgetId() + '-header'" class="widget-header">
        <h2 [attr.style]="'view-transition-name: ' + widgetId() + '-header-text'">{{ data()?.name }}</h2>
        @if (!isFullscreen()) {
          <a [routerLink]="route()" [title]="'Open ' + data()?.name + ' in fullscreen mode'">
            <span
              class="material-symbols-outlined"
              [attr.style]="'view-transition-name: ' + widgetId() + '-header-icon'"
            >
              open_in_new
            </span>
          </a>
        } @else {
          <a [routerLink]="['/']" class="button" [title]="'Go back to dashboard'">
            <span
              class="material-symbols-outlined"
              [attr.style]="'view-transition-name: ' + widgetId() + '-header-icon'"
            >
              close_fullscreen
            </span>
          </a>
        }
      </header>
    }
    <div class="widget-content" [attr.style]="'view-transition-name: ' + widgetId() + '-content'">
      <ng-container *ngTemplateOutlet="tpl"></ng-container>
    </div>
  `,
  host: { class: 'widget-wrapper' },
})
export class WidgetComponent {
  private readonly widgetService = inject(WidgetService);

  /** Holds a reference to the base class of all widgets */
  host = input.required<AbstractWidgetComponent>();

  /** A proxy to the base class signal of the same name */
  isFullscreen = computed(() => this.host()?.isFullscreen() === true);

  /**
   * Data is only input here if widget is displayed in a dashboard.
   *
   * If widget is displayed fullscreen, data is derived from whatever
   * the actual widget is willing to provide us.
   */
  data = computed(() => this.host()?.resolvedData() ?? { id: '', name: '', componentName: '' });

  widgetId = computed(() => this.host()?.widgetId());
  route = computed(() => {
    const data = this.data();
    if (data) {
      const route = this.widgetService.getRoute(data?.componentName);
      return route ? [route.path] : [];
    }
    return [];
  });
}

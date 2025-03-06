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
  selector: 'app-widget',
  imports: [RouterModule, NgTemplateOutlet],
  template: `
    <ng-template #tpl>
      <ng-content></ng-content>
    </ng-template>

    @if (!isFullscreen()) {
      @if (route().length > 0) {
        <header [attr.style]="'view-transition-name: ' + widgetId() + '-header'">
          <span>{{ data()?.name }}</span>
          <a [routerLink]="route()" [title]="'Open ' + data()?.name + ' in fullscreen mode'">
            <span class="material-symbols-outlined"> open_in_new </span>
          </a>
        </header>
      }
      <div class="widget-content" [attr.style]="'view-transition-name: ' + widgetId() + '-content'">
        <ng-container *ngTemplateOutlet="tpl"></ng-container>
      </div>
    } @else {
      <header [attr.style]="'view-transition-name: ' + widgetId() + '-header'">
        <h2>{{ data()?.name }}</h2>
        @if (route().length) {
          <a [routerLink]="['/']" class="button">
            <span class="material-symbols-outlined"> close_fullscreen </span>
          </a>
        }
      </header>

      <ng-container *ngTemplateOutlet="tpl"></ng-container>
    }
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

  widgetId = computed(() => `widget-${this.host()?.widgetName()}`);
  route = computed(() => {
    const data = this.data();
    if (data) {
      const route = this.widgetService.getRoute(data?.componentName);
      return route ? [route.path] : [];
    }
    return [];
  });
}

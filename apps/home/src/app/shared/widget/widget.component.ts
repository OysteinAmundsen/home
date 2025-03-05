import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, TemplateRef, viewChild } from '@angular/core';
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
          <a [routerLink]="['/']">
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

  tpl = viewChild<TemplateRef<any>>('tpl');

  host = input.required<AbstractWidgetComponent>();
  isFullscreen = computed(() => this.host()?.isFullscreen() === true);
  data = computed(() => this.host()?.resolvedData() ?? { id: '', name: '', componentName: '' });

  widgetId = computed(() => `widget-${this.host()?.widgetId()}`);
  route = computed(() => {
    const data = this.data();
    if (data) {
      const route = this.widgetService.getRoute(data?.componentName);
      return route ? [route.path] : [];
    }
    return [];
  });
}

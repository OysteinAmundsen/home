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
      <header [attr.style]="'view-transition-name: ' + this.widgetId() + '-header'">
        <span>{{ data()?.name }}</span>
        @if (route().length) {
          <a [routerLink]="route()">Open</a>
        }
      </header>
      <div class="widget-content" [attr.style]="'view-transition-name: ' + this.widgetId() + '-content'">
        <ng-container *ngTemplateOutlet="tpl"></ng-container>
      </div>
    } @else {
      <header [attr.style]="'view-transition-name: ' + this.widgetId() + '-header'">
        <h2>{{ data()?.name }}</h2>
        @if (route().length) {
          <a [routerLink]="['/']">Close</a>
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

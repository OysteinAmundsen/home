import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';
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
      <header
        [attr.style]="'view-transition-name: ' + this.widgetId() + '-header'"
      >
        <span>{{ data()?.name }}</span>
        @if (route().length) {
          <a [routerLink]="route()">Open</a>
        }
      </header>
      <div
        class="widget-content"
        [attr.style]="'view-transition-name: ' + this.widgetId() + '-content'"
      >
        <ng-container *ngTemplateOutlet="tpl"></ng-container>
      </div>
    } @else {
      <header
        [attr.style]="'view-transition-name: ' + this.widgetId() + '-header'"
      >
        <h2>{{ data()?.name }}</h2>
        @if (route().length) {
          <a [routerLink]="['/']">Close</a>
        }
      </header>

      <ng-container *ngTemplateOutlet="tpl"></ng-container>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      border-radius: var(--border-radius);
      overflow: hidden;
      view-transition-class: widget;
      view-transition-name: var(--widget-id);

      @layer widget {
        transition-behavior: allow-discrete;
        transition:
          opacity 0.25s ease-in,
          scale 0.25s ease-in,
          display 0.25s ease-in;

        // Enter animation
        @starting-style {
          scale: 0.7;
          opacity: 0;
        }
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        color: var(--header-color);
        font-size: 0.9rem;
        view-transition-class: widget-header;
      }

      .widget-content {
        padding: 1rem;
        background-color: var(--background-color);
        view-transition-class: widget-content;
        min-height: fit-content;
      }
    }

    // Dashboard view
    :root .widget:not(.fullscreen) :host {
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow1);
      header {
        background: var(--header-background);
      }
    }
  `,
  host: {
    class: 'widget-wrapper',
  },
})
export class WidgetComponent {
  private readonly widgetService = inject(WidgetService);

  tpl = viewChild<TemplateRef<any>>('tpl');

  host = input.required<AbstractWidgetComponent>();
  isFullscreen = computed(() => this.host()?.isFullscreen() === true);
  data = computed(
    () =>
      this.host()?.resolvedData() ?? { id: '', name: '', componentName: '' },
  );

  widgetId = computed(() => `widget_${this.data()?.componentName}`);
  route = computed(() => {
    const data = this.data();
    if (data) {
      const route = this.widgetService.getRoute(data?.componentName);
      return route ? [route.path] : [];
    }
    return [];
  });
}

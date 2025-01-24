import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConnectivityService } from './shared/connectivity/connectivity.service';
import { ThemeComponent } from './shared/theme/theme.component';
import { TimeComponent } from './shared/time.component';
import { doSafeTransition } from './shared/utils/transitions';
import { VisibilityService } from './shared/visibility/visibility.service';
import { WidgetComponent } from './shared/widget/widget.component';
import { Widget, WidgetService } from './shared/widget/widget.service';

@Component({
  imports: [
    RouterModule,
    CommonModule,
    WidgetComponent,
    TimeComponent,
    ThemeComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  private readonly widgetService = inject(WidgetService);
  private readonly visibility = inject(VisibilityService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly el = inject(ElementRef);

  /** Is set if current document is inactive and not in focus */
  @HostBinding('class.inactive')
  get isInactive() {
    return !this.visibility.isBrowserActive();
  }

  /** Is set if browser looses connectivity */
  @HostBinding('class.offline')
  get isOffline() {
    return this.connectivity.isBrowserOffline();
  }

  /** The resource loader for widgets is outsourced to an effect in order to animate this */
  widgets = signal([] as Widget[]);
  error = signal(undefined);

  /* This will apply loaded widgets inside a view transition */
  widgetLoader = effect(() => {
    const widgets = this.widgetService.widgets;
    if (widgets.isLoading()) return;
    if (widgets.error()) {
      this.error.set((widgets.error() as HttpErrorResponse).error.error);
      return;
    }
    doSafeTransition(() =>
      this.widgets.update((oldWidgets) => {
        const newWidgets = widgets.value() || [];
        // Keep widgets that exist in both arrays,
        // remove widgets that are not in the new array
        // and add widgets that are not in the old array
        return newWidgets.map((newWidget) => {
          const oldWidget = oldWidgets.find(
            (oldWidget) => oldWidget.id === newWidget.id,
          );
          return oldWidget || newWidget;
        });
      }),
    );
  });

  /** The resource reactive signal for reloading */
  filter(id: number | undefined) {
    this.widgetService.filter.set(id);
  }

  /** Handle background position changes with mouse movements */
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const offsetX = (mouseX / viewportWidth) * 108 - 4;
    const offsetY = (mouseY / viewportHeight) * 108 - 4;
    this.el.nativeElement.style.setProperty(
      '--background-position-x',
      `${offsetX}%`,
    );
    this.el.nativeElement.style.setProperty(
      '--background-position-y',
      `${offsetY}%`,
    );
  }

  ngAfterViewInit() {
    this.filter(undefined);
  }
}

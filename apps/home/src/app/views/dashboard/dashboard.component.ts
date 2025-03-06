import { trigger } from '@angular/animations';
import { afterNextRender, AfterViewInit, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { doSafeTransition } from '../../shared/utils/transitions';
import { WidgetLoaderComponent } from '../../shared/widget/widget-loader.component';
import { Widget, WidgetService } from '../../shared/widget/widget.service';
import { widgetAnimation } from '../../shared/widget/widgets.animation';

/**
 * The dashboard component
 *
 * This holds all the widgets for this dashboard.
 */
@Component({
  selector: 'app-dashboard',
  imports: [WidgetLoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [trigger('widgets', [widgetAnimation])],
})
export class DashboardComponent implements AfterViewInit {
  private readonly widgetService = inject(WidgetService);
  private readonly router = inject(Router);
  private readonly destroyRef$ = inject(DestroyRef);

  protected animationDisabled = signal(true);

  /** The resource loader for widgets is outsourced to an effect in order to animate this */
  widgets = signal<Widget[]>([]);
  error = this.widgetService.error;
  isLoading = this.widgetService.isLoading;
  widgetsLoader = effect(() => {
    const widgets = this.widgetService.widgets();
    doSafeTransition(() => this.widgets.set(widgets));
  });

  /** The resource reactive signal for reloading */
  filter(id: number | undefined) {
    this.widgetService.filter.set(id);
  }

  constructor() {
    // Skip animation on initial load
    afterNextRender(() => (this.animationDisabled() ? this.animationDisabled.set(false) : null));

    // Skip animation on route change
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        filter((event) => event instanceof NavigationStart),
      )
      .subscribe(() => {
        this.animationDisabled.set(true);
      });
  }

  ngAfterViewInit() {
    this.filter(undefined);
  }
}

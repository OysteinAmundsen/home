import { trigger } from '@angular/animations';
import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, AfterViewInit, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { StringPipe } from '@home/shared/pipes/string.pipe';
import { doSafeTransition } from '@home/shared/utils/transitions';
import { PopoverToggleComponent } from '@home/shared/ux/popover/popover-toggle.component';
import { PopoverComponent } from '@home/shared/ux/popover/popover.component';
import { SettingsFormComponent } from '@home/shared/ux/settings/settings-form.component';
import { WidgetLoaderComponent } from '@home/shared/widget/widget-loader.component';
import { Widget, WidgetService } from '@home/shared/widget/widget.service';
import { filter } from 'rxjs';
import { dashboardAnimation } from './dashboard.animation';
import { SpinnerComponent } from '@home/shared/ux/spinner/spinner.component';

/**
 * The dashboard component
 *
 * This holds all the widgets for this dashboard.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    WidgetLoaderComponent,
    StringPipe,
    PopoverToggleComponent,
    PopoverComponent,
    SettingsFormComponent,
    SpinnerComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [trigger('widgets', [dashboardAnimation])],
})
export class DashboardComponent implements AfterViewInit {
  private readonly widgetService = inject(WidgetService);
  private readonly router = inject(Router);
  private readonly destroyRef$ = inject(DestroyRef);

  protected animationDisabled = signal(true);

  /** The resource loader for widgets is outsourced to an effect in order to animate this */
  tags = this.widgetService.tags;
  widgets = signal<Widget[]>([]);
  error = this.widgetService.error;
  isLoading = this.widgetService.isLoading;
  widgetsLoader = effect(() => {
    const widgets = this.widgetService.widgets();
    doSafeTransition(() => this.widgets.set(widgets));
  });

  /** The resource reactive signal for reloading */
  filter(id: string | undefined) {
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

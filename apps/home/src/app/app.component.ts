import { trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
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
import { AppSettingsService } from './app.settings';
import { AuthenticationService } from './shared/auth/authentication.service';
import { LoginComponent } from './shared/auth/login.component';
import { RegisterComponent } from './shared/auth/register.component';
import { ConnectivityService } from './shared/connectivity/connectivity.service';
import { ThemeComponent } from './shared/theme/theme.component';
import { TimeComponent } from './shared/time.component';
import { doSafeTransition } from './shared/utils/transitions';
import { VisibilityService } from './shared/visibility/visibility.service';
import { WidgetComponent } from './shared/widget/widget.component';
import { Widget, WidgetService } from './shared/widget/widget.service';
import { widgetAnimation } from './shared/widget/widgets.animation';

@Component({
  imports: [
    RouterModule,
    CommonModule,
    WidgetComponent,
    TimeComponent,
    ThemeComponent,
    RegisterComponent,
    LoginComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [trigger('widgets', [widgetAnimation])],
})
export class AppComponent implements AfterViewInit {
  private readonly widgetService = inject(WidgetService);
  private readonly visibility = inject(VisibilityService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly el = inject(ElementRef);
  private readonly settings = inject(AppSettingsService);
  private readonly auth = inject(AuthenticationService);

  protected animationDisabled = signal(true);

  constructor() {
    afterNextRender(() =>
      this.animationDisabled() ? this.animationDisabled.set(false) : null,
    );
  }

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

  isRegistered = this.auth.isRegistered;

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

  /** Handle background position changes with mouse movements */
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.settings.animateBackground()) {
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
  }

  ngAfterViewInit() {
    this.filter(undefined);
  }
}

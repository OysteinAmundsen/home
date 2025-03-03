import { trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppSettingsService } from './app.settings';
import { AuthenticationService } from './shared/auth/authentication.service';
import { LoginComponent } from './shared/auth/login.component';
import { ConnectivityService } from './shared/connectivity/connectivity.service';
import { ThemeComponent } from './shared/theme/theme.component';
import { TimeComponent } from './shared/time.component';
import { VisibilityService } from './shared/visibility/visibility.service';
import { WidgetService } from './shared/widget/widget.service';
import { widgetAnimation } from './shared/widget/widgets.animation';

@Component({
  imports: [
    RouterModule,
    CommonModule,
    TimeComponent,
    ThemeComponent,
    LoginComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [trigger('widgets', [widgetAnimation])],
  host: {
    '[class.inactive]': 'isInactive()',
    '[class.offline]': 'isOffline()',
  },
})
export class AppComponent implements AfterViewInit {
  private readonly widgetService = inject(WidgetService);
  private readonly visibility = inject(VisibilityService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly el = inject(ElementRef);
  private readonly settings = inject(AppSettingsService);
  private readonly auth = inject(AuthenticationService);

  /** Is set if current document is inactive and not in focus */
  isInactive = computed(() => !this.visibility.isBrowserActive());

  /** Is set if browser looses connectivity */
  isOffline = computed(() => this.connectivity.isBrowserOffline());

  isRegistered = this.auth.isRegistered;

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

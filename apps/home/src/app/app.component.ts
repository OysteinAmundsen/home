import { trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppSettingsService } from '@home/shared/app.settings';
import { ConnectivityService } from '@home/shared/browser/connectivity/connectivity.service';
import { ThemeComponent } from '@home/shared/browser/theme/theme.component';
import { VisibilityService } from '@home/shared/browser/visibility/visibility.service';
import { AuthenticationService } from './shared/auth/authentication.service';
import { LoginComponent } from './shared/auth/login.component';
import { TimeComponent } from './shared/time.component';
import { dashboardAnimation } from './views/dashboard/dashboard.animation';

@Component({
  imports: [RouterModule, CommonModule, TimeComponent, ThemeComponent, LoginComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [trigger('widgets', [dashboardAnimation])],
  host: {
    '[class.inactive]': 'isInactive()',
    '[class.offline]': 'isOffline()',
  },
})
export class AppComponent {
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
      this.el.nativeElement.style.setProperty('--background-position-x', `${offsetX}%`);
      this.el.nativeElement.style.setProperty('--background-position-y', `${offsetY}%`);
    } else {
      this.el.nativeElement.style.removeProperty('--background-position-x');
      this.el.nativeElement.style.removeProperty('--background-position-y');
    }
  }
}

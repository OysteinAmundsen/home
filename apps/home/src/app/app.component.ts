import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConnectivityService } from './shared/connectivity.service';
import { TimeComponent } from './shared/time.component';
import { VisibilityService } from './shared/visibility.service';
import { WidgetComponent } from './shared/widget/widget.component';
import { WidgetService } from './shared/widget/widget.service';

@Component({
  imports: [RouterModule, CommonModule, WidgetComponent, TimeComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
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

  /** The resource loader for widgets */
  widgets = this.widgetService.widgets;
  error = computed(
    () => (this.widgets.error() as HttpErrorResponse).error.error,
  );

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
}

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  HostBinding,
  inject,
  resource,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { WidgetComponent } from './shared/widget/widget.component';
import { WidgetService } from './shared/widget/widget.service';
import { TimeComponent } from './shared/time.component';

@Component({
  imports: [RouterModule, CommonModule, WidgetComponent, TimeComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  widgetService = inject(WidgetService);
  widgets = this.widgetService.widgets;
  error = computed(
    () => (this.widgets.error() as HttpErrorResponse).error.error,
  );

  filter(id: number | undefined) {
    this.widgetService.filter.set(id);
  }

  @HostBinding('style.--background-image')
  get backgroundImage() {
    return `url('/api/background')`;
  }
}

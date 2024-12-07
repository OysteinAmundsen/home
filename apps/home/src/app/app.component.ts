import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WidgetComponent } from './shared/widget/widget.component';
import { WidgetService } from './shared/widget/widget.service';

@Component({
  imports: [RouterModule, CommonModule, WidgetComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  widgetService = inject(WidgetService);
  widgets = this.widgetService.widgets;

  filter(id: number | undefined) {
    this.widgetService.filter.set(id);
  }
}

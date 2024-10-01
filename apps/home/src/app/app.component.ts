import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WidgetComponent } from './shared/widget/widget.component';

@Component({
  standalone: true,
  imports: [RouterModule, WidgetComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  http = inject(HttpClient);
  widgets = signal([]);
}

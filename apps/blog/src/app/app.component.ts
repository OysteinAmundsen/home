import { isPlatformBrowser } from '@angular/common';
import { Component, inject, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly currentYear = signal(new Date().getFullYear());
  isAdminAvailable = linkedSignal(() => {
    if (isPlatformBrowser(this.platformId)) {
      return location.origin.includes('://localhost');
    }
    return false;
  });
}

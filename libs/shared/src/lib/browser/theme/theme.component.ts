import { Component, computed, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'lib-theme',
  template: `
    <button type="button" class="flat text-shadow" (click)="toggleTheme()" [title]="title()">
      <span class="material-symbols-outlined">
        {{ theme() === 'light' ? 'dark_mode' : 'light_mode' }}
      </span>
    </button>
  `,
  host: {
    class: 'icon-button',
  },
})
export class ThemeComponent {
  private readonly themeService = inject(ThemeService);
  theme = this.themeService.selectedTheme;

  title = computed(() => {
    const theme = this.theme();
    return `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
  });

  toggleTheme() {
    this.themeService.selectedTheme.set(this.theme() === 'light' ? 'dark' : 'light');
  }
}

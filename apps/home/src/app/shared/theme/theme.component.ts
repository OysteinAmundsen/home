import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme',
  template: `
    <button type="button" class="flat text-shadow" (click)="toggleTheme()">
      <span class="material-symbols-outlined">
        {{ theme() === 'light' ? 'dark_mode' : 'light_mode' }}
      </span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      height: 100%;
      place-items: center;
    }
    button {
      color: var(--color-text);
      height: 1.5rem;
      line-height: 1.7rem;
      padding-top: 1px;
      padding-bottom: 0;
      span {
        font-size: 1rem;
        font-weight: bold;
        line-height: 1.3rem;
        height: 1.5rem;
      }
    }
  `,
})
export class ThemeComponent {
  private readonly themeService = inject(ThemeService);
  theme = this.themeService.selectedTheme;

  toggleTheme() {
    this.themeService.selectedTheme.set(this.theme() === 'light' ? 'dark' : 'light');
  }
}

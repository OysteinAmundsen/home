import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme',
  template: `
    <button type="button" class="text-shadow" (click)="toggleTheme()">
      <span class="material-symbols-outlined">
        {{ theme() === 'light' ? 'dark_mode' : 'light_mode' }}
      </span>
    </button>
  `,
  styles: `
    button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color);
      height: 1.5rem;
      line-height: 1.7rem;
      &:focus,
      &:active {
        outline: none;
      }
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
    this.themeService.selectedTheme.set(
      this.theme() === 'light' ? 'dark' : 'light',
    );
  }
}

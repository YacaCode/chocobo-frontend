import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

type ThemePreference = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'chb_theme';
  private readonly document = inject(DOCUMENT);
  private readonly systemPreference = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  private currentTheme: ThemePreference = this.readSavedTheme();
  private readonly darkModeSignal = signal(this.resolveTheme(this.currentTheme) === 'dark');

  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.applyTheme(this.currentTheme, false);

    this.systemPreference?.addEventListener('change', (event) => {
      if (this.currentTheme === 'auto') {
        this.applyResolvedTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  toggle(): void {
    this.setTheme(this.darkModeSignal() ? 'light' : 'dark');
  }

  setTheme(tema: ThemePreference): void {
    this.applyTheme(tema, true);
  }

  private applyTheme(theme: ThemePreference, persist: boolean): void {
    this.currentTheme = theme;
    this.applyResolvedTheme(this.resolveTheme(theme));
    if (persist) {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  private applyResolvedTheme(effective: 'light' | 'dark'): void {
    const enabled = effective === 'dark';
    this.darkModeSignal.set(enabled);
    this.document.documentElement.classList.toggle('dark', enabled);
    this.document.documentElement.setAttribute('data-theme', effective);
    this.document.documentElement.style.colorScheme = effective;
  }

  private resolveTheme(theme: ThemePreference): 'light' | 'dark' {
    return theme === 'auto'
      ? (this.systemPreference?.matches ?? false ? 'dark' : 'light')
      : theme;
  }

  private readSavedTheme(): ThemePreference {
    const saved = localStorage.getItem(this.storageKey);
    return saved === 'light' || saved === 'dark' || saved === 'auto' ? saved : 'auto';
  }
}

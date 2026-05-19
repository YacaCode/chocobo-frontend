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
  private themeTransitionTimer?: number;

  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.applyTheme(this.currentTheme, false);

    this.systemPreference?.addEventListener('change', (event) => {
      if (this.currentTheme === 'auto') {
        this.applyResolvedTheme(event.matches ? 'dark' : 'light', true);
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
    this.applyResolvedTheme(this.resolveTheme(theme), persist);
    if (persist) {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  private applyResolvedTheme(effective: 'light' | 'dark', animate: boolean): void {
    const root = this.document.documentElement;
    if (animate) {
      root.classList.add('theme-transition');
      if (this.themeTransitionTimer) {
        window.clearTimeout(this.themeTransitionTimer);
      }
      this.themeTransitionTimer = window.setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 220);
    } else {
      root.classList.remove('theme-transition');
    }
    const enabled = effective === 'dark';
    this.darkModeSignal.set(enabled);
    root.classList.toggle('dark', enabled);
    root.setAttribute('data-theme', effective);
    root.style.colorScheme = effective;
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

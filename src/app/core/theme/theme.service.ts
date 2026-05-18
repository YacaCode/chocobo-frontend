import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'chocobo.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkModeSignal = signal(this.readInitialPreference());

  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    effect(() => {
      const enabled = this.darkModeSignal();
      this.document.documentElement.classList.toggle('dark', enabled);
      localStorage.setItem(STORAGE_KEY, enabled ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.darkModeSignal.update((current) => !current);
  }

  private readInitialPreference(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'dark') {
      return true;
    }

    if (stored === 'light') {
      return false;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}

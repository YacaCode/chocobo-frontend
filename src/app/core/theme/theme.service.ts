import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly systemPreference = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  private readonly darkModeSignal = signal(this.readSystemPreference());

  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.systemPreference?.addEventListener('change', (event) => {
      this.darkModeSignal.set(event.matches);
    });

    effect(() => {
      const enabled = this.darkModeSignal();
      this.document.documentElement.classList.toggle('dark', enabled);
      this.document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
    });
  }

  toggle(): void {
    this.darkModeSignal.set(this.readSystemPreference());
  }

  private readSystemPreference(): boolean {
    return this.systemPreference?.matches ?? false;
  }
}

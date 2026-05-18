import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'chb-topbar',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <header class="topbar">
      <div class="topbar__title">
        <span class="topbar__mark" aria-hidden="true">C</span>
        <div>
          <p class="topbar__eyebrow">ERP Chocobo</p>
          <h1>Fundacao operacional</h1>
        </div>
      </div>

      <button
        pButton
        type="button"
        class="p-button-text topbar__theme"
        [icon]="theme.darkMode() ? 'pi pi-sun' : 'pi pi-moon'"
        [attr.aria-label]="theme.darkMode() ? 'Ativar modo claro' : 'Ativar modo escuro'"
        (click)="theme.toggle()">
      </button>
    </header>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      min-height: 4rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--chb-border);
      background: color-mix(in srgb, var(--chb-surface) 94%, transparent);
      padding: 0.75rem 1.5rem;
      backdrop-filter: blur(12px);
    }

    .topbar__title {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 0.75rem;
    }

    .topbar__mark {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.5rem;
      background: var(--chb-yellow);
      color: #111827;
      font-weight: 800;
    }

    .topbar__eyebrow,
    h1 {
      margin: 0;
    }

    .topbar__eyebrow {
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      color: var(--chb-text);
      font-size: 1.05rem;
      font-weight: 800;
    }

    .topbar__theme {
      flex: 0 0 auto;
    }

    @media (max-width: 767px) {
      .topbar {
        padding-inline: 1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  readonly theme = inject(ThemeService);
}

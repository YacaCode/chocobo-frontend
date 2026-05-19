import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'chb-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>Usuario: {{ auth.user()?.login || '-' }}</span>
      <span>Loja: {{ auth.activeStore()?.name || '-' }}</span>
      <span>F1-Frontend operacional</span>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border-top: 1px solid var(--chb-border);
      color: var(--chb-text-muted);
      font-size: 0.76rem;
      padding: 0.65rem 1rem;
      flex-wrap: wrap;
    }

    @media (max-width: 767px) {
      .footer {
        align-items: flex-start;
        flex-direction: column;
        padding-inline: 0.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly auth = inject(AuthService);
}

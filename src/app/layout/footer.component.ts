import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'chb-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>Chocobo ERP</span>
      <span>F0-002</span>
    </footer>
  `,
  styles: [`
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-top: 1px solid var(--chb-border);
      color: var(--chb-text-muted);
      font-size: 0.85rem;
      padding: 1rem 1.5rem;
    }

    @media (max-width: 767px) {
      .footer {
        padding-inline: 1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}

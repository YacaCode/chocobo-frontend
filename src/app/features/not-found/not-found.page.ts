import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'chb-not-found-page',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  template: `
    <section class="not-found">
      <h2>Pagina nao encontrada</h2>
      <a pButton routerLink="/dashboard" label="Voltar para dashboard"></a>
    </section>
  `,
  styles: [`
    .not-found {
      display: grid;
      min-height: 16rem;
      place-items: center;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      padding: 2rem;
      text-align: center;
    }

    h2 {
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage {}

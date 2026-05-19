import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'chb-store-selection-page',
  standalone: true,
  imports: [ButtonModule, TagModule],
  template: `
    <main class="store-page">
      <section class="store-panel" aria-labelledby="store-title">
        <header class="store-panel__header">
          <div>
            <p>Loja ativa</p>
            <h1 id="store-title">Selecione a empresa da sessao</h1>
          </div>
          <button pButton type="button" class="p-button-text" icon="pi pi-sign-out" label="Sair" (click)="logout()"></button>
        </header>

        <div class="store-list">
          @for (store of auth.stores(); track store.id) {
            <article class="store-card">
              <div class="store-card__head">
                <span class="store-card__code" [title]="store.code">{{ store.code.slice(0, 2) }}</span>
                <p-tag [value]="store.status" severity="success"></p-tag>
              </div>
              <h2>{{ store.name }}</h2>
              <dl>
                <div>
                  <dt>CNPJ</dt>
                  <dd>{{ store.cnpj }}</dd>
                </div>
                <div>
                  <dt>Municipio</dt>
                  <dd>{{ store.city }}</dd>
                </div>
              </dl>
              <button
                pButton
                type="button"
                icon="pi pi-arrow-right"
                iconPos="right"
                label="Entrar nesta loja"
                class="store-card__action"
                (click)="select(store.id)">
              </button>
            </article>
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    .store-page {
      display: grid;
      min-height: 100vh;
      align-items: center;
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--chb-text) 3%, transparent) 1px, transparent 1px),
        linear-gradient(180deg, color-mix(in srgb, var(--chb-text) 3%, transparent) 1px, transparent 1px),
        linear-gradient(135deg, var(--chb-page-bg), color-mix(in srgb, var(--chb-page-bg) 88%, var(--chb-teal-50)));
      background-size: 42px 42px, 42px 42px, auto;
      padding: 1.25rem;
    }

    .store-panel {
      display: grid;
      width: min(100%, 66rem);
      gap: 1rem;
      margin: 0 auto;
    }

    .store-panel__header {
      position: relative;
      display: flex;
      overflow: hidden;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid color-mix(in srgb, var(--chb-border-strong) 70%, transparent);
      border-radius: 0.85rem;
      background: color-mix(in srgb, var(--chb-surface) 96%, transparent);
      padding: 1.25rem;
      box-shadow: var(--chb-shadow-soft);
    }

    .store-panel__header::before {
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: linear-gradient(90deg, var(--chb-teal), var(--chb-yellow));
      content: '';
    }

    .store-panel__header p,
    h1,
    h2,
    dl {
      margin: 0;
    }

    .store-panel__header p {
      color: var(--chb-text-muted);
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    h1 {
      color: var(--chb-text);
      font-size: 1.55rem;
    }

    .store-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .store-card {
      display: grid;
      gap: 1rem;
      border: 1px solid color-mix(in srgb, var(--chb-border-strong) 70%, transparent);
      border-radius: 0.75rem;
      background: color-mix(in srgb, var(--chb-surface) 96%, transparent);
      padding: 1.25rem;
      box-shadow: var(--chb-shadow-soft);
    }

    .store-card__head,
    dl {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .store-card__code {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      overflow: hidden;
      place-items: center;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, var(--chb-teal), var(--chb-yellow));
      color: #ffffff;
      font-weight: 900;
      line-height: 1;
      box-shadow: 0 0 0 0.24rem color-mix(in srgb, var(--chb-teal-50) 72%, transparent);
      text-transform: uppercase;
      white-space: nowrap;
    }

    h2 {
      color: var(--chb-text);
      font-size: 1.2rem;
    }

    dt {
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    dd {
      margin: 0.25rem 0 0;
      color: var(--chb-text);
      font-weight: 700;
    }

    :host ::ng-deep .store-card__action.p-button {
      width: 100%;
      min-height: 2.65rem;
      justify-content: space-between;
      border: 0;
      border-radius: 0.55rem;
      background: var(--chb-yellow);
      color: #111827;
      padding-inline: 0.85rem;
      font-size: 0.9rem;
      font-weight: 900;
      letter-spacing: 0;
      box-shadow: 0 12px 26px color-mix(in srgb, var(--chb-yellow) 22%, transparent);
    }

    :host ::ng-deep .store-card__action.p-button .p-button-label {
      flex: 0 0 auto;
      color: #111827;
      font-weight: 900;
    }

    :host ::ng-deep .store-card__action.p-button .p-button-icon {
      color: #111827;
      font-size: 0.95rem;
    }

    :host ::ng-deep .store-card__action.p-button:enabled:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    @media (max-width: 767px) {
      .store-panel__header,
      .store-list,
      dl {
        grid-template-columns: 1fr;
      }

      .store-panel__header {
        align-items: stretch;
        flex-direction: column;
      }

      .store-list {
        display: grid;
      }

      dl {
        display: grid;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreSelectionPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  select(storeId: string): void {
    this.auth.selectStore(storeId);
    void this.router.navigateByUrl('/dashboard');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}

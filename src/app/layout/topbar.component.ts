import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../core/auth/auth.service';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard operacional',
  '/core/usuarios': 'Usuarios e permissoes',
  '/core/lojas': 'Lojas',
  '/cadastros/clientes': 'Clientes',
  '/cadastros/produtos': 'Produtos',
  '/estoque/saldos': 'Saldos de estoque',
  '/estoque/transferencias': 'Transferencias',
  '/estoque/inventarios': 'Inventarios',
  '/vendas/pre-vendas': 'Pre-vendas',
  '/vendas/pdv': 'PDV',
  '/caixa/operacoes': 'Operacoes de caixa',
  '/financeiro': 'Financeiro',
  '/compras': 'Compras',
  '/fiscal': 'Fiscal',
  '/servicos/oficina': 'Oficina',
  '/health': 'Saude do backend',
  '/preferencias': 'Preferencias'
};

@Component({
  selector: 'chb-topbar',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  template: `
    <header class="topbar">
      <div class="topbar__title">
        <img src="/chocobo-logo.svg" alt="" class="topbar__logo" />
        <div>
          <p class="topbar__eyebrow">{{ auth.activeStore()?.code || '00' }} {{ auth.activeStore()?.name || 'Loja' }} / {{ auth.user()?.name || 'Usuario' }}</p>
          <h1>{{ title() }}</h1>
        </div>
      </div>

      <div class="topbar__actions">
        <button
          pButton
          type="button"
          class="p-button-text"
          icon="pi pi-building"
          label="Trocar loja"
          (click)="switchStore()">
        </button>
        <a
          pButton
          routerLink="/preferencias"
          type="button"
          class="p-button-text"
          icon="pi pi-cog"
          aria-label="Preferências">
        </a>
        <button
          pButton
          type="button"
          class="p-button-text"
          icon="pi pi-sign-out"
          aria-label="Sair"
          (click)="logout()">
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      min-height: 3.55rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid color-mix(in srgb, var(--chb-border-strong) 74%, transparent);
      background: color-mix(in srgb, var(--chb-surface) 88%, transparent);
      padding: 0.55rem 1rem;
      backdrop-filter: blur(12px);
      min-width: 0;
      max-width: 100%;
    }

    .topbar__title {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 0.65rem;
    }

    .topbar__logo {
      width: 2rem;
      height: 2rem;
      flex: 0 0 auto;
      object-fit: contain;
      filter: drop-shadow(0 0 4px color-mix(in srgb, var(--chb-teal-50) 60%, transparent));
    }

    .topbar__eyebrow,
    h1 {
      margin: 0;
    }

    .topbar__eyebrow {
      color: var(--chb-text-muted);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      color: var(--chb-text);
      font-size: 0.98rem;
      font-weight: 800;
    }

    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
    }

    .topbar__actions button {
      color: var(--chb-text-muted);
    }

    .topbar__actions button,
    .topbar__theme {
      flex: 0 0 auto;
    }

    @media (max-width: 1024px) {
      .topbar {
        top: 0;
      }
    }

    @media (max-width: 1180px) {
      .topbar__actions .p-button-label {
        display: none;
      }

      .topbar__actions {
        gap: 0.2rem;
      }
    }

    @media (max-width: 767px) {
      .topbar {
        align-items: center;
        padding-inline: 0.75rem;
      }

      .topbar__title {
        gap: 0.5rem;
      }

      .topbar__eyebrow {
        max-width: 11rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      h1 {
        max-width: 13rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    @media (max-width: 520px) {
      .topbar {
        gap: 0.5rem;
        padding-inline: 1rem;
      }

      .topbar__actions {
        overflow-x: auto;
        gap: 0.2rem;
      }

      .topbar__actions .p-button-label {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = signal('Dashboard operacional');

  constructor() {
    this.setTitle(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setTitle(event.urlAfterRedirects);
      }
    });
  }

  switchStore(): void {
    this.auth.clearStoreSelection();
    void this.router.navigateByUrl('/selecionar-loja');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private setTitle(url: string): void {
    const path = url.split('?')[0] || '/dashboard';
    this.title.set(pageTitles[path] ?? 'Chocobo');
  }
}

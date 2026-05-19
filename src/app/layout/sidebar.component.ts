import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavItem = {
  label: string;
  route: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-chart-line' },
      { label: 'Health', route: '/health', icon: 'pi pi-heart-pulse' }
    ]
  },
  {
    label: 'Core',
    items: [
      { label: 'Usuarios', route: '/core/usuarios', icon: 'pi pi-users' },
      { label: 'Lojas', route: '/core/lojas', icon: 'pi pi-building' }
    ]
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Clientes', route: '/cadastros/clientes', icon: 'pi pi-id-card' },
      { label: 'Produtos', route: '/cadastros/produtos', icon: 'pi pi-box' },
      { label: 'Fabricantes', route: '/cadastros/fabricantes', icon: 'pi pi-tags' },
      { label: 'Secoes', route: '/cadastros/secoes', icon: 'pi pi-sitemap' },
      { label: 'Unidades', route: '/cadastros/unidades', icon: 'pi pi-hashtag' },
      { label: 'NCM', route: '/cadastros/ncm', icon: 'pi pi-file-check' },
      { label: 'Montadoras', route: '/cadastros/montadoras', icon: 'pi pi-car' }
    ]
  },
  {
    label: 'Estoque',
    items: [
      { label: 'Saldos', route: '/estoque/saldos', icon: 'pi pi-warehouse' },
      { label: 'Transferencias', route: '/estoque/transferencias', icon: 'pi pi-send' },
      { label: 'Inventarios', route: '/estoque/inventarios', icon: 'pi pi-clipboard' }
    ]
  },
  {
    label: 'Operação',
    items: [
      { label: 'Pre-vendas', route: '/vendas/pre-vendas', icon: 'pi pi-file-edit' },
      { label: 'PDV', route: '/vendas/pdv', icon: 'pi pi-calculator' },
      { label: 'Caixa', route: '/caixa/operacoes', icon: 'pi pi-wallet' },
      { label: 'Oficina', route: '/servicos/oficina', icon: 'pi pi-wrench' }
    ]
  },
  {
    label: 'Retaguarda',
    items: [
      { label: 'Financeiro', route: '/financeiro', icon: 'pi pi-dollar' },
      { label: 'Compras', route: '/compras', icon: 'pi pi-shopping-cart' },
      { label: 'Fiscal', route: '/fiscal', icon: 'pi pi-file' }
    ]
  }
];

@Component({
  selector: 'chb-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" aria-label="Navegacao principal">
      <div class="sidebar__brand">
        <img src="/chocobo-logo.svg" alt="Chocobo" class="sidebar__brand-logo" />
        <span>
          Chocobo
          <small>ERP operacional</small>
        </span>
      </div>

      <nav class="sidebar__nav">
        @for (group of navGroups; track group.label) {
          <section class="sidebar__group">
            <p>{{ group.label }}</p>
            @for (item of group.items; track item.route) {
              <a [routerLink]="item.route" routerLinkActive="is-active" class="sidebar__link">
                <i [class]="item.icon" aria-hidden="true"></i>
                <span>{{ item.label }}</span>
              </a>
            }
          </section>
        }
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      width: 100%;
      max-width: 100%;
      height: 100vh;
      flex-direction: column;
      gap: 0.75rem;
      border-right: 1px solid color-mix(in srgb, var(--chb-border-strong) 74%, transparent);
      background: color-mix(in srgb, var(--chb-surface) 91%, transparent);
      padding: 0.85rem 0.7rem;
      overflow: hidden;
      backdrop-filter: blur(12px);
    }

    .sidebar__brand {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 0.5rem 0.75rem;
      color: var(--chb-navy-700);
      font-size: 1.05rem;
      font-weight: 900;
    }

    :host-context(.dark) .sidebar__brand {
      color: var(--chb-yellow);
    }

    .sidebar__brand-logo {
      width: 2.15rem;
      height: 2.15rem;
      flex: 0 0 auto;
      filter: drop-shadow(0 0 6px color-mix(in srgb, var(--chb-teal-50) 72%, transparent));
    }

    .sidebar__brand small {
      display: block;
      color: var(--chb-text-muted);
      font-size: 0.72rem;
      font-weight: 800;
    }

    .sidebar__nav {
      display: grid;
      min-width: 0;
      max-width: 100%;
      gap: 0.65rem;
      overflow: auto;
      padding: 0.1rem 0.1rem 0.75rem;
    }

    .sidebar__group {
      display: grid;
      min-width: 0;
      gap: 0.25rem;
    }

    .sidebar__group p {
      margin: 0.25rem 0.5rem 0.15rem;
      color: var(--chb-text-muted);
      font-size: 0.66rem;
      font-weight: 900;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 2.15rem;
      border: 1px solid transparent;
      border-radius: 0.45rem;
      color: var(--chb-text-muted);
      font-weight: 700;
      padding: 0.5rem 0.6rem;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      white-space: nowrap;
    }

    .sidebar__link i {
      width: 1rem;
      color: color-mix(in srgb, var(--chb-teal) 72%, var(--chb-text-muted));
      font-size: 0.9rem;
      text-align: center;
    }

    .sidebar__link:hover {
      background: color-mix(in srgb, var(--chb-surface-muted) 82%, var(--chb-teal-50));
      color: var(--chb-text);
    }

    .sidebar__link.is-active {
      border-color: color-mix(in srgb, var(--chb-teal) 34%, var(--chb-border));
      background: color-mix(in srgb, var(--chb-teal-50) 72%, var(--chb-surface));
      color: var(--chb-navy-700);
      box-shadow: inset 3px 0 0 var(--chb-teal);
    }

    :host-context(.dark) .sidebar__link.is-active {
      background: var(--chb-navy-50);
      color: var(--chb-yellow);
    }

    @media (max-width: 1024px) {
      .sidebar {
        position: static;
        height: auto;
        gap: 0.55rem;
        border-right: 0;
        border-bottom: 1px solid var(--chb-border);
        padding: 0.65rem 0.75rem;
      }

      .sidebar__nav {
        display: flex;
        gap: 0.55rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .sidebar__group {
        display: flex;
        flex: 0 0 auto;
      }

      .sidebar__group p {
        display: none;
      }

      .sidebar__link {
        flex: 0 0 auto;
        min-height: 2rem;
        padding: 0.45rem 0.6rem;
      }
    }

    @media (max-width: 1366px) and (min-width: 1025px) {
      .sidebar {
        padding: 0.7rem 0.55rem;
      }

      .sidebar__brand {
        gap: 0.55rem;
        padding-inline: 0.35rem;
        font-size: 0.98rem;
      }

      .sidebar__brand-mark {
        width: 2rem;
        height: 2rem;
      }

      .sidebar__nav {
        gap: 0.45rem;
      }

      .sidebar__group p {
        margin-inline: 0.4rem;
        font-size: 0.62rem;
      }

      .sidebar__link {
        gap: 0.55rem;
        min-height: 2rem;
        padding: 0.44rem 0.5rem;
        font-size: 0.87rem;
      }
    }

    @media (max-width: 520px) {
      .sidebar__brand small,
      .sidebar__link span {
        display: none;
      }

      .sidebar__link {
        width: 2.25rem;
        justify-content: center;
        padding-inline: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly navGroups = navGroups;
}

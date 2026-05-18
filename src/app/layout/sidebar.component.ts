import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'chb-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" aria-label="Navegacao principal">
      <div class="sidebar__brand">
        <span class="sidebar__brand-mark" aria-hidden="true"></span>
        <span>Chocobo</span>
      </div>

      <nav class="sidebar__nav">
        <a routerLink="/health" routerLinkActive="is-active" class="sidebar__link">
          <i class="pi pi-heart-pulse" aria-hidden="true"></i>
          <span>Health</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      height: 100vh;
      flex-direction: column;
      gap: 1.5rem;
      border-right: 1px solid var(--chb-border);
      background: var(--chb-surface);
      padding: 1rem;
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      color: var(--chb-navy);
      font-size: 1.15rem;
      font-weight: 900;
    }

    :host-context(.dark) .sidebar__brand {
      color: var(--chb-yellow);
    }

    .sidebar__brand-mark {
      width: 0.85rem;
      height: 2rem;
      border-radius: 999px;
      background: var(--chb-yellow);
      box-shadow: 0 0 0 0.35rem var(--chb-navy-50);
    }

    .sidebar__nav {
      display: grid;
      gap: 0.35rem;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-left: 3px solid transparent;
      border-radius: 0.5rem;
      color: var(--chb-text-muted);
      font-weight: 700;
      padding: 0.75rem;
    }

    .sidebar__link.is-active {
      border-left-color: var(--chb-yellow);
      background: var(--chb-yellow-50);
      color: var(--chb-navy);
    }

    :host-context(.dark) .sidebar__link.is-active {
      background: var(--chb-navy-50);
      color: var(--chb-yellow);
    }

    @media (max-width: 767px) {
      .sidebar {
        position: static;
        height: auto;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        border-right: 0;
        border-bottom: 1px solid var(--chb-border);
      }

      .sidebar__nav {
        display: flex;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {}

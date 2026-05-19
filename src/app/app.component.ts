import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { FooterComponent } from './layout/footer.component';
import { SidebarComponent } from './layout/sidebar.component';
import { TopbarComponent } from './layout/topbar.component';

@Component({
  selector: 'chb-root',
  standalone: true,
  imports: [FooterComponent, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    @if (auth.activeStore()) {
      <div class="app-shell">
        <chb-sidebar />
        <div class="app-shell__main">
          <chb-topbar />
          <main class="app-shell__content" id="conteudo-principal">
            <router-outlet />
          </main>
          <chb-footer />
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .app-shell {
      display: grid;
      min-height: 100vh;
      grid-template-columns: 15.5rem minmax(0, 1fr);
      background: transparent;
      overflow-x: hidden;
    }

    chb-sidebar,
    .app-shell__main {
      width: 100%;
      min-width: 0;
    }

    .app-shell__main {
      display: flex;
      min-width: 0;
      min-height: 100vh;
      flex-direction: column;
    }

    .app-shell__content {
      width: min(100%, 1320px);
      flex: 1;
      margin: 0 auto;
      padding: 1rem;
    }

    @media (max-width: 1366px) and (min-width: 1025px) {
      .app-shell {
        grid-template-columns: 13.75rem minmax(0, 1fr);
      }

      .app-shell__content {
        padding: 0.75rem;
      }
    }

    @media (max-width: 1024px) {
      .app-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 767px) {
      .app-shell__content {
        padding: 0.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
}

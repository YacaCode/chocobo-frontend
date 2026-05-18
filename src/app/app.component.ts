import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './layout/footer.component';
import { SidebarComponent } from './layout/sidebar.component';
import { TopbarComponent } from './layout/topbar.component';

@Component({
  selector: 'chb-root',
  standalone: true,
  imports: [FooterComponent, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
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
  `,
  styles: [`
    .app-shell {
      display: grid;
      min-height: 100vh;
      grid-template-columns: 16rem minmax(0, 1fr);
      background: var(--chb-page-bg);
    }

    .app-shell__main {
      display: flex;
      min-width: 0;
      min-height: 100vh;
      flex-direction: column;
    }

    .app-shell__content {
      width: min(100%, 1280px);
      flex: 1;
      margin: 0 auto;
      padding: 1.5rem;
    }

    @media (max-width: 767px) {
      .app-shell {
        grid-template-columns: 1fr;
      }

      .app-shell__content {
        padding: 1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}

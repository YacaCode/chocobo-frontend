import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { catchError, map, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';

type HealthViewModel =
  | { state: 'loading' }
  | { state: 'ready'; data: HealthProbe }
  | { state: 'error'; message: string };

type HealthProbe = {
  status: string;
  version: string;
  timestamp: string;
};

@Component({
  selector: 'chb-health-page',
  standalone: true,
  imports: [AsyncPipe, ButtonModule, DatePipe],
  template: `
    <section class="health">
      <div class="health__header">
        <div>
          <p class="health__eyebrow">Monitoramento</p>
          <h2>Saude do backend</h2>
        </div>

        <button pButton type="button" icon="pi pi-refresh" label="Atualizar" (click)="refresh()"></button>
      </div>

      @if (vm$ | async; as vm) {
        <article class="health__panel" [attr.aria-busy]="vm.state === 'loading'">
          @if (vm.state === 'loading') {
            <i class="pi pi-spin pi-spinner health__icon" aria-hidden="true"></i>
            <p>Consultando /api/v1/health...</p>
          } @else if (vm.state === 'ready') {
            <span class="health__badge">Online</span>
            <dl class="health__data">
              <div>
                <dt>Status</dt>
                <dd>{{ vm.data.status || 'OK' }}</dd>
              </div>
              <div>
                <dt>Versao</dt>
                <dd>{{ vm.data.version || 'nao informada' }}</dd>
              </div>
              <div>
                <dt>Timestamp</dt>
                <dd>{{ vm.data.timestamp ? (vm.data.timestamp | date: 'short') : 'nao informado' }}</dd>
              </div>
            </dl>
          } @else {
            <span class="health__badge health__badge--error">Indisponivel</span>
            <p>{{ vm.message }}</p>
          }
        </article>
      }
    </section>
  `,
  styles: [`
    .health {
      display: grid;
      gap: 1rem;
    }

    .health__header,
    .health__panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
    }

    .health__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem;
    }

    .health__eyebrow,
    h2 {
      margin: 0;
    }

    .health__eyebrow {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    h2 {
      color: var(--chb-text);
      font-size: 1.4rem;
    }

    .health__panel {
      display: grid;
      gap: 1rem;
      min-height: 13rem;
      align-content: center;
      padding: 1.5rem;
    }

    .health__icon {
      color: var(--chb-yellow);
      font-size: 1.5rem;
    }

    .health__badge {
      width: fit-content;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 0.35rem 0.75rem;
    }

    .health__badge--error {
      background: #fee2e2;
      color: #991b1b;
    }

    .health__data {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      margin: 0;
    }

    dt {
      color: var(--chb-text-muted);
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    dd {
      margin: 0.3rem 0 0;
      overflow-wrap: anywhere;
      color: var(--chb-text);
      font-size: 1rem;
      font-weight: 700;
    }

    @media (max-width: 767px) {
      .health__header,
      .health__data {
        grid-template-columns: 1fr;
      }

      .health__header {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthPage {
  private readonly http = inject(HttpClient);
  private readonly refreshSignal = new Subject<void>();

  readonly vm$ = this.refreshSignal.pipe(
    startWith(undefined),
    switchMap(() => this.http.get<unknown>('/api/v1/health').pipe(
      map((payload): HealthViewModel => ({ state: 'ready', data: normalizeHealth(payload) })),
      startWith({ state: 'loading' } satisfies HealthViewModel),
      catchError(() => of({
        state: 'error',
        message: 'Nao foi possivel consultar o backend agora. Verifique se a API esta rodando e tente novamente.'
      } satisfies HealthViewModel))
    )),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  refresh(): void {
    this.refreshSignal.next();
  }
}

function normalizeHealth(payload: unknown): HealthProbe {
  const record = typeof payload === 'object' && payload !== null
    ? payload as Record<string, unknown>
    : {};

  return {
    status: typeof record['status'] === 'string' ? record['status'] : 'OK',
    version: typeof record['version'] === 'string' ? record['version'] : 'nao informada',
    timestamp: typeof record['timestamp'] === 'string' ? record['timestamp'] : ''
  };
}

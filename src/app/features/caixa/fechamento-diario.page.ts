import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnDestroy, type OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type FormaResumo = {
  forma: string;
  quantidade: number;
  total: number;
};

type FechamentoDiario = {
  data: string;
  loja: string;
  operador: string;
  totalVendas: number;
  totalNfce: number;
  saldoAbertura: number;
  suprimentos: number;
  sangrias: number;
  saldoCaixa: number;
  formasPagamento: FormaResumo[];
};

const DEMO_FECHAMENTO: FechamentoDiario = {
  data: new Date().toISOString(),
  loja: 'Loja 01 - Matriz',
  operador: 'caixa01',
  totalVendas: 9884.7,
  totalNfce: 27,
  saldoAbertura: 500,
  suprimentos: 350,
  sangrias: 420,
  saldoCaixa: 1314.7,
  formasPagamento: [
    { forma: 'Dinheiro', quantidade: 8, total: 1884.7 },
    { forma: 'Pix', quantidade: 9, total: 3200 },
    { forma: 'Cartao de debito', quantidade: 6, total: 2100 },
    { forma: 'Cartao de credito', quantidade: 4, total: 2700 }
  ]
};

@Component({
  selector: 'chb-fechamento-diario-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DatePipe, SkeletonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>

    <section class="fechamento-page">
      <header class="fechamento-header">
        <div>
          <p>Caixa</p>
          <h2>Fechamento diario</h2>
          <span>Resumo operacional consolidado da loja ativa.</span>
        </div>
        <div class="fechamento-actions">
          <button pButton type="button" icon="pi pi-refresh" label="Atualizar" class="p-button-outlined" [loading]="loading()" (click)="carregar()"></button>
          <button pButton type="button" icon="pi pi-print" label="Imprimir fechamento" (click)="imprimir()"></button>
        </div>
      </header>

      @if (loading() && !resumo()) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4,5]; track i) {
            <p-skeleton height="3rem" styleClass="mb-1"></p-skeleton>
          }
        </div>
      }

      @if (resumo(); as dados) {
        <div class="print-area">
          <div class="fechamento-meta">
            <div>
              <small>Data</small>
              <strong>{{ dados.data | date:'dd/MM/yyyy HH:mm' }}</strong>
            </div>
            <div>
              <small>Loja</small>
              <strong>{{ dados.loja }}</strong>
            </div>
            <div>
              <small>Operador</small>
              <strong>{{ dados.operador }}</strong>
            </div>
            <div>
              <small>Status</small>
              <p-tag value="Conferido" severity="success"></p-tag>
            </div>
          </div>

          <div class="kpis">
            <article class="kpi">
              <span>Total vendas</span>
              <strong>{{ dados.totalVendas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </article>
            <article class="kpi">
              <span>NFC-e emitidas</span>
              <strong>{{ dados.totalNfce }}</strong>
            </article>
            <article class="kpi">
              <span>Suprimentos</span>
              <strong>{{ dados.suprimentos | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </article>
            <article class="kpi kpi--danger">
              <span>Sangrias</span>
              <strong>{{ dados.sangrias | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </article>
          </div>

          <div class="panel">
            <div class="panel-title">
              <p>Recebimentos</p>
              <h3>Total por forma de pagamento</h3>
            </div>

            <p-table [value]="dados.formasPagamento" styleClass="chb-data-table" responsiveLayout="scroll">
              <ng-template pTemplate="header">
                <tr>
                  <th>Forma</th>
                  <th style="width: 8rem; text-align: right">Qtd.</th>
                  <th style="width: 12rem; text-align: right">Total</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-forma>
                <tr>
                  <td>{{ forma.forma }}</td>
                  <td style="text-align: right">{{ forma.quantidade }}</td>
                  <td style="text-align: right">{{ forma.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="saldo-panel">
            <span>Saldo de caixa</span>
            <strong>{{ dados.saldoCaixa | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>Abertura {{ dados.saldoAbertura | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} + suprimentos - sangrias</small>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .fechamento-page { display: grid; gap: 1rem; }
    .fechamento-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
      padding: 1rem;
    }
    .fechamento-header p,
    .panel-title p,
    h2,
    h3 { margin: 0; }
    .fechamento-header p,
    .panel-title p {
      color: var(--chb-text-muted);
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
    }
    h2 { color: var(--chb-text); font-size: 1.3rem; }
    h3 { color: var(--chb-text); font-size: 1rem; }
    .fechamento-header span { display: block; margin-top: 0.25rem; color: var(--chb-text-muted); }
    .fechamento-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; justify-content: flex-end; }
    .skeleton-list,
    .print-area { display: grid; gap: 1rem; }
    .fechamento-meta,
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }
    .fechamento-meta > div,
    .kpi,
    .panel,
    .saldo-panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
      padding: 0.85rem;
    }
    .fechamento-meta small,
    .kpi span,
    .saldo-panel span {
      display: block;
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
    }
    .fechamento-meta strong,
    .kpi strong,
    .saldo-panel strong {
      display: block;
      margin-top: 0.25rem;
      color: var(--chb-text);
      font-size: 1.05rem;
    }
    .kpi--danger strong { color: var(--chb-red); }
    .panel { display: grid; gap: 0.75rem; }
    .saldo-panel {
      display: grid;
      justify-items: end;
      text-align: right;
    }
    .saldo-panel strong { color: var(--chb-teal); font-size: 1.7rem; }
    .saldo-panel small { color: var(--chb-text-muted); }

    @media (max-width: 900px) {
      .fechamento-meta,
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .fechamento-header { align-items: stretch; flex-direction: column; }
      .fechamento-actions { justify-content: flex-start; }
    }

    @media (max-width: 560px) {
      .fechamento-meta,
      .kpis { grid-template-columns: 1fr; }
      .fechamento-actions .p-button { width: 100%; justify-content: center; }
    }

    @media print {
      :host { color: var(--chb-text); }
      .fechamento-actions,
      p-toast { display: none !important; }
      .fechamento-page,
      .print-area { gap: 0.6rem; }
      .fechamento-header,
      .fechamento-meta > div,
      .kpi,
      .panel,
      .saldo-panel {
        box-shadow: none !important;
      }
    }
  `]
})
export class FechamentoDiarioPage implements OnInit, OnDestroy {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly resumo = signal<FechamentoDiario | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<FechamentoDiario>('/api/v1/caixa/sessoes/fechamento-diario').pipe(
      catchError(() => of(DEMO_FECHAMENTO)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((resumo) => this.resumo.set(resumo));
  }

  imprimir(): void {
    this.msg.add({ severity: 'info', summary: 'Preparando impressao', life: 1200 });
    setTimeout(() => window.print(), 150);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

const DEMO_INADIMPLENCIA = {
  kpis: { totalVencido: 1503.4, qtdInadimplentes: 3, maiorAtraso: 34 },
  clientes: [
    { clienteNome: 'Moto Rapido CE', totalDevido: 850.0, diasMaxAtraso: 34, qtdTitulos: 1, documento: 'CNPJ: 41.222.333/0001-10' },
    { clienteNome: 'Carlos Oficina ME', totalDevido: 363.5, diasMaxAtraso: 9, qtdTitulos: 1, documento: 'CNPJ: 31.444.555/0001-99' },
    { clienteNome: 'João Batista da Silva', totalDevido: 289.9, diasMaxAtraso: 19, qtdTitulos: 2, documento: 'CPF: 333.444.555-66' }
  ]
};

@Component({
  selector: 'chb-inadimplencia-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, FormsModule, InputNumberModule,
    SkeletonModule, SliderModule, TableModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Inadimplência</h2>
      <div class="toolbar-actions">
        <div class="filtro-dias">
          <label style="font-size:.85rem;font-weight:700;color:var(--chb-text-muted)">
            Atraso mínimo: <strong>{{ diasMinimos }}d</strong>
          </label>
          <p-slider [(ngModel)]="diasMinimos" [min]="1" [max]="90" [step]="1"
                    (onSlideEnd)="carregar()" styleClass="slider-largura"></p-slider>
        </div>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"
                pTooltip="Atualizar"></button>
      </div>
    </div>

    <!-- KPIs -->
    @if (loading() && !dados()) {
      <div class="kpi-row">
        @for (i of [1,2,3]; track i) {
          <p-skeleton height="5rem" styleClass="flex-1"></p-skeleton>
        }
      </div>
    } @else if (dados()) {
      <div class="kpi-row">
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">TOTAL VENCIDO</span>
          <span class="kpi-value">{{ dados()!.kpis.totalVencido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">CLIENTES INADIMPLENTES</span>
          <span class="kpi-value">{{ dados()!.kpis.qtdInadimplentes }}</span>
        </div>
        <div class="kpi-card kpi-info">
          <span class="kpi-label">MAIOR ATRASO</span>
          <span class="kpi-value">{{ dados()!.kpis.maiorAtraso }} dias</span>
        </div>
      </div>
    }

    <!-- Tabela de clientes -->
    @if (loading() && clientes().length === 0) {
      @for (i of [1,2,3]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="clientes()" [paginator]="false" dataKey="clienteNome">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="clienteNome">Cliente <p-sortIcon field="clienteNome"></p-sortIcon></th>
            <th>Documento</th>
            <th style="text-align:center">Títulos</th>
            <th style="text-align:right">Total Devido</th>
            <th style="text-align:center">Maior Atraso</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-cliente>
          <tr>
            <td style="font-weight:700">{{ cliente.clienteNome }}</td>
            <td style="color:var(--chb-text-muted);font-size:.85rem">{{ cliente.documento }}</td>
            <td style="text-align:center">{{ cliente.qtdTitulos }}</td>
            <td style="text-align:right;color:#dc2626;font-weight:700">
              {{ cliente.totalDevido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
            </td>
            <td style="text-align:center">
              <span class="atraso-badge-lg">{{ cliente.diasMaxAtraso }}d</span>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" style="text-align:center;padding:2rem">
              <i class="pi pi-check-circle" style="font-size:2rem;color:#16a34a"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhum cliente inadimplente para o período selecionado.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:160px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .kpi-danger .kpi-value { color:#dc2626; }
    .kpi-warning .kpi-value { color:#ea580c; }
    .kpi-info .kpi-value { color:#1A237E; }
    .atraso-badge-lg { background:#dc2626; color:#fff; border-radius:.35rem; padding:.2rem .6rem; font-size:.8rem; font-weight:700; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:1rem; flex-wrap:wrap; align-items:center; }
    .filtro-dias { display:flex; flex-direction:column; gap:.35rem; }
    :host ::ng-deep .slider-largura { width: 150px; }
  `]
})
export class InadimplenciaPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly dadosRaw = signal<any>(null);
  readonly loading = signal(false);
  diasMinimos = 1;

  readonly dados = computed(() => this.dadosRaw());
  readonly clientes = computed(() => this.dadosRaw()?.clientes ?? []);

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any>(`/api/v1/financeiro/inadimplencia?diasMinimos=${this.diasMinimos}`)
      .pipe(
        catchError(() => of(DEMO_INADIMPLENCIA)),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.dadosRaw.set(data));
  }
}

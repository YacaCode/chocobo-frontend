import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  type OnDestroy,
  type OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface SaldoItem {
  id: string;
  codigo: string;
  descricao: string;
  loja: string;
  disponivel: number;
  reservado: number;
  minimo: number;
  valorUnitario: number;
  valorTotal: number;
  statusEstoque: 'NORMAL' | 'CRITICO' | 'COMPRAR' | 'ZERADO';
}

const DEMO_SALDOS: SaldoItem[] = [
  { id: 's1', codigo: '101.004-9', descricao: 'Pastilha freio dianteira BROS 150', loja: '01', disponivel: 18, reservado: 2, minimo: 8, valorUnitario: 89.90, valorTotal: 1618.20, statusEstoque: 'NORMAL' },
  { id: 's2', codigo: '201.118-2', descricao: 'Kit relacao 428H CG 160', loja: '01', disponivel: 7, reservado: 4, minimo: 6, valorUnitario: 189.50, valorTotal: 1326.50, statusEstoque: 'CRITICO' },
  { id: 's3', codigo: '301.090-1', descricao: 'Bateria 5Ah selada Biz/Pop', loja: '01', disponivel: 3, reservado: 1, minimo: 5, valorUnitario: 174.00, valorTotal: 522.00, statusEstoque: 'COMPRAR' },
  { id: 's4', codigo: '401.220-5', descricao: 'Oleo 10W30 semissintetico Motos 4T', loja: '02', disponivel: 22, reservado: 0, minimo: 12, valorUnitario: 38.90, valorTotal: 855.80, statusEstoque: 'NORMAL' },
  { id: 's5', codigo: 'VELA-BR8', descricao: 'Vela ignicao NGK BR8ES', loja: '01', disponivel: 35, reservado: 5, minimo: 10, valorUnitario: 12.50, valorTotal: 437.50, statusEstoque: 'NORMAL' },
  { id: 's6', codigo: 'FILTRO-OLEO', descricao: 'Filtro de Oleo Moto 150cc', loja: '01', disponivel: 0, reservado: 0, minimo: 5, valorUnitario: 19.20, valorTotal: 0, statusEstoque: 'ZERADO' }
];

const STATUS_FILTRO = [
  { label: 'Todos', value: null },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Critico', value: 'CRITICO' },
  { label: 'Comprar', value: 'COMPRAR' },
  { label: 'Zerado', value: 'ZERADO' }
];

@Component({
  selector: 'chb-estoque-saldos-page',
  standalone: true,
  imports: [
    ButtonModule, CurrencyPipe, DecimalPipe, DropdownModule,
    FormsModule, InputTextModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="saldos-page">
      <header class="saldos-header">
        <div class="saldos-heading">
          <span class="saldos-heading-icon" aria-hidden="true"><i class="pi pi-warehouse"></i></span>
          <div>
            <p>Estoque</p>
            <h2>Saldos por Loja</h2>
            <span>Visao consolidada de estoque disponivel, reservado, minimo e necessidade de compra.</span>
          </div>
        </div>
        <div class="saldos-header-acoes">
          <button pButton type="button" icon="pi pi-download" label="Exportar" class="p-button-outlined" (click)="exportar()"></button>
          <button pButton type="button" icon="pi pi-refresh" label="Atualizar" class="p-button-outlined" (click)="carregar()"></button>
        </div>
      </header>

      <div class="saldos-kpis">
        <article class="kpi kpi--info">
          <i class="pi pi-warehouse" aria-hidden="true"></i>
          <div>
            <span>SKUs com saldo</span>
            <strong>{{ kpiComSaldo() }}</strong>
            <small>loja ativa</small>
          </div>
        </article>
        <article class="kpi kpi--warning">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <span>Criticos / Comprar</span>
            <strong>{{ kpiCriticos() }}</strong>
            <small>abaixo do minimo</small>
          </div>
        </article>
        <article class="kpi kpi--danger">
          <i class="pi pi-times-circle" aria-hidden="true"></i>
          <div>
            <span>Zerados</span>
            <strong>{{ kpiZerados() }}</strong>
            <small>sem estoque</small>
          </div>
        </article>
        <article class="kpi kpi--success">
          <i class="pi pi-dollar" aria-hidden="true"></i>
          <div>
            <span>Valor Total</span>
            <strong>{{ kpiValorTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>estoque valorizado</small>
          </div>
        </article>
      </div>

      <div class="saldos-panel">
        <div class="saldos-toolbar">
          <div class="saldos-filtros">
            <span class="p-input-icon-left">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                pInputText
                type="search"
                placeholder="Codigo ou descricao..."
                [(ngModel)]="busca"
                (ngModelChange)="onBuscaChange($event)"
                class="saldos-search-input" />
            </span>
            <p-dropdown
              [(ngModel)]="filtroStatus"
              [options]="statusFiltroOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Status"
              (ngModelChange)="aplicarFiltros()"
              [style]="{ width: '140px' }">
            </p-dropdown>
          </div>
          <small class="saldos-hint">{{ saldosFiltrados().length }} registro(s)</small>
        </div>

        @if (loading() && !saldos().length) {
          <div class="skeleton-list">
            @for (i of [1,2,3,4,5,6]; track i) {
              <p-skeleton height="3rem" styleClass="mb-1"></p-skeleton>
            }
          </div>
        } @else {
        <p-table
          [value]="saldosFiltrados()"
          [loading]="loading()"
          [rows]="12"
          [paginator]="saldosFiltrados().length > 12"
          styleClass="chb-data-table"
          responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="codigo">Codigo <p-sortIcon field="codigo"></p-sortIcon></th>
              <th pSortableColumn="descricao">Descricao <p-sortIcon field="descricao"></p-sortIcon></th>
              <th style="text-align:center">Loja</th>
              <th pSortableColumn="disponivel" style="text-align:right">Disponivel <p-sortIcon field="disponivel"></p-sortIcon></th>
              <th style="text-align:right">Reservado</th>
              <th pSortableColumn="minimo" style="text-align:right">Minimo <p-sortIcon field="minimo"></p-sortIcon></th>
              <th style="text-align:right">Valor Total</th>
              <th style="text-align:center">Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr [class.row-critico]="item.statusEstoque === 'CRITICO'" [class.row-comprar]="item.statusEstoque === 'COMPRAR'" [class.row-zerado]="item.statusEstoque === 'ZERADO'">
              <td><strong class="cod-text">{{ item.codigo }}</strong></td>
              <td>{{ item.descricao }}</td>
              <td style="text-align:center">{{ item.loja }}</td>
              <td style="text-align:right">
                <strong [class.qtd-zero]="item.disponivel === 0">{{ item.disponivel | number:'1.0-0':'pt-BR' }}</strong>
              </td>
              <td style="text-align:right;color:var(--chb-text-muted)">{{ item.reservado | number:'1.0-0':'pt-BR' }}</td>
              <td style="text-align:right;color:var(--chb-text-muted)">{{ item.minimo | number:'1.0-0':'pt-BR' }}</td>
              <td style="text-align:right">{{ item.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align:center">
                <p-tag [value]="statusLabel(item.statusEstoque)" [severity]="statusSeverity(item.statusEstoque)"></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                Nenhum saldo encontrado.
              </td>
            </tr>
          </ng-template>
        </p-table>
        } <!-- end @else -->
      </div>
    </section>
  `,
  styles: [`
    .saldos-page {
      display: grid;
      gap: 0.85rem;
    }

    .saldos-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
      flex-wrap: wrap;
    }

    .saldos-heading {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 0;
    }

    .saldos-heading-icon {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.45rem;
      background: var(--chb-teal-50);
      color: var(--chb-teal);
    }

    .saldos-header p {
      margin: 0;
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: var(--chb-text);
      font-size: 1.35rem;
      line-height: 1.15;
    }

    .saldos-header span {
      display: block;
      margin-top: 0.4rem;
      color: var(--chb-text-muted);
      max-width: 44rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .saldos-header-acoes {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .saldos-kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .kpi {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.8rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
    }

    .kpi i {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.5rem;
      font-size: 1.15rem;
    }

    .kpi--success i { background: #dcfce7; color: #166534; }
    .kpi--warning i { background: var(--chb-yellow-50); color: var(--chb-yellow-700); }
    .kpi--info i { background: var(--chb-navy-50); color: var(--chb-navy); }
    .kpi--danger i { background: #fee2e2; color: #991b1b; }

    .kpi span, .kpi small { display: block; color: var(--chb-text-muted); font-size: 0.78rem; font-weight: 800; }
    .kpi strong { display: block; margin: 0.15rem 0; color: var(--chb-text); font-size: 1.05rem; }

    .saldos-panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
      overflow: hidden;
      min-width: 0;
    }

    .saldos-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem;
      border-bottom: 1px solid var(--chb-border);
      flex-wrap: wrap;
    }

    .saldos-filtros {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .saldos-search-input {
      width: 16rem;
      max-width: 100%;
    }

    .saldos-hint {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
    }

    .cod-text {
      font-family: monospace;
      font-size: 0.85rem;
    }

    .qtd-zero {
      color: #dc2626;
    }

    .row-critico {
      background: #fffbeb !important;
    }

    .row-comprar {
      background: #fff7ed !important;
    }

    .row-zerado {
      background: #fef2f2 !important;
    }

    :host-context(.dark) .row-critico { background: rgba(245,158,11,0.08) !important; }
    :host-context(.dark) .row-comprar { background: rgba(249,115,22,0.08) !important; }
    :host-context(.dark) .row-zerado { background: rgba(239,68,68,0.08) !important; }

    .skeleton-list { display: grid; gap: 0.35rem; }

    @media (max-width: 900px) {
      .saldos-kpis { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 767px) {
      .saldos-kpis { grid-template-columns: 1fr; }
      .saldos-header { flex-direction: column; }
      .saldos-heading { width: 100%; }
      .saldos-filtros,
      .saldos-filtros > span,
      .saldos-search-input {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstoqueSaldosPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private readonly busca$ = new Subject<string>();

  readonly loading = signal(false);
  readonly saldos = signal<SaldoItem[]>([]);
  readonly saldosFiltrados = signal<SaldoItem[]>([]);

  busca = '';
  filtroStatus: SaldoItem['statusEstoque'] | null = null;
  readonly statusFiltroOptions = STATUS_FILTRO;

  readonly kpiComSaldo = computed(() => this.saldos().filter((s) => s.disponivel > 0).length);
  readonly kpiCriticos = computed(() => this.saldos().filter((s) => s.statusEstoque === 'CRITICO' || s.statusEstoque === 'COMPRAR').length);
  readonly kpiZerados = computed(() => this.saldos().filter((s) => s.statusEstoque === 'ZERADO').length);
  readonly kpiValorTotal = computed(() => this.saldos().reduce((acc, s) => acc + s.valorTotal, 0));

  ngOnInit(): void {
    this.busca$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.aplicarFiltros());

    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F5') {
      event.preventDefault();
      this.carregar();
    }
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/estoque/saldos').pipe(
      catchError(() => of(DEMO_SALDOS))
    ).subscribe((response) => {
      const list = normalizeSaldos(response);
      this.saldos.set(list.length ? list : DEMO_SALDOS);
      this.aplicarFiltros();
      this.loading.set(false);
    });
  }

  onBuscaChange(value: string): void {
    this.busca$.next(value);
  }

  aplicarFiltros(): void {
    let lista = this.saldos();
    const q = this.busca.trim().toLowerCase();

    if (q) {
      lista = lista.filter((s) =>
        s.codigo.toLowerCase().includes(q) ||
        s.descricao.toLowerCase().includes(q)
      );
    }

    if (this.filtroStatus) {
      lista = lista.filter((s) => s.statusEstoque === this.filtroStatus);
    }

    this.saldosFiltrados.set(lista);
  }

  exportar(): void {
    // Placeholder para exportacao CSV
    const csv = [
      'Codigo,Descricao,Loja,Disponivel,Reservado,Minimo,Valor Total,Status',
      ...this.saldosFiltrados().map((s) =>
        `"${s.codigo}","${s.descricao}","${s.loja}",${s.disponivel},${s.reservado},${s.minimo},${s.valorTotal.toFixed(2)},${s.statusEstoque}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saldos-estoque-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  statusLabel(status: SaldoItem['statusEstoque']): string {
    const map: Record<SaldoItem['statusEstoque'], string> = {
      NORMAL: 'Normal',
      CRITICO: 'Critico',
      COMPRAR: 'Comprar',
      ZERADO: 'Zerado'
    };
    return map[status] ?? status;
  }

  statusSeverity(status: SaldoItem['statusEstoque']): 'success' | 'warning' | 'danger' | 'secondary' {
    const map: Record<SaldoItem['statusEstoque'], 'success' | 'warning' | 'danger' | 'secondary'> = {
      NORMAL: 'success',
      CRITICO: 'warning',
      COMPRAR: 'warning',
      ZERADO: 'danger'
    };
    return map[status] ?? 'secondary';
  }
}

function normalizeSaldos(response: unknown): SaldoItem[] {
  const arr = Array.isArray(response) ? response
    : (typeof response === 'object' && response !== null)
      ? ((response as Record<string, unknown>)['content'] as unknown[] ||
         (response as Record<string, unknown>)['items'] as unknown[] ||
         (response as Record<string, unknown>)['data'] as unknown[] || [])
      : [];

  return (arr as Record<string, unknown>[]).map((r) => {
    // Backend EstoqueSaldoResponse fields: qtdDisponivel (computed), qtdAtual, qtdMinima, qtdReservada
    const disponivel = Number(r['qtdDisponivel'] ?? r['disponivel'] ?? r['qtdAtual'] ?? 0);
    const minimo = Number(r['qtdMinima'] ?? r['minimo'] ?? 0);

    // Backend computes status as 'OK'|'ABAIXO_MINIMO'|'SEM_ESTOQUE'; map to frontend enum
    let statusEstoque: SaldoItem['statusEstoque'] = 'NORMAL';
    const backendStatus = String(r['status'] ?? '');
    if (backendStatus === 'SEM_ESTOQUE' || disponivel === 0) {
      statusEstoque = 'ZERADO';
    } else if (backendStatus === 'ABAIXO_MINIMO') {
      statusEstoque = disponivel < minimo * 0.5 ? 'COMPRAR' : 'CRITICO';
    } else if (disponivel < minimo * 0.5) {
      statusEstoque = 'COMPRAR';
    } else if (disponivel < minimo) {
      statusEstoque = 'CRITICO';
    }

    return {
      id: String(r['id'] ?? ''),
      // codigoProduto and descricaoProduto are the real backend field names
      codigo: String(r['codigoProduto'] ?? r['codigo'] ?? r['produto'] ?? ''),
      descricao: String(r['descricaoProduto'] ?? r['descricao'] ?? r['nome'] ?? ''),
      loja: String(r['lojaId'] ?? r['loja'] ?? ''),
      disponivel,
      reservado: Number(r['qtdReservada'] ?? r['reservado'] ?? 0),
      minimo,
      valorUnitario: Number(r['valorUnitario'] ?? r['preco'] ?? 0),
      valorTotal: Number(r['valorTotal'] ?? 0),
      statusEstoque
    };
  });
}

import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface PreVendaResumo {
  id: string;
  numero: string;
  cliente: string;
  vendedor: string;
  data: string;
  status: PreVendaStatus;
  total: number;
  itens: number;
}

export type PreVendaStatus = 'ABERTA' | 'SEPARADA' | 'CONFERIDA' | 'EMITIDA' | 'CANCELADA';

const DEMO_PRE_VENDAS: PreVendaResumo[] = [
  { id: 'pv1', numero: 'PV-009812', cliente: 'Joao Batista da Silva', vendedor: 'ANA', data: '2026-05-18', status: 'ABERTA', total: 318.30, itens: 3 },
  { id: 'pv2', numero: 'PV-009811', cliente: 'Moto Rapido Entregas LTDA', vendedor: 'Vendedor Balcao', data: '2026-05-18', status: 'SEPARADA', total: 1240.00, itens: 8 },
  { id: 'pv3', numero: 'PV-009810', cliente: 'Consumidor Balcao', vendedor: 'ANA', data: '2026-05-18', status: 'EMITIDA', total: 38.90, itens: 1 },
  { id: 'pv4', numero: 'PV-009809', cliente: 'Carlos Oficina ME', vendedor: 'Vendedor Balcao', data: '2026-05-17', status: 'CONFERIDA', total: 363.50, itens: 2 },
  { id: 'pv5', numero: 'PV-009808', cliente: 'Joao Batista da Silva', vendedor: 'ANA', data: '2026-05-17', status: 'CANCELADA', total: 89.90, itens: 1 }
];

const STATUS_OPTIONS = [
  { label: 'Todos', value: null },
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Separada', value: 'SEPARADA' },
  { label: 'Conferida', value: 'CONFERIDA' },
  { label: 'Emitida', value: 'EMITIDA' },
  { label: 'Cancelada', value: 'CANCELADA' }
];

@Component({
  selector: 'chb-pre-venda-list-page',
  standalone: true,
  imports: [
    ButtonModule, CalendarModule, CurrencyPipe, DatePipe,
    DropdownModule, FormsModule, InputTextModule,
    TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="pv-page">
      <header class="pv-header">
        <div class="pv-heading">
          <span class="pv-heading-icon" aria-hidden="true"><i class="pi pi-file-edit"></i></span>
          <div>
            <p>Vendas</p>
            <h2>Pre-vendas</h2>
            <span>Gerencie pre-vendas de balcao com reserva de estoque, descontos e acompanhamento de status.</span>
          </div>
        </div>
        <div class="pv-header-actions">
          <button pButton type="button" icon="pi pi-refresh" label="Atualizar" class="p-button-outlined" (click)="carregar()"></button>
          <button pButton type="button" icon="pi pi-plus" label="Nova Pre-venda (Ctrl+N)" (click)="novaPV()"></button>
        </div>
      </header>

      <div class="pv-kpis">
        <article class="kpi kpi--info">
          <i class="pi pi-file-edit" aria-hidden="true"></i>
          <div>
            <span>Abertas</span>
            <strong>{{ kpiAbertas() }}</strong>
            <small>aguardando caixa</small>
          </div>
        </article>
        <article class="kpi kpi--warning">
          <i class="pi pi-box" aria-hidden="true"></i>
          <div>
            <span>Separadas / Conferidas</span>
            <strong>{{ kpiSeparadas() }}</strong>
            <small>em processo</small>
          </div>
        </article>
        <article class="kpi kpi--success">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <div>
            <span>Total do dia</span>
            <strong>{{ kpiTotalDia() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>emitidas hoje</small>
          </div>
        </article>
      </div>

      <div class="pv-panel">
        <div class="pv-toolbar">
          <div class="pv-toolbar-filters">
            <span class="p-input-icon-left">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                pInputText
                type="search"
                placeholder="Buscar por numero ou cliente..."
                [(ngModel)]="busca"
                (ngModelChange)="onBuscaChange($event)"
                class="pv-search-input" />
            </span>
            <p-dropdown
              [(ngModel)]="filtroStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Status"
              (ngModelChange)="aplicarFiltros()"
              [style]="{ width: '140px' }">
            </p-dropdown>
          </div>
          <small class="pv-hint">F1=Busca &nbsp; Ctrl+N=Nova &nbsp; Click=Abrir</small>
        </div>

        <p-table
          [value]="preVendasFiltradas()"
          [loading]="loading()"
          [rows]="10"
          [paginator]="preVendasFiltradas().length > 10"
          selectionMode="single"
          (onRowSelect)="abrirPV($event.data)"
          styleClass="chb-data-table"
          responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="numero">Numero <p-sortIcon field="numero"></p-sortIcon></th>
              <th pSortableColumn="cliente">Cliente <p-sortIcon field="cliente"></p-sortIcon></th>
              <th pSortableColumn="vendedor">Vendedor <p-sortIcon field="vendedor"></p-sortIcon></th>
              <th pSortableColumn="data">Data <p-sortIcon field="data"></p-sortIcon></th>
              <th style="text-align:center">Itens</th>
              <th style="text-align:right">Total</th>
              <th style="text-align:center">Status</th>
              <th style="width:80px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pv>
            <tr [pSelectableRow]="pv" style="cursor:pointer">
              <td><strong>{{ pv.numero }}</strong></td>
              <td>{{ pv.cliente }}</td>
              <td>{{ pv.vendedor }}</td>
              <td>{{ pv.data | date:'dd/MM/yy':'':'pt-BR' }}</td>
              <td style="text-align:center">{{ pv.itens }}</td>
              <td style="text-align:right">{{ pv.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align:center">
                <p-tag [value]="statusLabel(pv.status)" [severity]="statusSeverity(pv.status)"></p-tag>
              </td>
              <td>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirPV(pv); $event.stopPropagation()"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                Nenhuma pre-venda encontrada.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styles: [`
    .pv-page {
      display: grid;
      gap: 0.85rem;
    }

    .pv-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
    }

    .pv-heading {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 0;
    }

    .pv-heading-icon {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.45rem;
      background: var(--chb-teal-50);
      color: var(--chb-teal);
    }

    .pv-header p {
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

    .pv-header span {
      display: block;
      margin-top: 0.4rem;
      color: var(--chb-text-muted);
      max-width: 44rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .pv-header-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .pv-kpis {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
      background: var(--chb-navy-50);
      color: var(--chb-navy);
      font-size: 1.15rem;
    }

    .kpi--success i { background: #dcfce7; color: #166534; }
    .kpi--warning i { background: var(--chb-yellow-50); color: var(--chb-yellow-700); }
    .kpi--info i { background: var(--chb-navy-50); color: var(--chb-navy); }

    .kpi span, .kpi small { display: block; color: var(--chb-text-muted); font-size: 0.78rem; font-weight: 800; }
    .kpi strong { display: block; margin: 0.15rem 0; color: var(--chb-text); font-size: 1.12rem; }

    .pv-panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
      overflow: hidden;
      min-width: 0;
    }

    .pv-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem;
      border-bottom: 1px solid var(--chb-border);
      flex-wrap: wrap;
    }

    .pv-toolbar-filters {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pv-search-input {
      width: 16rem;
      max-width: 100%;
    }

    .pv-hint {
      color: var(--chb-text-muted);
      font-size: 0.75rem;
    }

    @media (max-width: 767px) {
      .pv-kpis { grid-template-columns: 1fr; }
      .pv-header { flex-direction: column; }
      .pv-heading { width: 100%; }
      .pv-toolbar-filters,
      .pv-toolbar-filters > span,
      .pv-search-input {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreVendaListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly busca$ = new Subject<string>();

  readonly loading = signal(false);
  readonly preVendas = signal<PreVendaResumo[]>([]);
  readonly preVendasFiltradas = signal<PreVendaResumo[]>([]);

  busca = '';
  filtroStatus: PreVendaStatus | null = null;
  readonly statusOptions = STATUS_OPTIONS;

  readonly kpiAbertas = computed(() => this.preVendas().filter((p) => p.status === 'ABERTA').length);
  readonly kpiSeparadas = computed(() => this.preVendas().filter((p) => p.status === 'SEPARADA' || p.status === 'CONFERIDA').length);
  readonly kpiTotalDia = computed(() => this.preVendas().filter((p) => p.status === 'EMITIDA').reduce((acc, p) => acc + p.total, 0));

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
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      this.novaPV();
    }
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/vendas/pre-vendas').pipe(
      catchError(() => of(DEMO_PRE_VENDAS))
    ).subscribe((response) => {
      const list = normalizePreVendas(response);
      this.preVendas.set(list.length ? list : DEMO_PRE_VENDAS);
      this.aplicarFiltros();
      this.loading.set(false);
    });
  }

  onBuscaChange(value: string): void {
    this.busca$.next(value);
  }

  aplicarFiltros(): void {
    let lista = this.preVendas();
    const q = this.busca.trim().toLowerCase();

    if (q) {
      lista = lista.filter((pv) =>
        pv.numero.toLowerCase().includes(q) ||
        pv.cliente.toLowerCase().includes(q) ||
        pv.vendedor.toLowerCase().includes(q)
      );
    }

    if (this.filtroStatus) {
      lista = lista.filter((pv) => pv.status === this.filtroStatus);
    }

    this.preVendasFiltradas.set(lista);
  }

  novaPV(): void {
    void this.router.navigate(['/vendas/pre-vendas/nova']);
  }

  abrirPV(pv: PreVendaResumo): void {
    void this.router.navigate(['/vendas/pre-vendas', pv.id]);
  }

  statusLabel(status: PreVendaStatus): string {
    const map: Record<PreVendaStatus, string> = {
      ABERTA: 'Aberta',
      SEPARADA: 'Separada',
      CONFERIDA: 'Conferida',
      EMITIDA: 'Emitida',
      CANCELADA: 'Cancelada'
    };
    return map[status] ?? status;
  }

  statusSeverity(status: PreVendaStatus): 'info' | 'warning' | 'success' | 'danger' | 'secondary' {
    const map: Record<PreVendaStatus, 'info' | 'warning' | 'success' | 'danger' | 'secondary'> = {
      ABERTA: 'info',
      SEPARADA: 'warning',
      CONFERIDA: 'warning',
      EMITIDA: 'success',
      CANCELADA: 'secondary'
    };
    return map[status] ?? 'secondary';
  }
}

function normalizePreVendas(response: unknown): PreVendaResumo[] {
  const arr = Array.isArray(response) ? response
    : (typeof response === 'object' && response !== null)
      ? ((response as Record<string, unknown>)['content'] as unknown[] ||
         (response as Record<string, unknown>)['items'] as unknown[] ||
         (response as Record<string, unknown>)['data'] as unknown[] || [])
      : [];

  return (arr as Record<string, unknown>[]).map((r) => ({
    id: String(r['id'] ?? r['numero'] ?? ''),
    numero: String(r['numero'] ?? ''),
    // backend returns clienteNome (not cliente or nomeCliente)
    cliente: String(r['clienteNome'] ?? r['cliente'] ?? r['nomeCliente'] ?? ''),
    vendedor: String(r['vendedor'] ?? r['nomeVendedor'] ?? ''),
    // backend returns createdAt (ISO OffsetDateTime string, not data or dataEmissao)
    data: String(r['createdAt'] ?? r['data'] ?? r['dataEmissao'] ?? ''),
    status: String(r['status'] ?? 'ABERTA') as PreVendaResumo['status'],
    total: Number(r['total'] ?? r['valorTotal'] ?? 0),
    // no item count in list response from backend — default to 0
    itens: Number(r['itens'] ?? r['quantidadeItens'] ?? 0)
  }));
}

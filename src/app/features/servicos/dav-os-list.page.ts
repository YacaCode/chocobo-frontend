import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  type OnDestroy,
  type OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

const DEMO_DAV_OS = [
  { id: 'os-001', numero: 'OS-0001', clienteNome: 'Moto Rápido Entregas', placa: 'ABC-1234', modelo: 'Honda CG 160', consultor: 'Admin', total: 350.0, status: 'ABERTA' },
  { id: 'os-002', numero: 'OS-0002', clienteNome: 'Carlos Oficina ME', placa: 'DEF-5678', modelo: 'Yamaha Factor 150', consultor: 'Admin', total: 1200.0, status: 'ORCAMENTO' },
  { id: 'os-003', numero: 'OS-0003', clienteNome: 'João Batista da Silva', placa: 'GHI-9012', modelo: 'Biz 125', consultor: 'Admin', total: 89.9, status: 'APROVADA' },
  { id: 'os-004', numero: 'OS-0004', clienteNome: 'Ana Lucia Motos', placa: 'JKL-3456', modelo: 'Pop 110i', consultor: 'Admin', total: 650.0, status: 'FINALIZADA' },
  { id: 'os-005', numero: 'OS-0005', clienteNome: 'Rodrigo Pereira', placa: 'MNO-7890', modelo: 'Titan 160', consultor: 'Admin', total: 0.0, status: 'CANCELADA' }
];

@Component({
  selector: 'chb-dav-os-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, DatePipe, DropdownModule, FormsModule,
    InputTextModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- KPIs topo -->
    <div class="kpi-row">
      <div class="kpi-card kpi-info">
        <span class="kpi-label">ABERTAS</span>
        <span class="kpi-value">{{ qtdAbertas() }}</span>
      </div>
      <div class="kpi-card kpi-warning">
        <span class="kpi-label">EM ORÇAMENTO</span>
        <span class="kpi-value">{{ qtdOrcamento() }}</span>
      </div>
      <div class="kpi-card kpi-success">
        <span class="kpi-label">FINALIZADAS</span>
        <span class="kpi-value">{{ qtdFinalizadas() }}</span>
      </div>
      <div class="kpi-card kpi-secondary">
        <span class="kpi-label">TOTAL EM ABERTO</span>
        <span class="kpi-value">{{ totalAberto() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Ordens de Serviço (DAV-OS)</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar por cliente, número, placa..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFiltro"
                    placeholder="Todos os status" (onChange)="aplicarFiltro()">
        </p-dropdown>
        <button pButton icon="pi pi-plus" label="Nova OS"
                class="p-button-success"
                (click)="novaOs()" pTooltip="Ctrl+N">
        </button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"
                pTooltip="Atualizar"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !lista().length) {
      @for (i of [1,2,3,4,5]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtradas()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id"
               (onRowSelect)="abrirOs($event)"
               selectionMode="single"
               [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="numero">Número <p-sortIcon field="numero"></p-sortIcon></th>
            <th pSortableColumn="clienteNome">Cliente <p-sortIcon field="clienteNome"></p-sortIcon></th>
            <th>Veículo (Placa)</th>
            <th>Consultor</th>
            <th style="text-align:right">Total</th>
            <th>Status</th>
            <th style="width:80px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-os>
          <tr style="cursor:pointer" (click)="abrirOs({data: os})">
            <td style="font-weight:700">{{ os.numero }}</td>
            <td>{{ os.clienteNome }}</td>
            <td>
              <span class="placa-badge">{{ os.placa }}</span>
              <small style="color:var(--chb-text-muted);margin-left:.5rem">{{ os.modelo }}</small>
            </td>
            <td>{{ os.consultor }}</td>
            <td style="text-align:right;font-weight:700">{{ os.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td><p-tag [value]="os.status" [severity]="severidade(os.status)"></p-tag></td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                      (click)="abrirOs({data: os}); $event.stopPropagation()"
                      pTooltip="Abrir OS"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2rem">
              <i class="pi pi-wrench" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhuma ordem de serviço encontrada.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:140px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .kpi-info .kpi-value { color:#1A237E; }
    .kpi-warning .kpi-value { color:#ea580c; }
    .kpi-success .kpi-value { color:#16a34a; }
    .kpi-secondary .kpi-value { color:var(--chb-text); }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .placa-badge { background:var(--chb-navy); color:#fff; border-radius:.25rem; padding:.15rem .5rem; font-size:.8rem; font-weight:700; font-family:monospace; }
  `]
})
export class DavOsListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly lista = signal<any[]>([]);
  readonly loading = signal(false);
  readonly busca = signal('');
  statusFiltro = '';

  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Aberta', value: 'ABERTA' },
    { label: 'Orçamento', value: 'ORCAMENTO' },
    { label: 'Aprovada', value: 'APROVADA' },
    { label: 'Finalizada', value: 'FINALIZADA' },
    { label: 'Cancelada', value: 'CANCELADA' }
  ];

  readonly filtradas = computed(() => {
    const b = this.busca().toLowerCase();
    const st = this.statusFiltro;
    return this.lista().filter(os =>
      (!b || os.clienteNome?.toLowerCase().includes(b) ||
             os.numero?.includes(b) || os.placa?.toLowerCase().includes(b)) &&
      (!st || os.status === st)
    );
  });

  readonly qtdAbertas = computed(() => this.lista().filter(os => os.status === 'ABERTA').length);
  readonly qtdOrcamento = computed(() => this.lista().filter(os => os.status === 'ORCAMENTO').length);
  readonly qtdFinalizadas = computed(() => this.lista().filter(os => os.status === 'FINALIZADA').length);
  readonly totalAberto = computed(() =>
    this.lista().filter(os => ['ABERTA','ORCAMENTO','APROVADA'].includes(os.status))
      .reduce((s: number, os: any) => s + (os.total || 0), 0)
  );

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'ABERTA': 'info', 'ORCAMENTO': 'warning', 'APROVADA': 'success',
      'FINALIZADA': 'secondary', 'CANCELADA': 'danger'
    };
    return map[status] ?? 'secondary';
  }

  ngOnInit(): void {
    this.buscaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(e: KeyboardEvent): void {
    e.preventDefault();
    this.novaOs();
  }

  onBuscaInput(value: string): void {
    this.buscaSubject.next(value);
  }

  aplicarFiltro(): void {
    // filtradas() é computed — já reage
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/servicos/dav-os')
      .pipe(
        catchError(() => of(DEMO_DAV_OS)),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.lista.set(data));
  }

  novaOs(): void {
    void this.router.navigate(['/servicos/atendimento/nova']);
  }

  abrirOs(event: { data?: any }): void {
    if (event?.data) {
      void this.router.navigate(['/servicos/atendimento', event.data.id]);
    }
  }
}

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
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BaixarContaDialogComponent } from '../../shared/baixar-conta-dialog/baixar-conta-dialog.component';

const DEMO_CONTAS_RECEBER = [
  { id: 'cr-001', documento: 'PV-009800', clienteNome: 'Moto Rápido Entregas', valor: 1240.0, vencimento: '2026-05-25', status: 'ABERTA', diasAtraso: 0 },
  { id: 'cr-002', documento: 'PV-009799', clienteNome: 'Carlos Oficina ME', valor: 363.5, vencimento: '2026-05-10', status: 'VENCIDA', diasAtraso: 9 },
  { id: 'cr-003', documento: 'PV-009798', clienteNome: 'João Batista da Silva', valor: 89.9, vencimento: '2026-04-30', status: 'VENCIDA', diasAtraso: 19 },
  { id: 'cr-004', documento: 'PV-009797', clienteNome: 'Auto Peças Norte', valor: 2400.0, vencimento: '2026-05-18', status: 'PAGA', diasAtraso: 0, valorPago: 2400.0 },
  { id: 'cr-005', documento: 'PV-009796', clienteNome: 'Distribuidora Sul', valor: 560.0, vencimento: '2026-06-05', status: 'ABERTA', diasAtraso: 0 },
  { id: 'cr-006', documento: 'PV-009795', clienteNome: 'Moto Rapido CE', valor: 850.0, vencimento: '2026-04-15', status: 'NEGOCIADA', diasAtraso: 34 },
  { id: 'cr-007', documento: 'PV-009794', clienteNome: 'Rodrigo Pereira', valor: 125.0, vencimento: '2026-05-22', status: 'ABERTA', diasAtraso: 0 },
  { id: 'cr-008', documento: 'PV-009793', clienteNome: 'Ana Lucia Motos', valor: 678.0, vencimento: '2026-05-28', status: 'PAGA', diasAtraso: 0, valorPago: 678.0 }
];

@Component({
  selector: 'chb-contas-receber-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaixarContaDialogComponent, ButtonModule, CalendarModule, CurrencyPipe, DatePipe,
    DropdownModule, FormsModule, InputTextModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- KPIs topo -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">A RECEBER (30 dias)</span>
        <span class="kpi-value text-green">{{ totalAberto() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">VENCIDO</span>
        <span class="kpi-value text-red">{{ totalVencido() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">RECEBIDO NO MÊS</span>
        <span class="kpi-value text-teal">{{ totalPago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">NEGOCIADO</span>
        <span class="kpi-value text-orange">{{ totalNegociado() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
    </div>

    <!-- Toolbar com filtros -->
    <div class="page-toolbar">
      <h2 class="page-title">Contas a Receber</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar cliente ou documento..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFiltro"
                    placeholder="Todos os status" (onChange)="carregar()">
        </p-dropdown>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"
                pTooltip="Atualizar"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !contas().length) {
      @for (i of [1,2,3,4,5]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtradas()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id"
               [sortField]="'vencimento'" [sortOrder]="1">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="documento">Documento <p-sortIcon field="documento"></p-sortIcon></th>
            <th pSortableColumn="clienteNome">Cliente <p-sortIcon field="clienteNome"></p-sortIcon></th>
            <th pSortableColumn="vencimento">Vencimento <p-sortIcon field="vencimento"></p-sortIcon></th>
            <th style="text-align:right">Valor</th>
            <th>Status</th>
            <th style="width:120px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-conta>
          <tr [class.row-vencida]="conta.status === 'VENCIDA'" [class.row-paga]="conta.status === 'PAGA'">
            <td>{{ conta.documento }}</td>
            <td>{{ conta.clienteNome }}</td>
            <td [class.text-red]="conta.status === 'VENCIDA'">
              {{ conta.vencimento | date:'dd/MM/yyyy' }}
              @if (conta.diasAtraso > 0) {
                <small class="atraso-badge">{{ conta.diasAtraso }}d</small>
              }
            </td>
            <td style="text-align:right;font-weight:700">
              {{ conta.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
            </td>
            <td><p-tag [value]="conta.status" [severity]="severidadeStatus(conta.status)"></p-tag></td>
            <td>
              @if (conta.status !== 'PAGA') {
                <button pButton icon="pi pi-dollar" label="Baixar"
                        class="p-button-success p-button-sm"
                        (click)="abrirBaixar(conta)"></button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" style="text-align:center;padding:2rem">
              <i class="pi pi-inbox" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhuma conta encontrada.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }

    <!-- Dialog Baixar Conta -->
    <chb-baixar-conta-dialog
      [(visible)]="showBaixarDialog"
      [conta]="contaSelecionada()"
      (baixado)="onBaixado($event)">
    </chb-baixar-conta-dialog>
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:160px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .text-green { color:#16a34a; }
    .text-red { color:#dc2626; }
    .text-teal { color:#00897B; }
    .text-orange { color:#ea580c; }
    .row-vencida { background:rgba(220,38,38,.05); }
    .row-paga { opacity:.65; }
    .atraso-badge { background:#dc2626; color:#fff; border-radius:.25rem; padding:.1rem .35rem; font-size:.65rem; margin-left:.35rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
  `]
})
export class ContasReceberPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly contas = signal<any[]>([]);
  readonly loading = signal(false);
  readonly busca = signal('');
  statusFiltro = '';
  showBaixarDialog = false;
  readonly contaSelecionada = signal<any>(null);

  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Aberta', value: 'ABERTA' },
    { label: 'Vencida', value: 'VENCIDA' },
    { label: 'Paga', value: 'PAGA' },
    { label: 'Negociada', value: 'NEGOCIADA' }
  ];

  readonly filtradas = computed(() => {
    const b = this.busca().toLowerCase();
    return this.contas().filter(c =>
      !b || c.clienteNome?.toLowerCase().includes(b) || c.documento?.includes(b)
    );
  });

  readonly totalAberto = computed(() =>
    this.contas().filter(c => c.status === 'ABERTA').reduce((s: number, c: any) => s + (c.valor || 0), 0)
  );
  readonly totalVencido = computed(() =>
    this.contas().filter(c => c.status === 'VENCIDA').reduce((s: number, c: any) => s + (c.valor || 0), 0)
  );
  readonly totalPago = computed(() =>
    this.contas().filter(c => c.status === 'PAGA').reduce((s: number, c: any) => s + (c.valorPago || c.valor || 0), 0)
  );
  readonly totalNegociado = computed(() =>
    this.contas().filter(c => c.status === 'NEGOCIADA').reduce((s: number, c: any) => s + (c.valor || 0), 0)
  );

  severidadeStatus(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'ABERTA': 'info', 'VENCIDA': 'danger', 'PAGA': 'success', 'NEGOCIADA': 'warning'
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

  onBuscaInput(value: string): void {
    this.buscaSubject.next(value);
  }

  carregar(): void {
    this.loading.set(true);
    const params = this.statusFiltro ? `?status=${this.statusFiltro}` : '';
    this.http.get<any[]>(`/api/v1/financeiro/contas-receber${params}`)
      .pipe(
        catchError(() => of(DEMO_CONTAS_RECEBER)),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.contas.set(data));
  }

  abrirBaixar(conta: any): void {
    this.contaSelecionada.set(conta);
    this.showBaixarDialog = true;
  }

  onBaixado(result: any): void {
    this.msg.add({
      severity: 'success',
      summary: 'Conta baixada',
      detail: `Total cobrado: R$ ${(result.totalCobrado ?? 0).toFixed(2)}`
    });
    this.carregar();
  }
}

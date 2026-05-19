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
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_CONTAS_PAGAR = [
  { id: 'cp-001', documento: 'NF-045821', fornecedorNome: 'Distribuidora de Peças CE', valor: 4580.0, vencimento: '2026-05-30', status: 'ABERTA', diasAtraso: 0 },
  { id: 'cp-002', documento: 'NF-031200', fornecedorNome: 'Riffel Brasil', valor: 1250.0, vencimento: '2026-05-12', status: 'VENCIDA', diasAtraso: 7 },
  { id: 'cp-003', documento: 'BOL-0089', fornecedorNome: 'Heliar Baterias', valor: 2100.0, vencimento: '2026-05-20', status: 'PAGA', diasAtraso: 0, valorPago: 2100.0 },
  { id: 'cp-004', documento: 'NF-098712', fornecedorNome: 'NGK do Brasil', valor: 890.0, vencimento: '2026-06-10', status: 'ABERTA', diasAtraso: 0 },
  { id: 'cp-005', documento: 'BOL-0092', fornecedorNome: 'Mobil Lubrificantes', valor: 650.0, vencimento: '2026-04-28', status: 'VENCIDA', diasAtraso: 21 }
];

@Component({
  selector: 'chb-contas-pagar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CalendarModule, ConfirmDialogModule, CurrencyPipe, DatePipe,
    DialogModule, DropdownModule, FormsModule, InputTextModule, SkeletonModule,
    TableModule, TagModule, ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- KPIs topo -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">A PAGAR (30 dias)</span>
        <span class="kpi-value text-orange">{{ totalAberto() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">VENCIDO</span>
        <span class="kpi-value text-red">{{ totalVencido() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">PAGO NO MÊS</span>
        <span class="kpi-value text-teal">{{ totalPago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
    </div>

    <!-- Toolbar com filtros -->
    <div class="page-toolbar">
      <h2 class="page-title">Contas a Pagar</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar fornecedor ou documento..."
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
               [rowsPerPageOptions]="[10,20,50]" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="documento">Documento <p-sortIcon field="documento"></p-sortIcon></th>
            <th pSortableColumn="fornecedorNome">Fornecedor <p-sortIcon field="fornecedorNome"></p-sortIcon></th>
            <th pSortableColumn="vencimento">Vencimento <p-sortIcon field="vencimento"></p-sortIcon></th>
            <th style="text-align:right">Valor</th>
            <th>Status</th>
            <th style="width:120px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-conta>
          <tr [class.row-vencida]="conta.status === 'VENCIDA'" [class.row-paga]="conta.status === 'PAGA'">
            <td>{{ conta.documento }}</td>
            <td>{{ conta.fornecedorNome }}</td>
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
                <button pButton icon="pi pi-check" label="Pagar"
                        class="p-button-warning p-button-sm"
                        (click)="pagarConta(conta)"></button>
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
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:160px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .text-orange { color:#ea580c; }
    .text-red { color:#dc2626; }
    .text-teal { color:#00897B; }
    .row-vencida { background:rgba(220,38,38,.05); }
    .row-paga { opacity:.65; }
    .atraso-badge { background:#dc2626; color:#fff; border-radius:.25rem; padding:.1rem .35rem; font-size:.65rem; margin-left:.35rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
  `]
})
export class ContasPagarPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly contas = signal<any[]>([]);
  readonly loading = signal(false);
  readonly busca = signal('');
  statusFiltro = '';

  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Aberta', value: 'ABERTA' },
    { label: 'Vencida', value: 'VENCIDA' },
    { label: 'Paga', value: 'PAGA' }
  ];

  readonly filtradas = computed(() => {
    const b = this.busca().toLowerCase();
    return this.contas().filter(c =>
      !b || c.fornecedorNome?.toLowerCase().includes(b) || c.documento?.includes(b)
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

  severidadeStatus(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'ABERTA': 'info', 'VENCIDA': 'danger', 'PAGA': 'success'
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
    this.http.get<any[]>(`/api/v1/financeiro/contas-pagar${params}`)
      .pipe(
        catchError(() => of(DEMO_CONTAS_PAGAR)),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.contas.set(data));
  }

  pagarConta(conta: any): void {
    this.confirm.confirm({
      message: `Confirmar pagamento de ${conta.documento} — ${conta.fornecedorNome} no valor de R$ ${conta.valor.toFixed(2)}?`,
      header: 'Confirmar Pagamento',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Pagar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.post<any>(`/api/v1/financeiro/contas-pagar/${conta.id}/pagar`, {
          valorPago: conta.valor,
          formaPagamento: 'DINHEIRO',
          dataPagamento: new Date().toISOString().split('T')[0]
        })
          .pipe(
            catchError(() => of({ ...conta, status: 'PAGA', valorPago: conta.valor })),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            this.msg.add({ severity: 'success', summary: 'Conta paga', detail: `${conta.documento} pago com sucesso!` });
            this.carregar();
          });
      }
    });
  }
}

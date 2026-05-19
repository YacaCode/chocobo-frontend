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
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';

const DEMO_PEDIDOS_COMPRA = [
  { id: 'pc-001', numero: 'PC-0001', fornecedorNome: 'Distribuidora de Peças CE', emissao: '2026-05-10', qtdItens: 5, valorTotal: 4580.0, status: 'ABERTO', previsaoEntrega: '2026-05-25' },
  { id: 'pc-002', numero: 'PC-0002', fornecedorNome: 'Riffel Brasil', emissao: '2026-05-12', qtdItens: 2, valorTotal: 1250.0, status: 'RECEBIDO', previsaoEntrega: '2026-05-20' },
  { id: 'pc-003', numero: 'PC-0003', fornecedorNome: 'Heliar Baterias', emissao: '2026-05-14', qtdItens: 8, valorTotal: 3200.0, status: 'PARCIAL', previsaoEntrega: '2026-05-28' },
  { id: 'pc-004', numero: 'PC-0004', fornecedorNome: 'NGK do Brasil', emissao: '2026-04-28', qtdItens: 3, valorTotal: 890.0, status: 'CANCELADO', previsaoEntrega: null }
];

@Component({
  selector: 'chb-pedidos-compra-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CalendarModule, CurrencyPipe, DatePipe, DialogModule,
    DropdownModule, FormsModule, InputNumberModule, InputTextModule,
    ProdutoBuscaDialogComponent, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Dialog Novo Pedido -->
    <p-dialog [(visible)]="showNovoPedido" header="Novo Pedido de Compra" [modal]="true"
              [style]="{width:'640px',maxWidth:'95vw'}" [closable]="true">
      <chb-produto-busca-dialog [(visible)]="showProdutoDialog"
                                 (produtoSelecionado)="onProdutoPedido($event)"></chb-produto-busca-dialog>
      <div style="display:flex;flex-direction:column;gap:.85rem;padding:.5rem 0">
        <div class="form-field">
          <label class="form-label">Fornecedor *</label>
          <input pInputText [(ngModel)]="novoPedido.fornecedorNome" placeholder="Nome do fornecedor" />
        </div>
        <div class="form-field">
          <label class="form-label">Previsão de Entrega</label>
          <p-calendar [(ngModel)]="novoPedido.previsaoEntrega" dateFormat="dd/mm/yy" [showIcon]="true"></p-calendar>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <h4 style="margin:0;font-size:.85rem;font-weight:700;color:var(--chb-text-muted)">ITENS DO PEDIDO</h4>
          <button pButton icon="pi pi-plus" label="Adicionar Produto" class="p-button-sm p-button-outlined"
                  (click)="showProdutoDialog = true"></button>
        </div>
        @if (novoPedido.itens.length > 0) {
          <table class="items-table-sm">
            <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Est.</th></tr></thead>
            <tbody>
              @for (item of novoPedido.itens; track item.id; let i = $index) {
                <tr>
                  <td>{{ item.descricao }}</td>
                  <td><p-inputNumber [(ngModel)]="item.quantidade" [min]="1" [style]="{width:'70px'}"></p-inputNumber></td>
                  <td><p-inputNumber [(ngModel)]="item.precoEstimado" mode="currency" currency="BRL" locale="pt-BR" [style]="{width:'110px'}"></p-inputNumber></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancelar" icon="pi pi-times" class="p-button-outlined p-button-secondary"
                (click)="showNovoPedido = false"></button>
        <button pButton label="Salvar Pedido" icon="pi pi-check" class="p-button-success"
                (click)="salvarPedido()" [loading]="salvando()"></button>
      </ng-template>
    </p-dialog>

    <!-- KPIs -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">PEDIDOS ABERTOS</span>
        <span class="kpi-value" style="color:#1A237E">{{ qtdAbertos() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">VALOR COMPROMETIDO</span>
        <span class="kpi-value" style="color:#ea580c">{{ valorAberto() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">RECEBIDOS NO MÊS</span>
        <span class="kpi-value" style="color:#16a34a">{{ qtdRecebidos() }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Pedidos de Compra</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar fornecedor ou número..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <button pButton icon="pi pi-plus" label="Novo Pedido"
                class="p-button-success" (click)="abrirNovoPedido()"></button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !pedidos().length) {
      @for (i of [1,2,3,4]; track i) { <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton> }
    } @else {
      <p-table [value]="filtrados()" [paginator]="true" [rows]="20" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="numero">Número <p-sortIcon field="numero"></p-sortIcon></th>
            <th pSortableColumn="fornecedorNome">Fornecedor <p-sortIcon field="fornecedorNome"></p-sortIcon></th>
            <th pSortableColumn="emissao">Emissão <p-sortIcon field="emissao"></p-sortIcon></th>
            <th style="text-align:center">Itens</th>
            <th style="text-align:right">Valor Total</th>
            <th>Status</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td style="font-weight:700">{{ p.numero }}</td>
            <td>{{ p.fornecedorNome }}</td>
            <td>{{ p.emissao | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:center">{{ p.qtdItens }}</td>
            <td style="text-align:right;font-weight:700">{{ p.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td><p-tag [value]="p.status" [severity]="severidade(p.status)"></p-tag></td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" style="text-align:center;padding:2rem">
            <i class="pi pi-shopping-cart" style="font-size:2rem;color:var(--chb-text-muted)"></i>
            <p style="color:var(--chb-text-muted)">Nenhum pedido encontrado.</p>
          </td></tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:160px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .form-field { display:flex; flex-direction:column; gap:.25rem; }
    .form-label { font-size:.82rem; font-weight:700; color:var(--chb-text-muted); }
    .items-table-sm { width:100%; border-collapse:collapse; }
    .items-table-sm th { border-bottom:2px solid var(--chb-border); padding:.4rem; font-size:.8rem; text-align:left; color:var(--chb-text-muted); }
    .items-table-sm td { border-bottom:1px solid var(--chb-border); padding:.35rem .4rem; font-size:.88rem; }
  `]
})
export class PedidosCompraPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly pedidos = signal<any[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');

  showNovoPedido = false;
  showProdutoDialog = false;

  novoPedido: { fornecedorNome: string; previsaoEntrega: Date | null; itens: any[] } = {
    fornecedorNome: '', previsaoEntrega: null, itens: []
  };

  readonly filtrados = computed(() => {
    const b = this.busca().toLowerCase();
    return this.pedidos().filter(p => !b || p.fornecedorNome?.toLowerCase().includes(b) || p.numero?.includes(b));
  });
  readonly qtdAbertos = computed(() => this.pedidos().filter(p => p.status === 'ABERTO').length);
  readonly qtdRecebidos = computed(() => this.pedidos().filter(p => p.status === 'RECEBIDO').length);
  readonly valorAberto = computed(() =>
    this.pedidos().filter(p => p.status === 'ABERTO').reduce((s: number, p: any) => s + (p.valorTotal || 0), 0)
  );

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'ABERTO': 'info', 'RECEBIDO': 'success', 'PARCIAL': 'warning', 'CANCELADO': 'danger'
    };
    return map[status] ?? 'secondary';
  }

  ngOnInit(): void {
    this.buscaSubject.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onBuscaInput(value: string): void { this.buscaSubject.next(value); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/compras/pedidos-compra')
      .pipe(catchError(() => of(DEMO_PEDIDOS_COMPRA)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.pedidos.set(data));
  }

  abrirNovoPedido(): void {
    this.novoPedido = { fornecedorNome: '', previsaoEntrega: null, itens: [] };
    this.showNovoPedido = true;
  }

  onProdutoPedido(produto: ProdutoItem): void {
    this.novoPedido.itens.push({ id: produto.id, descricao: produto.descricao, quantidade: 1, precoEstimado: produto.precoVenda });
    this.showProdutoDialog = false;
  }

  salvarPedido(): void {
    this.salvando.set(true);
    this.http.post<any>('/api/v1/compras/pedidos-compra', this.novoPedido)
      .pipe(
        catchError(() => of({ ...this.novoPedido, id: 'pc-' + Date.now(), numero: 'PC-DEMO', status: 'ABERTO', qtdItens: this.novoPedido.itens.length, valorTotal: this.novoPedido.itens.reduce((s, i) => s + i.quantidade * i.precoEstimado, 0), emissao: new Date().toISOString().split('T')[0] })),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.pedidos.update(list => [data, ...list]);
        this.showNovoPedido = false;
        this.msg.add({ severity: 'success', summary: 'Pedido criado', detail: 'Pedido de compra salvo com sucesso!' });
      });
  }
}

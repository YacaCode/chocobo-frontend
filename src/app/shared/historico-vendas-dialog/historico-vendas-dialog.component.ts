import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject, signal, model, computed, type OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

interface HistoricoItem {
  loja: string;
  data: string;
  tipo: string;
  documento: string;
  codigoProduto: string;
  descricao: string;
  aplicacao: string;
  quantidade: number;
  valor: number;
}

const DEMO_HISTORICO: HistoricoItem[] = [
  { loja: 'Matriz', data: '2026-05-10', tipo: 'V', documento: 'PV-008211', codigoProduto: '101.425-2', descricao: 'Óleo 20W50 Lubrax 1L', aplicacao: 'TITAN150', quantidade: 2, valor: 54.90 },
  { loja: 'Matriz', data: '2026-04-22', tipo: 'V', documento: 'PV-007891', codigoProduto: '203.110-4', descricao: 'Filtro de Óleo Mahle', aplicacao: 'BROS125/150', quantidade: 1, valor: 28.50 },
  { loja: 'Filial Norte', data: '2026-04-10', tipo: 'D', documento: 'DEV-000021', codigoProduto: '101.425-2', descricao: 'Óleo 20W50 Lubrax 1L', aplicacao: 'TITAN150', quantidade: 1, valor: -27.45 },
  { loja: 'Matriz', data: '2026-03-18', tipo: 'V', documento: 'PV-006543', codigoProduto: '305.201-8', descricao: 'Pastilha de Freio Cobreq', aplicacao: 'LEAD110', quantidade: 1, valor: 48.90 },
  { loja: 'Matriz', data: '2026-02-05', tipo: 'V', documento: 'PV-005211', codigoProduto: '401.310-2', descricao: 'Correia Dentada Gates', aplicacao: 'BIZ125', quantidade: 1, valor: 62.00 },
];

@Component({
  selector: 'chb-historico-vendas-dialog',
  standalone: true,
  imports: [ButtonModule, CalendarModule, CurrencyPipe, DatePipe, DialogModule,
            FormsModule, InputTextModule, SkeletonModule, TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      header="Histórico de Vendas do Cliente"
      [modal]="true"
      [draggable]="false"
      [style]="{width:'92vw',maxWidth:'900px'}"
      [contentStyle]="{padding:'0'}">

      <div class="hist-filtros">
        <p-calendar [(ngModel)]="filtroDe" placeholder="De" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-calendar>
        <p-calendar [(ngModel)]="filtroAte" placeholder="Até" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-calendar>
        <span class="p-input-icon-left">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input pInputText [(ngModel)]="filtroProduto" placeholder="Produto..." (input)="filtrar()" />
        </span>
        <button pButton type="button" label="Filtrar" icon="pi pi-filter" class="p-button-sm" (click)="carregar()"></button>
      </div>

      @if (loading()) {
        <div class="hist-skeleton">
          @for (i of [1,2,3,4]; track i) { <p-skeleton height="2.8rem" styleClass="mb-1"></p-skeleton> }
        </div>
      } @else {
        <p-table [value]="historico()" [scrollable]="true" scrollHeight="380px"
                 [paginator]="true" [rows]="15" styleClass="p-datatable-sm hist-table"
                 emptyMessage="Nenhuma venda encontrada no período.">
          <ng-template pTemplate="header">
            <tr>
              <th>Loja</th>
              <th pSortableColumn="data">Data <p-sortIcon field="data"></p-sortIcon></th>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Código</th>
              <th>Descrição</th>
              <th>Aplicação</th>
              <th style="text-align:right">Qtd</th>
              <th style="text-align:right">Valor</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.loja }}</td>
              <td>{{ item.data | date:'dd/MM/yy' }}</td>
              <td><p-tag [value]="item.tipo === 'V' ? 'Venda' : 'Dev.'" [severity]="item.tipo === 'V' ? 'success' : 'warning'"></p-tag></td>
              <td><code>{{ item.documento }}</code></td>
              <td>{{ item.codigoProduto }}</td>
              <td class="hist-desc">{{ item.descricao }}</td>
              <td>{{ item.aplicacao }}</td>
              <td style="text-align:right">{{ item.quantidade }}</td>
              <td style="text-align:right" [class.negativo]="item.valor < 0">
                {{ item.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td colspan="8" style="text-align:right;font-weight:700;font-size:0.85rem">Total no período:</td>
              <td style="text-align:right;font-weight:900;color:var(--chb-teal,#00897B)">
                {{ totalPeriodo() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <ng-template pTemplate="footer">
        <button pButton type="button" label="Fechar" class="p-button-text" (click)="visible.set(false)"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .hist-filtros { display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap; padding: 0.85rem 1rem; border-bottom: 1px solid var(--chb-border, #dee2e6); background: var(--chb-surface-muted, #f8f9fa); }
    .hist-skeleton { padding: 1rem; display: grid; gap: 0.4rem; }
    .hist-desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .negativo { color: #dc2626; }
    code { font-size: 0.82rem; background: var(--chb-surface-muted, #f8f9fa); padding: 0.1rem 0.3rem; border-radius: 0.2rem; }
    :host ::ng-deep .hist-table .p-datatable-wrapper { border-radius: 0; }
  `]
})
export class HistoricoVendasDialogComponent implements OnChanges {
  private readonly http = inject(HttpClient);

  readonly visible = model(false);
  @Input() pvId = '';
  @Input() clienteId = '';

  filtroDe: Date | null = null;
  filtroAte: Date | null = null;
  filtroProduto = '';

  readonly loading = signal(false);
  readonly historico = signal<HistoricoItem[]>([]);
  readonly totalPeriodo = computed(() => this.historico().reduce((acc, i) => acc + i.valor, 0));

  ngOnChanges(): void {
    if (this.visible()) this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    const url = this.pvId
      ? `/api/v1/vendas/pre-vendas/${this.pvId}/historico-cliente?diasAtras=180`
      : null;

    const req = url
      ? this.http.get<HistoricoItem[]>(url)
      : of(DEMO_HISTORICO);

    req.pipe(catchError(() => of(DEMO_HISTORICO))).subscribe((data) => {
      let filtrado = data;
      if (this.filtroProduto) {
        const q = this.filtroProduto.toLowerCase();
        filtrado = data.filter((i) => i.descricao.toLowerCase().includes(q) || i.codigoProduto.includes(q));
      }
      this.historico.set(filtrado);
      this.loading.set(false);
    });
  }

  filtrar(): void { this.carregar(); }
}

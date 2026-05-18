import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  type OnDestroy,
  type OnInit,
  Output,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

export interface ProdutoItem {
  id: string;
  codigo: string;
  descricao: string;
  fabricante: string;
  precoVenda: number;
  qtdDisponivel: number;
  secao?: string;
  aplicacao?: string;
}

const DEMO_PRODUTOS: ProdutoItem[] = [
  { id: 'oleo-id', codigo: 'OLEO-10W40', descricao: 'Oleo Motor 10W40 Semissintetico', fabricante: 'Mobil', precoVenda: 41.33, qtdDisponivel: 42, secao: 'Lubrificantes' },
  { id: 'filtro-id', codigo: 'FILTRO-OLEO', descricao: 'Filtro de Oleo Moto 150cc', fabricante: 'Tecfil', precoVenda: 19.20, qtdDisponivel: 7, secao: 'Filtros' },
  { id: 'pastilha-id', codigo: '101.004-9', descricao: 'Pastilha freio dianteira BROS 150', fabricante: 'Cobreq', precoVenda: 89.90, qtdDisponivel: 18, secao: 'Freios' },
  { id: 'kit-id', codigo: '201.118-2', descricao: 'Kit relacao 428H CG 160', fabricante: 'Riffel', precoVenda: 189.50, qtdDisponivel: 7, secao: 'Transmissao' },
  { id: 'bateria-id', codigo: '301.090-1', descricao: 'Bateria 5Ah selada Biz/Pop', fabricante: 'Heliar', precoVenda: 174.00, qtdDisponivel: 3, secao: 'Eletrica' },
  { id: 'vela-id', codigo: 'VELA-NGK-BR8', descricao: 'Vela ignicao NGK BR8ES', fabricante: 'NGK', precoVenda: 12.50, qtdDisponivel: 35, secao: 'Eletrica' }
];

@Component({
  selector: 'chb-produto-busca-dialog',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DecimalPipe, DialogModule, FormsModule, InputTextModule, TableModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '80vw', 'max-height': '80vh' }"
      [contentStyle]="{ padding: '0' }"
      header="Buscar Produto (F1)"
      (onHide)="onDialogHide()">

      <div class="busca-container">
        <div class="busca-header">
          <span class="p-input-icon-left busca-input-wrap">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              #buscaInput
              pInputText
              type="search"
              placeholder="Codigo, descricao ou fabricante..."
              [(ngModel)]="queryModel"
              (ngModelChange)="onQueryChange($event)"
              (keydown)="onInputKeydown($event)"
              autocomplete="off"
              class="busca-input" />
          </span>
          <span class="busca-hint">Enter ou duplo clique para selecionar &nbsp;|&nbsp; Esc para fechar</span>
        </div>

        <p-table
          [value]="produtos()"
          [loading]="loading()"
          selectionMode="single"
          [(selection)]="selectedProduto"
          [scrollable]="true"
          scrollHeight="50vh"
          styleClass="chb-data-table busca-table"
          (onRowSelect)="confirmarSelecao($event.data)"
          (onRowDblclick)="confirmarSelecao($any($event).data)">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:120px">Codigo</th>
              <th>Descricao</th>
              <th>Fabricante</th>
              <th style="width:110px;text-align:right">Preco</th>
              <th style="width:80px;text-align:right">Disp.</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-produto>
            <tr
              [pSelectableRow]="produto"
              [pSelectableRowDblClick]="produto"
              [class.row-sem-estoque]="produto.qtdDisponivel <= 0">
              <td>{{ produto.codigo }}</td>
              <td>{{ produto.descricao }}</td>
              <td>{{ produto.fabricante }}</td>
              <td style="text-align:right">{{ produto.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align:right" [class.qtd-critica]="produto.qtdDisponivel <= 3">{{ produto.qtdDisponivel | number:'1.0-0':'pt-BR' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                @if (loading()) {
                  Buscando...
                } @else {
                  Nenhum produto encontrado. Digite pelo menos 2 caracteres.
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="fechar()"></button>
        <button pButton type="button" icon="pi pi-check" label="Selecionar" [disabled]="!selectedProduto" (click)="confirmarSelecao(selectedProduto!)"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .busca-container {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .busca-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid var(--chb-border);
      flex-wrap: wrap;
    }

    .busca-input-wrap {
      flex: 1;
      min-width: 250px;
    }

    .busca-input {
      width: 100%;
    }

    .busca-hint {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
    }

    .busca-table {
      font-size: 0.875rem;
    }

    .row-sem-estoque {
      opacity: 0.6;
    }

    .qtd-critica {
      color: #dc2626;
      font-weight: 700;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: var(--chb-yellow-50);
      cursor: pointer;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProdutoBuscaDialogComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private readonly query$ = new Subject<string>();

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() produtoSelecionado = new EventEmitter<ProdutoItem>();

  readonly produtos = signal<ProdutoItem[]>([]);
  readonly loading = signal(false);

  queryModel = '';
  selectedProduto: ProdutoItem | null = null;

  ngOnInit(): void {
    this.query$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((q) => this.buscarProdutos(q));

    this.buscarProdutos('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fechar();
    }
    if (event.key === 'Enter' && this.selectedProduto) {
      event.preventDefault();
      this.confirmarSelecao(this.selectedProduto);
    }
  }

  onQueryChange(value: string): void {
    this.query$.next(value);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.selectedProduto) {
      event.preventDefault();
      this.confirmarSelecao(this.selectedProduto);
    }
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
    this.queryModel = '';
    this.selectedProduto = null;
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.queryModel = '';
    this.selectedProduto = null;
  }

  confirmarSelecao(produto: ProdutoItem): void {
    if (!produto) return;
    this.produtoSelecionado.emit(produto);
    this.fechar();
  }

  private buscarProdutos(q: string): void {
    this.loading.set(true);
    const url = q.length >= 2 ? `/api/v1/cadastros/produtos?q=${encodeURIComponent(q)}` : '/api/v1/cadastros/produtos';

    this.http.get<unknown>(url).pipe(
      catchError(() => of(DEMO_PRODUTOS))
    ).subscribe((response) => {
      const list = normalizeProdutos(response);
      this.produtos.set(list.length ? list : (q ? DEMO_PRODUTOS.filter(p =>
        p.codigo.toLowerCase().includes(q.toLowerCase()) ||
        p.descricao.toLowerCase().includes(q.toLowerCase()) ||
        p.fabricante.toLowerCase().includes(q.toLowerCase())
      ) : DEMO_PRODUTOS));
      this.loading.set(false);
    });
  }
}

function normalizeProdutos(response: unknown): ProdutoItem[] {
  const arr = Array.isArray(response) ? response
    : (typeof response === 'object' && response !== null)
      ? ((response as Record<string, unknown>)['content'] as unknown[] ||
         (response as Record<string, unknown>)['items'] as unknown[] ||
         (response as Record<string, unknown>)['data'] as unknown[] || [])
      : [];

  return (arr as Record<string, unknown>[]).map((r) => ({
    id: String(r['id'] ?? r['codigo'] ?? ''),
    codigo: String(r['codigo'] ?? ''),
    descricao: String(r['descricao'] ?? r['nome'] ?? ''),
    fabricante: String(r['fabricante'] ?? ''),
    precoVenda: Number(r['precoVenda'] ?? r['preco'] ?? 0),
    qtdDisponivel: Number(r['qtdDisponivel'] ?? r['saldo'] ?? r['estoque'] ?? 0),
    secao: String(r['secao'] ?? ''),
    aplicacao: String(r['aplicacao'] ?? '')
  }));
}

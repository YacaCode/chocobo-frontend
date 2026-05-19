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
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of, finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

export interface Produto {
  id: string;
  codigo: string;
  descricao: string;
  fabricante: string;
  secao: string;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo?: number;
  status?: string;
  emPromocao?: boolean;
  refFabricante?: string;
  ncm?: string;
}

const DEMO_PRODUTOS: Produto[] = [
  { id: 'p1', codigo: 'OLEO-10W40', descricao: 'Oleo Motor 10W40 Semissintetico', fabricante: 'Motul', secao: 'Lubrificantes', precoVenda: 41.33, estoqueAtual: 42, estoqueMinimo: 10, emPromocao: false, status: 'Ativo' },
  { id: 'p2', codigo: 'FILTRO-OLEO', descricao: 'Filtro Oleo Moto 150cc', fabricante: 'JN Parts', secao: 'Filtros', precoVenda: 19.20, estoqueAtual: 7, estoqueMinimo: 10, emPromocao: true, status: 'Ativo' },
  { id: 'p3', codigo: '101.425-2', descricao: 'Correia Transmissao TITAN 150', fabricante: 'RK', secao: 'Transmissao', precoVenda: 89.90, estoqueAtual: 15, estoqueMinimo: 5, emPromocao: false, status: 'Ativo' },
  { id: 'p4', codigo: 'PASTILHA-DIANTEIRA', descricao: 'Pastilha Freio Dianteiro CG150', fabricante: 'Ferodo', secao: 'Freios', precoVenda: 45.00, estoqueAtual: 22, estoqueMinimo: 8, emPromocao: false, status: 'Ativo' },
  { id: 'p5', codigo: 'VELA-NGK', descricao: 'Vela Ignicao NGK CR7HSA', fabricante: 'NGK', secao: 'Ignicao', precoVenda: 12.50, estoqueAtual: 48, estoqueMinimo: 12, emPromocao: false, status: 'Ativo' },
  { id: 'p6', codigo: 'PNEU-TRASEIRO-14', descricao: 'Pneu Traseiro 90/90-14 Titan', fabricante: 'Pirelli', secao: 'Pneus', precoVenda: 189.00, estoqueAtual: 8, estoqueMinimo: 10, emPromocao: false, status: 'Ativo' },
  { id: 'p7', codigo: 'AMORTECEDOR-TRAS', descricao: 'Amortecedor Traseiro Biz 125', fabricante: 'Cofap', secao: 'Suspensao', precoVenda: 145.00, estoqueAtual: 4, estoqueMinimo: 5, emPromocao: true, status: 'Ativo' },
  { id: 'p8', codigo: 'CABO-ACELERADOR', descricao: 'Cabo Acelerador CG 160', fabricante: 'Cofap', secao: 'Cabos', precoVenda: 28.50, estoqueAtual: 12, estoqueMinimo: 4, emPromocao: false, status: 'Ativo' },
  { id: 'p9', codigo: 'KIT-RELACAO-428', descricao: 'Kit Relacao 428H CG160', fabricante: 'Riffel', secao: 'Transmissao', precoVenda: 189.50, estoqueAtual: 7, estoqueMinimo: 5, emPromocao: false, status: 'Ativo' },
  { id: 'p10', codigo: 'BATERIA-5AH', descricao: 'Bateria 5Ah Selada Motos', fabricante: 'Heliar', secao: 'Eletrica', precoVenda: 174.00, estoqueAtual: 3, estoqueMinimo: 5, emPromocao: false, status: 'Ativo' },
  { id: 'p11', codigo: 'ROLAMENTO-DIANT', descricao: 'Rolamento Roda Dianteira CG', fabricante: 'NSK', secao: 'Rolamentos', precoVenda: 35.00, estoqueAtual: 18, estoqueMinimo: 6, emPromocao: false, status: 'Inativo' },
  { id: 'p12', codigo: 'ESPELHO-RETRO', descricao: 'Espelho Retrovisor Universal Moto', fabricante: 'Multimoto', secao: 'Acessorios', precoVenda: 22.00, estoqueAtual: 25, estoqueMinimo: 8, emPromocao: true, status: 'Ativo' }
];

@Component({
  selector: 'chb-produtos-list',
  standalone: true,
  imports: [ButtonModule, CheckboxModule, CurrencyPipe, FormsModule, InputTextModule, TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon" aria-hidden="true"><i class="pi pi-box"></i></span>
          <div>
            <p class="page-area">Cadastros</p>
            <h2 class="page-title">Produtos e Catalogo</h2>
          </div>
        </div>
        <div class="page-actions">
          <button pButton type="button" icon="pi pi-upload" label="Importar CSV" class="p-button-outlined" (click)="toast('Importacao em desenvolvimento')"></button>
          <button pButton type="button" icon="pi pi-box" label="Novo Produto" (click)="novoProduto()"></button>
        </div>
      </header>

      <!-- KPIs -->
      <div class="kpis">
        <article class="kpi kpi--info">
          <i class="pi pi-box" aria-hidden="true"></i>
          <div>
            <span>Total Produtos</span>
            <strong>{{ produtos().length }}</strong>
            <small>no catalogo</small>
          </div>
        </article>
        <article class="kpi kpi--success">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <div>
            <span>Ativos</span>
            <strong>{{ totalAtivos() }}</strong>
            <small>disponiveis</small>
          </div>
        </article>
        <article class="kpi kpi--primary">
          <i class="pi pi-tags" aria-hidden="true"></i>
          <div>
            <span>Em Promocao</span>
            <strong>{{ totalEmPromocao() }}</strong>
            <small>com desconto</small>
          </div>
        </article>
        <article class="kpi kpi--warning">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <span>Abaixo Minimo</span>
            <strong>{{ totalAbaixoMinimo() }}</strong>
            <small>necessitam reposicao</small>
          </div>
        </article>
      </div>

      <!-- Filtros horizontais -->
      <div class="filtros-bar">
        <label class="filter-field">
          <span>Codigo</span>
          <input pInputText type="search" [(ngModel)]="filtroCodigo" (ngModelChange)="aplicarFiltros()" placeholder="Codigo..." />
        </label>
        <label class="filter-field filter-field--wide">
          <span>Descricao</span>
          <input pInputText type="search" [(ngModel)]="filtroDescricao" (ngModelChange)="onDescricaoChange($event)" placeholder="Descricao do produto..." />
        </label>
        <label class="filter-field">
          <span>Fabricante</span>
          <input pInputText type="search" [(ngModel)]="filtroFabricante" (ngModelChange)="aplicarFiltros()" placeholder="Fabricante..." />
        </label>
        <label class="filter-field">
          <span>Secao</span>
          <input pInputText type="search" [(ngModel)]="filtroSecao" (ngModelChange)="aplicarFiltros()" placeholder="Secao..." />
        </label>
        <label class="filter-field">
          <span>Ref. Fabricante</span>
          <input pInputText type="search" [(ngModel)]="filtroRef" (ngModelChange)="aplicarFiltros()" placeholder="Referencia..." />
        </label>
        <label class="filter-field">
          <span>NCM</span>
          <input pInputText type="search" [(ngModel)]="filtroNcm" (ngModelChange)="aplicarFiltros()" placeholder="NCM..." />
        </label>
        <div class="filter-checks">
          <label class="check-label">
            <p-checkbox [(ngModel)]="soAtivos" [binary]="true" inputId="soAtivos" (ngModelChange)="aplicarFiltros()"></p-checkbox>
            <label for="soAtivos">Somente ativos</label>
          </label>
          <label class="check-label">
            <p-checkbox [(ngModel)]="exibirFotos" [binary]="true" inputId="exibirFotos" (ngModelChange)="aplicarFiltros()"></p-checkbox>
            <label for="exibirFotos">Exibir fotos</label>
          </label>
        </div>
        <button pButton type="button" icon="pi pi-filter-slash" label="Limpar" class="p-button-outlined p-button-sm" (click)="limparFiltros()"></button>
      </div>

      <!-- Tabela -->
      <div class="table-area">
        <div class="table-toolbar">
          <span class="registro-count">{{ produtosFiltrados().length }} produto(s) encontrado(s)</span>
        </div>

        <p-table
          [value]="produtosFiltrados()"
          [loading]="loading()"
          [rows]="20"
          [paginator]="produtosFiltrados().length > 20"
          [rowsPerPageOptions]="[10, 20, 50]"
          selectionMode="single"
          styleClass="chb-data-table"
          responsiveLayout="scroll"
          (onRowSelect)="verProduto($event.data)">
          <ng-template pTemplate="header">
            <tr>
              @if (exibirFotos) {
                <th style="width:60px">Foto</th>
              }
              <th style="width:150px">Codigo</th>
              <th>Descricao</th>
              <th style="width:130px">Fabricante</th>
              <th style="width:120px">Secao</th>
              <th style="width:120px">Preco Venda</th>
              <th style="width:90px">Estoque</th>
              <th style="width:90px">Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-produto>
            <tr [pSelectableRow]="produto" class="row-clickable"
                [class.row-promocao]="produto.emPromocao"
                (dblclick)="verProduto(produto)">
              @if (exibirFotos) {
                <td>
                  <div class="foto-placeholder">
                    <i class="pi pi-image" aria-hidden="true"></i>
                  </div>
                </td>
              }
              <td>{{ produto.codigo }}</td>
              <td>
                {{ produto.descricao }}
                @if (produto.emPromocao) {
                  <p-tag value="Promo" severity="info" styleClass="ml-1"></p-tag>
                }
              </td>
              <td>{{ produto.fabricante }}</td>
              <td>{{ produto.secao }}</td>
              <td class="text-right">{{ produto.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td class="text-center" [class.estoque-critico]="produto.estoqueAtual < (produto.estoqueMinimo ?? 0)">
                {{ produto.estoqueAtual }}
              </td>
              <td>
                <p-tag [value]="produto.status ?? 'Ativo'" [severity]="produto.status === 'Ativo' ? 'success' : 'secondary'"></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="exibirFotos ? 8 : 7" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                @if (loading()) {
                  Carregando produtos...
                } @else {
                  Nenhum produto encontrado com os filtros aplicados.
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      @if (toastMsg()) {
        <div class="toast-notice">{{ toastMsg() }}</div>
      }
    </section>
  `,
  styles: [`
    .page { display: grid; gap: .85rem; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .page-heading { display: flex; align-items: center; gap: .75rem; min-width: 0; }
    .page-icon {
      display: grid; width: 2.25rem; height: 2.25rem; flex: 0 0 auto; place-items: center;
      border-radius: .45rem; background: var(--chb-teal-50); color: var(--chb-teal);
    }
    .page-area { margin: 0; color: var(--chb-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .page-title { margin: 0; color: var(--chb-text); font-size: 1.35rem; line-height: 1.15; }
    .page-actions { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: flex-end; }

    .kpis {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem;
    }
    .kpi {
      display: flex; align-items: center; gap: .7rem; padding: .8rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; box-shadow: var(--chb-shadow-soft);
    }
    .kpi i {
      display: grid; width: 2.25rem; height: 2.25rem; flex: 0 0 auto;
      place-items: center; border-radius: .5rem; font-size: 1.15rem;
    }
    .kpi--info i { background: var(--chb-navy-50); color: var(--chb-navy); }
    .kpi--success i { background: #dcfce7; color: #166534; }
    .kpi--warning i { background: var(--chb-yellow-50); color: var(--chb-yellow-700); }
    .kpi--primary i { background: #ede9fe; color: #5b21b6; }
    .kpi span { display: block; color: var(--chb-text-muted); font-size: .78rem; font-weight: 800; }
    .kpi strong { display: block; margin: .15rem 0; color: var(--chb-text); font-size: 1.12rem; }
    .kpi small { display: block; color: var(--chb-text-muted); font-size: .78rem; }

    .filtros-bar {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); align-items: end; gap: .7rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: .85rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .filter-field {
      display: grid; gap: .3rem; font-size: .82rem; font-weight: 700; color: var(--chb-text);
      min-width: 0;
    }
    .filter-field input { width: 100%; }
    .filter-field--wide { grid-column: span 2; }
    .filter-checks { display: flex; flex-direction: column; gap: .45rem; }
    .check-label { display: flex; align-items: center; gap: .5rem; font-size: .85rem; font-weight: 500; cursor: pointer; }

    .table-area {
      display: grid; gap: .75rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: .85rem; box-shadow: var(--chb-shadow-soft);
      min-width: 0;
    }
    .table-toolbar { display: flex; align-items: center; justify-content: space-between; }
    .registro-count { color: var(--chb-text-muted); font-size: .85rem; }
    .row-clickable { cursor: pointer; }
    .row-promocao td { color: #1d4ed8; }
    .row-promocao:hover td { background: #eff6ff; }
    .estoque-critico { color: #dc2626; font-weight: 700; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .foto-placeholder {
      width: 36px; height: 36px; display: grid; place-items: center;
      background: var(--chb-surface-muted); border-radius: .25rem;
      color: var(--chb-text-muted); font-size: .85rem;
    }

    .ml-1 { margin-left: .25rem; }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .kpis { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
      .page-heading { width: 100%; }
      .filter-field--wide { grid-column: span 1; }
    }
  `]
})
export class ProdutosListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly descricao$ = new Subject<string>();

  readonly produtos = signal<Produto[]>([]);
  readonly produtosFiltrados = signal<Produto[]>([]);
  readonly loading = signal(false);
  readonly toastMsg = signal('');

  readonly totalAtivos = computed(() => this.produtos().filter(p => p.status !== 'Inativo').length);
  readonly totalEmPromocao = computed(() => this.produtos().filter(p => p.emPromocao).length);
  readonly totalAbaixoMinimo = computed(() => this.produtos().filter(p => p.estoqueAtual < (p.estoqueMinimo ?? 0)).length);

  filtroCodigo = '';
  filtroDescricao = '';
  filtroFabricante = '';
  filtroSecao = '';
  filtroRef = '';
  filtroNcm = '';
  soAtivos = true;
  exibirFotos = false;

  ngOnInit(): void {
    this.descricao$.pipe(
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
      this.novoProduto();
    }
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/cadastros/produtos').pipe(
      catchError(() => of(DEMO_PRODUTOS)),
      finalize(() => this.loading.set(false))
    ).subscribe(resp => {
      const list = this.normalizar(resp);
      this.produtos.set(list.length ? list : DEMO_PRODUTOS);
      this.aplicarFiltros();
    });
  }

  onDescricaoChange(value: string): void {
    this.descricao$.next(value);
  }

  aplicarFiltros(): void {
    let lista = this.produtos();

    if (this.soAtivos) lista = lista.filter(p => p.status !== 'Inativo');

    if (this.filtroCodigo) {
      const norm = this.normalizarCodigo(this.filtroCodigo);
      lista = lista.filter(p => this.normalizarCodigo(p.codigo).includes(norm));
    }
    if (this.filtroDescricao) {
      const fd = this.filtroDescricao.toLowerCase();
      lista = lista.filter(p => p.descricao.toLowerCase().includes(fd));
    }
    if (this.filtroFabricante) {
      const ff = this.filtroFabricante.toLowerCase();
      lista = lista.filter(p => p.fabricante.toLowerCase().includes(ff));
    }
    if (this.filtroSecao) {
      const fs = this.filtroSecao.toLowerCase();
      lista = lista.filter(p => p.secao.toLowerCase().includes(fs));
    }
    if (this.filtroRef) {
      const fr = this.filtroRef.toLowerCase();
      lista = lista.filter(p => (p.refFabricante ?? '').toLowerCase().includes(fr));
    }
    if (this.filtroNcm) {
      lista = lista.filter(p => (p.ncm ?? '').includes(this.filtroNcm));
    }

    this.produtosFiltrados.set(lista);
  }

  limparFiltros(): void {
    this.filtroCodigo = '';
    this.filtroDescricao = '';
    this.filtroFabricante = '';
    this.filtroSecao = '';
    this.filtroRef = '';
    this.filtroNcm = '';
    this.soAtivos = true;
    this.exibirFotos = false;
    this.carregar();
  }

  novoProduto(): void {
    void this.router.navigate(['/cadastros/produtos/novo']);
  }

  verProduto(produto: Produto): void {
    void this.router.navigate(['/cadastros/produtos', produto.id]);
  }

  toast(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 3000);
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.replace(/[.\-/]/g, '').toLowerCase();
  }

  private normalizar(resp: unknown): Produto[] {
    const arr = Array.isArray(resp) ? resp
      : (typeof resp === 'object' && resp !== null)
        ? ((resp as Record<string, unknown>)['content'] as unknown[] ??
           (resp as Record<string, unknown>)['items'] as unknown[] ??
           (resp as Record<string, unknown>)['data'] as unknown[] ?? [])
        : [];
    return (arr as Record<string, unknown>[]).map(r => ({
      id: String(r['id'] ?? r['codigo'] ?? ''),
      codigo: String(r['codigo'] ?? ''),
      descricao: String(r['descricao'] ?? r['nome'] ?? ''),
      fabricante: String(r['fabricante'] ?? r['marca'] ?? ''),
      secao: String(r['secao'] ?? r['categoria'] ?? ''),
      precoVenda: Number(r['precoVenda'] ?? r['preco'] ?? 0),
      // estoqueAtual not available from produto endpoint — stock qty comes from EstoqueController
      estoqueAtual: 0,
      estoqueMinimo: Number(r['estoqueMinimo'] ?? r['minimo'] ?? 0),
      // ativo is boolean in backend; convert to status string
      status: r['ativo'] === false ? 'Inativo' : 'Ativo',
      emPromocao: Boolean(r['emPromocao'] ?? false),
      refFabricante: r['referencia'] ? String(r['referencia']) : undefined,
      ncm: r['ncm'] ? String(r['ncm']) : undefined
    }));
  }
}

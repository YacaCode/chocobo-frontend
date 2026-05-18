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
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of, finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

export interface Cliente {
  id: string;
  codigo: number;
  razaoSocial: string;
  documento: string;
  tipo: 'PF' | 'PJ';
  status: 'Ativo' | 'Inativo' | 'Inadimplente' | 'VIP';
  cidade: string;
  uf: string;
  telefone?: string;
}

const DEMO_CLIENTES: Cliente[] = [
  { id: '1', codigo: 1, razaoSocial: 'CONSUMIDOR', documento: '000.000.000-00', tipo: 'PF', status: 'Ativo', cidade: 'Fortaleza', uf: 'CE' },
  { id: '2', codigo: 2, razaoSocial: 'Joao da Silva', documento: '111.222.333-44', tipo: 'PF', status: 'Ativo', cidade: 'Fortaleza', uf: 'CE', telefone: '(85) 99999-0000' },
  { id: '3', codigo: 3, razaoSocial: 'Auto Pecas Lima LTDA', documento: '12.345.678/0001-90', tipo: 'PJ', status: 'VIP', cidade: 'Fortaleza', uf: 'CE' },
  { id: '4', codigo: 4, razaoSocial: 'Maria Santos', documento: '222.333.444-55', tipo: 'PF', status: 'Inadimplente', cidade: 'Caucaia', uf: 'CE' },
  { id: '5', codigo: 5, razaoSocial: 'Moto Rapido Entregas LTDA', documento: '41.222.333/0001-10', tipo: 'PJ', status: 'Ativo', cidade: 'Fortaleza', uf: 'CE', telefone: '(85) 3222-7788' },
  { id: '6', codigo: 6, razaoSocial: 'Carlos Oficina ME', documento: '31.444.555/0001-99', tipo: 'PJ', status: 'Inadimplente', cidade: 'Maranguape', uf: 'CE', telefone: '(85) 99711-3311' },
  { id: '7', codigo: 7, razaoSocial: 'Rodrigo Pereira', documento: '333.444.555-66', tipo: 'PF', status: 'Ativo', cidade: 'Fortaleza', uf: 'CE', telefone: '(85) 98200-4400' },
  { id: '8', codigo: 8, razaoSocial: 'Distribuidora Pecas CE', documento: '55.666.777/0001-88', tipo: 'PJ', status: 'VIP', cidade: 'Fortaleza', uf: 'CE', telefone: '(85) 3344-5566' },
  { id: '9', codigo: 9, razaoSocial: 'Ana Lucia Motos', documento: '444.555.666-77', tipo: 'PF', status: 'Ativo', cidade: 'Caucaia', uf: 'CE' },
  { id: '10', codigo: 10, razaoSocial: 'Pecas e Servicos Unidas', documento: '66.777.888/0001-11', tipo: 'PJ', status: 'Inativo', cidade: 'Maracanau', uf: 'CE' }
];

@Component({
  selector: 'chb-clientes-list',
  standalone: true,
  imports: [ButtonModule, DropdownModule, FormsModule, InputTextModule, RouterLink, TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="page-area">Cadastros</p>
          <h2 class="page-title">Clientes e Fornecedores</h2>
        </div>
        <div class="page-actions">
          <button pButton type="button" icon="pi pi-upload" label="Importar" class="p-button-outlined" (click)="toast('Importacao em desenvolvimento')"></button>
          <button pButton type="button" icon="pi pi-user-plus" label="Novo Cliente" (click)="novoCliente()"></button>
        </div>
      </header>

      <div class="kpis">
        <article class="kpi kpi--info">
          <i class="pi pi-users" aria-hidden="true"></i>
          <div>
            <span>Total</span>
            <strong>{{ clientes().length }}</strong>
            <small>cadastrados</small>
          </div>
        </article>
        <article class="kpi kpi--success">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <div>
            <span>Ativos</span>
            <strong>{{ totalAtivos() }}</strong>
            <small>em dia</small>
          </div>
        </article>
        <article class="kpi kpi--warning">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <div>
            <span>Inadimplentes</span>
            <strong>{{ totalInadimplentes() }}</strong>
            <small>com pendencias</small>
          </div>
        </article>
        <article class="kpi kpi--primary">
          <i class="pi pi-star" aria-hidden="true"></i>
          <div>
            <span>VIP</span>
            <strong>{{ totalVip() }}</strong>
            <small>clientes premium</small>
          </div>
        </article>
      </div>

      <div class="content">
        <aside class="filtros">
          <h3 class="filtros-title">Filtros</h3>

          <label class="field">
            <span>Busca rapida</span>
            <span class="p-input-icon-left">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input pInputText type="search" placeholder="Nome, documento..." [(ngModel)]="busca" (ngModelChange)="onBuscaChange($event)" class="w-full" />
            </span>
          </label>

          <label class="field">
            <span>Tipo</span>
            <p-dropdown
              [options]="tipoOptions"
              [(ngModel)]="filtroTipo"
              (ngModelChange)="aplicarFiltros()"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              [showClear]="true"
              class="w-full">
            </p-dropdown>
          </label>

          <label class="field">
            <span>Status</span>
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="filtroStatus"
              (ngModelChange)="aplicarFiltros()"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              [showClear]="true"
              class="w-full">
            </p-dropdown>
          </label>

          <label class="field">
            <span>Cidade</span>
            <input pInputText type="text" placeholder="Cidade..." [(ngModel)]="filtroCidade" (ngModelChange)="aplicarFiltros()" class="w-full" />
          </label>

          <button pButton type="button" label="Limpar filtros" icon="pi pi-filter-slash" class="p-button-outlined p-button-sm w-full" (click)="limparFiltros()"></button>
        </aside>

        <div class="table-area">
          <div class="table-toolbar">
            <span class="registro-count">{{ clientesFiltrados().length }} registro(s) encontrado(s)</span>
          </div>

          <p-table
            [value]="clientesFiltrados()"
            [loading]="loading()"
            [rows]="20"
            [paginator]="clientesFiltrados().length > 20"
            [rowsPerPageOptions]="[10, 20, 50]"
            selectionMode="single"
            styleClass="chb-data-table"
            responsiveLayout="scroll"
            (onRowSelect)="verCliente($event.data)">
            <ng-template pTemplate="header">
              <tr>
                <th style="width:80px">Codigo</th>
                <th>Razao Social / Nome</th>
                <th style="width:160px">Documento</th>
                <th style="width:140px">Telefone</th>
                <th style="width:160px">Cidade/UF</th>
                <th style="width:110px">Status</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-cliente>
              <tr [pSelectableRow]="cliente" class="row-clickable" (dblclick)="verCliente(cliente)">
                <td>{{ cliente.codigo }}</td>
                <td>{{ cliente.razaoSocial }}</td>
                <td>{{ cliente.documento }}</td>
                <td>{{ cliente.telefone || '-' }}</td>
                <td>{{ cliente.cidade }}/{{ cliente.uf }}</td>
                <td>
                  <p-tag [value]="cliente.status" [severity]="statusSeverity(cliente.status)"></p-tag>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                  @if (loading()) {
                    Carregando clientes...
                  } @else {
                    Nenhum cliente encontrado com os filtros aplicados.
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      @if (toastMsg()) {
        <div class="toast-notice">{{ toastMsg() }}</div>
      }
    </section>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1.25rem;
      box-shadow: 0 10px 28px rgba(15,23,42,.06);
    }
    .page-area { margin: 0; color: var(--chb-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .page-title { margin: 0; color: var(--chb-text); font-size: 1.65rem; line-height: 1.15; }
    .page-actions { display: flex; gap: .75rem; flex-wrap: wrap; }

    .kpis {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem;
    }
    .kpi {
      display: flex; align-items: center; gap: .9rem; padding: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; box-shadow: 0 10px 28px rgba(15,23,42,.06);
    }
    .kpi i {
      display: grid; width: 2.6rem; height: 2.6rem; flex: 0 0 auto;
      place-items: center; border-radius: .5rem; font-size: 1.15rem;
    }
    .kpi--info i { background: var(--chb-navy-50); color: var(--chb-navy); }
    .kpi--success i { background: #dcfce7; color: #166534; }
    .kpi--warning i { background: var(--chb-yellow-50); color: var(--chb-yellow-700); }
    .kpi--primary i { background: #ede9fe; color: #5b21b6; }
    .kpi span { display: block; color: var(--chb-text-muted); font-size: .78rem; font-weight: 800; }
    .kpi strong { display: block; margin: .15rem 0; color: var(--chb-text); font-size: 1.35rem; }
    .kpi small { display: block; color: var(--chb-text-muted); font-size: .78rem; }

    .content {
      display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 1rem; align-items: start;
    }
    .filtros {
      display: grid; gap: .75rem; padding: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; box-shadow: 0 10px 28px rgba(15,23,42,.06);
    }
    .filtros-title { margin: 0; color: var(--chb-text); font-size: 1rem; font-weight: 700; }
    .field { display: grid; gap: .35rem; color: var(--chb-text); font-size: .86rem; font-weight: 700; }
    .w-full { width: 100%; }

    .table-area {
      display: grid; gap: .75rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1rem; box-shadow: 0 10px 28px rgba(15,23,42,.06);
    }
    .table-toolbar { display: flex; align-items: center; justify-content: space-between; }
    .registro-count { color: var(--chb-text-muted); font-size: .85rem; }
    .row-clickable { cursor: pointer; }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: repeat(2, 1fr); }
      .content { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .kpis { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ClientesListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly busca$ = new Subject<string>();

  readonly clientes = signal<Cliente[]>([]);
  readonly clientesFiltrados = signal<Cliente[]>([]);
  readonly loading = signal(false);
  readonly toastMsg = signal('');

  readonly totalAtivos = computed(() => this.clientes().filter(c => c.status === 'Ativo').length);
  readonly totalInadimplentes = computed(() => this.clientes().filter(c => c.status === 'Inadimplente').length);
  readonly totalVip = computed(() => this.clientes().filter(c => c.status === 'VIP').length);

  busca = '';
  filtroTipo: string | null = null;
  filtroStatus: string | null = null;
  filtroCidade = '';

  readonly tipoOptions = [
    { label: 'Pessoa Fisica (PF)', value: 'PF' },
    { label: 'Pessoa Juridica (PJ)', value: 'PJ' }
  ];

  readonly statusOptions = [
    { label: 'Ativo', value: 'Ativo' },
    { label: 'Inativo', value: 'Inativo' },
    { label: 'Inadimplente', value: 'Inadimplente' },
    { label: 'VIP', value: 'VIP' }
  ];

  ngOnInit(): void {
    this.busca$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((q) => this.carregarComQuery(q));

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
      this.novoCliente();
    }
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/cadastros/clientes').pipe(
      catchError(() => of(DEMO_CLIENTES)),
      finalize(() => this.loading.set(false))
    ).subscribe((resp) => {
      const list = this.normalizar(resp);
      this.clientes.set(list.length ? list : DEMO_CLIENTES);
      this.aplicarFiltros();
    });
  }

  carregarComQuery(q: string): void {
    if (!q) { this.carregar(); return; }
    this.loading.set(true);
    this.http.get<unknown>(`/api/v1/cadastros/clientes?q=${encodeURIComponent(q)}`).pipe(
      catchError(() => of([])),
      finalize(() => this.loading.set(false))
    ).subscribe((resp) => {
      const list = this.normalizar(resp);
      if (list.length) {
        this.clientes.set(list);
      } else {
        const ql = q.toLowerCase();
        this.clientes.set(DEMO_CLIENTES.filter(c =>
          c.razaoSocial.toLowerCase().includes(ql) ||
          c.documento.includes(q) ||
          String(c.codigo).includes(q)
        ));
      }
      this.aplicarFiltros();
    });
  }

  onBuscaChange(value: string): void {
    this.busca$.next(value);
  }

  aplicarFiltros(): void {
    let lista = this.clientes();
    if (this.filtroTipo) lista = lista.filter(c => c.tipo === this.filtroTipo);
    if (this.filtroStatus) lista = lista.filter(c => c.status === this.filtroStatus);
    if (this.filtroCidade) {
      const fc = this.filtroCidade.toLowerCase();
      lista = lista.filter(c => c.cidade.toLowerCase().includes(fc));
    }
    this.clientesFiltrados.set(lista);
  }

  limparFiltros(): void {
    this.busca = '';
    this.filtroTipo = null;
    this.filtroStatus = null;
    this.filtroCidade = '';
    this.carregar();
  }

  novoCliente(): void {
    void this.router.navigate(['/cadastros/clientes/novo']);
  }

  verCliente(cliente: Cliente): void {
    void this.router.navigate(['/cadastros/clientes', cliente.id]);
  }

  statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case 'Ativo': return 'success';
      case 'VIP': return 'info';
      case 'Inadimplente': return 'warning';
      case 'Inativo': return 'secondary';
      default: return 'secondary';
    }
  }

  toast(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 3000);
  }

  private normalizar(resp: unknown): Cliente[] {
    const arr = Array.isArray(resp) ? resp
      : (typeof resp === 'object' && resp !== null)
        ? ((resp as Record<string, unknown>)['content'] as unknown[] ??
           (resp as Record<string, unknown>)['items'] as unknown[] ??
           (resp as Record<string, unknown>)['data'] as unknown[] ?? [])
        : [];
    return (arr as Record<string, unknown>[]).map(r => ({
      id: String(r['id'] ?? r['codigo'] ?? ''),
      codigo: Number(r['codigo'] ?? 0),
      razaoSocial: String(r['razaoSocial'] ?? r['nome'] ?? r['name'] ?? ''),
      documento: String(r['documento'] ?? r['cpfCnpj'] ?? r['cnpj'] ?? ''),
      tipo: (r['tipo'] === 'PJ' ? 'PJ' : 'PF') as 'PF' | 'PJ',
      status: String(r['status'] ?? 'Ativo') as Cliente['status'],
      cidade: String(r['cidade'] ?? r['municipio'] ?? '-'),
      uf: String(r['uf'] ?? r['estado'] ?? '-'),
      telefone: r['telefone'] ? String(r['telefone']) : undefined
    }));
  }
}

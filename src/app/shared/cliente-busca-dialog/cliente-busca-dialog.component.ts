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

export interface ClienteItem {
  id: string;
  codigo: string;
  razaoSocial: string;
  documento: string;
  telefone: string;
  cidade: string;
  limite?: number;
  status?: string;
}

const DEMO_CLIENTES: ClienteItem[] = [
  { id: 'c1', codigo: '000145', razaoSocial: 'Joao Batista da Silva', documento: '123.456.789-00', telefone: '(85) 98800-1200', cidade: 'Fortaleza/CE', limite: 1200, status: 'Regular' },
  { id: 'c2', codigo: '000278', razaoSocial: 'Moto Rapido Entregas LTDA', documento: '41.222.333/0001-10', telefone: '(85) 3222-7788', cidade: 'Fortaleza/CE', limite: 8500, status: 'Regular' },
  { id: 'c3', codigo: '000319', razaoSocial: 'Carlos Oficina ME', documento: '31.444.555/0001-99', telefone: '(85) 99711-3311', cidade: 'Maranguape/CE', limite: 3500, status: 'Atraso' },
  { id: 'c4', codigo: '000402', razaoSocial: 'Consumidor Balcao', documento: '000.000.000-00', telefone: '-', cidade: '-', limite: 0, status: 'Padrao' }
];

@Component({
  selector: 'chb-cliente-busca-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, TableModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [style]="{ width: 'min(96vw, 62rem)', 'max-height': '84vh' }"
      [contentStyle]="{ padding: '0' }"
      header="Buscar Cliente (F4)"
      (onHide)="onDialogHide()">

      <div class="busca-container">
        <div class="busca-header">
          <span class="p-input-icon-left busca-input-wrap">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              pInputText
              type="search"
              placeholder="Nome, CPF/CNPJ ou codigo..."
              [(ngModel)]="queryModel"
              (ngModelChange)="onQueryChange($event)"
              (keydown)="onInputKeydown($event)"
              autocomplete="off"
              class="busca-input" />
          </span>
          <span class="busca-hint">Enter ou duplo clique para selecionar &nbsp;|&nbsp; Esc para fechar</span>
        </div>

        <p-table
          [value]="clientes()"
          [loading]="loading()"
          selectionMode="single"
          [(selection)]="selectedCliente"
          [scrollable]="true"
          scrollHeight="50vh"
          styleClass="chb-data-table busca-table"
          (onRowSelect)="confirmarSelecao($event.data)"
          (onRowDblclick)="confirmarSelecao($any($event).data)">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:90px">Codigo</th>
              <th>Razao Social / Nome</th>
              <th style="width:145px">Documento</th>
              <th style="width:130px">Telefone</th>
              <th>Cidade</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-cliente>
            <tr
              [pSelectableRow]="cliente"
              [pSelectableRowDblClick]="cliente"
              [class.row-atraso]="cliente.status === 'Atraso'">
              <td>{{ cliente.codigo }}</td>
              <td>{{ cliente.razaoSocial }}</td>
              <td>{{ cliente.documento }}</td>
              <td>{{ cliente.telefone }}</td>
              <td>{{ cliente.cidade }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                @if (loading()) {
                  Buscando...
                } @else {
                  Nenhum cliente encontrado.
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="fechar()"></button>
        <button pButton type="button" icon="pi pi-check" label="Selecionar" [disabled]="!selectedCliente" (click)="confirmarSelecao(selectedCliente!)"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .busca-container {
      display: flex;
      flex-direction: column;
    }

    .busca-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
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
      border-radius: 999px;
      background: var(--chb-surface-muted);
      padding: 0.25rem 0.55rem;
    }

    .row-atraso {
      background: #fff7ed;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: var(--chb-teal-50);
      cursor: pointer;
    }

    @media (max-width: 640px) {
      .busca-input-wrap,
      .busca-hint {
        width: 100%;
        min-width: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClienteBuscaDialogComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private readonly query$ = new Subject<string>();

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() clienteSelecionado = new EventEmitter<ClienteItem>();

  readonly clientes = signal<ClienteItem[]>([]);
  readonly loading = signal(false);

  queryModel = '';
  selectedCliente: ClienteItem | null = null;

  ngOnInit(): void {
    this.query$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((q) => this.buscarClientes(q));

    this.buscarClientes('');
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
    if (event.key === 'Enter' && this.selectedCliente) {
      event.preventDefault();
      this.confirmarSelecao(this.selectedCliente);
    }
  }

  onQueryChange(value: string): void {
    this.query$.next(value);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.selectedCliente) {
      event.preventDefault();
      this.confirmarSelecao(this.selectedCliente);
    }
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
    this.queryModel = '';
    this.selectedCliente = null;
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.queryModel = '';
    this.selectedCliente = null;
  }

  confirmarSelecao(cliente: ClienteItem): void {
    if (!cliente) return;
    this.clienteSelecionado.emit(cliente);
    this.fechar();
  }

  private buscarClientes(q: string): void {
    this.loading.set(true);
    const url = q.length >= 2 ? `/api/v1/cadastros/clientes?q=${encodeURIComponent(q)}` : '/api/v1/cadastros/clientes';

    this.http.get<unknown>(url).pipe(
      catchError(() => of(DEMO_CLIENTES))
    ).subscribe((response) => {
      const list = normalizeClientes(response);
      this.clientes.set(list.length ? list : (q ? DEMO_CLIENTES.filter(c =>
        c.razaoSocial.toLowerCase().includes(q.toLowerCase()) ||
        c.documento.includes(q) ||
        c.codigo.includes(q)
      ) : DEMO_CLIENTES));
      this.loading.set(false);
    });
  }
}

function normalizeClientes(response: unknown): ClienteItem[] {
  const arr = Array.isArray(response) ? response
    : (typeof response === 'object' && response !== null)
      ? ((response as Record<string, unknown>)['content'] as unknown[] ||
         (response as Record<string, unknown>)['items'] as unknown[] ||
         (response as Record<string, unknown>)['data'] as unknown[] || [])
      : [];

  return (arr as Record<string, unknown>[]).map((r) => ({
    id: String(r['id'] ?? r['codigo'] ?? ''),
    codigo: String(r['codigo'] ?? ''),
    // razaoSocial is the main name field in backend
    razaoSocial: String(r['razaoSocial'] ?? r['nomeFantasia'] ?? r['nome'] ?? r['name'] ?? ''),
    documento: String(r['documento'] ?? r['cpfCnpj'] ?? r['cnpj'] ?? ''),
    telefone: String(r['telefone'] ?? r['celular'] ?? r['fone'] ?? '-'),
    cidade: String(r['cidade'] ?? r['municipio'] ?? '-'),
    // limiteCredito is the backend field name
    limite: Number(r['limiteCredito'] ?? r['limite'] ?? 0),
    // ativo is boolean in backend; no string status field
    status: r['ativo'] === false ? 'Inativo' : 'Regular'
  }));
}

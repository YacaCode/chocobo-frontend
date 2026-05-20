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
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

export interface ServicoItem {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  tempoPrevisto?: number;
}

const DEMO_SERVICOS: ServicoItem[] = [
  { id: 'sv-001', codigo: 'SV001', nome: 'Troca de Óleo', preco: 45.00, tempoPrevisto: 0.5 },
  { id: 'sv-002', codigo: 'SV002', nome: 'Revisão 6.000 km', preco: 180.00, tempoPrevisto: 2.0 },
  { id: 'sv-003', codigo: 'SV003', nome: 'Revisão 12.000 km', preco: 320.00, tempoPrevisto: 3.0 },
  { id: 'sv-004', codigo: 'SV004', nome: 'Troca de Pneu Dianteiro', preco: 60.00, tempoPrevisto: 0.5 },
  { id: 'sv-005', codigo: 'SV005', nome: 'Troca de Pneu Traseiro', preco: 70.00, tempoPrevisto: 1.0 },
  { id: 'sv-006', codigo: 'SV006', nome: 'Regulagem de Válvulas', preco: 120.00, tempoPrevisto: 1.5 },
  { id: 'sv-007', codigo: 'SV007', nome: 'Limpeza de Carburador', preco: 90.00, tempoPrevisto: 1.0 }
];

@Component({
  selector: 'chb-servico-busca-dialog',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DialogModule, FormsModule, InputTextModule, TableModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [style]="{ width: 'min(96vw, 56rem)', 'max-height': '80vh' }"
      [contentStyle]="{ padding: '0' }"
      header="Buscar Serviço (F2)"
      (onHide)="onDialogHide()">

      <div class="busca-container">
        <div class="busca-header">
          <span class="p-input-icon-left busca-input-wrap">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              pInputText
              type="search"
              placeholder="Código ou nome do serviço..."
              [(ngModel)]="queryModel"
              (ngModelChange)="onQueryChange($event)"
              (keydown)="onInputKeydown($event)"
              autocomplete="off"
              class="busca-input" />
          </span>
          <span class="busca-hint">Enter ou duplo clique para selecionar &nbsp;|&nbsp; Esc para fechar</span>
        </div>

        <p-table
          [value]="servicos()"
          [loading]="loading()"
          selectionMode="single"
          [(selection)]="selectedServico"
          [scrollable]="true"
          scrollHeight="45vh"
          styleClass="chb-data-table busca-table"
          (onRowSelect)="confirmarSelecao($event.data)"
          (onRowDblclick)="confirmarSelecao($any($event).data)">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:100px">Código</th>
              <th>Nome do Serviço</th>
              <th style="width:120px;text-align:right">Preço</th>
              <th style="width:100px;text-align:center">Tempo (h)</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-sv>
            <tr [pSelectableRow]="sv" [pSelectableRowDblClick]="sv">
              <td style="font-family:monospace;font-weight:700">{{ sv.codigo }}</td>
              <td>{{ sv.nome }}</td>
              <td style="text-align:right">{{ sv.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align:center">{{ sv.tempoPrevisto ?? '—' }}h</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" style="text-align:center;padding:2rem;color:var(--chb-text-muted)">
                @if (loading()) { Buscando... } @else { Nenhum serviço encontrado. }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="fechar()"></button>
        <button pButton type="button" icon="pi pi-check" label="Selecionar"
                [disabled]="!selectedServico" (click)="confirmarSelecao(selectedServico!)"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .busca-container { display:flex; flex-direction:column; }
    .busca-header { display:flex; align-items:center; gap:.75rem; padding:.85rem; border-bottom:1px solid var(--chb-border); flex-wrap:wrap; }
    .busca-input-wrap { flex:1; min-width:250px; }
    .busca-input { width:100%; }
    .busca-hint { color:var(--chb-text-muted); font-size:.78rem; border-radius:999px; background:var(--chb-surface-muted); padding:.25rem .55rem; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover { background:var(--chb-teal-50); cursor:pointer; }
    @media (max-width:640px) { .busca-input-wrap, .busca-hint { width:100%; min-width:0; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicoBuscaDialogComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private readonly query$ = new Subject<string>();

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() servicoSelecionado = new EventEmitter<ServicoItem>();

  readonly servicos = signal<ServicoItem[]>([]);
  readonly loading = signal(false);

  queryModel = '';
  selectedServico: ServicoItem | null = null;

  ngOnInit(): void {
    this.query$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.buscarServicos(q));
    this.buscarServicos('');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;
    if (event.key === 'Escape') { event.preventDefault(); this.fechar(); }
    if (event.key === 'Enter' && this.selectedServico) { event.preventDefault(); this.confirmarSelecao(this.selectedServico); }
  }

  onQueryChange(value: string): void { this.query$.next(value); }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.selectedServico) { event.preventDefault(); this.confirmarSelecao(this.selectedServico); }
  }

  onDialogHide(): void { this.visibleChange.emit(false); this.queryModel = ''; this.selectedServico = null; }

  fechar(): void { this.visible = false; this.visibleChange.emit(false); this.queryModel = ''; this.selectedServico = null; }

  confirmarSelecao(sv: ServicoItem): void {
    if (!sv) return;
    this.servicoSelecionado.emit(sv);
    this.fechar();
  }

  private buscarServicos(q: string): void {
    this.loading.set(true);
    const url = q.length >= 2 ? `/api/v1/servicos/catalogo?q=${encodeURIComponent(q)}` : '/api/v1/servicos/catalogo';
    this.http.get<any[]>(url).pipe(catchError(() => of(null))).subscribe(data => {
      const list: ServicoItem[] | null = data?.map((s: any) => ({
        id: String(s.id ?? ''),
        codigo: String(s.codigo ?? ''),
        nome: String(s.nome ?? ''),
        preco: Number(s.preco ?? 0),
        tempoPrevisto: s.tempoPrevisto != null ? Number(s.tempoPrevisto) : undefined
      })) ?? null;
      this.servicos.set(list?.length ? list : (q
        ? DEMO_SERVICOS.filter(s => s.codigo.toLowerCase().includes(q.toLowerCase()) || s.nome.toLowerCase().includes(q.toLowerCase()))
        : DEMO_SERVICOS));
      this.loading.set(false);
    });
  }
}

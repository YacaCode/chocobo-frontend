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
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_FORNECEDORES = [
  { id: 'f-001', codigo: '001', razaoSocial: 'Distribuidora de Peças CE', cnpj: '12.345.678/0001-90', cidade: 'Fortaleza', uf: 'CE', telefone: '(85) 3344-5566', representante: 'Roberto Lima', ativo: true },
  { id: 'f-002', codigo: '002', razaoSocial: 'Riffel Brasil Ltda', cnpj: '98.765.432/0001-10', cidade: 'Caxias do Sul', uf: 'RS', telefone: '(54) 3227-8899', representante: 'Ana Mota', ativo: true },
  { id: 'f-003', codigo: '003', razaoSocial: 'Heliar Baterias', cnpj: '45.678.901/0001-23', cidade: 'São Paulo', uf: 'SP', telefone: '(11) 4004-1234', representante: 'Carlos Silva', ativo: true },
  { id: 'f-004', codigo: '004', razaoSocial: 'NGK do Brasil Ltda', cnpj: '23.456.789/0001-45', cidade: 'São Paulo', uf: 'SP', telefone: '(11) 5555-4444', representante: 'Maria Santos', ativo: false },
  { id: 'f-005', codigo: '005', razaoSocial: 'Mobil Lubrificantes', cnpj: '67.890.123/0001-67', cidade: 'Rio de Janeiro', uf: 'RJ', telefone: '(21) 3333-2222', representante: 'Paulo Costa', ativo: true }
];

@Component({
  selector: 'chb-fornecedores-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, FormsModule, InputTextModule, RouterLink, SkeletonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- KPIs -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">TOTAL</span>
        <span class="kpi-value">{{ lista().length }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">ATIVOS</span>
        <span class="kpi-value" style="color:#16a34a">{{ qtdAtivos() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">INATIVOS</span>
        <span class="kpi-value" style="color:var(--chb-text-muted)">{{ qtdInativos() }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Fornecedores</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar razão social, CNPJ ou cidade..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <button pButton icon="pi pi-plus" label="Novo Fornecedor"
                class="p-button-success"
                routerLink="/cadastros/fornecedores/novo"
                pTooltip="Ctrl+N">
        </button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !lista().length) {
      @for (i of [1,2,3,4,5]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtrados()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="codigo">Cód. <p-sortIcon field="codigo"></p-sortIcon></th>
            <th pSortableColumn="razaoSocial">Razão Social <p-sortIcon field="razaoSocial"></p-sortIcon></th>
            <th>CNPJ</th>
            <th pSortableColumn="cidade">Cidade/UF <p-sortIcon field="cidade"></p-sortIcon></th>
            <th>Telefone</th>
            <th>Representante</th>
            <th>Ativo</th>
            <th style="width:80px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-f>
          <tr style="cursor:pointer" [routerLink]="['/cadastros/fornecedores', f.id]">
            <td style="font-weight:700;font-family:monospace">{{ f.codigo }}</td>
            <td style="font-weight:600">{{ f.razaoSocial }}</td>
            <td style="font-family:monospace;font-size:.85rem">{{ f.cnpj }}</td>
            <td>{{ f.cidade }}/{{ f.uf }}</td>
            <td>{{ f.telefone }}</td>
            <td>{{ f.representante }}</td>
            <td><p-tag [value]="f.ativo ? 'Ativo' : 'Inativo'" [severity]="f.ativo ? 'success' : 'secondary'"></p-tag></td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                      [routerLink]="['/cadastros/fornecedores', f.id]"
                      (click)="$event.stopPropagation()"
                      pTooltip="Editar"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" style="text-align:center;padding:2rem">
              <i class="pi pi-truck" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhum fornecedor encontrado.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:120px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
  `]
})
export class FornecedoresListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly lista = signal<any[]>([]);
  readonly loading = signal(false);
  readonly busca = signal('');

  readonly filtrados = computed(() => {
    const b = this.busca().toLowerCase();
    return this.lista().filter(f =>
      !b || f.razaoSocial?.toLowerCase().includes(b) ||
            f.cnpj?.includes(b) || f.cidade?.toLowerCase().includes(b)
    );
  });
  readonly qtdAtivos = computed(() => this.lista().filter(f => f.ativo).length);
  readonly qtdInativos = computed(() => this.lista().filter(f => !f.ativo).length);

  ngOnInit(): void {
    this.buscaSubject.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(e: KeyboardEvent): void { e.preventDefault(); void this.router.navigate(['/cadastros/fornecedores/novo']); }

  onBuscaInput(value: string): void { this.buscaSubject.next(value); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/cadastros/fornecedores')
      .pipe(catchError(() => of(DEMO_FORNECEDORES)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.lista.set(data));
  }
}

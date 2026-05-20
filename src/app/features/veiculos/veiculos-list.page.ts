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

const DEMO_VEICULOS = [
  { id: 'v-001', placa: 'ABC-1D34', modeloNome: 'Bros 150', montadora: 'HONDA', ano: 2018, corNome: 'Preta', clienteNome: 'Joao da Silva', combustivel: 'GASOLINA' },
  { id: 'v-002', placa: 'DEF-2E56', modeloNome: 'Factor 150', montadora: 'YAMAHA', ano: 2020, corNome: 'Azul', clienteNome: 'Maria Oliveira', combustivel: 'GASOLINA' },
  { id: 'v-003', placa: 'GHI-3F78', modeloNome: 'XRE 300', montadora: 'HONDA', ano: 2022, corNome: 'Vermelha', clienteNome: 'Carlos Santos', combustivel: 'GASOLINA' },
  { id: 'v-004', placa: 'JKL-4G90', modeloNome: 'Biz 125', montadora: 'HONDA', ano: 2019, corNome: 'Branca', clienteNome: 'Ana Lima', combustivel: 'FLEX' }
];

@Component({
  selector: 'chb-veiculos-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, FormsModule, InputTextModule, RouterLink, SkeletonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">TOTAL</span>
        <span class="kpi-value">{{ lista().length }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">HONDA</span>
        <span class="kpi-value" style="color:#e11d48">{{ qtdPorMarca('HONDA') }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">YAMAHA</span>
        <span class="kpi-value" style="color:#1d4ed8">{{ qtdPorMarca('YAMAHA') }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">OUTRAS</span>
        <span class="kpi-value" style="color:var(--chb-text-muted)">{{ qtdOutras() }}</span>
      </div>
    </div>

    <div class="page-toolbar">
      <h2 class="page-title">Veículos</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar placa, modelo ou cliente..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <button pButton icon="pi pi-plus" label="Novo Veículo"
                class="p-button-success"
                routerLink="/veiculos/novo"
                pTooltip="Ctrl+N">
        </button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    @if (loading() && !lista().length) {
      @for (i of [1,2,3,4]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtrados()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="placa">Placa <p-sortIcon field="placa"></p-sortIcon></th>
            <th pSortableColumn="modeloNome">Modelo <p-sortIcon field="modeloNome"></p-sortIcon></th>
            <th>Montadora</th>
            <th pSortableColumn="ano">Ano <p-sortIcon field="ano"></p-sortIcon></th>
            <th>Cor</th>
            <th pSortableColumn="clienteNome">Cliente <p-sortIcon field="clienteNome"></p-sortIcon></th>
            <th>Combustível</th>
            <th style="width:80px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-v>
          <tr style="cursor:pointer" [routerLink]="['/veiculos', v.id]">
            <td style="font-weight:700;font-family:monospace;letter-spacing:.05em">{{ v.placa }}</td>
            <td style="font-weight:600">{{ v.modeloNome }}</td>
            <td>{{ v.montadora }}</td>
            <td>{{ v.ano }}</td>
            <td>{{ v.corNome }}</td>
            <td>{{ v.clienteNome }}</td>
            <td>
              <p-tag [value]="v.combustivel" severity="secondary"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                      [routerLink]="['/veiculos', v.id]"
                      (click)="$event.stopPropagation()"
                      pTooltip="Editar"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" style="text-align:center;padding:2rem">
              <i class="pi pi-car" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhum veículo encontrado.</p>
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
export class VeiculosListPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly lista = signal<any[]>([]);
  readonly loading = signal(false);
  readonly busca = signal('');

  readonly filtrados = computed(() => {
    const b = this.busca().toLowerCase();
    return this.lista().filter(v =>
      !b || v.placa?.toLowerCase().includes(b) ||
            v.modeloNome?.toLowerCase().includes(b) ||
            v.clienteNome?.toLowerCase().includes(b)
    );
  });

  qtdPorMarca(marca: string): number {
    return this.lista().filter(v => v.montadora === marca).length;
  }

  qtdOutras(): number {
    return this.lista().filter(v => v.montadora !== 'HONDA' && v.montadora !== 'YAMAHA').length;
  }

  ngOnInit(): void {
    this.buscaSubject.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(e: KeyboardEvent): void { e.preventDefault(); void this.router.navigate(['/veiculos/novo']); }

  onBuscaInput(value: string): void { this.buscaSubject.next(value); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/veiculos')
      .pipe(catchError(() => of(DEMO_VEICULOS)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.lista.set(data));
  }
}

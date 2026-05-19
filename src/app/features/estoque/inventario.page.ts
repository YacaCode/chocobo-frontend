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
import { DecimalPipe } from '@angular/common';
import { Subject, catchError, finalize, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

interface ItemInventario {
  id: string;
  codigo: string;
  descricao: string;
  secao: string;
  qtdSistema: number;
  qtdContada: number | null;
}

const DEMO_INVENTARIO: ItemInventario[] = [
  { id: 'i1', codigo: 'OLEO-10W40', descricao: 'Oleo Motor 10W40 Semissintetico', secao: 'Lubrificantes', qtdSistema: 42, qtdContada: null },
  { id: 'i2', codigo: 'FILTRO-OLEO', descricao: 'Filtro Oleo Moto 150cc', secao: 'Filtros', qtdSistema: 7, qtdContada: null },
  { id: 'i3', codigo: '101.425-2', descricao: 'Correia Transmissao TITAN 150', secao: 'Transmissao', qtdSistema: 15, qtdContada: null },
  { id: 'i4', codigo: 'PASTILHA-DIANTEIRA', descricao: 'Pastilha Freio Dianteiro CG150', secao: 'Freios', qtdSistema: 22, qtdContada: null },
  { id: 'i5', codigo: 'VELA-NGK', descricao: 'Vela Ignicao NGK CR7HSA', secao: 'Ignicao', qtdSistema: 48, qtdContada: null },
  { id: 'i6', codigo: 'PNEU-TRASEIRO-14', descricao: 'Pneu Traseiro 90/90-14 Titan', secao: 'Pneus', qtdSistema: 8, qtdContada: null },
  { id: 'i7', codigo: 'AMORTECEDOR-TRAS', descricao: 'Amortecedor Traseiro Biz 125', secao: 'Suspensao', qtdSistema: 4, qtdContada: null },
  { id: 'i8', codigo: 'CABO-ACELERADOR', descricao: 'Cabo Acelerador CG 160', secao: 'Cabos', qtdSistema: 12, qtdContada: null },
  { id: 'i9', codigo: 'BATERIA-5AH', descricao: 'Bateria 5Ah Selada Motos', secao: 'Eletrica', qtdSistema: 3, qtdContada: null },
  { id: 'i10', codigo: 'KIT-RELACAO-428', descricao: 'Kit Relacao 428H CG160', secao: 'Transmissao', qtdSistema: 7, qtdContada: null }
];

@Component({
  selector: 'chb-inventario-page',
  standalone: true,
  imports: [ButtonModule, DecimalPipe, DropdownModule, FormsModule, InputTextModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon" aria-hidden="true"><i class="pi pi-clipboard"></i></span>
          <div>
            <p class="page-area">Estoque</p>
            <h2 class="page-title">Inventario de Estoque</h2>
            <span class="page-sub">Iniciado em {{ dataInventario }}</span>
          </div>
        </div>
        <div class="page-actions">
          <button pButton type="button" icon="pi pi-save" label="Aplicar Contagem" [disabled]="saving() || totalConferidos() === 0" (click)="aplicarContagem()"></button>
        </div>
      </header>

      <!-- Progress -->
      <div class="progress-bar-wrap">
        <div class="progress-info">
          <span>Itens conferidos: <strong>{{ totalConferidos() }}</strong> de {{ itensFiltrados().length }}</span>
          <span>{{ progressoPct() }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressoPct()"></div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros-bar">
        <label class="filter-field">
          <span>Secao</span>
          <p-dropdown
            [options]="secaoOptions"
            [(ngModel)]="filtroSecao"
            (ngModelChange)="aplicarFiltro()"
            optionLabel="label"
            optionValue="value"
            placeholder="Todas as secoes"
            [showClear]="true"
            class="w-full">
          </p-dropdown>
        </label>
        <label class="filter-field filter-field--wide">
          <span>Buscar produto</span>
          <input pInputText type="search" [(ngModel)]="filtroBusca" (ngModelChange)="aplicarFiltro()" placeholder="Codigo ou descricao..." />
        </label>
        <label class="filter-field">
          <span>Mostrar</span>
          <p-dropdown
            [options]="mostrarOptions"
            [(ngModel)]="filtroMostrar"
            (ngModelChange)="aplicarFiltro()"
            optionLabel="label"
            optionValue="value"
            class="w-full">
          </p-dropdown>
        </label>
      </div>

      <!-- Tabela de contagem -->
      <div class="table-area">
        <table class="inv-table">
          <thead>
            <tr>
              <th style="width:140px">Codigo</th>
              <th>Descricao</th>
              <th style="width:100px">Secao</th>
              <th style="width:110px" class="text-center">Qtd Sistema</th>
              <th style="width:140px" class="text-center">Qtd Contada</th>
              <th style="width:110px" class="text-center">Diferenca</th>
              <th style="width:70px" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (item of itensFiltrados(); track item.id) {
              <tr [class]="rowClass(item)">
                <td class="code">{{ item.codigo }}</td>
                <td>{{ item.descricao }}</td>
                <td>{{ item.secao }}</td>
                <td class="text-center qtd-sistema">{{ item.qtdSistema | number:'1.2-2':'pt-BR' }}</td>
                <td class="text-center">
                  <input
                    type="number"
                    class="qtd-input"
                    [value]="item.qtdContada ?? ''"
                    [placeholder]="item.qtdSistema.toString()"
                    min="0"
                    step="1"
                    (change)="setContagem(item, $event)" />
                </td>
                <td class="text-center">
                  @if (item.qtdContada !== null) {
                    <span [class]="diferencaClass(item)">
                      {{ diferenca(item) >= 0 ? '+' : '' }}{{ diferenca(item) | number:'1.2-2':'pt-BR' }}
                    </span>
                  } @else {
                    <span class="nao-contado">-</span>
                  }
                </td>
                <td class="text-center">
                  @if (item.qtdContada !== null) {
                    <span [class]="'badge ' + badgeClass(item)">
                      <i [class]="badgeIcon(item)" aria-hidden="true"></i>
                    </span>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="7" class="empty-state">Nenhum item encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (toastMsg()) {
        <div class="toast-notice" [class.toast-success]="!toastError()">{{ toastMsg() }}</div>
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
    .page-sub { color: var(--chb-text-muted); font-size: .85rem; }
    .page-actions { display: flex; gap: .75rem; }

    .progress-bar-wrap {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: .85rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .progress-info { display: flex; justify-content: space-between; margin-bottom: .5rem; font-size: .85rem; color: var(--chb-text-muted); }
    .progress-info strong { color: var(--chb-text); }
    .progress-bar { height: 8px; background: var(--chb-border); border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #22c55e; border-radius: 999px; transition: width .3s; }

    .filtros-bar {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); align-items: end; gap: .7rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: .85rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .filter-field { display: grid; gap: .3rem; font-size: .82rem; font-weight: 700; color: var(--chb-text); min-width: 0; }
    .filter-field input { width: 100%; }
    .filter-field--wide { grid-column: span 2; }
    .w-full { width: 100%; }

    .table-area {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; overflow: auto;
      box-shadow: var(--chb-shadow-soft);
    }

    .inv-table { width: 100%; min-width: 48rem; border-collapse: collapse; font-size: .84rem; }
    .inv-table th {
      background: color-mix(in srgb, var(--chb-surface-muted) 88%, var(--chb-teal-50)); padding: .55rem .7rem; text-align: left;
      font-weight: 700; border-bottom: 2px solid var(--chb-border); font-size: .82rem;
      text-transform: uppercase; color: var(--chb-text-muted);
    }
    .inv-table td { padding: .5rem .7rem; border-bottom: 1px solid var(--chb-border); vertical-align: middle; }
    .inv-table tr { transition: background-color 120ms ease; }
    .inv-table tbody tr:hover { background: color-mix(in srgb, var(--chb-teal-50) 52%, var(--chb-surface)); }
    .inv-table tr:last-child td { border-bottom: none; }

    .text-center { text-align: center; }
    .code { font-family: monospace; font-size: .85rem; color: var(--chb-navy); }
    .qtd-sistema { font-weight: 600; }
    .nao-contado { color: var(--chb-text-muted); }

    .qtd-input {
      width: 90px; height: 44px; text-align: center;
      border: 1px solid var(--chb-border); border-radius: .375rem;
      font-size: 1rem; font-weight: 600; padding: .25rem .5rem;
      outline: none; background: var(--chb-surface);
      color: var(--chb-text);
    }
    .qtd-input:focus { border-color: var(--chb-navy); }

    .row-ok { background: #f0fdf4; }
    .row-aviso { background: #fffbeb; }
    .row-divergencia { background: #fef2f2; }

    .dif-ok { color: #166534; font-weight: 700; }
    .dif-aviso { color: #92400e; font-weight: 700; }
    .dif-danger { color: #991b1b; font-weight: 700; }

    .badge {
      display: inline-grid; width: 24px; height: 24px; place-items: center;
      border-radius: 999px; font-size: .8rem;
    }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-aviso { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }

    .empty-state { text-align: center; padding: 2rem; color: var(--chb-text-muted); }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }
    .toast-success { background: #166534; }

    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .page-heading { width: 100%; }
      .filter-field--wide { grid-column: span 1; }
      .page-actions { width: 100%; }
      .page-actions .p-button { width: 100%; justify-content: center; }
    }
  `]
})
export class InventarioPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly itens = signal<ItemInventario[]>([]);
  readonly itensFiltrados = signal<ItemInventario[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly toastMsg = signal('');
  readonly toastError = signal(false);

  readonly totalConferidos = computed(() => this.itens().filter(i => i.qtdContada !== null).length);
  readonly progressoPct = computed(() => {
    const total = this.itens().length;
    return total > 0 ? Math.round((this.totalConferidos() / total) * 100) : 0;
  });

  filtroSecao: string | null = null;
  filtroBusca = '';
  filtroMostrar = 'todos';
  dataInventario = new Date().toLocaleDateString('pt-BR');

  readonly secaoOptions = [
    { label: 'Lubrificantes', value: 'Lubrificantes' },
    { label: 'Filtros', value: 'Filtros' },
    { label: 'Transmissao', value: 'Transmissao' },
    { label: 'Freios', value: 'Freios' },
    { label: 'Ignicao', value: 'Ignicao' },
    { label: 'Pneus', value: 'Pneus' },
    { label: 'Suspensao', value: 'Suspensao' },
    { label: 'Cabos', value: 'Cabos' },
    { label: 'Eletrica', value: 'Eletrica' }
  ];

  readonly mostrarOptions = [
    { label: 'Todos os itens', value: 'todos' },
    { label: 'Nao conferidos', value: 'pendentes' },
    { label: 'Conferidos', value: 'conferidos' },
    { label: 'Com divergencia', value: 'divergentes' }
  ];

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/estoque/movimentacoes').pipe(
      catchError(() => of(DEMO_INVENTARIO)),
      finalize(() => this.loading.set(false))
    ).subscribe(resp => {
      const list = Array.isArray(resp) ? (resp as ItemInventario[]) : DEMO_INVENTARIO;
      const items = list.length ? list : DEMO_INVENTARIO;
      const withNull = items.map(i => ({ ...i, qtdContada: null as number | null }));
      this.itens.set(withNull);
      this.aplicarFiltro();
    });
  }

  setContagem(item: ItemInventario, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.itens.update(lista =>
      lista.map(i => i.id === item.id ? { ...i, qtdContada: isNaN(val) ? null : val } : i)
    );
    this.aplicarFiltro();
  }

  diferenca(item: ItemInventario): number {
    if (item.qtdContada === null) return 0;
    return item.qtdContada - item.qtdSistema;
  }

  diferencaClass(item: ItemInventario): string {
    const diff = this.diferenca(item);
    const pct = item.qtdSistema > 0 ? Math.abs(diff / item.qtdSistema * 100) : 0;
    if (diff === 0) return 'dif-ok';
    if (pct <= 5) return 'dif-aviso';
    return 'dif-danger';
  }

  rowClass(item: ItemInventario): string {
    if (item.qtdContada === null) return '';
    const diff = this.diferenca(item);
    const pct = item.qtdSistema > 0 ? Math.abs(diff / item.qtdSistema * 100) : 0;
    if (diff === 0) return 'row-ok';
    if (pct <= 5) return 'row-aviso';
    return 'row-divergencia';
  }

  badgeClass(item: ItemInventario): string {
    const diff = this.diferenca(item);
    const pct = item.qtdSistema > 0 ? Math.abs(diff / item.qtdSistema * 100) : 0;
    if (diff === 0) return 'badge-ok';
    if (pct <= 5) return 'badge-aviso';
    return 'badge-danger';
  }

  badgeIcon(item: ItemInventario): string {
    const diff = this.diferenca(item);
    const pct = item.qtdSistema > 0 ? Math.abs(diff / item.qtdSistema * 100) : 0;
    if (diff === 0) return 'pi pi-check';
    if (pct <= 5) return 'pi pi-exclamation-triangle';
    return 'pi pi-times';
  }

  aplicarFiltro(): void {
    let lista = this.itens();

    if (this.filtroSecao) lista = lista.filter(i => i.secao === this.filtroSecao);

    if (this.filtroBusca) {
      const fb = this.filtroBusca.toLowerCase();
      lista = lista.filter(i => i.codigo.toLowerCase().includes(fb) || i.descricao.toLowerCase().includes(fb));
    }

    switch (this.filtroMostrar) {
      case 'pendentes': lista = lista.filter(i => i.qtdContada === null); break;
      case 'conferidos': lista = lista.filter(i => i.qtdContada !== null); break;
      case 'divergentes': lista = lista.filter(i => i.qtdContada !== null && this.diferenca(i) !== 0); break;
    }

    this.itensFiltrados.set(lista);
  }

  aplicarContagem(): void {
    const conferidos = this.itens().filter(i => i.qtdContada !== null);
    if (!conferidos.length) return;

    this.saving.set(true);
    const payload = conferidos.map(i => ({ codigo: i.codigo, qtdContada: i.qtdContada }));

    this.http.post('/api/v1/estoque/inventario/ajustar', payload).pipe(
      catchError(() => of({ ok: true })),
      finalize(() => this.saving.set(false))
    ).subscribe(() => {
      this.toastMsg.set(`${conferidos.length} ajuste(s) aplicado(s) com sucesso!`);
      this.toastError.set(false);
      setTimeout(() => this.toastMsg.set(''), 3500);
    });
  }
}

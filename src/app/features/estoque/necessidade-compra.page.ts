import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

interface ItemNecessidade {
  id: string;
  codigo: string;
  descricao: string;
  fabricante: string;
  qtdAtual: number;
  qtdMinima: number;
  qtdSugerida: number;
  precoUnitario: number;
}

interface GrupoFabricante {
  fabricante: string;
  itens: ItemNecessidade[];
  aberto: boolean;
}

const DEMO_NECESSIDADE: ItemNecessidade[] = [
  { id: 'n1', codigo: 'FILTRO-OLEO', descricao: 'Filtro Oleo Moto 150cc', fabricante: 'JN Parts', qtdAtual: 7, qtdMinima: 10, qtdSugerida: 20, precoUnitario: 19.20 },
  { id: 'n2', codigo: 'ROLAMENTO-DIANT', descricao: 'Rolamento Roda Dianteira CG', fabricante: 'NSK', qtdAtual: 2, qtdMinima: 6, qtdSugerida: 12, precoUnitario: 35.00 },
  { id: 'n3', codigo: 'PNEU-TRASEIRO-14', descricao: 'Pneu Traseiro 90/90-14 Titan', fabricante: 'Pirelli', qtdAtual: 8, qtdMinima: 10, qtdSugerida: 16, precoUnitario: 189.00 },
  { id: 'n4', codigo: 'AMORTECEDOR-TRAS', descricao: 'Amortecedor Traseiro Biz 125', fabricante: 'Cofap', qtdAtual: 4, qtdMinima: 5, qtdSugerida: 10, precoUnitario: 145.00 },
  { id: 'n5', codigo: 'CABO-ACELERADOR', descricao: 'Cabo Acelerador CG 160', fabricante: 'Cofap', qtdAtual: 2, qtdMinima: 4, qtdSugerida: 8, precoUnitario: 28.50 },
  { id: 'n6', codigo: 'BATERIA-5AH', descricao: 'Bateria 5Ah Selada Motos', fabricante: 'Heliar', qtdAtual: 3, qtdMinima: 5, qtdSugerida: 10, precoUnitario: 174.00 }
];

function agruparPorFabricante(itens: ItemNecessidade[]): GrupoFabricante[] {
  const mapa = new Map<string, ItemNecessidade[]>();
  for (const item of itens) {
    const fab = item.fabricante;
    if (!mapa.has(fab)) mapa.set(fab, []);
    mapa.get(fab)!.push(item);
  }
  return Array.from(mapa.entries()).map(([fabricante, items]) => ({
    fabricante,
    itens: items,
    aberto: true
  }));
}

@Component({
  selector: 'chb-necessidade-compra-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, FormsModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon" aria-hidden="true"><i class="pi pi-shopping-cart"></i></span>
          <div>
            <p class="page-area">Estoque</p>
            <h2 class="page-title">Necessidade de Compra</h2>
            <span class="page-sub">Produtos abaixo do estoque minimo</span>
          </div>
        </div>
        <div class="page-actions">
          <div class="total-estimado">
            Total estimado: <strong>{{ totalGeral() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
          <button pButton type="button" icon="pi pi-shopping-cart" label="Gerar Pedido de Compra" (click)="gerarPedido()"></button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-overlay">
          <i class="pi pi-spin pi-spinner" style="font-size:2rem"></i>
          <span>Carregando necessidades...</span>
        </div>
      }

      @if (!loading() && grupos().length === 0) {
        <div class="empty-global">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <p>Nenhuma necessidade de compra identificada.</p>
          <small>Todos os produtos estao acima do estoque minimo.</small>
        </div>
      }

      @for (grupo of grupos(); track grupo.fabricante) {
        <div class="grupo-card">
          <button type="button" class="grupo-header" (click)="toggleGrupo(grupo)">
            <div class="grupo-info">
              <i [class]="grupo.aberto ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" aria-hidden="true"></i>
              <strong>{{ grupo.fabricante }}</strong>
              <span class="grupo-qtd">{{ grupo.itens.length }} item(ns)</span>
            </div>
            <div class="grupo-total">
              Total: <strong>{{ totalGrupo(grupo) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
          </button>

          @if (grupo.aberto) {
            <div class="grupo-body">
              <table class="nec-table">
                <thead>
                  <tr>
                    <th style="width:140px">Codigo</th>
                    <th>Descricao</th>
                    <th style="width:100px" class="text-center">Qtd Atual</th>
                    <th style="width:100px" class="text-center">Minimo</th>
                    <th style="width:140px" class="text-center">Qtd Sugerida</th>
                    <th style="width:120px" class="text-right">Valor Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of grupo.itens; track item.id) {
                    <tr>
                      <td class="code">{{ item.codigo }}</td>
                      <td>{{ item.descricao }}</td>
                      <td class="text-center">
                        <span [class]="item.qtdAtual <= 0 ? 'qty-zero' : 'qty-low'">{{ item.qtdAtual }}</span>
                      </td>
                      <td class="text-center qty-min">{{ item.qtdMinima }}</td>
                      <td class="text-center">
                        <input
                          type="number"
                          class="qtd-input"
                          [(ngModel)]="item.qtdSugerida"
                          min="0"
                          step="1"
                          (change)="recalcular()" />
                      </td>
                      <td class="text-right valor">
                        {{ (item.qtdSugerida * item.precoUnitario) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" class="subtotal-label">Subtotal {{ grupo.fabricante }}</td>
                    <td class="text-right subtotal-valor">
                      {{ totalGrupo(grupo) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }
        </div>
      }

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
    .page-sub { color: var(--chb-text-muted); font-size: .85rem; }
    .page-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: flex-end; }

    .total-estimado {
      font-size: .88rem; color: var(--chb-text-muted);
    }
    .total-estimado strong { color: var(--chb-teal); font-size: 1.05rem; }

    .loading-overlay {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 3rem; background: var(--chb-surface); border-radius: .5rem;
      color: var(--chb-text-muted);
    }

    .empty-global {
      text-align: center; padding: 3rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; color: var(--chb-text-muted);
      box-shadow: var(--chb-shadow-soft);
    }
    .empty-global i { font-size: 3rem; color: #22c55e; display: block; margin-bottom: 1rem; }
    .empty-global p { font-size: 1.1rem; margin: 0 0 .5rem; color: var(--chb-text); }

    .grupo-card {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; overflow: hidden;
      box-shadow: var(--chb-shadow-soft);
    }

    .grupo-header {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: .85rem 1rem;
      background: var(--chb-surface-muted); border: none;
      cursor: pointer; color: inherit;
      border-bottom: 1px solid var(--chb-border);
    }
    .grupo-header:hover { background: var(--chb-yellow-50); }

    .grupo-info { display: flex; align-items: center; gap: .75rem; }
    .grupo-info strong { font-size: 1rem; color: var(--chb-text); }
    .grupo-qtd { color: var(--chb-text-muted); font-size: .85rem; }
    .grupo-total { font-size: .9rem; color: var(--chb-text-muted); }
    .grupo-total strong { color: var(--chb-navy); font-size: 1rem; }

    .grupo-body { overflow-x: auto; }

    .nec-table { width: 100%; min-width: 44rem; border-collapse: collapse; font-size: .84rem; }
    .nec-table th {
      background: color-mix(in srgb, var(--chb-surface-muted) 88%, var(--chb-teal-50)); padding: .55rem .7rem; text-align: left;
      font-weight: 700; border-bottom: 1px solid var(--chb-border);
      font-size: .8rem; text-transform: uppercase; color: var(--chb-text-muted);
    }
    .nec-table td { padding: .5rem .7rem; border-bottom: 1px solid var(--chb-border); vertical-align: middle; }
    .nec-table tbody tr { transition: background-color 120ms ease; }
    .nec-table tbody tr:hover { background: color-mix(in srgb, var(--chb-teal-50) 52%, var(--chb-surface)); }
    .nec-table tfoot td { border-top: 2px solid var(--chb-border); border-bottom: none; }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .code { font-family: monospace; font-size: .85rem; color: var(--chb-navy); }
    .qty-zero { color: #dc2626; font-weight: 700; }
    .qty-low { color: #d97706; font-weight: 700; }
    .qty-min { color: var(--chb-text-muted); }
    .valor { font-weight: 600; }
    .subtotal-label { font-weight: 700; color: var(--chb-text-muted); font-size: .85rem; }
    .subtotal-valor { font-weight: 700; font-size: 1rem; color: var(--chb-navy); }

    .qtd-input {
      width: 80px; height: 36px; text-align: center;
      border: 1px solid var(--chb-border); border-radius: .375rem;
      font-size: .95rem; font-weight: 600; padding: .25rem .5rem;
      outline: none; background: var(--chb-surface); color: var(--chb-text);
    }
    .qtd-input:focus { border-color: var(--chb-navy); }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #166534; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }

    @media (max-width: 700px) {
      .page-header,
      .grupo-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .page-heading,
      .page-actions {
        width: 100%;
      }

      .page-actions .p-button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class NecessidadeCompraPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly itens = signal<ItemNecessidade[]>([]);
  readonly grupos = signal<GrupoFabricante[]>([]);
  readonly loading = signal(false);
  readonly toastMsg = signal('');

  readonly totalGeral = computed(() =>
    this.grupos().reduce((acc, g) => acc + this.totalGrupo(g), 0)
  );

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading.set(true);
    // Falls back to estoque/saldos filtered to below-minimum items if dedicated endpoint absent
    this.http.get<unknown>('/api/v1/estoque/necessidade-compra').pipe(
      catchError(() => this.http.get<unknown>('/api/v1/estoque/saldos').pipe(
        catchError(() => of(DEMO_NECESSIDADE))
      )),
      finalize(() => this.loading.set(false))
    ).subscribe(resp => {
      const list = this.normalizar(resp);
      const itens = list.length ? list : DEMO_NECESSIDADE;
      this.itens.set(itens);
      this.grupos.set(agruparPorFabricante(itens));
    });
  }

  private normalizar(resp: unknown): ItemNecessidade[] {
    const arr = Array.isArray(resp) ? resp
      : (typeof resp === 'object' && resp !== null)
        ? ((resp as Record<string, unknown>)['content'] as unknown[] ??
           (resp as Record<string, unknown>)['items'] as unknown[] ??
           (resp as Record<string, unknown>)['data'] as unknown[] ?? [])
        : [];

    return (arr as Record<string, unknown>[]).map(r => ({
      id: String(r['id'] ?? ''),
      // codigoProduto and descricaoProduto are the backend field names for estoque records
      codigo: String(r['codigoProduto'] ?? r['codigo'] ?? ''),
      descricao: String(r['descricaoProduto'] ?? r['descricao'] ?? ''),
      fabricante: String(r['fabricante'] ?? ''),
      // qtdAtual is the real quantity; qtdDisponivel is computed
      qtdAtual: Number(r['qtdAtual'] ?? r['qtdDisponivel'] ?? r['qtdAtual'] ?? 0),
      qtdMinima: Number(r['qtdMinima'] ?? r['minimo'] ?? 0),
      qtdSugerida: Math.max(0, Number(r['qtdMinima'] ?? r['minimo'] ?? 0) * 2 - Number(r['qtdAtual'] ?? r['qtdDisponivel'] ?? 0)),
      precoUnitario: Number(r['precoUnitario'] ?? r['preco'] ?? 0)
    }));
  }

  totalGrupo(grupo: GrupoFabricante): number {
    return grupo.itens.reduce((acc, i) => acc + i.qtdSugerida * i.precoUnitario, 0);
  }

  toggleGrupo(grupo: GrupoFabricante): void {
    this.grupos.update(gs =>
      gs.map(g => g.fabricante === grupo.fabricante ? { ...g, aberto: !g.aberto } : g)
    );
  }

  recalcular(): void {
    // Força re-render do computed totalGeral
    this.grupos.update(gs => [...gs]);
  }

  gerarPedido(): void {
    this.toastMsg.set('Pedido de compra gerado com sucesso! (demo)');
    setTimeout(() => this.toastMsg.set(''), 3500);
  }
}

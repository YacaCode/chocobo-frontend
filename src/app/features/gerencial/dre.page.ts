import { CurrencyPipe, DecimalPipe } from '@angular/common';
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
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

interface DreLinha {
  codigo: string;
  nome: string;
  tipo: 'RECEITA' | 'CUSTO' | 'DESPESA' | string;
  nivel: number;
  valor: number;
  percentual: number;
  filhos: DreLinha[];
}

interface DreResponse {
  inicio: string;
  fim: string;
  receitaBruta: number;
  devolucoes: number;
  receitaLiquida: number;
  custo: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  despesasFinanceiras: number;
  lucroLiquido: number;
  margemBruta: number;
  margemEbitda: number;
  margemLiquida: number;
  linhas: DreLinha[];
}

const DEMO_DRE: DreResponse = {
  inicio: '2026-01-01',
  fim: '2026-05-31',
  receitaBruta: 87000,
  devolucoes: 2000,
  receitaLiquida: 85000,
  custo: 52000,
  lucroBruto: 33000,
  despesasOperacionais: 12000,
  ebitda: 21000,
  despesasFinanceiras: 1500,
  lucroLiquido: 19500,
  margemBruta: 38.82,
  margemEbitda: 24.71,
  margemLiquida: 22.94,
  linhas: [
    {
      codigo: '1',
      nome: 'RECEITAS OPERACIONAIS',
      tipo: 'RECEITA',
      nivel: 1,
      valor: 85000,
      percentual: 100,
      filhos: [
        { codigo: '1.1', nome: 'Receita de Vendas de Produtos', tipo: 'RECEITA', nivel: 2, valor: 87000, percentual: 102.35, filhos: [] },
        { codigo: '1.3', nome: '(-) Devolucoes e Cancelamentos', tipo: 'RECEITA', nivel: 2, valor: -2000, percentual: -2.35, filhos: [] }
      ]
    },
    {
      codigo: '2',
      nome: 'CUSTOS',
      tipo: 'CUSTO',
      nivel: 1,
      valor: -52000,
      percentual: -61.18,
      filhos: [
        { codigo: '2.1', nome: 'Custo das Mercadorias Vendidas', tipo: 'CUSTO', nivel: 2, valor: -52000, percentual: -61.18, filhos: [] }
      ]
    },
    {
      codigo: '3',
      nome: 'DESPESAS OPERACIONAIS',
      tipo: 'DESPESA',
      nivel: 1,
      valor: -12000,
      percentual: -14.12,
      filhos: [
        { codigo: '3.1', nome: 'Folha de Pagamento e Encargos', tipo: 'DESPESA', nivel: 2, valor: -7000, percentual: -8.24, filhos: [] },
        { codigo: '3.2', nome: 'Aluguel e Condominio', tipo: 'DESPESA', nivel: 2, valor: -3000, percentual: -3.53, filhos: [] },
        { codigo: '3.6', nome: 'Despesas Administrativas', tipo: 'DESPESA', nivel: 2, valor: -2000, percentual: -2.35, filhos: [] }
      ]
    },
    {
      codigo: '4',
      nome: 'DESPESAS FINANCEIRAS',
      tipo: 'DESPESA',
      nivel: 1,
      valor: -1500,
      percentual: -1.76,
      filhos: [
        { codigo: '4.2', nome: 'IOF e Tarifas', tipo: 'DESPESA', nivel: 2, valor: -1500, percentual: -1.76, filhos: [] }
      ]
    }
  ]
};

@Component({
  selector: 'chb-dre-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    CurrencyPipe,
    DecimalPipe,
    DropdownModule,
    FormsModule,
    NgxEchartsDirective,
    SkeletonModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="page-toolbar">
      <h2 class="page-title">DRE - Demonstrativo de Resultado</h2>
      <div class="toolbar-actions">
        <p-dropdown
          [options]="periodoOptions"
          [(ngModel)]="periodoSelecionado"
          optionLabel="label"
          optionValue="value"
          (onChange)="carregar()">
        </p-dropdown>
        <button
          pButton
          type="button"
          icon="pi pi-print"
          label="Exportar PDF"
          class="p-button-outlined"
          (click)="exportarPdf()">
        </button>
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          class="p-button-outlined"
          pTooltip="Atualizar"
          (click)="carregar()">
        </button>
      </div>
    </div>

    @if (loading()) {
      @for (i of [1, 2, 3, 4, 5]; track i) {
        <p-skeleton height="2.8rem" styleClass="mb-2"></p-skeleton>
      }
    } @else if (dre()) {
      <div class="resumo-grid">
        <div class="resumo-card receita">
          <span>Receita Liquida</span>
          <strong>{{ dre()!.receitaLiquida | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
        </div>
        <div class="resumo-card">
          <span>Lucro Bruto</span>
          <strong>{{ dre()!.lucroBruto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          <small>{{ dre()!.margemBruta | number:'1.2-2':'pt-BR' }}%</small>
        </div>
        <div class="resumo-card">
          <span>EBITDA</span>
          <strong>{{ dre()!.ebitda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          <small>{{ dre()!.margemEbitda | number:'1.2-2':'pt-BR' }}%</small>
        </div>
        <div class="resumo-card lucro">
          <span>Lucro Liquido</span>
          <strong>{{ dre()!.lucroLiquido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          <small>{{ dre()!.margemLiquida | number:'1.2-2':'pt-BR' }}%</small>
        </div>
      </div>

      <div class="dre-container">
        <div class="dre-tabela">
          <div class="dre-row dre-header">
            <span>Conta</span>
            <span>Valor</span>
            <span class="percentual">% Receita</span>
          </div>

          @for (linha of linhasVisiveis(); track linha.codigo) {
            <button
              type="button"
              class="dre-row linha"
              [class.receita]="linha.tipo === 'RECEITA'"
              [class.deducao]="linha.tipo === 'CUSTO' || linha.tipo === 'DESPESA'"
              [class.nivel-2]="linha.nivel > 1"
              (click)="toggleLinha(linha)"
              [disabled]="!linha.filhos.length">
              <span class="conta-cell">
                @if (linha.filhos.length) {
                  <i class="pi" [class.pi-chevron-down]="isExpandida(linha.codigo)" [class.pi-chevron-right]="!isExpandida(linha.codigo)"></i>
                } @else {
                  <i class="pi pi-minus muted"></i>
                }
                <span class="codigo">{{ linha.codigo }}</span>
                <span>{{ linha.nome }}</span>
              </span>
              <span [class.negativo]="linha.valor < 0">{{ linha.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              <span class="percentual">{{ linha.percentual | number:'1.2-2':'pt-BR' }}%</span>
            </button>
          }

          <div class="dre-row resultado">
            <span>= Receita Liquida</span>
            <span>{{ dre()!.receitaLiquida | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="percentual">100,00%</span>
          </div>
          <div class="dre-row resultado">
            <span>= Lucro Bruto</span>
            <span>{{ dre()!.lucroBruto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="percentual">{{ dre()!.margemBruta | number:'1.2-2':'pt-BR' }}%</span>
          </div>
          <div class="dre-row resultado">
            <span>= EBITDA</span>
            <span>{{ dre()!.ebitda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="percentual">{{ dre()!.margemEbitda | number:'1.2-2':'pt-BR' }}%</span>
          </div>
          <div class="dre-row resultado final">
            <span>= Lucro Liquido</span>
            <span>{{ dre()!.lucroLiquido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="percentual">{{ dre()!.margemLiquida | number:'1.2-2':'pt-BR' }}%</span>
          </div>
        </div>

        <div class="grafico-container">
          <h3 class="grafico-titulo">Composicao do Resultado</h3>
          <div echarts [options]="chartOptions()" class="chart"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .85rem 0 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--chb-text);
    }

    .toolbar-actions {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .resumo-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .resumo-card {
      background: var(--chb-surface);
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      padding: 1rem;
      border-left: 4px solid var(--chb-navy);
      min-width: 0;
    }

    .resumo-card.receita {
      border-left-color: #16a34a;
    }

    .resumo-card.lucro {
      border-left-color: var(--chb-teal);
    }

    .resumo-card span,
    .resumo-card small {
      display: block;
      color: var(--chb-text-muted);
      font-size: .75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .resumo-card strong {
      display: block;
      margin-top: .3rem;
      font-size: 1.25rem;
      color: var(--chb-text);
      overflow-wrap: anywhere;
    }

    .resumo-card small {
      margin-top: .25rem;
      color: var(--chb-teal);
    }

    .dre-container {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(20rem, .75fr);
      gap: 1.25rem;
    }

    .dre-tabela,
    .grafico-container {
      background: var(--chb-surface);
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      overflow: hidden;
    }

    .dre-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 11rem 7rem;
      gap: .75rem;
      align-items: center;
      width: 100%;
      min-height: 2.75rem;
      padding: .55rem 1rem;
      border: 0;
      border-bottom: 1px solid var(--chb-border);
      background: transparent;
      color: var(--chb-text);
      font: inherit;
      text-align: left;
    }

    button.dre-row:not(:disabled) {
      cursor: pointer;
    }

    button.dre-row:hover:not(:disabled) {
      background: var(--chb-surface-muted);
    }

    .dre-row:last-child {
      border-bottom: 0;
    }

    .dre-header {
      background: var(--chb-navy);
      color: #fff;
      font-size: .78rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .linha {
      font-weight: 700;
    }

    .linha.nivel-2 {
      font-weight: 500;
      font-size: .88rem;
    }

    .linha.receita {
      box-shadow: inset 4px 0 0 #16a34a;
    }

    .linha.deducao {
      box-shadow: inset 4px 0 0 #dc2626;
    }

    .conta-cell {
      display: flex;
      align-items: center;
      gap: .5rem;
      min-width: 0;
    }

    .conta-cell .pi {
      font-size: .72rem;
      width: .9rem;
      flex: 0 0 .9rem;
    }

    .codigo {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      color: var(--chb-text-muted);
      min-width: 2.6rem;
    }

    .muted {
      color: var(--chb-text-muted);
      opacity: .65;
    }

    .percentual {
      text-align: right;
      color: var(--chb-text-muted);
    }

    .negativo {
      color: #dc2626;
    }

    .resultado {
      background: color-mix(in srgb, var(--chb-navy) 6%, var(--chb-surface));
      font-weight: 800;
    }

    .resultado.final {
      background: color-mix(in srgb, var(--chb-teal) 12%, var(--chb-surface));
      font-size: 1rem;
    }

    .grafico-container {
      padding: 1rem;
    }

    .grafico-titulo {
      margin: 0 0 .75rem;
      font-size: .95rem;
      font-weight: 700;
      color: var(--chb-text);
    }

    .chart {
      height: 360px;
    }

    @media print {
      .toolbar-actions {
        display: none;
      }

      .dre-container {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 980px) {
      .resumo-grid,
      .dre-container {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 620px) {
      .dre-row {
        grid-template-columns: minmax(0, 1fr);
        gap: .25rem;
      }

      .percentual {
        text-align: left;
      }
    }
  `]
})
export class DrePage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly dre = signal<DreResponse | null>(null);
  readonly loading = signal(false);
  readonly expandidas = signal<Set<string>>(new Set(['1', '2', '3', '4']));

  periodoSelecionado = '2026-01_2026-05';

  readonly periodoOptions = [
    { label: 'Jan-Mai/2026', value: '2026-01_2026-05' },
    { label: 'Mai/2026', value: '2026-05_2026-05' },
    { label: 'Ano 2026', value: '2026-01_2026-12' },
    { label: 'Ano 2025', value: '2025-01_2025-12' }
  ];

  readonly linhasVisiveis = computed(() => flattenLinhas(this.dre()?.linhas ?? [], this.expandidas()));

  readonly chartOptions = computed((): EChartsOption => {
    const data = this.dre();
    if (!data) return {};
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        valueFormatter: value => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      },
      grid: { left: 56, right: 16, top: 32, bottom: 48 },
      xAxis: {
        type: 'category',
        data: ['Receita', 'Custo', 'Desp. Op.', 'EBITDA', 'Lucro']
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (v: number) => `R$ ${(v / 1000).toFixed(0)}k` }
      },
      series: [{
        name: 'Resultado',
        type: 'bar',
        data: [
          data.receitaLiquida,
          -data.custo,
          -data.despesasOperacionais,
          data.ebitda,
          data.lucroLiquido
        ],
        itemStyle: {
          color: (params: { value?: unknown }) => Number(params.value ?? 0) >= 0 ? '#16a34a' : '#dc2626'
        }
      }]
    };
  });

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    const [inicioYm, fimYm] = this.periodoSelecionado.split('_');
    const params = `inicio=${inicioYm}-01&fim=${lastDayOfMonth(fimYm)}`;
    this.loading.set(true);
    this.http.get<unknown>(`/api/v1/gerencial/dre?${params}`).pipe(
      catchError(() => of(DEMO_DRE)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(data => this.dre.set(normalizeDre(data)));
  }

  toggleLinha(linha: DreLinha): void {
    if (!linha.filhos.length) return;
    this.expandidas.update(current => {
      const next = new Set(current);
      if (next.has(linha.codigo)) {
        next.delete(linha.codigo);
      } else {
        next.add(linha.codigo);
      }
      return next;
    });
  }

  isExpandida(codigo: string): boolean {
    return this.expandidas().has(codigo);
  }

  exportarPdf(): void {
    window.print();
  }
}

function flattenLinhas(linhas: DreLinha[], expandidas: Set<string>): DreLinha[] {
  const result: DreLinha[] = [];
  for (const linha of linhas) {
    result.push(linha);
    if (linha.filhos.length && expandidas.has(linha.codigo)) {
      result.push(...flattenLinhas(linha.filhos, expandidas));
    }
  }
  return result;
}

function normalizeDre(raw: unknown): DreResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    inicio: String(r['inicio'] ?? DEMO_DRE.inicio),
    fim: String(r['fim'] ?? DEMO_DRE.fim),
    receitaBruta: toNumber(r['receitaBruta']),
    devolucoes: toNumber(r['devolucoes']),
    receitaLiquida: toNumber(r['receitaLiquida']),
    custo: toNumber(r['custo']),
    lucroBruto: toNumber(r['lucroBruto']),
    despesasOperacionais: toNumber(r['despesasOperacionais']),
    ebitda: toNumber(r['ebitda']),
    despesasFinanceiras: toNumber(r['despesasFinanceiras']),
    lucroLiquido: toNumber(r['lucroLiquido']),
    margemBruta: toNumber(r['margemBruta']),
    margemEbitda: toNumber(r['margemEbitda']),
    margemLiquida: toNumber(r['margemLiquida']),
    linhas: normalizeLinhas(r['linhas'])
  };
}

function normalizeLinhas(raw: unknown): DreLinha[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      codigo: String(r['codigo'] ?? ''),
      nome: String(r['nome'] ?? ''),
      tipo: String(r['tipo'] ?? ''),
      nivel: toNumber(r['nivel']),
      valor: toNumber(r['valor']),
      percentual: toNumber(r['percentual']),
      filhos: normalizeLinhas(r['filhos'])
    };
  });
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function lastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const day = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

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
import { CurrencyPipe } from '@angular/common';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';

const DEMO_DRE = {
  receitas: [
    { categoria: 'Vendas de Mercadorias', valor: 87000 },
    { categoria: '(-) Devoluções', valor: -2000 }
  ],
  custos: [
    { categoria: 'Custo das Mercadorias Vendidas', valor: 52000 },
    { categoria: 'Despesas de Pessoal', valor: 7000 },
    { categoria: 'Aluguel e Ocupação', valor: 3000 },
    { categoria: 'Despesas Administrativas', valor: 2000 },
    { categoria: 'Despesas Financeiras', valor: 1500 }
  ],
  receitaBruta: 87000,
  devolucoes: 2000,
  receitaLiquida: 85000,
  custoMercadorias: 52000,
  lucroBruto: 33000,
  percentualMargem: 38.8,
  despesasOperacionais: 12000,
  ebitda: 21000,
  despesasFinanceiras: 1500,
  lucroLiquido: 19500,
  percentualMargemLiquida: 22.9,
  periodos: [
    { mes: 'Jan', receita: 72000, custo: 44000, lucro: 28000 },
    { mes: 'Fev', receita: 78000, custo: 47000, lucro: 31000 },
    { mes: 'Mar', receita: 81000, custo: 49000, lucro: 32000 },
    { mes: 'Abr', receita: 83000, custo: 50500, lucro: 32500 },
    { mes: 'Mai', receita: 87000, custo: 52000, lucro: 35000 }
  ]
};

@Component({
  selector: 'chb-dre-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, DropdownModule, FormsModule,
    NgxEchartsDirective, SkeletonModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">DRE — Demonstrativo de Resultado</h2>
      <div class="toolbar-actions">
        <p-dropdown [options]="periodoOptions" [(ngModel)]="periodoSelecionado"
                    optionLabel="label" optionValue="value"
                    (onChange)="carregar()">
        </p-dropdown>
        <button pButton icon="pi pi-print" label="Exportar PDF" class="p-button-outlined"
                (click)="exportarPdf()"></button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    @if (loading()) {
      @for (i of [1,2,3,4,5]; track i) { <p-skeleton height="2.5rem" styleClass="mb-2"></p-skeleton> }
    } @else if (dre()) {
      <div class="dre-container">
        <!-- Tabela DRE Estruturada -->
        <div class="dre-tabela">
          <div class="dre-row dre-header">
            <span>DEMONSTRATIVO DE RESULTADO</span>
            <span>{{ periodoSelecionado }}</span>
          </div>

          <div class="dre-row dre-receita-bruta">
            <span>RECEITA BRUTA DE VENDAS</span>
            <span>{{ dre()!.receitaBruta | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div class="dre-row dre-deducao">
            <span>&nbsp;&nbsp;(-) Devoluções / Cancelamentos</span>
            <span class="text-red">{{ dre()!.devolucoes | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div class="dre-row dre-resultado">
            <span>= RECEITA LÍQUIDA</span>
            <span>{{ dre()!.receitaLiquida | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>

          <div class="dre-row dre-separador">
            <span>CUSTO DAS MERCADORIAS VENDIDAS (CMV)</span>
            <span class="text-red">{{ dre()!.custoMercadorias | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>

          <div class="dre-row dre-resultado dre-lucro-bruto">
            <span>= LUCRO BRUTO</span>
            <span>
              {{ dre()!.lucroBruto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              <span class="margem-badge">{{ dre()!.percentualMargem }}%</span>
            </span>
          </div>

          @for (desp of dre()!.custos.slice(1); track desp.categoria) {
            <div class="dre-row dre-deducao">
              <span>&nbsp;&nbsp;(-) {{ desp.categoria }}</span>
              <span class="text-red">{{ desp.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            </div>
          }

          <div class="dre-row dre-resultado">
            <span>= EBITDA</span>
            <span>{{ dre()!.ebitda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>

          <div class="dre-row dre-deducao">
            <span>&nbsp;&nbsp;(-) Despesas Financeiras</span>
            <span class="text-red">{{ dre()!.despesasFinanceiras | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>

          <div class="dre-row dre-resultado dre-lucro-liquido">
            <span>= LUCRO LÍQUIDO</span>
            <span>
              {{ dre()!.lucroLiquido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              <span class="margem-badge margem-teal">{{ dre()!.percentualMargemLiquida }}%</span>
            </span>
          </div>
        </div>

        <!-- Gráfico ECharts -->
        <div class="grafico-container">
          <h3 class="grafico-titulo">Evolução Mensal</h3>
          <div echarts [options]="chartOptions()" style="height:320px"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0 1rem; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .dre-container { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
    @media (max-width:900px) { .dre-container { grid-template-columns:1fr; } }
    .dre-tabela { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; overflow:hidden; }
    .dre-row { display:flex; justify-content:space-between; align-items:center; padding:.55rem 1rem; font-size:.9rem; border-bottom:1px solid var(--chb-border); }
    .dre-row:last-child { border-bottom:none; }
    .dre-header { background:var(--chb-navy); color:#fff; font-weight:900; font-size:.82rem; text-transform:uppercase; }
    .dre-receita-bruta { font-weight:700; background:color-mix(in srgb,#16a34a 5%,var(--chb-surface)); }
    .dre-deducao { color:var(--chb-text-muted); font-size:.87rem; }
    .dre-separador { font-weight:700; background:color-mix(in srgb,#dc2626 5%,var(--chb-surface)); }
    .dre-resultado { font-weight:700; border-top:2px solid var(--chb-border); }
    .dre-lucro-bruto { background:color-mix(in srgb,#16a34a 8%,var(--chb-surface)); }
    .dre-lucro-liquido { background:color-mix(in srgb,var(--chb-teal) 10%,var(--chb-surface)); font-size:1rem; }
    .text-red { color:#dc2626; }
    .margem-badge { background:#16a34a; color:#fff; border-radius:.25rem; padding:.1rem .4rem; font-size:.72rem; margin-left:.5rem; }
    .margem-teal { background:var(--chb-teal); }
    .grafico-container { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .grafico-titulo { margin:0 0 .75rem; font-size:.95rem; font-weight:700; color:var(--chb-text); }
  `]
})
export class DrePage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly dre = signal<typeof DEMO_DRE | null>(null);
  readonly loading = signal(false);
  periodoSelecionado = '2026';

  readonly periodoOptions = [
    { label: 'Janeiro-Maio/2026', value: '2026' },
    { label: 'Janeiro-Dezembro/2025', value: '2025' }
  ];

  readonly chartOptions = computed((): EChartsOption => {
    const data = this.dre();
    if (!data) return {};
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['Receita', 'Custo', 'Lucro'] },
      xAxis: { type: 'category', data: data.periodos.map(p => p.mes) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `R$ ${(v/1000).toFixed(0)}k` } },
      series: [
        { name: 'Receita', type: 'bar', data: data.periodos.map(p => p.receita), itemStyle: { color: '#16a34a' } },
        { name: 'Custo', type: 'bar', data: data.periodos.map(p => p.custo), itemStyle: { color: '#dc2626' } },
        { name: 'Lucro', type: 'line', data: data.periodos.map(p => p.lucro), itemStyle: { color: '#1A237E' }, lineStyle: { width: 3 } }
      ]
    };
  });

  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any>('/api/v1/gerencial/dre')
      .pipe(catchError(() => of(DEMO_DRE)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.dre.set(data));
  }

  exportarPdf(): void {
    window.print();
  }
}

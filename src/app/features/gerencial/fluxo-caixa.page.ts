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
import { CurrencyPipe, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

const semanas = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'];

const DEMO_FLUXO = {
  saldoAtual: 48500,
  entradasPrevistas: 92000,
  saidasPrevistas: 71000,
  saldoProjetado: 69500,
  semanas: semanas.map((s, i) => {
    const base = 48500 + i * 1750;
    const entradas = 7000 + Math.sin(i) * 1200 + i * 400;
    const saidas = 5500 + Math.cos(i) * 800 + i * 200;
    const saldo = base + entradas - saidas;
    return {
      semana: s,
      entradas: Math.round(entradas),
      saidas: Math.round(saidas),
      saldo: Math.round(saldo)
    };
  }),
  lancamentos: [
    { data: '2026-05-20', descricao: 'Recebimento — Nota 2841', tipo: 'ENTRADA', valor: 4800, origem: 'Contas a Receber' },
    { data: '2026-05-21', descricao: 'Fornecedor Peças SA — Fatura 553', tipo: 'SAIDA', valor: 3200, origem: 'Contas a Pagar' },
    { data: '2026-05-22', descricao: 'Recebimento — Nota 2842', tipo: 'ENTRADA', valor: 6100, origem: 'Contas a Receber' },
    { data: '2026-05-23', descricao: 'Folha de Pagamento — Mai/26', tipo: 'SAIDA', valor: 7000, origem: 'Despesas Fixas' },
    { data: '2026-05-24', descricao: 'Venda PDV Acumulado', tipo: 'ENTRADA', valor: 9500, origem: 'PDV' },
    { data: '2026-05-26', descricao: 'Aluguel Maio/26', tipo: 'SAIDA', valor: 3000, origem: 'Despesas Fixas' },
    { data: '2026-05-28', descricao: 'Recebimento — Nota 2845', tipo: 'ENTRADA', valor: 5200, origem: 'Contas a Receber' },
    { data: '2026-05-29', descricao: 'Energia / Telefone', tipo: 'SAIDA', valor: 1400, origem: 'Despesas Fixas' }
  ]
};

@Component({
  selector: 'chb-fluxo-caixa-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, DatePipe, DropdownModule, FormsModule,
    NgxEchartsDirective, SkeletonModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Fluxo de Caixa Projetado</h2>
      <div class="toolbar-actions">
        <p-dropdown [options]="horizonteOptions" [(ngModel)]="horizonteSelecionado"
                    optionLabel="label" optionValue="value"
                    (onChange)="carregar()">
        </p-dropdown>
        <button pButton icon="pi pi-print" label="Exportar PDF" class="p-button-outlined"
                (click)="exportarPdf()"></button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    @if (loading()) {
      @for (i of [1,2,3,4]; track i) { <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton> }
    } @else if (fluxo()) {
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Saldo Atual</span>
          <span class="kpi-value">{{ fluxo()!.saldoAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="kpi-card kpi-green">
          <span class="kpi-label">Entradas Previstas (12 sem.)</span>
          <span class="kpi-value">{{ fluxo()!.entradasPrevistas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="kpi-card kpi-red">
          <span class="kpi-label">Saídas Previstas (12 sem.)</span>
          <span class="kpi-value">{{ fluxo()!.saidasPrevistas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="kpi-card kpi-teal">
          <span class="kpi-label">Saldo Projetado Final</span>
          <span class="kpi-value">{{ fluxo()!.saldoProjetado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
      </div>

      <!-- Gráfico Projetado -->
      <div class="grafico-container">
        <h3 class="grafico-titulo">Projeção 12 Semanas — Entradas × Saídas × Saldo</h3>
        <div echarts [options]="chartOptions()" style="height:360px"></div>
      </div>

      <!-- Tabela de Lançamentos Futuros -->
      <div class="lancamentos-container">
        <h3 class="section-titulo">Lançamentos Previstos</h3>
        <table class="lancamentos-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Origem</th>
              <th>Tipo</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            @for (l of fluxo()!.lancamentos; track l.descricao) {
              <tr>
                <td>{{ l.data | date:'dd/MM':'':'' }}</td>
                <td>{{ l.descricao }}</td>
                <td class="text-muted">{{ l.origem }}</td>
                <td>
                  <p-tag [value]="l.tipo" [severity]="l.tipo === 'ENTRADA' ? 'success' : 'danger'"></p-tag>
                </td>
                <td class="text-right" [class.text-green]="l.tipo === 'ENTRADA'" [class.text-red]="l.tipo === 'SAIDA'">
                  {{ l.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0 1rem; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }

    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.25rem; }
    @media (max-width:900px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:520px) { .kpi-grid { grid-template-columns:1fr; } }

    .kpi-card { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem 1.25rem; display:flex; flex-direction:column; gap:.35rem; }
    .kpi-card.kpi-green { border-left:4px solid #16a34a; }
    .kpi-card.kpi-red { border-left:4px solid #dc2626; }
    .kpi-card.kpi-teal { border-left:4px solid var(--chb-teal); }
    .kpi-label { font-size:.75rem; font-weight:700; color:var(--chb-text-muted); text-transform:uppercase; letter-spacing:.03em; }
    .kpi-value { font-size:1.35rem; font-weight:900; color:var(--chb-text); }

    .grafico-container { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin-bottom:1.25rem; }
    .grafico-titulo { margin:0 0 .75rem; font-size:.95rem; font-weight:700; color:var(--chb-text); }

    .lancamentos-container { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .section-titulo { margin:0 0 .75rem; font-size:.95rem; font-weight:700; color:var(--chb-text); }
    .lancamentos-table { width:100%; border-collapse:collapse; font-size:.88rem; }
    .lancamentos-table th { padding:.5rem .75rem; text-align:left; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); border-bottom:2px solid var(--chb-border); }
    .lancamentos-table td { padding:.55rem .75rem; border-bottom:1px solid var(--chb-border); color:var(--chb-text); vertical-align:middle; }
    .lancamentos-table tr:last-child td { border-bottom:none; }
    .lancamentos-table tr:hover td { background:color-mix(in srgb,var(--chb-surface-muted) 60%,transparent); }
    .text-right { text-align:right; }
    .text-muted { color:var(--chb-text-muted); }
    .text-green { color:#16a34a; font-weight:700; }
    .text-red { color:#dc2626; font-weight:700; }
  `]
})
export class FluxoCaixaPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  readonly fluxo = signal<typeof DEMO_FLUXO | null>(null);
  readonly loading = signal(false);
  horizonteSelecionado = '12s';

  readonly horizonteOptions = [
    { label: '4 semanas', value: '4s' },
    { label: '8 semanas', value: '8s' },
    { label: '12 semanas', value: '12s' }
  ];

  readonly chartOptions = computed((): EChartsOption => {
    const data = this.fluxo();
    if (!data) return {};
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['Entradas', 'Saídas', 'Saldo'] },
      xAxis: { type: 'category', data: data.semanas.map(s => s.semana) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `R$ ${(v / 1000).toFixed(0)}k` } },
      series: [
        {
          name: 'Entradas',
          type: 'bar',
          data: data.semanas.map(s => s.entradas),
          itemStyle: { color: '#16a34a' }
        },
        {
          name: 'Saídas',
          type: 'bar',
          data: data.semanas.map(s => s.saidas),
          itemStyle: { color: '#dc2626' }
        },
        {
          name: 'Saldo',
          type: 'line',
          data: data.semanas.map(s => s.saldo),
          itemStyle: { color: '#1A237E' },
          lineStyle: { width: 3 },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    };
  });

  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any>('/api/v1/gerencial/fluxo-caixa')
      .pipe(catchError(() => of(DEMO_FLUXO)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.fluxo.set(data));
  }

  exportarPdf(): void {
    window.print();
  }
}

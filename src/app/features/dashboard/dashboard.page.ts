import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../core/auth/auth.service';

interface DashboardData {
  preVendasAbertas: number;
  itensAbaixoMinimo: number;
  caixaAberto: boolean;
  vendasHoje: number;
  contasReceberAVencer: number;
  contasPagarAVencer: number;
  totalContasReceber: number;
  totalContasPagar: number;
  nfceHoje: number;
  pedidosCompraAbertos: number;
}

type DashboardTile = {
  title: string;
  value: string;
  detail: string;
  icon: string;
  route: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
};

const workItems = [
  { title: 'Separar PV-009811', owner: 'Vendas', status: 'Hoje', route: '/vendas/pre-vendas' },
  { title: 'Conferir XML NE-00077', owner: 'Compras', status: 'Pendente', route: '/compras' },
  { title: 'Finalizar OS-00416 no caixa', owner: 'Oficina', status: 'Caixa', route: '/servicos/oficina' },
  { title: 'Revisar NCM da NFC-e 1283', owner: 'Fiscal', status: 'Critico', route: '/fiscal' }
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

@Component({
  selector: 'chb-dashboard-page',
  standalone: true,
  imports: [ButtonModule, NgxEchartsDirective, RouterLink, TagModule],
  template: `
    <section class="dashboard">
      <header class="dashboard__hero">
        <div>
          <p>{{ auth.activeStore()?.name || 'Loja nao selecionada' }}</p>
          <h2>Operação comercial</h2>
          <span>Acompanhamento integrado de vendas, estoque, caixa, oficina, fiscal e financeiro da loja ativa.</span>
        </div>
        <a pButton routerLink="/vendas/pdv" icon="pi pi-calculator" label="Abrir PDV"></a>
      </header>

      <div class="dashboard__tiles">
        @for (tile of tiles(); track tile.title) {
          <a class="tile" [routerLink]="tile.route">
            <span [class]="'tile__icon tile__icon--' + tile.tone">
              <i [class]="tile.icon" aria-hidden="true"></i>
            </span>
            <span>
              <small>{{ tile.title }}</small>
              <strong>{{ tile.value }}</strong>
              <em>{{ tile.detail }}</em>
            </span>
          </a>
        }
      </div>

      <div class="dashboard__grid">
        <article class="panel">
          <div class="panel__title">
            <p>Fluxo do dia</p>
            <h3>Fila operacional</h3>
          </div>
          <div class="work-list">
            @for (item of workItems; track item.title) {
              <a class="work-list__item" [routerLink]="item.route">
                <span>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.owner }}</small>
                </span>
                <p-tag [value]="item.status" [severity]="item.status === 'Critico' ? 'danger' : item.status === 'Pendente' ? 'warning' : 'info'"></p-tag>
              </a>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel__title">
            <p>Semana</p>
            <h3>Vendas por dia</h3>
          </div>
          <div echarts [options]="vendasChartOptions()" class="chart"></div>
        </article>

        <article class="panel">
          <div class="panel__title">
            <p>Pagamentos</p>
            <h3>Distribuicao por forma</h3>
          </div>
          <div echarts [options]="pagamentosChartOptions()" class="chart"></div>
        </article>

        <article class="panel panel--wide">
          <div class="panel__title">
            <p>Atalhos</p>
            <h3>Areas principais</h3>
          </div>
          <div class="shortcuts">
            <a routerLink="/cadastros/clientes"><i class="pi pi-users"></i><span>Clientes</span></a>
            <a routerLink="/cadastros/produtos"><i class="pi pi-box"></i><span>Produtos</span></a>
            <a routerLink="/estoque/transferencias"><i class="pi pi-send"></i><span>Transferencias</span></a>
            <a routerLink="/financeiro"><i class="pi pi-chart-line"></i><span>Financeiro</span></a>
            <a routerLink="/compras"><i class="pi pi-shopping-cart"></i><span>Compras</span></a>
            <a routerLink="/servicos/oficina"><i class="pi pi-wrench"></i><span>Oficina</span></a>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 0.85rem;
    }

    .dashboard__hero,
    .tile,
    .panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
    }

    .dashboard__hero {
      display: flex;
      min-height: 7.5rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: color-mix(in srgb, var(--chb-surface) 96%, transparent);
      color: var(--chb-text);
      padding: 1rem;
    }

    .dashboard__hero p,
    .panel__title p,
    h2,
    h3 {
      margin: 0;
    }

    .dashboard__hero p,
    .panel__title p {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .dashboard__hero p {
      color: var(--chb-text-muted);
    }

    h2 {
      margin-top: 0.2rem;
      font-size: 1.45rem;
      line-height: 1.1;
    }

    .dashboard__hero span {
      display: block;
      max-width: 44rem;
      margin-top: 0.4rem;
      color: var(--chb-text-muted);
      line-height: 1.5;
      font-size: 0.9rem;
    }

    .dashboard__tiles {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .tile {
      display: flex;
      min-width: 0;
      gap: 0.7rem;
      padding: 0.8rem;
    }

    .tile__icon {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.5rem;
      background: var(--chb-navy-50);
      color: var(--chb-navy);
    }

    .tile__icon--success {
      background: #dcfce7;
      color: #166534;
    }

    .tile__icon--warning {
      background: var(--chb-yellow-50);
      color: var(--chb-yellow-700);
    }

    .tile__icon--danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .tile small,
    .tile em {
      display: block;
      color: var(--chb-text-muted);
      font-style: normal;
      line-height: 1.35;
    }

    .tile small {
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .tile strong {
      display: block;
      margin: 0.2rem 0;
      color: var(--chb-text);
      font-size: 1.08rem;
    }

    .dashboard__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .panel {
      display: grid;
      gap: 0.75rem;
      padding: 0.85rem;
    }

    .panel--wide {
      grid-column: 1 / -1;
    }

    h3 {
      color: var(--chb-text);
      font-size: 1.1rem;
    }

    .work-list {
      display: grid;
      gap: 0.6rem;
    }

    .work-list__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      padding: 0.7rem;
    }

    .work-list__item strong,
    .work-list__item small {
      display: block;
    }

    .work-list__item small {
      margin-top: 0.2rem;
      color: var(--chb-text-muted);
      font-size: 0.8rem;
      font-weight: 800;
    }

    .chart { width: 100%; min-height: 15rem; }

    .shortcuts {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 0.65rem;
    }

    .shortcuts a {
      display: grid;
      gap: 0.55rem;
      min-height: 4.8rem;
      place-items: center;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      color: var(--chb-text);
      font-weight: 800;
      text-align: center;
      font-size: 0.86rem;
    }

    .shortcuts i {
      color: var(--chb-navy);
      font-size: 1.25rem;
    }

    @media (max-width: 1100px) {
      .dashboard__tiles,
      .shortcuts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dashboard__grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 767px) {
      .dashboard__hero {
        align-items: stretch;
        flex-direction: column;
      }

      .dashboard__tiles,
      .shortcuts {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  private readonly data = signal<DashboardData | null>(null);

  readonly tiles = computed<DashboardTile[]>(() => {
    const d = this.data();
    if (!d) {
      return [
        { title: 'Pre-vendas abertas', value: '-', detail: 'carregando...', icon: 'pi pi-shopping-bag', route: '/vendas/pre-vendas', tone: 'info' },
        { title: 'Estoque critico', value: '-', detail: 'carregando...', icon: 'pi pi-exclamation-triangle', route: '/estoque/saldos', tone: 'warning' },
        { title: 'Caixa', value: '-', detail: 'carregando...', icon: 'pi pi-calculator', route: '/caixa/operacoes', tone: 'info' },
        { title: 'Financeiro', value: '-', detail: 'carregando...', icon: 'pi pi-chart-line', route: '/financeiro', tone: 'success' }
      ];
    }
    return [
      {
        title: 'Pre-vendas abertas',
        value: String(d.preVendasAbertas),
        detail: 'pre-vendas em aberto na loja',
        icon: 'pi pi-shopping-bag',
        route: '/vendas/pre-vendas',
        tone: 'info'
      },
      {
        title: 'Estoque critico',
        value: d.itensAbaixoMinimo + ' itens',
        detail: 'abaixo do minimo na loja ativa',
        icon: 'pi pi-exclamation-triangle',
        route: '/estoque/saldos',
        tone: 'warning'
      },
      {
        title: 'Caixa',
        value: d.caixaAberto ? 'Aberto' : 'Fechado',
        detail: d.caixaAberto ? 'sessao de caixa ativa' : 'nenhuma sessao aberta',
        icon: 'pi pi-calculator',
        route: '/caixa/operacoes',
        tone: d.caixaAberto ? 'success' : 'danger'
      },
      {
        title: 'Financeiro',
        value: formatBRL(d.totalContasReceber),
        detail: d.contasReceberAVencer + ' contas a vencer em 7 dias',
        icon: 'pi pi-chart-line',
        route: '/financeiro',
        tone: 'success'
      }
    ];
  });

  readonly workItems = workItems;

  readonly vendasChartOptions = computed<EChartsOption>(() => {
    const total = this.data()?.vendasHoje ?? 0;
    const base = total > 0 ? total : 9884;
    const valores = [0.76, 1.1, 0.92, 1.24, 1.45, 0.68].map((fator) => Math.round(base * fator));

    return {
      color: ['#F9A825'],
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => formatBRL(Number(value ?? 0))
      },
      grid: { left: 48, right: 16, top: 22, bottom: 32 },
      xAxis: {
        type: 'category',
        data: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'R$',
        axisLabel: {
          formatter: (value: number) => `${Math.round(value / 1000)}k`
        }
      },
      series: [{
        name: 'Vendas',
        type: 'bar',
        barMaxWidth: 34,
        data: valores,
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    };
  });

  readonly pagamentosChartOptions = computed<EChartsOption>(() => {
    const total = this.data()?.vendasHoje ?? 9884;
    return {
      color: ['#F9A825', '#00897B', '#1A237E', '#60a5fa'],
      tooltip: {
        trigger: 'item',
        valueFormatter: (value: unknown) => formatBRL(Number(value ?? 0))
      },
      legend: {
        bottom: 0,
        left: 'center'
      },
      series: [{
        name: 'Forma de pagamento',
        type: 'pie',
        radius: ['46%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b}' },
        data: [
          { name: 'Dinheiro', value: Math.round(total * 0.19) },
          { name: 'Pix', value: Math.round(total * 0.32) },
          { name: 'Debito', value: Math.round(total * 0.22) },
          { name: 'Credito', value: Math.round(total * 0.27) }
        ]
      }]
    };
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.http.get<DashboardData>('/api/v1/gerencial/dashboard').subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.data.set({
          preVendasAbertas: 0,
          itensAbaixoMinimo: 0,
          caixaAberto: false,
          vendasHoje: 0,
          contasReceberAVencer: 0,
          contasPagarAVencer: 0,
          totalContasReceber: 0,
          totalContasPagar: 0,
          nfceHoje: 0,
          pedidosCompraAbertos: 0
        });
        this.loading.set(false);
      }
    });
  }
}

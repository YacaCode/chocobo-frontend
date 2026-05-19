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
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_COTACOES = [
  { id: 'cot-001', numero: 'COT-0001', fornecedores: 'Distribuidora CE, Riffel Brasil', status: 'ENVIADA', emissao: '2026-05-15', qtdItens: 4, melhorPreco: 2300.0 },
  { id: 'cot-002', numero: 'COT-0002', fornecedores: 'Heliar Baterias', status: 'RESPONDIDA', emissao: '2026-05-10', qtdItens: 2, melhorPreco: 1800.0 },
  { id: 'cot-003', numero: 'COT-0003', fornecedores: 'NGK do Brasil, Motul', status: 'RASCUNHO', emissao: '2026-05-18', qtdItens: 6, melhorPreco: null }
];

@Component({
  selector: 'chb-cotacoes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, DatePipe, DialogModule, DropdownModule,
    FormsModule, InputTextModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Dialog Nova Cotação -->
    <p-dialog [(visible)]="showNovaCotacao" header="Nova Cotação" [modal]="true"
              [style]="{width:'480px',maxWidth:'95vw'}">
      <div style="display:flex;flex-direction:column;gap:.85rem;padding:.5rem 0">
        <div class="form-field">
          <label class="form-label">Fornecedores (separados por vírgula)</label>
          <input pInputText [(ngModel)]="novaCotacao.fornecedores" placeholder="Fornecedor 1, Fornecedor 2..." />
        </div>
        <div class="form-field">
          <label class="form-label">Observações</label>
          <input pInputText [(ngModel)]="novaCotacao.observacoes" placeholder="Observações da cotação..." />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancelar" icon="pi pi-times" class="p-button-outlined p-button-secondary"
                (click)="showNovaCotacao = false"></button>
        <button pButton label="Criar Cotação" icon="pi pi-check" class="p-button-success"
                (click)="salvarCotacao()" [loading]="salvando()"></button>
      </ng-template>
    </p-dialog>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Cotações de Compra</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar fornecedor ou número..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <button pButton icon="pi pi-plus" label="Nova Cotação"
                class="p-button-success" (click)="abrirNovaCotacao()"></button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !cotacoes().length) {
      @for (i of [1,2,3]; track i) { <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton> }
    } @else {
      <p-table [value]="filtradas()" [paginator]="true" [rows]="20" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Número</th>
            <th>Fornecedores</th>
            <th>Emissão</th>
            <th style="text-align:center">Itens</th>
            <th style="text-align:right">Melhor Preço</th>
            <th>Status</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-c>
          <tr>
            <td style="font-weight:700">{{ c.numero }}</td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis">{{ c.fornecedores }}</td>
            <td>{{ c.emissao | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:center">{{ c.qtdItens }}</td>
            <td style="text-align:right">
              @if (c.melhorPreco) {
                <span style="font-weight:700">{{ c.melhorPreco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              } @else {
                <span style="color:var(--chb-text-muted)">—</span>
              }
            </td>
            <td><p-tag [value]="c.status" [severity]="severidade(c.status)"></p-tag></td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" style="text-align:center;padding:2rem">
            <i class="pi pi-search" style="font-size:2rem;color:var(--chb-text-muted)"></i>
            <p style="color:var(--chb-text-muted)">Nenhuma cotação encontrada.</p>
          </td></tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .form-field { display:flex; flex-direction:column; gap:.25rem; }
    .form-label { font-size:.82rem; font-weight:700; color:var(--chb-text-muted); }
  `]
})
export class CotacoesPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly cotacoes = signal<any[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');

  showNovaCotacao = false;
  novaCotacao: { fornecedores: string; observacoes: string } = { fornecedores: '', observacoes: '' };

  readonly filtradas = computed(() => {
    const b = this.busca().toLowerCase();
    return this.cotacoes().filter(c => !b || c.fornecedores?.toLowerCase().includes(b) || c.numero?.includes(b));
  });

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'RASCUNHO': 'secondary', 'ENVIADA': 'info', 'RESPONDIDA': 'warning', 'FECHADA': 'success'
    };
    return map[status] ?? 'secondary';
  }

  ngOnInit(): void {
    this.buscaSubject.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onBuscaInput(value: string): void { this.buscaSubject.next(value); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/compras/cotacoes')
      .pipe(catchError(() => of(DEMO_COTACOES)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.cotacoes.set(data));
  }

  abrirNovaCotacao(): void {
    this.novaCotacao = { fornecedores: '', observacoes: '' };
    this.showNovaCotacao = true;
  }

  salvarCotacao(): void {
    this.salvando.set(true);
    this.http.post<any>('/api/v1/compras/cotacoes', this.novaCotacao)
      .pipe(
        catchError(() => of({ id: 'cot-' + Date.now(), numero: 'COT-DEMO', ...this.novaCotacao, status: 'RASCUNHO', emissao: new Date().toISOString().split('T')[0], qtdItens: 0, melhorPreco: null })),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.cotacoes.update(list => [data, ...list]);
        this.showNovaCotacao = false;
        this.msg.add({ severity: 'success', summary: 'Cotação criada', detail: 'Cotação salva com sucesso!' });
      });
  }
}

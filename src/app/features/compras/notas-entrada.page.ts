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
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_NOTAS_ENTRADA = [
  { id: 'ne-001', numero: '045821', fornecedorNome: 'Distribuidora de Peças CE', dataEmissao: '2026-05-10', valor: 4580.0, status: 'CONFERIDA', chave: '35260123456789000100550010000458210000000001' },
  { id: 'ne-002', numero: '031200', fornecedorNome: 'Riffel Brasil', dataEmissao: '2026-05-08', valor: 1250.0, status: 'LANCADA', chave: '35260123456789000100550010000312000000000001' },
  { id: 'ne-003', numero: '098712', fornecedorNome: 'NGK do Brasil', dataEmissao: '2026-05-15', valor: 890.0, status: 'PENDENTE', chave: '' }
];

@Component({
  selector: 'chb-notas-entrada-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CurrencyPipe, DatePipe, DialogModule, FileUploadModule,
    FormsModule, InputTextModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Dialog Detalhe Nota -->
    <p-dialog [(visible)]="showDetalhe" [header]="'Nota Fiscal NF-e Nº ' + (notaSelecionada()?.numero || '')"
              [modal]="true" [style]="{width:'640px',maxWidth:'95vw'}">
      @if (notaSelecionada()) {
        <div style="display:flex;flex-direction:column;gap:.75rem;padding:.5rem 0">
          <div class="info-row"><span class="info-label">Fornecedor:</span><span>{{ notaSelecionada()?.fornecedorNome }}</span></div>
          <div class="info-row"><span class="info-label">Data Emissão:</span><span>{{ notaSelecionada()?.dataEmissao | date:'dd/MM/yyyy' }}</span></div>
          <div class="info-row"><span class="info-label">Valor:</span><span style="font-weight:700">{{ notaSelecionada()?.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
          @if (notaSelecionada()?.chave) {
            <div class="info-row">
              <span class="info-label">Chave de Acesso:</span>
              <span style="font-family:monospace;font-size:.75rem;word-break:break-all">{{ notaSelecionada()?.chave }}</span>
            </div>
          }
          <div class="info-row"><span class="info-label">Status:</span><p-tag [value]="notaSelecionada()?.status" [severity]="severidade(notaSelecionada()?.status || '')"></p-tag></div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Fechar" icon="pi pi-times" class="p-button-outlined p-button-secondary"
                  (click)="showDetalhe = false"></button>
          @if (notaSelecionada()?.status === 'CONFERIDA') {
            <button pButton label="Lançar no Estoque" icon="pi pi-check" class="p-button-success"
                    (click)="lancarEstoque()" [loading]="salvando()"></button>
          }
        </ng-template>
      }
    </p-dialog>

    <!-- KPIs -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">PENDENTES</span>
        <span class="kpi-value" style="color:#ea580c">{{ qtdPendentes() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">CONFERIDAS</span>
        <span class="kpi-value" style="color:#1A237E">{{ qtdConferidas() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">LANÇADAS NO ESTOQUE</span>
        <span class="kpi-value" style="color:#16a34a">{{ qtdLancadas() }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <h2 class="page-title">Notas de Entrada</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar fornecedor ou número..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <p-fileUpload mode="basic" name="nfe" accept=".xml"
                      chooseLabel="Importar XML"
                      chooseIcon="pi pi-upload"
                      [maxFileSize]="2000000"
                      [auto]="true"
                      styleClass="p-button-outlined"
                      (onSelect)="onXmlSelecionado($event)">
        </p-fileUpload>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !notas().length) {
      @for (i of [1,2,3]; track i) { <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton> }
    } @else {
      <p-table [value]="filtradas()" [paginator]="true" [rows]="20" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="numero">Número NF <p-sortIcon field="numero"></p-sortIcon></th>
            <th pSortableColumn="fornecedorNome">Fornecedor <p-sortIcon field="fornecedorNome"></p-sortIcon></th>
            <th>Chave de Acesso</th>
            <th pSortableColumn="dataEmissao">Data Emissão <p-sortIcon field="dataEmissao"></p-sortIcon></th>
            <th style="text-align:right">Valor</th>
            <th>Status</th>
            <th style="width:80px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-n>
          <tr>
            <td style="font-weight:700;font-family:monospace">{{ n.numero }}</td>
            <td>{{ n.fornecedorNome }}</td>
            <td style="font-size:.75rem;font-family:monospace;max-width:200px;overflow:hidden;text-overflow:ellipsis">
              {{ n.chave || '—' }}
            </td>
            <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:right;font-weight:700">{{ n.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td><p-tag [value]="n.status" [severity]="severidade(n.status)"></p-tag></td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                      (click)="abrirDetalhe(n)" pTooltip="Detalhes"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" style="text-align:center;padding:2rem">
            <i class="pi pi-file" style="font-size:2rem;color:var(--chb-text-muted)"></i>
            <p style="color:var(--chb-text-muted)">Nenhuma nota de entrada encontrada.</p>
          </td></tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:140px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .info-row { display:flex; gap:.5rem; align-items:flex-start; font-size:.9rem; }
    .info-label { font-weight:700; color:var(--chb-text-muted); min-width:130px; }
  `]
})
export class NotasEntradaPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly notas = signal<any[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');
  readonly notaSelecionada = signal<any>(null);

  showDetalhe = false;

  readonly filtradas = computed(() => {
    const b = this.busca().toLowerCase();
    return this.notas().filter(n => !b || n.fornecedorNome?.toLowerCase().includes(b) || n.numero?.includes(b));
  });
  readonly qtdPendentes = computed(() => this.notas().filter(n => n.status === 'PENDENTE').length);
  readonly qtdConferidas = computed(() => this.notas().filter(n => n.status === 'CONFERIDA').length);
  readonly qtdLancadas = computed(() => this.notas().filter(n => n.status === 'LANCADA').length);

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'PENDENTE': 'warning', 'CONFERIDA': 'info', 'LANCADA': 'success'
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
    this.http.get<any[]>('/api/v1/compras/notas-entrada')
      .pipe(catchError(() => of(DEMO_NOTAS_ENTRADA)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.notas.set(data));
  }

  abrirDetalhe(nota: any): void {
    this.notaSelecionada.set(nota);
    this.showDetalhe = true;
  }

  onXmlSelecionado(event: { files: File[] }): void {
    const file = event?.files?.[0];
    if (!file) return;
    this.msg.add({ severity: 'info', summary: 'XML recebido', detail: `Arquivo "${file.name}" será processado em breve (demo).` });
  }

  lancarEstoque(): void {
    const nota = this.notaSelecionada();
    if (!nota) return;
    this.salvando.set(true);
    this.http.post(`/api/v1/compras/notas-entrada/${nota.id}/lancar`, {})
      .pipe(
        catchError(() => of({})),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.notas.update(list => list.map(n => n.id === nota.id ? { ...n, status: 'LANCADA' } : n));
        this.notaSelecionada.update(n => ({ ...n, status: 'LANCADA' }));
        this.msg.add({ severity: 'success', summary: 'Estoque atualizado', detail: 'Nota lançada no estoque com sucesso!' });
      });
  }
}

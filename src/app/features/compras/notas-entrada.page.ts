import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
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
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  ProdutoBuscaDialogComponent,
  type ProdutoItem
} from '../../shared/produto-busca-dialog/produto-busca-dialog.component';

interface NotaEntradaItem {
  id?: string;
  produtoId?: string | null;
  codigoProduto: string;
  descricao: string;
  ncm?: string | null;
  cfop?: string | null;
  cstIcms?: string | null;
  quantidade: number;
  unidade?: string | null;
  valorUnitario: number;
  valorTotal: number;
  valorIpi?: number;
  percIcms?: number;
  mapeadoProdutoId?: string | null;
  produtoCodigo?: string;
  produtoDescricao?: string;
}

interface NotaEntrada {
  id: string;
  numero: string;
  serie?: string | null;
  fornecedorId?: string | null;
  fornecedorNome: string;
  cnpjEmitente?: string | null;
  chaveAcesso: string;
  dataEmissao?: string | null;
  dataEntrada?: string | null;
  valorTotal: number;
  valorFrete?: number;
  valorIpi?: number;
  status: string;
  xmlContent?: string | null;
  itens: NotaEntradaItem[];
}

const DEMO_NOTAS_ENTRADA: NotaEntrada[] = [
  {
    id: 'ne-001',
    numero: '045821',
    serie: '1',
    fornecedorNome: 'Distribuidora de Pecas CE',
    dataEmissao: '2026-05-10T10:00:00-03:00',
    valorTotal: 4580,
    status: 'CONFERIDA',
    chaveAcesso: '35260123456789000100550010000458210000000001',
    itens: []
  },
  {
    id: 'ne-002',
    numero: '031200',
    serie: '1',
    fornecedorNome: 'Riffel Brasil',
    dataEmissao: '2026-05-08T10:00:00-03:00',
    valorTotal: 1250,
    status: 'LANCADA',
    chaveAcesso: '35260123456789000100550010000312000000000001',
    itens: []
  },
  {
    id: 'ne-003',
    numero: '098712',
    serie: '2',
    fornecedorNome: 'NGK do Brasil',
    dataEmissao: '2026-05-15T10:00:00-03:00',
    valorTotal: 890,
    status: 'PENDENTE',
    chaveAcesso: '',
    itens: []
  }
];

@Component({
  selector: 'chb-notas-entrada-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    DialogModule,
    FileUploadModule,
    FormsModule,
    InputTextModule,
    ProdutoBuscaDialogComponent,
    SkeletonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <chb-produto-busca-dialog
      [(visible)]="showProdutoDialog"
      (produtoSelecionado)="onProdutoVinculado($event)">
    </chb-produto-busca-dialog>

    <p-dialog
      [(visible)]="showImportDialog"
      header="Importar NF-e"
      [modal]="true"
      [style]="{ width: 'min(96vw, 78rem)' }"
      [contentStyle]="{ 'max-height': '72vh', overflow: 'auto' }">
      @if (previewNota()) {
        <div class="preview-header">
          <div class="info-tile">
            <span>Fornecedor</span>
            <strong>{{ previewNota()?.fornecedorNome }}</strong>
          </div>
          <div class="info-tile">
            <span>NF-e</span>
            <strong>{{ previewNota()?.numero }} / {{ previewNota()?.serie || 'S/N' }}</strong>
          </div>
          <div class="info-tile">
            <span>Emissao</span>
            <strong>{{ previewNota()?.dataEmissao | date:'dd/MM/yyyy' }}</strong>
          </div>
          <div class="info-tile">
            <span>Total</span>
            <strong>{{ previewNota()?.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
        </div>

        <div class="chave-line">{{ previewNota()?.chaveAcesso }}</div>

        <p-table [value]="previewNota()?.itens || []" dataKey="codigoProduto" styleClass="preview-table">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:8rem">Codigo NF</th>
              <th>Descricao</th>
              <th style="width:6rem">NCM</th>
              <th style="width:5rem">CFOP</th>
              <th style="width:6rem;text-align:right">Qtd</th>
              <th style="width:8rem;text-align:right">Unitario</th>
              <th style="width:8rem;text-align:right">Total</th>
              <th style="width:16rem">Produto Chocobo</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
            <tr [class.item-pendente]="!item.mapeadoProdutoId">
              <td class="mono">{{ item.codigoProduto }}</td>
              <td>{{ item.descricao }}</td>
              <td class="mono">{{ item.ncm || '-' }}</td>
              <td class="mono">{{ item.cfop || '-' }}</td>
              <td style="text-align:right">{{ item.quantidade | number:'1.0-4':'pt-BR' }}</td>
              <td style="text-align:right">{{ item.valorUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align:right;font-weight:700">{{ item.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td>
                <div class="produto-map">
                  <p-tag
                    [value]="item.mapeadoProdutoId ? (item.produtoCodigo || 'Vinculado') : 'Pendente'"
                    [severity]="item.mapeadoProdutoId ? 'success' : 'danger'">
                  </p-tag>
                  <button
                    pButton
                    type="button"
                    icon="pi pi-link"
                    class="p-button-sm p-button-text"
                    pTooltip="Vincular produto"
                    (click)="abrirVinculoProduto(rowIndex)">
                  </button>
                </div>
                @if (item.produtoDescricao) {
                  <small class="produto-desc">{{ item.produtoDescricao }}</small>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-cell">Nenhum item encontrado no XML.</td>
            </tr>
          </ng-template>
        </p-table>
      }

      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-outlined p-button-secondary"
          (click)="fecharImportacao()">
        </button>
        <button
          pButton
          type="button"
          label="Confirmar Entrada"
          icon="pi pi-check"
          [disabled]="!podeConfirmarImportacao()"
          [loading]="salvando()"
          (click)="confirmarEntrada()">
        </button>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="showDetalhe"
      [header]="'Nota Fiscal NF-e No ' + (notaSelecionada()?.numero || '')"
      [modal]="true"
      [style]="{ width: 'min(95vw, 48rem)' }">
      @if (notaSelecionada()) {
        <div class="detalhe-grid">
          <div class="info-row"><span>Fornecedor</span><strong>{{ notaSelecionada()?.fornecedorNome }}</strong></div>
          <div class="info-row"><span>Data Emissao</span><strong>{{ notaSelecionada()?.dataEmissao | date:'dd/MM/yyyy' }}</strong></div>
          <div class="info-row"><span>Valor</span><strong>{{ notaSelecionada()?.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></div>
          <div class="info-row"><span>Status</span><p-tag [value]="notaSelecionada()?.status" [severity]="severidade(notaSelecionada()?.status || '')"></p-tag></div>
        </div>
        @if (notaSelecionada()?.chaveAcesso) {
          <div class="chave-line detalhe">{{ notaSelecionada()?.chaveAcesso }}</div>
        }
        <ng-template pTemplate="footer">
          <button
            pButton
            type="button"
            label="Fechar"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary"
            (click)="showDetalhe = false">
          </button>
          @if (podeLancarNota(notaSelecionada())) {
            <button
              pButton
              type="button"
              label="Lancar no Estoque"
              icon="pi pi-check"
              class="p-button-success"
              [loading]="salvando()"
              (click)="lancarEstoque()">
            </button>
          }
        </ng-template>
      }
    </p-dialog>

    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">Pendentes</span>
        <span class="kpi-value warn">{{ qtdPendentes() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Conferidas</span>
        <span class="kpi-value info">{{ qtdConferidas() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Lancadas</span>
        <span class="kpi-value ok">{{ qtdLancadas() }}</span>
      </div>
    </div>

    <div class="page-toolbar">
      <h2 class="page-title">Notas de Entrada</h2>
      <div class="toolbar-actions">
        <input
          pInputText
          placeholder="Buscar fornecedor ou numero..."
          [ngModel]="busca()"
          (input)="onBuscaInput($any($event.target).value)" />
        <p-fileUpload
          #xmlUpload
          mode="advanced"
          name="file"
          accept=".xml"
          [maxFileSize]="2000000"
          [customUpload]="true"
          chooseLabel="Selecionar XML"
          uploadLabel="Processar"
          cancelLabel="Limpar"
          styleClass="xml-upload"
          (uploadHandler)="onXmlUpload($event, xmlUpload)">
        </p-fileUpload>
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          pTooltip="Atualizar"
          class="p-button-outlined"
          (click)="carregar()">
        </button>
      </div>
    </div>

    @if (loading() && !notas().length) {
      @for (i of [1, 2, 3]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtradas()" [paginator]="true" [rows]="20" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="numero">Numero NF <p-sortIcon field="numero"></p-sortIcon></th>
            <th pSortableColumn="fornecedorNome">Fornecedor <p-sortIcon field="fornecedorNome"></p-sortIcon></th>
            <th>Chave de Acesso</th>
            <th pSortableColumn="dataEmissao">Data Emissao <p-sortIcon field="dataEmissao"></p-sortIcon></th>
            <th style="text-align:right">Valor</th>
            <th>Status</th>
            <th style="width:7rem">Acoes</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-n>
          <tr>
            <td class="mono strong">{{ n.numero }}</td>
            <td>{{ n.fornecedorNome }}</td>
            <td class="chave-cell">{{ n.chaveAcesso || '-' }}</td>
            <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:right;font-weight:700">{{ n.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td><p-tag [value]="n.status" [severity]="severidade(n.status)"></p-tag></td>
            <td>
              <button
                pButton
                type="button"
                icon="pi pi-eye"
                class="p-button-text p-button-sm"
                pTooltip="Detalhes"
                (click)="abrirDetalhe(n)">
              </button>
              @if (podeLancarNota(n)) {
                <button
                  pButton
                  type="button"
                  icon="pi pi-check"
                  class="p-button-text p-button-sm p-button-success"
                  pTooltip="Lancar estoque"
                  (click)="abrirDetalhe(n)">
                </button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="empty-cell">
              <i class="pi pi-file"></i>
              <span>Nenhuma nota de entrada encontrada.</span>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .kpi-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }

    .kpi-card {
      flex: 1;
      min-width: 140px;
      background: var(--chb-surface);
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      padding: 1rem;
    }

    .kpi-label {
      display: block;
      font-size: .72rem;
      font-weight: 900;
      text-transform: uppercase;
      color: var(--chb-text-muted);
    }

    .kpi-value {
      display: block;
      font-size: 1.4rem;
      font-weight: 700;
      margin-top: .25rem;
    }

    .kpi-value.warn { color: #ea580c; }
    .kpi-value.info { color: var(--chb-navy); }
    .kpi-value.ok { color: #16a34a; }

    .page-toolbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: .85rem 0;
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
      align-items: flex-start;
      justify-content: flex-end;
    }

    .toolbar-actions input {
      width: min(100vw - 2rem, 18rem);
    }

    .preview-header {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: .75rem;
      margin-bottom: .75rem;
    }

    .info-tile {
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      padding: .75rem;
      background: var(--chb-surface);
      min-width: 0;
    }

    .info-tile span,
    .info-row span {
      display: block;
      color: var(--chb-text-muted);
      font-size: .72rem;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: .2rem;
    }

    .info-tile strong,
    .info-row strong {
      color: var(--chb-text);
      overflow-wrap: anywhere;
    }

    .detalhe-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .75rem;
    }

    .info-row {
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      padding: .75rem;
      background: var(--chb-surface);
    }

    .chave-line {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: .78rem;
      word-break: break-all;
      color: var(--chb-text-muted);
      background: var(--chb-surface);
      border: 1px solid var(--chb-border);
      border-radius: .5rem;
      padding: .65rem .75rem;
      margin-bottom: .75rem;
    }

    .chave-line.detalhe {
      margin-top: .75rem;
      margin-bottom: 0;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    }

    .strong {
      font-weight: 700;
    }

    .chave-cell {
      max-width: 14rem;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: .75rem;
    }

    .produto-map {
      display: flex;
      align-items: center;
      gap: .4rem;
      min-width: 0;
    }

    .produto-desc {
      display: block;
      color: var(--chb-text-muted);
      margin-top: .2rem;
      overflow-wrap: anywhere;
    }

    .item-pendente {
      background: rgba(220, 38, 38, .06);
    }

    .empty-cell {
      text-align: center;
      padding: 2rem;
      color: var(--chb-text-muted);
    }

    .empty-cell i {
      display: block;
      font-size: 2rem;
      margin-bottom: .5rem;
    }

    :host ::ng-deep .xml-upload .p-fileupload-buttonbar {
      padding: .5rem;
      border-radius: .5rem .5rem 0 0;
    }

    :host ::ng-deep .xml-upload .p-fileupload-content {
      padding: .5rem;
      max-width: min(100vw - 2rem, 28rem);
    }

    @media (max-width: 760px) {
      .preview-header,
      .detalhe-grid {
        grid-template-columns: 1fr;
      }

      .toolbar-actions,
      .toolbar-actions input,
      :host ::ng-deep .xml-upload {
        width: 100%;
      }
    }
  `]
})
export class NotasEntradaPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly notas = signal<NotaEntrada[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly processandoXml = signal(false);
  readonly busca = signal('');
  readonly notaSelecionada = signal<NotaEntrada | null>(null);
  readonly previewNota = signal<NotaEntrada | null>(null);

  showDetalhe = false;
  showImportDialog = false;
  showProdutoDialog = false;
  private itemVinculoIndex: number | null = null;

  readonly filtradas = computed(() => {
    const b = this.busca().trim().toLowerCase();
    return this.notas().filter(n => !b
      || n.fornecedorNome.toLowerCase().includes(b)
      || n.numero.includes(b)
      || n.chaveAcesso.includes(b));
  });
  readonly qtdPendentes = computed(() => this.notas().filter(n => n.status === 'PENDENTE').length);
  readonly qtdConferidas = computed(() => this.notas().filter(n => n.status === 'CONFERIDA').length);
  readonly qtdLancadas = computed(() => this.notas().filter(n => n.status === 'LANCADA').length);

  ngOnInit(): void {
    this.buscaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      PENDENTE: 'warning',
      CONFERIDA: 'info',
      LANCADA: 'success',
      CANCELADA: 'danger'
    };
    return map[status] ?? 'secondary';
  }

  onBuscaInput(value: string): void {
    this.buscaSubject.next(value);
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<unknown>('/api/v1/compras/notas-entrada').pipe(
      catchError(() => of(DEMO_NOTAS_ENTRADA)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(data => this.notas.set(normalizeNotas(data)));
  }

  abrirDetalhe(nota: NotaEntrada): void {
    this.notaSelecionada.set(nota);
    this.showDetalhe = true;
  }

  onXmlUpload(event: { files?: File[] }, uploader: { clear?: () => void }): void {
    const file = event.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file, file.name);
    this.processandoXml.set(true);

    this.http.post<unknown>('/api/v1/compras/notas-entrada/importar-xml', formData).pipe(
      catchError(error => {
        this.msg.add({
          severity: 'warn',
          summary: 'Modo demo',
          detail: 'Backend indisponivel. XML carregado com preview demonstrativo.'
        });
        return of(demoPreviewFromFile(file));
      }),
      finalize(() => {
        this.processandoXml.set(false);
        uploader.clear?.();
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.previewNota.set(normalizeNota(response));
      this.showImportDialog = true;
    });
  }

  abrirVinculoProduto(index: number): void {
    this.itemVinculoIndex = index;
    this.showProdutoDialog = true;
  }

  onProdutoVinculado(produto: ProdutoItem): void {
    const index = this.itemVinculoIndex;
    if (index === null) return;

    this.previewNota.update(nota => {
      if (!nota) return nota;
      const itens = nota.itens.map((item, i) => i === index ? {
        ...item,
        produtoId: produto.id,
        mapeadoProdutoId: produto.id,
        produtoCodigo: produto.codigo,
        produtoDescricao: produto.descricao
      } : item);
      return { ...nota, itens };
    });

    this.itemVinculoIndex = null;
  }

  podeConfirmarImportacao(): boolean {
    const nota = this.previewNota();
    return !!nota && nota.itens.length > 0 && nota.itens.every(item => !!item.mapeadoProdutoId) && !this.salvando();
  }

  confirmarEntrada(): void {
    const nota = this.previewNota();
    if (!nota || !this.podeConfirmarImportacao()) return;

    this.salvando.set(true);
    const payload = toRequestPayload(nota);
    this.http.post<unknown>('/api/v1/compras/notas-entrada', payload).pipe(
      catchError(error => {
        if (error?.status === 409) {
          return throwError(() => error);
        }
        const demo = { ...nota, id: nota.id || newLocalId(), status: 'CONFERIDA' };
        this.msg.add({
          severity: 'warn',
          summary: 'Modo demo',
          detail: 'Entrada registrada localmente enquanto a API esta indisponivel.'
        });
        return of(demo);
      }),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        const salva = normalizeNota(response);
        this.notas.update(list => upsertNota(list, salva));
        this.previewNota.set(null);
        this.notaSelecionada.set(salva);
        this.showImportDialog = false;
        this.showDetalhe = true;
        this.msg.add({ severity: 'success', summary: 'NF-e importada', detail: 'Nota de entrada confirmada com sucesso.' });
      },
      error: () => this.msg.add({
        severity: 'error',
        summary: 'NF-e duplicada',
        detail: 'Esta chave de acesso ja foi importada.'
      })
    });
  }

  podeLancarNota(nota: NotaEntrada | null): boolean {
    return !!nota && ['PENDENTE', 'CONFERIDA'].includes(nota.status);
  }

  lancarEstoque(): void {
    const nota = this.notaSelecionada();
    if (!nota || !this.podeLancarNota(nota)) return;

    this.salvando.set(true);
    this.http.post<unknown>(`/api/v1/compras/notas-entrada/${nota.id}/lancar-estoque`, {}).pipe(
      catchError(() => of({ notaEntradaId: nota.id, status: 'LANCADA' })),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const lancada = { ...nota, status: 'LANCADA' };
      this.notas.update(list => upsertNota(list, lancada));
      this.notaSelecionada.set(lancada);
      this.msg.add({ severity: 'success', summary: 'Estoque atualizado', detail: 'Nota lancada no estoque com sucesso.' });
    });
  }

  fecharImportacao(): void {
    this.previewNota.set(null);
    this.showImportDialog = false;
  }
}

function normalizeNotas(response: unknown): NotaEntrada[] {
  const arr = Array.isArray(response)
    ? response
    : typeof response === 'object' && response !== null
      ? ((response as Record<string, unknown>)['content'] as unknown[] ||
         (response as Record<string, unknown>)['items'] as unknown[] ||
         (response as Record<string, unknown>)['data'] as unknown[] || [])
      : [];
  return arr.map(normalizeNota);
}

function normalizeNota(raw: unknown): NotaEntrada {
  const r = (raw ?? {}) as Record<string, unknown>;
  const itens = normalizeItens(r['itens']);
  const numero = String(r['numero'] ?? '0');
  return {
    id: String(r['id'] ?? newLocalId()),
    numero,
    serie: nullableString(r['serie']),
    fornecedorId: nullableString(r['fornecedorId']),
    fornecedorNome: String(r['fornecedorNome'] ?? 'Fornecedor nao identificado'),
    cnpjEmitente: nullableString(r['cnpjEmitente']),
    chaveAcesso: String(r['chaveAcesso'] ?? r['chave'] ?? ''),
    dataEmissao: nullableString(r['dataEmissao']),
    dataEntrada: nullableString(r['dataEntrada']),
    valorTotal: toNumber(r['valorTotal'] ?? r['valor']),
    valorFrete: toNumber(r['valorFrete']),
    valorIpi: toNumber(r['valorIpi']),
    status: String(r['status'] ?? 'PENDENTE'),
    xmlContent: nullableString(r['xmlContent']),
    itens
  };
}

function normalizeItens(raw: unknown): NotaEntradaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const mapeadoProdutoId = nullableString(r['mapeadoProdutoId'] ?? r['produtoId']);
    return {
      id: nullableString(r['id']) ?? undefined,
      produtoId: nullableString(r['produtoId']),
      codigoProduto: String(r['codigoProduto'] ?? r['codigo'] ?? ''),
      descricao: String(r['descricao'] ?? r['nome'] ?? ''),
      ncm: nullableString(r['ncm']),
      cfop: nullableString(r['cfop']),
      cstIcms: nullableString(r['cstIcms']),
      quantidade: toNumber(r['quantidade']),
      unidade: nullableString(r['unidade']),
      valorUnitario: toNumber(r['valorUnitario']),
      valorTotal: toNumber(r['valorTotal']),
      valorIpi: toNumber(r['valorIpi']),
      percIcms: toNumber(r['percIcms']),
      mapeadoProdutoId,
      produtoCodigo: nullableString(r['produtoCodigo']) ?? String(r['codigoProduto'] ?? ''),
      produtoDescricao: nullableString(r['produtoDescricao']) ?? undefined
    };
  });
}

function toRequestPayload(nota: NotaEntrada): Record<string, unknown> {
  return {
    numero: nota.numero,
    serie: nota.serie,
    fornecedorId: nota.fornecedorId,
    fornecedorNome: nota.fornecedorNome,
    cnpjEmitente: nota.cnpjEmitente,
    chaveAcesso: nota.chaveAcesso,
    dataEmissao: nota.dataEmissao,
    valorTotal: nota.valorTotal,
    valorFrete: nota.valorFrete ?? 0,
    valorIpi: nota.valorIpi ?? 0,
    xmlContent: nota.xmlContent,
    itens: nota.itens.map(item => ({
      produtoId: item.produtoId ?? item.mapeadoProdutoId,
      codigoProduto: item.codigoProduto,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      cstIcms: item.cstIcms,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      valorIpi: item.valorIpi ?? 0,
      percIcms: item.percIcms ?? 0,
      mapeadoProdutoId: item.mapeadoProdutoId
    }))
  };
}

function upsertNota(list: NotaEntrada[], nota: NotaEntrada): NotaEntrada[] {
  const exists = list.some(item => item.id === nota.id);
  return exists
    ? list.map(item => item.id === nota.id ? nota : item)
    : [nota, ...list];
}

function demoPreviewFromFile(file: File): NotaEntrada {
  return {
    id: newLocalId(),
    numero: file.name.replace(/\D/g, '').slice(-6) || '000001',
    serie: '1',
    fornecedorNome: 'Fornecedor XML Demo',
    cnpjEmitente: '12345678000190',
    chaveAcesso: '35260512345678000190550010000000011000000010',
    dataEmissao: new Date().toISOString(),
    valorTotal: 159.9,
    valorFrete: 0,
    valorIpi: 0,
    status: 'PENDENTE',
    xmlContent: null,
    itens: [
      {
        codigoProduto: 'OLEO-10W40',
        descricao: 'Oleo 10W40 Semissintetico 1L',
        ncm: '27101259',
        cfop: '5102',
        cstIcms: '00',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 41.33,
        valorTotal: 82.66,
        valorIpi: 0,
        percIcms: 18,
        mapeadoProdutoId: null
      },
      {
        codigoProduto: 'FILTRO-OLEO',
        descricao: 'Filtro de Oleo Moto 150cc',
        ncm: '84212300',
        cfop: '5102',
        cstIcms: '00',
        quantidade: 1,
        unidade: 'UN',
        valorUnitario: 19.2,
        valorTotal: 19.2,
        valorIpi: 0,
        percIcms: 18,
        mapeadoProdutoId: null
      }
    ]
  };
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function newLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

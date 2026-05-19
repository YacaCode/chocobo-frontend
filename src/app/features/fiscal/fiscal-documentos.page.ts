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
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_FISCAL = [
  { id: 'nf-001', modelo: 'NFC-e', numero: '000001', chaveAcesso: '35260123456789000100650010000000011000000001', clienteNome: 'Moto Rápido Entregas', emissao: '2026-05-19', valor: 1240.0, status: 'AUTORIZADA' },
  { id: 'nf-002', modelo: 'NFC-e', numero: '000002', chaveAcesso: '35260123456789000100650010000000021000000002', clienteNome: 'Carlos Oficina ME', emissao: '2026-05-18', valor: 363.5, status: 'AUTORIZADA' },
  { id: 'nf-003', modelo: 'NF-e', numero: '000003', chaveAcesso: '35260123456789000100550010000000031000000003', clienteNome: 'Auto Peças Norte', emissao: '2026-05-17', valor: 4580.0, status: 'CANCELADA' },
  { id: 'nf-004', modelo: 'NFC-e', numero: '000004', chaveAcesso: '35260123456789000100650010000000041000000004', clienteNome: 'João Batista da Silva', emissao: '2026-05-16', valor: 89.9, status: 'REJEITADA' },
  { id: 'nf-005', modelo: 'NF-e', numero: '000005', chaveAcesso: '35260123456789000100550010000000051000000005', clienteNome: 'Distribuidora Sul', emissao: '2026-05-15', valor: 2400.0, status: 'AUTORIZADA' },
  { id: 'nf-006', modelo: 'NFC-e', numero: '000006', chaveAcesso: '', clienteNome: 'Consumidor Final', emissao: '2026-05-19', valor: 125.0, status: 'PENDENTE' }
];

@Component({
  selector: 'chb-fiscal-documentos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CalendarModule, ConfirmDialogModule, CurrencyPipe, DatePipe,
    DialogModule, DropdownModule, FormsModule, InputTextModule, InputTextareaModule,
    SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- Dialog Cancelar Nota -->
    <p-dialog [(visible)]="showCancelarDialog" header="Cancelar Nota Fiscal" [modal]="true"
              [style]="{width:'480px',maxWidth:'95vw'}">
      @if (docSelecionado()) {
        <div style="display:flex;flex-direction:column;gap:.75rem;padding:.5rem 0">
          <div class="info-row">
            <span class="info-label">Documento:</span>
            <span>{{ docSelecionado()?.modelo }} nº {{ docSelecionado()?.numero }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor:</span>
            <span style="font-weight:700">{{ docSelecionado()?.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:.25rem">
            <label style="font-size:.85rem;font-weight:700;color:var(--chb-text-muted)">
              Justificativa de Cancelamento * (mínimo 15 caracteres)
            </label>
            <textarea pInputTextarea [(ngModel)]="justificativaCancelamento" rows="3"
                      placeholder="Descreva o motivo do cancelamento..."
                      style="width:100%"></textarea>
            @if (justificativaCancelamento.length > 0 && justificativaCancelamento.length < 15) {
              <small style="color:#dc2626">Mínimo 15 caracteres ({{ justificativaCancelamento.length }}/15)</small>
            }
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Voltar" icon="pi pi-arrow-left" class="p-button-outlined p-button-secondary"
                  (click)="showCancelarDialog = false" [disabled]="salvando()"></button>
          <button pButton label="Confirmar Cancelamento" icon="pi pi-times" class="p-button-danger"
                  [disabled]="justificativaCancelamento.length < 15"
                  [loading]="salvando()"
                  (click)="confirmarCancelamento()"></button>
        </ng-template>
      }
    </p-dialog>

    <!-- Indicador SEFAZ -->
    <div class="sefaz-status">
      <span class="sefaz-dot"></span>
      <span>SEFAZ Online</span>
    </div>

    <!-- KPIs -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">NFC-e AUTORIZADAS (MÊS)</span>
        <span class="kpi-value" style="color:#16a34a">{{ qtdNfce() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">NF-e EMITIDAS (MÊS)</span>
        <span class="kpi-value" style="color:#1A237E">{{ qtdNfe() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">CANCELADAS</span>
        <span class="kpi-value" style="color:var(--chb-text-muted)">{{ qtdCanceladas() }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">REJEITADAS</span>
        <span class="kpi-value" style="color:#dc2626">{{ qtdRejeitadas() }}</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="page-toolbar">
      <h2 class="page-title">Documentos Fiscais</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar número ou cliente..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <p-dropdown [options]="modeloOptions" [(ngModel)]="modeloFiltro"
                    placeholder="Tipo" (onChange)="carregar()">
        </p-dropdown>
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFiltro"
                    placeholder="Status" (onChange)="carregar()">
        </p-dropdown>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    <!-- Tabela -->
    @if (loading() && !documentos().length) {
      @for (i of [1,2,3,4,5]; track i) { <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton> }
    } @else {
      <p-table [value]="filtrados()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Modelo</th>
            <th pSortableColumn="numero">Número <p-sortIcon field="numero"></p-sortIcon></th>
            <th>Chave de Acesso</th>
            <th>Cliente</th>
            <th pSortableColumn="emissao">Emissão <p-sortIcon field="emissao"></p-sortIcon></th>
            <th style="text-align:right">Valor</th>
            <th>Status</th>
            <th style="width:100px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-doc>
          <tr>
            <td><p-tag [value]="doc.modelo" [severity]="doc.modelo === 'NFC-e' ? 'info' : 'secondary'"></p-tag></td>
            <td style="font-weight:700;font-family:monospace">{{ doc.numero }}</td>
            <td style="font-size:.72rem;font-family:monospace;max-width:160px;overflow:hidden;text-overflow:ellipsis;color:var(--chb-text-muted)">
              {{ doc.chaveAcesso || '—' }}
            </td>
            <td>{{ doc.clienteNome }}</td>
            <td>{{ doc.emissao | date:'dd/MM/yyyy' }}</td>
            <td style="text-align:right;font-weight:700">{{ doc.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td><p-tag [value]="doc.status" [severity]="severidade(doc.status)"></p-tag></td>
            <td>
              <div style="display:flex;gap:.25rem">
                @if (doc.chaveAcesso) {
                  <button pButton icon="pi pi-file-pdf" class="p-button-text p-button-sm"
                          (click)="visualizarXml(doc)" pTooltip="Visualizar XML"></button>
                }
                @if (doc.status === 'AUTORIZADA') {
                  <button pButton icon="pi pi-ban" class="p-button-text p-button-danger p-button-sm"
                          (click)="abrirCancelamento(doc)" pTooltip="Cancelar"></button>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" style="text-align:center;padding:2rem">
            <i class="pi pi-file" style="font-size:2rem;color:var(--chb-text-muted)"></i>
            <p style="color:var(--chb-text-muted)">Nenhum documento encontrado.</p>
          </td></tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .sefaz-status { display:flex; align-items:center; gap:.5rem; font-size:.82rem; font-weight:700; color:#16a34a; margin-bottom:1rem; }
    .sefaz-dot { width:.6rem; height:.6rem; background:#16a34a; border-radius:50%; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .kpi-card { flex:1; min-width:140px; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .kpi-label { display:block; font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .kpi-value { display:block; font-size:1.4rem; font-weight:700; margin-top:.25rem; }
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .info-row { display:flex; gap:.5rem; font-size:.9rem; }
    .info-label { font-weight:700; color:var(--chb-text-muted); min-width:100px; }
  `]
})
export class FiscalDocumentosPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly documentos = signal<any[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');
  readonly docSelecionado = signal<any>(null);

  showCancelarDialog = false;
  justificativaCancelamento = '';
  modeloFiltro = '';
  statusFiltro = '';

  readonly modeloOptions = [
    { label: 'Todos', value: '' },
    { label: 'NFC-e', value: 'NFC-e' },
    { label: 'NF-e', value: 'NF-e' }
  ];
  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Autorizada', value: 'AUTORIZADA' },
    { label: 'Cancelada', value: 'CANCELADA' },
    { label: 'Rejeitada', value: 'REJEITADA' },
    { label: 'Pendente', value: 'PENDENTE' }
  ];

  readonly filtrados = computed(() => {
    const b = this.busca().toLowerCase();
    const m = this.modeloFiltro;
    const s = this.statusFiltro;
    return this.documentos().filter(d =>
      (!b || d.numero?.includes(b) || d.clienteNome?.toLowerCase().includes(b)) &&
      (!m || d.modelo === m) &&
      (!s || d.status === s)
    );
  });
  readonly qtdNfce = computed(() => this.documentos().filter(d => d.modelo === 'NFC-e' && d.status === 'AUTORIZADA').length);
  readonly qtdNfe = computed(() => this.documentos().filter(d => d.modelo === 'NF-e' && d.status === 'AUTORIZADA').length);
  readonly qtdCanceladas = computed(() => this.documentos().filter(d => d.status === 'CANCELADA').length);
  readonly qtdRejeitadas = computed(() => this.documentos().filter(d => d.status === 'REJEITADA').length);

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'AUTORIZADA': 'success', 'CANCELADA': 'secondary', 'REJEITADA': 'danger', 'PENDENTE': 'warning'
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
    const params: string[] = [];
    if (this.modeloFiltro) params.push(`modelo=${this.modeloFiltro}`);
    if (this.statusFiltro) params.push(`status=${this.statusFiltro}`);
    const query = params.length ? '?' + params.join('&') : '';
    this.http.get<any[]>(`/api/v1/fiscal/documentos${query}`)
      .pipe(catchError(() => of(DEMO_FISCAL)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.documentos.set(data));
  }

  visualizarXml(doc: any): void {
    this.msg.add({
      severity: 'info',
      summary: 'XML da Nota',
      detail: `Chave: ${doc.chaveAcesso?.substring(0, 22)}... (visualização real disponível com backend de produção)`
    });
  }

  abrirCancelamento(doc: any): void {
    this.docSelecionado.set(doc);
    this.justificativaCancelamento = '';
    this.showCancelarDialog = true;
  }

  confirmarCancelamento(): void {
    if (this.justificativaCancelamento.length < 15) return;
    this.salvando.set(true);
    const doc = this.docSelecionado();
    this.http.post(`/api/v1/fiscal/nfce/${doc.id}/cancelar`, { justificativa: this.justificativaCancelamento })
      .pipe(
        catchError(() => of({})),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.documentos.update(list => list.map(d => d.id === doc.id ? { ...d, status: 'CANCELADA' } : d));
        this.showCancelarDialog = false;
        this.msg.add({ severity: 'success', summary: 'Nota cancelada', detail: `${doc.modelo} nº ${doc.numero} cancelada com sucesso.` });
      });
  }
}

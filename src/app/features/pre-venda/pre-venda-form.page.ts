import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  type OnDestroy,
  type OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import { ClienteBuscaDialogComponent } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';
import type { ClienteItem } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';
import { FormaPagamentoDialogComponent } from '../../shared/forma-pagamento-dialog/forma-pagamento-dialog.component';
import type { FormaPagamentoSelecionada } from '../../shared/forma-pagamento-dialog/forma-pagamento-dialog.component';

interface PreVendaItem {
  id?: string;
  codigo: string;
  descricao: string;
  qtd: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

interface PreVendaDetalhe {
  id: string;
  numero: string;
  cliente: ClienteItem | null;
  vendedor: string;
  status: string;
  itens: PreVendaItem[];
}

const DEMO_PV: PreVendaDetalhe = {
  id: 'nova',
  numero: 'PV-NOVA',
  cliente: null,
  vendedor: 'ANA',
  status: 'ABERTA',
  itens: []
};

@Component({
  selector: 'chb-pre-venda-form-page',
  standalone: true,
  imports: [
    ButtonModule, CurrencyPipe, FormsModule, InputNumberModule, InputTextModule,
    ReactiveFormsModule, TableModule, TagModule, ToastModule,
    ProdutoBuscaDialogComponent, ClienteBuscaDialogComponent, FormaPagamentoDialogComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <chb-produto-busca-dialog
      [(visible)]="showProdutoDialog"
      (produtoSelecionado)="onProdutoSelecionado($event)">
    </chb-produto-busca-dialog>

    <chb-cliente-busca-dialog
      [(visible)]="showClienteDialog"
      (clienteSelecionado)="onClienteSelecionado($event)">
    </chb-cliente-busca-dialog>

    <chb-forma-pagamento-dialog
      [(visible)]="showPagamentoDialog"
      [total]="totalGeral()"
      (pagamentoConfirmado)="onPagamentoConfirmado($event)">
    </chb-forma-pagamento-dialog>

    <section class="pv-form">
      <!-- Cabecalho -->
      <header class="pv-cabecalho">
        <div class="pv-cabecalho-info">
          <div class="pv-numero">
            <p>Pre-venda</p>
            <h2>{{ pvNumero() }}</h2>
          </div>
          <div class="pv-status">
            <span>Status:</span>
            <p-tag [value]="pvStatus()" [severity]="statusSeverity(pvStatus())"></p-tag>
          </div>
          <div class="pv-data">
            <span>Data:</span>
            <strong>{{ dataHoje() }}</strong>
          </div>
        </div>

        <div class="pv-cliente-wrap">
          <label>
            <span>Cliente <small>(F4)</small></span>
            <button type="button" class="btn-cliente" (click)="abrirClienteDialog()">
              <i class="pi pi-user" aria-hidden="true"></i>
              <span>{{ clienteSelecionado()?.razaoSocial ?? 'Clique para selecionar...' }}</span>
              <i class="pi pi-search" aria-hidden="true"></i>
            </button>
          </label>
          <div class="pv-vendedor">
            <span>Vendedor:</span>
            <strong>{{ vendedor() }}</strong>
          </div>
        </div>
      </header>

      <!-- Corpo: Grid + Totais -->
      <div class="pv-body">
        <!-- Grid de itens -->
        <div class="pv-itens-panel">
          <div class="pv-itens-toolbar">
            <span>Itens da pre-venda</span>
            <button pButton type="button" icon="pi pi-plus" label="Adicionar item (F1)" class="p-button-sm p-button-outlined" (click)="abrirProdutoDialog()"></button>
          </div>

          <!-- Linha de entrada rapida -->
          <div class="pv-entrada-rapida" [formGroup]="entradaForm">
            <input
              pInputText
              formControlName="codigo"
              placeholder="F1 - Codigo ou descricao..."
              (keydown.enter)="onCodigoEnter()"
              (keydown.tab)="onCodigoEnter()"
              class="entrada-codigo"
              #codigoInput />
            <p-inputNumber
              formControlName="qtd"
              [min]="1"
              [showButtons]="false"
              placeholder="Qtd"
              [style]="{ width: '80px' }">
            </p-inputNumber>
            <button pButton type="button" icon="pi pi-search" class="p-button-sm" (click)="abrirProdutoDialog()"></button>
          </div>

          <!-- Tabela de itens -->
          @if (itens().length > 0) {
            <div class="pv-itens-table">
              <table class="itens-table">
                <thead>
                  <tr>
                    <th style="width:40px">#</th>
                    <th style="width:120px">Codigo</th>
                    <th>Descricao</th>
                    <th style="width:80px;text-align:right">Qtd</th>
                    <th style="width:110px;text-align:right">Preco</th>
                    <th style="width:70px;text-align:right">%Desc</th>
                    <th style="width:110px;text-align:right">Total</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of itens(); track $index; let i = $index) {
                    <tr class="item-row" [class.item-row--editing]="itemEditando() === i">
                      <td class="item-seq">{{ i + 1 }}</td>
                      <td>{{ item.codigo }}</td>
                      <td class="item-desc">{{ item.descricao }}</td>
                      <td class="item-num">
                        <p-inputNumber
                          [(ngModel)]="item.qtd"
                          [min]="1"
                          [showButtons]="false"
                          (ngModelChange)="recalcularItem(i)"
                          inputStyleClass="item-input-num"
                          [style]="{ width: '70px' }">
                        </p-inputNumber>
                      </td>
                      <td class="item-num">
                        <p-inputNumber
                          [(ngModel)]="item.precoUnitario"
                          mode="currency"
                          currency="BRL"
                          locale="pt-BR"
                          [min]="0"
                          [showButtons]="false"
                          (ngModelChange)="recalcularItem(i)"
                          inputStyleClass="item-input-num"
                          [style]="{ width: '100px' }">
                        </p-inputNumber>
                      </td>
                      <td class="item-num">
                        <p-inputNumber
                          [(ngModel)]="item.desconto"
                          [min]="0"
                          [max]="100"
                          [maxFractionDigits]="2"
                          suffix="%"
                          [showButtons]="false"
                          (ngModelChange)="recalcularItem(i)"
                          inputStyleClass="item-input-num"
                          [style]="{ width: '70px' }">
                        </p-inputNumber>
                      </td>
                      <td class="item-total">{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td>
                        <button
                          type="button"
                          class="btn-remover"
                          title="Remover item"
                          (click)="removerItem(i)">
                          <i class="pi pi-times" aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="pv-itens-vazio">
              <i class="pi pi-inbox" aria-hidden="true"></i>
              <p>Nenhum item adicionado.</p>
              <small>Pressione F1 ou use o campo acima para buscar produtos.</small>
            </div>
          }
        </div>

        <!-- Painel de totais -->
        <aside class="pv-totais">
          <div class="totais-panel">
            <h3>Resumo</h3>
            <div class="totais-linha">
              <span>Sub-Total</span>
              <strong>{{ subTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="totais-linha totais-desconto">
              <span>Desconto</span>
              <strong>{{ totalDesconto() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="totais-linha totais-total">
              <span>TOTAL</span>
              <strong>{{ totalGeral() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="totais-linha">
              <span>PAGO</span>
              <strong class="valor-pago">{{ totalPago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="totais-linha" [class.troco-positivo]="troco() > 0">
              <span>TROCO</span>
              <strong>{{ troco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
          </div>

          <div class="totais-acoes">
            <button
              pButton
              type="button"
              icon="pi pi-credit-card"
              label="Pagamento"
              class="p-button-outlined w-full"
              [disabled]="itens().length === 0"
              (click)="abrirPagamentoDialog()">
            </button>
            <button
              pButton
              type="button"
              icon="pi pi-check-circle"
              label="Conferir (F8)"
              class="p-button-outlined p-button-warning w-full"
              [disabled]="itens().length === 0"
              (click)="conferir()">
            </button>
            <button
              pButton
              type="button"
              icon="pi pi-save"
              label="Salvar (Ctrl+S)"
              class="w-full"
              [loading]="salvando()"
              (click)="salvar()">
            </button>
          </div>
        </aside>
      </div>

      <!-- Rodape de atalhos -->
      <footer class="pv-atalhos">
        <span>F1=Produto</span>
        <span>F4=Cliente</span>
        <span>F8=Conferir</span>
        <span>Ctrl+S=Salvar</span>
        <span>Esc=Cancelar</span>
      </footer>
    </section>
  `,
  styles: [`
    .pv-form {
      display: grid;
      gap: 1rem;
    }

    .pv-cabecalho {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: 0 10px 28px rgba(15,23,42,0.06);
      flex-wrap: wrap;
    }

    .pv-cabecalho-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .pv-numero p {
      margin: 0;
      color: var(--chb-text-muted);
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: var(--chb-text);
      font-size: 1.4rem;
    }

    .pv-status, .pv-data, .pv-vendedor {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      color: var(--chb-text-muted);
    }

    .pv-status strong, .pv-data strong, .pv-vendedor strong {
      color: var(--chb-text);
      font-weight: 700;
    }

    .pv-cliente-wrap {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
      flex-wrap: wrap;
    }

    .pv-cliente-wrap label {
      flex: 1;
      display: grid;
      gap: 0.25rem;
    }

    .pv-cliente-wrap label span {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .pv-cliente-wrap label small {
      color: var(--chb-yellow-700);
    }

    .btn-cliente {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      min-height: 2.4rem;
      padding: 0.5rem 0.75rem;
      border: 1px dashed var(--chb-border);
      border-radius: 0.4rem;
      background: var(--chb-surface-muted);
      color: var(--chb-text);
      cursor: pointer;
      text-align: left;
      font-size: 0.9rem;
      transition: border-color 0.15s;
    }

    .btn-cliente:hover {
      border-color: var(--chb-yellow);
    }

    .btn-cliente span {
      flex: 1;
    }

    .pv-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 1rem;
      align-items: start;
    }

    .pv-itens-panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: 0 10px 28px rgba(15,23,42,0.06);
      overflow: hidden;
    }

    .pv-itens-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--chb-border);
      font-weight: 700;
      color: var(--chb-text);
    }

    .pv-entrada-rapida {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--chb-border);
      background: var(--chb-surface-muted);
    }

    .entrada-codigo {
      flex: 1;
    }

    .pv-itens-table {
      overflow-x: auto;
    }

    .itens-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .itens-table th {
      padding: 0.6rem 0.75rem;
      background: var(--chb-surface-muted);
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 1px solid var(--chb-border);
      white-space: nowrap;
    }

    .itens-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--chb-border);
      color: var(--chb-text);
      vertical-align: middle;
    }

    .item-row:hover {
      background: var(--chb-surface-muted);
    }

    .item-seq {
      color: var(--chb-text-muted);
      font-size: 0.8rem;
    }

    .item-desc {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-num {
      text-align: right;
    }

    .item-total {
      text-align: right;
      font-weight: 700;
    }

    .btn-remover {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.6rem;
      height: 1.6rem;
      border: none;
      border-radius: 0.25rem;
      background: transparent;
      color: var(--chb-text-muted);
      cursor: pointer;
      font-size: 0.7rem;
    }

    .btn-remover:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    :host ::ng-deep .item-input-num {
      text-align: right;
      font-size: 0.875rem;
    }

    .pv-itens-vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--chb-text-muted);
      gap: 0.5rem;
    }

    .pv-itens-vazio i {
      font-size: 2.5rem;
      opacity: 0.4;
    }

    .pv-itens-vazio p {
      margin: 0;
      font-weight: 600;
    }

    .pv-itens-vazio small {
      font-size: 0.8rem;
    }

    .pv-totais {
      display: grid;
      gap: 1rem;
    }

    .totais-panel {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: 0 10px 28px rgba(15,23,42,0.06);
      padding: 1rem;
      display: grid;
      gap: 0.6rem;
    }

    .totais-panel h3 {
      margin: 0 0 0.5rem;
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .totais-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .totais-linha span {
      color: var(--chb-text-muted);
      font-weight: 600;
    }

    .totais-linha strong {
      color: var(--chb-text);
    }

    .totais-desconto strong {
      color: #dc2626;
    }

    .totais-total {
      padding: 0.5rem 0;
      border-top: 2px solid var(--chb-border);
      font-size: 1.1rem;
    }

    .totais-total strong {
      font-size: 1.25rem;
      font-weight: 900;
    }

    .valor-pago {
      color: #16a34a !important;
    }

    .troco-positivo strong {
      color: #16a34a;
    }

    .totais-acoes {
      display: grid;
      gap: 0.5rem;
    }

    .w-full {
      width: 100%;
    }

    .pv-atalhos {
      display: flex;
      gap: 1.5rem;
      padding: 0.6rem 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      font-size: 0.78rem;
      color: var(--chb-text-muted);
      font-weight: 800;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .pv-body {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreVendaFormPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  showProdutoDialog = false;
  showClienteDialog = false;
  showPagamentoDialog = false;

  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly pvId = signal<string | null>(null);
  readonly pvNumero = signal('PV-NOVA');
  readonly pvStatus = signal('ABERTA');
  readonly clienteSelecionado = signal<ClienteItem | null>(null);
  readonly vendedor = signal('ANA');
  readonly itens = signal<PreVendaItem[]>([]);
  readonly itemEditando = signal<number | null>(null);
  readonly totalPago = signal(0);
  readonly formasPagamento = signal<FormaPagamentoSelecionada[]>([]);

  readonly subTotal = computed(() =>
    this.itens().reduce((acc, i) => acc + (i.qtd * i.precoUnitario), 0)
  );
  readonly totalDesconto = computed(() =>
    this.itens().reduce((acc, i) => acc + (i.qtd * i.precoUnitario * i.desconto / 100), 0)
  );
  readonly totalGeral = computed(() =>
    Math.max(0, this.subTotal() - this.totalDesconto())
  );
  readonly troco = computed(() => this.totalPago() - this.totalGeral());

  readonly entradaForm = this.fb.group({
    codigo: [''],
    qtd: [1, [Validators.min(1)]]
  });

  dataHoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'] as string | undefined;
      if (id && id !== 'nova') {
        this.pvId.set(id);
        this.carregarPV(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.showProdutoDialog || this.showClienteDialog || this.showPagamentoDialog) return;

    if (event.key === 'F1') {
      event.preventDefault();
      this.abrirProdutoDialog();
    }
    if (event.key === 'F4') {
      event.preventDefault();
      this.abrirClienteDialog();
    }
    if (event.key === 'F8') {
      event.preventDefault();
      this.conferir();
    }
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.salvar();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelar();
    }
  }

  abrirProdutoDialog(): void {
    this.showProdutoDialog = true;
  }

  abrirClienteDialog(): void {
    this.showClienteDialog = true;
  }

  abrirPagamentoDialog(): void {
    if (this.itens().length > 0) {
      this.showPagamentoDialog = true;
    }
  }

  onCodigoEnter(): void {
    const codigo = this.entradaForm.value.codigo?.trim() ?? '';
    if (!codigo) {
      this.abrirProdutoDialog();
      return;
    }

    const qtd = this.entradaForm.value.qtd ?? 1;
    this.http.get<unknown>(`/api/v1/cadastros/produtos?q=${encodeURIComponent(codigo)}`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      const arr = Array.isArray(response) ? response : [];
      const produto = arr[0] as Record<string, unknown> | undefined;

      if (produto) {
        this.adicionarProdutoComoItem({
          id: String(produto['id'] ?? ''),
          codigo: String(produto['codigo'] ?? codigo),
          descricao: String(produto['descricao'] ?? ''),
          fabricante: String(produto['fabricante'] ?? ''),
          precoVenda: Number(produto['precoVenda'] ?? 0),
          qtdDisponivel: Number(produto['qtdDisponivel'] ?? 0)
        }, Number(qtd));
      } else {
        this.abrirProdutoDialog();
      }

      this.entradaForm.reset({ codigo: '', qtd: 1 });
    });
  }

  onProdutoSelecionado(produto: ProdutoItem): void {
    const qtd = this.entradaForm.value.qtd ?? 1;
    this.adicionarProdutoComoItem(produto, Number(qtd));
    this.entradaForm.patchValue({ codigo: '', qtd: 1 });
  }

  private adicionarProdutoComoItem(produto: ProdutoItem, qtd = 1): void {
    const novoItem: PreVendaItem = {
      codigo: produto.codigo,
      descricao: produto.descricao,
      qtd,
      precoUnitario: produto.precoVenda,
      desconto: 0,
      total: qtd * produto.precoVenda
    };
    this.itens.update((itens) => [...itens, novoItem]);
    this.messageService.add({ severity: 'success', summary: 'Item adicionado', detail: produto.descricao, life: 2000 });
  }

  onClienteSelecionado(cliente: ClienteItem): void {
    this.clienteSelecionado.set(cliente);
  }

  onPagamentoConfirmado(formas: FormaPagamentoSelecionada[]): void {
    this.formasPagamento.set(formas);
    const totalPago = formas.reduce((acc, f) => acc + f.valor, 0);
    this.totalPago.set(Math.round(totalPago * 100) / 100);
    this.messageService.add({ severity: 'success', summary: 'Pagamento registrado', detail: `Total: R$ ${totalPago.toFixed(2)}` });
  }

  recalcularItem(index: number): void {
    this.itens.update((itens) => {
      const updated = [...itens];
      const item = updated[index];
      if (item) {
        const bruto = item.qtd * item.precoUnitario;
        item.total = bruto * (1 - item.desconto / 100);
      }
      return updated;
    });
  }

  removerItem(index: number): void {
    this.itens.update((itens) => itens.filter((_, i) => i !== index));
  }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true);

    const payload = {
      clienteId: this.clienteSelecionado()?.id ?? null,
      clienteNome: this.clienteSelecionado()?.razaoSocial ?? 'Consumidor Balcao',
      itens: this.itens().map((item) => ({
        codigo: item.codigo,
        descricao: item.descricao,
        qtd: item.qtd,
        precoUnitario: item.precoUnitario,
        desconto: item.desconto,
        total: item.total
      }))
    };

    const pvId = this.pvId();
    const req = pvId
      ? this.http.put<unknown>(`/api/v1/vendas/pre-vendas/${pvId}`, payload)
      : this.http.post<unknown>('/api/v1/vendas/pre-vendas', payload);

    req.pipe(
      catchError(() => of({ id: `pv-${Date.now()}`, numero: `PV-${Date.now()}` })),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      const rec = response as Record<string, unknown>;
      if (!pvId && rec['id']) {
        this.pvId.set(String(rec['id']));
        this.pvNumero.set(String(rec['numero'] ?? this.pvNumero()));
      }
      this.salvando.set(false);
      this.messageService.add({ severity: 'success', summary: 'Salvo!', detail: 'Pre-venda salva com sucesso.' });
    });
  }

  conferir(): void {
    if (this.itens().length === 0) return;
    const pvId = this.pvId();
    if (!pvId) {
      this.salvar();
      return;
    }

    this.http.post<unknown>(`/api/v1/vendas/pre-vendas/${pvId}/conferir`, {}).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pvStatus.set('CONFERIDA');
      this.messageService.add({ severity: 'info', summary: 'Conferida', detail: 'Pre-venda marcada como conferida.' });
    });
  }

  cancelar(): void {
    if (this.itens().length > 0) {
      const confirma = window.confirm('Deseja sair sem salvar as alteracoes?');
      if (!confirma) return;
    }
    void this.router.navigate(['/vendas/pre-vendas']);
  }

  statusSeverity(status: string): 'info' | 'warning' | 'success' | 'danger' | 'secondary' {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'secondary'> = {
      ABERTA: 'info',
      SEPARADA: 'warning',
      CONFERIDA: 'warning',
      EMITIDA: 'success',
      CANCELADA: 'secondary'
    };
    return map[status] ?? 'secondary';
  }

  private carregarPV(id: string): void {
    this.loading.set(true);
    this.http.get<unknown>(`/api/v1/vendas/pre-vendas/${id}`).pipe(
      catchError(() => of(DEMO_PV)),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      const rec = response as Record<string, unknown>;
      this.pvNumero.set(String(rec['numero'] ?? 'PV-' + id));
      this.pvStatus.set(String(rec['status'] ?? 'ABERTA'));
      this.vendedor.set(String(rec['vendedor'] ?? rec['nomeVendedor'] ?? 'ANA'));

      const rawArr = Array.isArray(rec['itens']) ? rec['itens'] as Record<string, unknown>[] : (DEMO_PV.itens as unknown as Record<string, unknown>[]);
      this.itens.set(rawArr.map((i) => ({
        id: String(i['id'] ?? ''),
        codigo: String(i['codigo'] ?? ''),
        descricao: String(i['descricao'] ?? ''),
        qtd: Number(i['qtd'] ?? i['quantidade'] ?? 1),
        precoUnitario: Number(i['precoUnitario'] ?? i['preco'] ?? 0),
        desconto: Number(i['desconto'] ?? 0),
        total: Number(i['total'] ?? i['valorTotal'] ?? 0)
      })));

      this.loading.set(false);
    });
  }
}
